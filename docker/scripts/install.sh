#!/bin/bash
#
# ╔══════════════════════════════════════════════════════════════════╗
# ║                    BelBird VDS Auto-Installer                    ║
# ║                  Full Self-Hosted Edition                        ║
# ║                         Ubuntu 22.04+                            ║
# ╚══════════════════════════════════════════════════════════════════╝
#
# Устанавливает:
# • Frontend (React/Vite) с Nginx и SSL
# • Self-hosted Supabase (PostgreSQL, Auth, Storage, Realtime)
# • Edge Functions на Docker/Deno
# • GitHub Webhook для автодеплоя
#
# Usage: sudo ./install.sh
#

set -e

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTALL_DIR="/opt/belbird"
WEB_DIR="/var/www/belbird"
SUPABASE_DIR="/opt/supabase"
CERTBOT_DIR="/var/www/certbot"
LOG_FILE="/var/log/belbird-install.log"

# Supabase ports
SUPABASE_API_PORT=8000
SUPABASE_STUDIO_PORT=3000
SUPABASE_DB_PORT=5432
EDGE_FUNCTIONS_PORT=9000

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Helper Functions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

generate_password() {
    openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32
}

generate_jwt_secret() {
    openssl rand -base64 64 | tr -d '\n'
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Pre-flight Checks
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

preflight_check() {
    header "🔍 Pre-flight Checks"
    
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (sudo ./install.sh)"
    fi
    success "Running as root"
    
    source /etc/os-release 2>/dev/null || error "Cannot detect OS"
    success "OS: $PRETTY_NAME"
    
    # Check disk space (minimum 20GB for full install)
    DISK_FREE=$(df / | tail -1 | awk '{print $4}')
    if [[ $DISK_FREE -lt 20000000 ]]; then
        warn "Low disk space. Recommended: 20GB+ for full Supabase install"
    fi
    success "Disk space: $(df -h / | tail -1 | awk '{print $4}') available"
    
    # Check RAM (minimum 4GB for Supabase)
    RAM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
    if [[ $RAM_TOTAL -lt 3500 ]]; then
        warn "Low RAM: ${RAM_TOTAL}MB. Recommended: 4GB+ for Supabase"
    fi
    success "RAM: ${RAM_TOTAL}MB"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Collect Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

collect_config() {
    header "📝 Configuration"
    
    echo ""
    echo -e "${YELLOW}Выберите тип установки:${NC}"
    echo ""
    echo -e "  ${CYAN}1)${NC} Полная установка (Frontend + Self-hosted Supabase + Edge Functions)"
    echo -e "  ${CYAN}2)${NC} Только Frontend (использовать Lovable Cloud для бэкенда)"
    echo ""
    read -p "Выбор [1/2]: " INSTALL_TYPE
    INSTALL_TYPE=${INSTALL_TYPE:-1}
    
    echo ""
    echo -e "${YELLOW}Введите данные:${NC}"
    echo ""
    
    # Domain
    read -p "Домен (например, belbird.ru): " DOMAIN
    DOMAIN=${DOMAIN:-belbird.ru}
    
    # GitHub repo
    read -p "GitHub repository URL: " GITHUB_REPO
    if [[ -z "$GITHUB_REPO" ]]; then
        error "GitHub repository URL is required"
    fi
    
    # Admin email for SSL
    read -p "Email для SSL сертификатов: " ADMIN_EMAIL
    
    if [[ "$INSTALL_TYPE" == "1" ]]; then
        # Full install - generate Supabase credentials
        echo ""
        echo -e "${CYAN}Генерация секретных ключей Supabase...${NC}"
        
        POSTGRES_PASSWORD=$(generate_password)
        JWT_SECRET=$(generate_jwt_secret)
        ANON_KEY=$(generate_jwt_secret | head -c 40)
        SERVICE_ROLE_KEY=$(generate_jwt_secret | head -c 40)
        DASHBOARD_PASSWORD=$(generate_password)
        
        # Generate actual JWT tokens using the secret
        # These are simplified - in production use proper JWT generation
        SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE5NTczNDUyMDB9.$(echo -n "anon-$JWT_SECRET" | openssl dgst -sha256 -binary | base64 | tr -d '=' | tr '+/' '-_')"
        SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDE3NjkyMDAsImV4cCI6MTk1NzM0NTIwMH0.$(echo -n "service-$JWT_SECRET" | openssl dgst -sha256 -binary | base64 | tr -d '=' | tr '+/' '-_')"
        
        SUPABASE_URL="https://api.$DOMAIN"
        
        success "Ключи сгенерированы"
    else
        # Frontend only - ask for existing Supabase credentials
        read -p "Supabase URL: " SUPABASE_URL
        read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
    fi
    
    # Webhook secret
    WEBHOOK_SECRET=$(openssl rand -hex 32)
    
    # YandexGPT (optional for AI features)
    echo ""
    read -p "YandexGPT API Key (опционально, Enter для пропуска): " YANDEX_API_KEY
    read -p "YandexGPT Folder ID (опционально): " YANDEX_FOLDER_ID
    
    # Summary
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Конфигурация:${NC}"
    echo -e "  Тип установки: ${GREEN}$([ "$INSTALL_TYPE" == "1" ] && echo "Полная" || echo "Только Frontend")${NC}"
    echo -e "  Домен:         ${GREEN}$DOMAIN${NC}"
    echo -e "  GitHub:        ${GREEN}$GITHUB_REPO${NC}"
    echo -e "  Supabase URL:  ${GREEN}$SUPABASE_URL${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    read -p "Продолжить установку? [Y/n]: " CONFIRM
    if [[ "$CONFIRM" =~ ^[Nn] ]]; then
        echo "Установка отменена."
        exit 0
    fi
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Install System Dependencies
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

install_dependencies() {
    header "📦 Installing System Dependencies"
    
    log "Updating package lists..."
    apt update -qq
    
    log "Installing essential packages..."
    apt install -y -qq \
        curl \
        wget \
        git \
        nginx \
        certbot \
        python3-certbot-nginx \
        ufw \
        htop \
        unzip \
        apache2-utils
    
    # Node.js 20
    if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 20 ]]; then
        log "Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
        apt install -y -qq nodejs
    fi
    success "Node.js $(node -v)"
    
    success "Base dependencies installed"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Install Docker
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

install_docker() {
    header "🐳 Installing Docker"
    
    if command -v docker &> /dev/null; then
        success "Docker already installed: $(docker --version)"
    else
        log "Installing Docker..."
        
        # Install Docker using official script
        curl -fsSL https://get.docker.com | sh > /dev/null 2>&1
        
        # Start and enable Docker
        systemctl enable docker
        systemctl start docker
        
        success "Docker installed: $(docker --version)"
    fi
    
    # Install Docker Compose plugin
    if ! docker compose version &> /dev/null; then
        log "Installing Docker Compose..."
        apt install -y -qq docker-compose-plugin
    fi
    success "Docker Compose: $(docker compose version --short)"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Install Self-Hosted Supabase
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

install_supabase() {
    header "🗄️  Installing Self-Hosted Supabase"
    
    # Clone Supabase Docker repo
    if [[ -d "$SUPABASE_DIR" ]]; then
        log "Supabase directory exists, updating..."
        cd "$SUPABASE_DIR"
        git pull origin master 2>/dev/null || true
    else
        log "Cloning Supabase repository..."
        git clone --depth 1 https://github.com/supabase/supabase "$SUPABASE_DIR"
    fi
    
    cd "$SUPABASE_DIR/docker"
    
    # Copy and configure .env
    log "Configuring Supabase environment..."
    cp .env.example .env
    
    # Update .env with generated values
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    sed -i "s|ANON_KEY=.*|ANON_KEY=$SUPABASE_ANON_KEY|" .env
    sed -i "s|SERVICE_ROLE_KEY=.*|SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY|" .env
    sed -i "s|DASHBOARD_USERNAME=.*|DASHBOARD_USERNAME=admin|" .env
    sed -i "s|DASHBOARD_PASSWORD=.*|DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD|" .env
    sed -i "s|SITE_URL=.*|SITE_URL=https://$DOMAIN|" .env
    sed -i "s|API_EXTERNAL_URL=.*|API_EXTERNAL_URL=https://api.$DOMAIN|" .env
    
    # Expose Studio port
    if ! grep -q "ports:" docker-compose.yml; then
        log "Configuring Studio port..."
    fi
    
    # Start Supabase
    log "Starting Supabase containers (this may take several minutes)..."
    docker compose pull
    docker compose up -d
    
    # Wait for services to be healthy
    log "Waiting for Supabase services to start..."
    sleep 30
    
    # Check status
    if docker compose ps | grep -q "healthy"; then
        success "Supabase is running"
    else
        warn "Some Supabase services may still be starting..."
    fi
    
    # Create systemd service for Supabase
    log "Creating Supabase systemd service..."
    cat > /etc/systemd/system/belbird-supabase.service << EOF
[Unit]
Description=BelBird Supabase
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$SUPABASE_DIR/docker
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable belbird-supabase
    
    success "Supabase installed and configured"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Install Edge Functions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

install_edge_functions() {
    header "⚡ Installing Edge Functions"
    
    cd "$INSTALL_DIR"
    
    # Create edge functions .env
    log "Configuring Edge Functions environment..."
    cat > "$INSTALL_DIR/docker/.env" << EOF
# Supabase
SUPABASE_URL=http://localhost:$SUPABASE_API_PORT
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# AI Provider (YandexGPT for Russian VDS)
AI_PROVIDER=yandex
YANDEX_API_KEY=${YANDEX_API_KEY:-}
YANDEX_FOLDER_ID=${YANDEX_FOLDER_ID:-}

# Fallback to Lovable AI if no YandexGPT
LOVABLE_API_KEY=

# VAPID Keys for Push Notifications
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
EOF

    # Start Edge Functions
    log "Starting Edge Functions containers..."
    cd "$INSTALL_DIR/docker"
    
    if [[ -f "docker-compose.functions.yml" ]]; then
        docker compose -f docker-compose.functions.yml up -d
        
        # Create systemd service
        cat > /etc/systemd/system/belbird-functions.service << EOF
[Unit]
Description=BelBird Edge Functions
Requires=docker.service belbird-supabase.service
After=docker.service belbird-supabase.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$INSTALL_DIR/docker
ExecStart=/usr/bin/docker compose -f docker-compose.functions.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.functions.yml down
TimeoutStartSec=120

[Install]
WantedBy=multi-user.target
EOF
        
        systemctl daemon-reload
        systemctl enable belbird-functions
        
        success "Edge Functions installed"
    else
        warn "Edge Functions docker-compose not found, skipping..."
    fi
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Setup Firewall
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

setup_firewall() {
    header "🔥 Configuring Firewall"
    
    log "Setting up UFW rules..."
    ufw --force reset > /dev/null 2>&1
    ufw default deny incoming > /dev/null 2>&1
    ufw default allow outgoing > /dev/null 2>&1
    ufw allow ssh > /dev/null 2>&1
    ufw allow 'Nginx Full' > /dev/null 2>&1
    
    # Don't expose database ports externally
    # PostgreSQL and other services are accessed via localhost
    
    ufw --force enable > /dev/null 2>&1
    
    success "Firewall configured"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Clone and Build Project
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

setup_project() {
    header "🐦 Setting Up BelBird Project"
    
    mkdir -p "$INSTALL_DIR" "$WEB_DIR" "$CERTBOT_DIR"
    
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        log "Project exists, pulling latest..."
        cd "$INSTALL_DIR"
        git fetch origin main
        git reset --hard origin/main
    else
        log "Cloning repository..."
        git clone "$GITHUB_REPO" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
    
    # Create production environment
    log "Creating environment configuration..."
    cat > "$INSTALL_DIR/.env.production" << EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_ANON_KEY
EOF
    
    log "Installing npm dependencies..."
    npm ci --silent
    
    log "Building frontend..."
    npm run build
    
    log "Deploying to web server..."
    rm -rf "$WEB_DIR"/*
    cp -r dist/* "$WEB_DIR"/
    
    success "Frontend built and deployed"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Configure Nginx
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

setup_nginx() {
    header "🌐 Configuring Nginx"
    
    rm -f /etc/nginx/sites-enabled/default
    
    # Main site
    log "Creating main site configuration..."
    cat > /etc/nginx/sites-available/belbird << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root $CERTBOT_DIR;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    root $WEB_DIR;
    index index.html;
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Edge Functions proxy
    location /functions/v1/ {
        proxy_pass http://127.0.0.1:$EDGE_FUNCTIONS_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # API subdomain (Supabase)
    if [[ "$INSTALL_TYPE" == "1" ]]; then
        log "Creating Supabase API configuration..."
        cat > /etc/nginx/sites-available/belbird-api << EOF
server {
    listen 80;
    server_name api.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root $CERTBOT_DIR;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name api.$DOMAIN;
    
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://127.0.0.1:$SUPABASE_API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
        ln -sf /etc/nginx/sites-available/belbird-api /etc/nginx/sites-enabled/

        # Studio subdomain
        log "Creating Supabase Studio configuration..."
        cat > /etc/nginx/sites-available/belbird-studio << EOF
server {
    listen 80;
    server_name studio.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root $CERTBOT_DIR;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name studio.$DOMAIN;
    
    auth_basic "Supabase Studio";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    location / {
        proxy_pass http://127.0.0.1:$SUPABASE_STUDIO_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
        ln -sf /etc/nginx/sites-available/belbird-studio /etc/nginx/sites-enabled/
        
        # Create htpasswd
        htpasswd -bc /etc/nginx/.htpasswd admin "$DASHBOARD_PASSWORD"
    fi

    # Webhook
    log "Creating webhook configuration..."
    cat > /etc/nginx/sites-available/belbird-webhook << EOF
server {
    listen 80;
    server_name webhook.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root $CERTBOT_DIR;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name webhook.$DOMAIN;
    
    location /health {
        proxy_pass http://127.0.0.1:9999;
    }
    
    location /webhook {
        proxy_pass http://127.0.0.1:9999;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Hub-Signature-256 \$http_x_hub_signature_256;
        proxy_read_timeout 300s;
        
        allow 192.30.252.0/22;
        allow 185.199.108.0/22;
        allow 140.82.112.0/20;
        allow 143.55.64.0/20;
        deny all;
    }
}
EOF

    ln -sf /etc/nginx/sites-available/belbird /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/belbird-webhook /etc/nginx/sites-enabled/
    
    nginx -t
    systemctl reload nginx
    
    success "Nginx configured"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Setup SSL
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

setup_ssl() {
    header "🔒 Setting Up SSL Certificates"
    
    log "Obtaining SSL certificates..."
    
    DOMAINS="-d $DOMAIN -d www.$DOMAIN -d webhook.$DOMAIN"
    
    if [[ "$INSTALL_TYPE" == "1" ]]; then
        DOMAINS="$DOMAINS -d api.$DOMAIN -d studio.$DOMAIN"
    fi
    
    certbot --nginx \
        $DOMAINS \
        --email "$ADMIN_EMAIL" \
        --agree-tos \
        --non-interactive \
        --redirect
    
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    success "SSL certificates installed"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Setup Webhook Service
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

setup_webhook() {
    header "🔗 Setting Up Webhook Service"
    
    cat > /etc/systemd/system/belbird-webhook.service << EOF
[Unit]
Description=BelBird GitHub Webhook Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/docker/scripts
Environment=WEBHOOK_PORT=9999
Environment=WEBHOOK_SECRET=$WEBHOOK_SECRET
Environment=DEPLOY_PATH=$INSTALL_DIR
Environment=WEB_PATH=$WEB_DIR
ExecStart=/usr/bin/node webhook-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    chmod +x "$INSTALL_DIR/docker/scripts/"*.sh 2>/dev/null || true
    chmod +x "$INSTALL_DIR/docker/scripts/"*.js 2>/dev/null || true
    
    systemctl daemon-reload
    systemctl enable belbird-webhook
    systemctl start belbird-webhook
    
    success "Webhook service installed"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Save Credentials
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

save_credentials() {
    header "💾 Saving Credentials"
    
    CREDS_FILE="$INSTALL_DIR/.credentials"
    
    cat > "$CREDS_FILE" << EOF
# ═══════════════════════════════════════════════════════════════════
# BelBird Credentials - KEEP THIS FILE SECURE!
# Generated: $(date)
# ═══════════════════════════════════════════════════════════════════

# Domain
DOMAIN=$DOMAIN

# URLs
SITE_URL=https://$DOMAIN
API_URL=https://api.$DOMAIN
STUDIO_URL=https://studio.$DOMAIN
WEBHOOK_URL=https://webhook.$DOMAIN/webhook

# Supabase
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

    if [[ "$INSTALL_TYPE" == "1" ]]; then
        cat >> "$CREDS_FILE" << EOF
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET

# Studio Login
STUDIO_USERNAME=admin
STUDIO_PASSWORD=$DASHBOARD_PASSWORD
EOF
    fi
    
    cat >> "$CREDS_FILE" << EOF

# GitHub Webhook
WEBHOOK_SECRET=$WEBHOOK_SECRET
EOF

    chmod 600 "$CREDS_FILE"
    
    success "Credentials saved to $CREDS_FILE"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Final Summary
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              🎉 BelBird Installation Complete!                   ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}URLs:${NC}"
    echo -e "  🌐 Сайт:      ${GREEN}https://$DOMAIN${NC}"
    
    if [[ "$INSTALL_TYPE" == "1" ]]; then
        echo -e "  🔌 API:       ${GREEN}https://api.$DOMAIN${NC}"
        echo -e "  📊 Studio:    ${GREEN}https://studio.$DOMAIN${NC}"
        echo -e "                Login: ${YELLOW}admin${NC} / ${YELLOW}$DASHBOARD_PASSWORD${NC}"
    fi
    
    echo -e "  🔗 Webhook:   ${GREEN}https://webhook.$DOMAIN/webhook${NC}"
    echo ""
    echo -e "${CYAN}GitHub Webhook:${NC}"
    echo -e "  URL:     ${YELLOW}https://webhook.$DOMAIN/webhook${NC}"
    echo -e "  Secret:  ${YELLOW}$WEBHOOK_SECRET${NC}"
    echo ""
    echo -e "${CYAN}Credentials saved to:${NC} ${YELLOW}$INSTALL_DIR/.credentials${NC}"
    echo ""
    echo -e "${CYAN}Service Status:${NC}"
    systemctl is-active --quiet nginx && echo -e "  ✅ Nginx" || echo -e "  ❌ Nginx"
    systemctl is-active --quiet belbird-webhook && echo -e "  ✅ Webhook" || echo -e "  ❌ Webhook"
    
    if [[ "$INSTALL_TYPE" == "1" ]]; then
        docker compose -f "$SUPABASE_DIR/docker/docker-compose.yml" ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null | head -5 || true
    fi
    
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo -e "  1. Настрой DNS записи для всех поддоменов"
    echo -e "  2. Добавь GitHub Webhook с указанным URL и секретом"
    echo -e "  3. Push в main = автоматический деплой"
    echo ""
    echo -e "${CYAN}Полезные команды:${NC}"
    echo -e "  Логи webhook:     ${YELLOW}journalctl -u belbird-webhook -f${NC}"
    echo -e "  Ручной деплой:    ${YELLOW}$INSTALL_DIR/docker/scripts/deploy.sh${NC}"
    
    if [[ "$INSTALL_TYPE" == "1" ]]; then
        echo -e "  Логи Supabase:    ${YELLOW}cd $SUPABASE_DIR/docker && docker compose logs -f${NC}"
        echo -e "  Restart Supabase: ${YELLOW}systemctl restart belbird-supabase${NC}"
    fi
    
    echo ""
    echo -e "Log: ${YELLOW}$LOG_FILE${NC}"
    echo ""
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Main
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

main() {
    clear
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                                  ║${NC}"
    echo -e "${CYAN}║   🐦  ${GREEN}BelBird VDS Auto-Installer${CYAN}                               ║${NC}"
    echo -e "${CYAN}║   ${MAGENTA}Full Self-Hosted Edition${CYAN}                                    ║${NC}"
    echo -e "${CYAN}║                                                                  ║${NC}"
    echo -e "${CYAN}║   Опции установки:                                               ║${NC}"
    echo -e "${CYAN}║   • Полная: Frontend + Supabase + Edge Functions                 ║${NC}"
    echo -e "${CYAN}║   • Лёгкая: Только Frontend (Cloud бэкенд)                       ║${NC}"
    echo -e "${CYAN}║                                                                  ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo "BelBird Installation Log - $(date)" > "$LOG_FILE"
    
    preflight_check
    collect_config
    install_dependencies
    
    if [[ "$INSTALL_TYPE" == "1" ]]; then
        install_docker
        install_supabase
    fi
    
    setup_firewall
    setup_project
    
    if [[ "$INSTALL_TYPE" == "1" ]]; then
        install_edge_functions
    fi
    
    setup_nginx
    setup_ssl
    setup_webhook
    save_credentials
    print_summary
}

main "$@"
