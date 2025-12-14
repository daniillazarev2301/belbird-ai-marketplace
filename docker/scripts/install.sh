#!/bin/bash
#
# ╔══════════════════════════════════════════════════════════════════╗
# ║                    BelBird VDS Auto-Installer                    ║
# ║                         Ubuntu 22.04+                            ║
# ╚══════════════════════════════════════════════════════════════════╝
#
# Usage: curl -sSL https://raw.githubusercontent.com/YOUR_REPO/main/docker/scripts/install.sh | bash
# Or: wget -qO- https://raw.githubusercontent.com/YOUR_REPO/main/docker/scripts/install.sh | bash
#

set -e

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTALL_DIR="/opt/belbird"
WEB_DIR="/var/www/belbird"
CERTBOT_DIR="/var/www/certbot"
LOG_FILE="/var/log/belbird-install.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

prompt() {
    echo -en "${CYAN}$1${NC}"
    read -r REPLY
    echo "$REPLY"
}

header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Pre-flight Checks
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

preflight_check() {
    header "🔍 Pre-flight Checks"
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (sudo ./install.sh)"
    fi
    success "Running as root"
    
    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        error "Cannot detect OS. This script requires Ubuntu 22.04+"
    fi
    source /etc/os-release
    if [[ "$ID" != "ubuntu" ]]; then
        warn "This script is designed for Ubuntu. Your OS: $ID"
    fi
    success "OS: $PRETTY_NAME"
    
    # Check available disk space (minimum 5GB)
    DISK_FREE=$(df / | tail -1 | awk '{print $4}')
    if [[ $DISK_FREE -lt 5000000 ]]; then
        error "Not enough disk space. Need at least 5GB free."
    fi
    success "Disk space: $(df -h / | tail -1 | awk '{print $4}') available"
    
    # Check RAM (minimum 2GB)
    RAM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
    if [[ $RAM_TOTAL -lt 1800 ]]; then
        warn "Low RAM detected: ${RAM_TOTAL}MB. Recommended: 2GB+"
    fi
    success "RAM: ${RAM_TOTAL}MB"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Collect Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

collect_config() {
    header "📝 Configuration"
    
    echo ""
    echo -e "${YELLOW}Please provide the following information:${NC}"
    echo ""
    
    # Domain
    read -p "Domain (e.g., belbird.ru): " DOMAIN
    DOMAIN=${DOMAIN:-belbird.ru}
    
    # GitHub repo
    read -p "GitHub repository URL: " GITHUB_REPO
    if [[ -z "$GITHUB_REPO" ]]; then
        error "GitHub repository URL is required"
    fi
    
    # Supabase credentials
    read -p "Supabase URL: " SUPABASE_URL
    read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
    
    # Webhook secret
    WEBHOOK_SECRET=$(openssl rand -hex 32)
    log "Generated webhook secret: $WEBHOOK_SECRET"
    
    # Admin email for SSL
    read -p "Email for SSL certificates: " ADMIN_EMAIL
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Configuration Summary:${NC}"
    echo -e "  Domain:        ${GREEN}$DOMAIN${NC}"
    echo -e "  GitHub Repo:   ${GREEN}$GITHUB_REPO${NC}"
    echo -e "  Supabase URL:  ${GREEN}$SUPABASE_URL${NC}"
    echo -e "  Admin Email:   ${GREEN}$ADMIN_EMAIL${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    read -p "Continue with installation? [Y/n]: " CONFIRM
    if [[ "$CONFIRM" =~ ^[Nn] ]]; then
        echo "Installation cancelled."
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
    
    log "Upgrading system packages..."
    apt upgrade -y -qq
    
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
        unzip
    
    # Node.js 20
    if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 20 ]]; then
        log "Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
        apt install -y -qq nodejs
    fi
    success "Node.js $(node -v)"
    success "npm $(npm -v)"
    
    success "All dependencies installed"
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
    ufw --force enable > /dev/null 2>&1
    
    success "Firewall configured (SSH, HTTP, HTTPS allowed)"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Clone and Build Project
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

setup_project() {
    header "🐦 Setting Up BelBird Project"
    
    # Create directories
    mkdir -p "$INSTALL_DIR" "$WEB_DIR" "$CERTBOT_DIR"
    
    # Clone repository
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        log "Project already exists, pulling latest..."
        cd "$INSTALL_DIR"
        git fetch origin main
        git reset --hard origin/main
    else
        log "Cloning repository..."
        git clone "$GITHUB_REPO" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
    
    # Create production environment file
    log "Creating environment configuration..."
    cat > "$INSTALL_DIR/.env.production" << EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_ANON_KEY
EOF
    
    # Install dependencies
    log "Installing npm dependencies..."
    npm ci --silent
    
    # Build project
    log "Building frontend (this may take a few minutes)..."
    npm run build
    
    # Deploy to web directory
    log "Deploying to web server..."
    rm -rf "$WEB_DIR"/*
    cp -r dist/* "$WEB_DIR"/
    
    success "Project built and deployed"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Configure Nginx
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

setup_nginx() {
    header "🌐 Configuring Nginx"
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Main site configuration
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
    
    # SSL will be configured by Certbot
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
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
        proxy_pass http://127.0.0.1:9000/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # Webhook configuration
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
    
    # SSL will be configured by Certbot
    # ssl_certificate /etc/letsencrypt/live/webhook.$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/webhook.$DOMAIN/privkey.pem;
    
    location /health {
        proxy_pass http://127.0.0.1:9999;
    }
    
    location /webhook {
        proxy_pass http://127.0.0.1:9999;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Hub-Signature-256 \$http_x_hub_signature_256;
        proxy_read_timeout 300s;
        
        # GitHub IP ranges
        allow 192.30.252.0/22;
        allow 185.199.108.0/22;
        allow 140.82.112.0/20;
        allow 143.55.64.0/20;
        deny all;
    }
    
    location / {
        return 404;
    }
}
EOF

    # Enable sites
    ln -sf /etc/nginx/sites-available/belbird /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/belbird-webhook /etc/nginx/sites-enabled/
    
    # Test and reload
    nginx -t
    systemctl reload nginx
    
    success "Nginx configured"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Setup SSL Certificates
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

setup_ssl() {
    header "🔒 Setting Up SSL Certificates"
    
    log "Obtaining SSL certificates..."
    
    # Get certificates
    certbot --nginx \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        -d "webhook.$DOMAIN" \
        --email "$ADMIN_EMAIL" \
        --agree-tos \
        --non-interactive \
        --redirect
    
    # Setup auto-renewal
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    success "SSL certificates installed and auto-renewal enabled"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Setup Systemd Services
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

setup_services() {
    header "⚙️  Setting Up System Services"
    
    # Create webhook service with actual secret
    log "Creating webhook service..."
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

    # Make scripts executable
    chmod +x "$INSTALL_DIR/docker/scripts/"*.sh
    chmod +x "$INSTALL_DIR/docker/scripts/"*.js 2>/dev/null || true
    
    # Reload and start services
    systemctl daemon-reload
    systemctl enable belbird-webhook
    systemctl start belbird-webhook
    
    success "Webhook service installed and started"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Final Summary
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🎉 Installation Complete!                     ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Your BelBird instance is now running at:${NC}"
    echo -e "  🌐 Website:    ${GREEN}https://$DOMAIN${NC}"
    echo -e "  🔗 Webhook:    ${GREEN}https://webhook.$DOMAIN/webhook${NC}"
    echo ""
    echo -e "${CYAN}GitHub Webhook Configuration:${NC}"
    echo -e "  URL:     ${YELLOW}https://webhook.$DOMAIN/webhook${NC}"
    echo -e "  Secret:  ${YELLOW}$WEBHOOK_SECRET${NC}"
    echo ""
    echo -e "${CYAN}Service Status:${NC}"
    systemctl is-active --quiet nginx && echo -e "  ✅ Nginx: running" || echo -e "  ❌ Nginx: stopped"
    systemctl is-active --quiet belbird-webhook && echo -e "  ✅ Webhook: running" || echo -e "  ❌ Webhook: stopped"
    echo ""
    echo -e "${CYAN}Useful Commands:${NC}"
    echo -e "  View logs:     ${YELLOW}journalctl -u belbird-webhook -f${NC}"
    echo -e "  Manual deploy: ${YELLOW}$INSTALL_DIR/docker/scripts/deploy.sh${NC}"
    echo -e "  Restart nginx: ${YELLOW}systemctl restart nginx${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo -e "  1. Configure GitHub Webhook with the URL and secret above"
    echo -e "  2. Add GitHub Actions secrets (VDS_HOST, VDS_USER, VDS_SSH_KEY)"
    echo -e "  3. Push to main branch to trigger auto-deploy"
    echo ""
    echo -e "Installation log saved to: ${YELLOW}$LOG_FILE${NC}"
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
    echo -e "${CYAN}║                                                                  ║${NC}"
    echo -e "${CYAN}║   This script will install and configure:                        ║${NC}"
    echo -e "${CYAN}║   • Node.js 20, Nginx, Certbot                                   ║${NC}"
    echo -e "${CYAN}║   • BelBird frontend with production build                       ║${NC}"
    echo -e "${CYAN}║   • SSL certificates (Let's Encrypt)                             ║${NC}"
    echo -e "${CYAN}║   • GitHub Webhook for auto-deploy                               ║${NC}"
    echo -e "${CYAN}║                                                                  ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Initialize log
    echo "BelBird Installation Log - $(date)" > "$LOG_FILE"
    
    preflight_check
    collect_config
    install_dependencies
    setup_firewall
    setup_project
    setup_nginx
    setup_ssl
    setup_services
    print_summary
}

# Run main function
main "$@"
