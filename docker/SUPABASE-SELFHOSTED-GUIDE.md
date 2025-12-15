# Self-hosted Supabase на VDS — Полное руководство

Пошаговая инструкция по развёртыванию self-hosted Supabase на Ubuntu 22.04 VDS с миграцией данных из Lovable Cloud.

## Содержание

1. [Требования к серверу](#1-требования-к-серверу)
2. [Подготовка VDS](#2-подготовка-vds)
3. [Установка Docker](#3-установка-docker)
4. [Установка Supabase](#4-установка-supabase)
5. [Генерация секретов](#5-генерация-секретов)
6. [Настройка конфигурации](#6-настройка-конфигурации)
7. [Запуск Supabase](#7-запуск-supabase)
8. [Настройка Nginx + SSL](#8-настройка-nginx--ssl)
9. [Миграция данных из Lovable Cloud](#9-миграция-данных-из-lovable-cloud)
10. [Настройка Frontend](#10-настройка-frontend)
11. [Edge Functions](#11-edge-functions)
12. [Резервное копирование](#12-резервное-копирование)
13. [Мониторинг](#13-мониторинг)

---

## 1. Требования к серверу

### Минимальные требования

| Компонент | Минимум | Рекомендуется |
|-----------|---------|---------------|
| CPU | 2 ядра | 4+ ядра |
| RAM | 4 GB | 8+ GB |
| SSD | 40 GB | 100+ GB |
| ОС | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### DNS записи

Создайте A-записи для вашего домена:

```
Тип    Имя              Значение
A      belbird.ru       IP_ВАШЕГО_СЕРВЕРА
A      api.belbird.ru   IP_ВАШЕГО_СЕРВЕРА
A      db.belbird.ru    IP_ВАШЕГО_СЕРВЕРА  (опционально, для Studio)
```

---

## 2. Подготовка VDS

### 2.1. Подключение к серверу

```bash
ssh root@IP_ВАШЕГО_СЕРВЕРА
```

### 2.2. Обновление системы

```bash
apt update && apt upgrade -y
```

### 2.3. Установка базовых пакетов

```bash
apt install -y \
  curl \
  wget \
  git \
  nginx \
  certbot \
  python3-certbot-nginx \
  ufw \
  htop \
  unzip \
  jq
```

### 2.4. Настройка файрвола

```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
ufw status
```

### 2.5. Настройка swap (если RAM < 8GB)

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 3. Установка Docker

### 3.1. Установка Docker Engine

```bash
# Добавление репозитория
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Проверка
docker --version
docker compose version
```

### 3.2. Автозапуск Docker

```bash
systemctl enable docker
systemctl start docker
```

---

## 4. Установка Supabase

### 4.1. Клонирование репозитория

```bash
mkdir -p /opt/supabase
cd /opt/supabase

# Клонируем официальный репозиторий
git clone --depth 1 https://github.com/supabase/supabase.git
cd supabase/docker
```

### 4.2. Копирование конфигурации

```bash
cp .env.example .env
```

---

## 5. Генерация секретов

### 5.1. Скрипт генерации секретов

Создайте скрипт для генерации всех необходимых секретов:

```bash
cat > /opt/supabase/generate-secrets.sh << 'EOF'
#!/bin/bash

echo "=== Генерация секретов для Supabase ==="

# Генерация случайных строк
generate_secret() {
  openssl rand -base64 32 | tr -d '/+=' | cut -c1-32
}

# JWT секрет (минимум 32 символа)
JWT_SECRET=$(openssl rand -base64 64 | tr -d '/+=' | cut -c1-64)

# Пароли
POSTGRES_PASSWORD=$(generate_secret)
DASHBOARD_PASSWORD=$(generate_secret)

# Anon Key (JWT токен)
ANON_KEY=$(echo -n '{"role":"anon","iss":"supabase","iat":'$(date +%s)',"exp":'$(($(date +%s) + 315360000))'}' | base64 -w 0 | tr '+/' '-_' | tr -d '=')

# Service Role Key (JWT токен)
SERVICE_ROLE_KEY=$(echo -n '{"role":"service_role","iss":"supabase","iat":'$(date +%s)',"exp":'$(($(date +%s) + 315360000))'}' | base64 -w 0 | tr '+/' '-_' | tr -d '=')

echo ""
echo "=== СОХРАНИТЕ ЭТИ ЗНАЧЕНИЯ ==="
echo ""
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
echo "JWT_SECRET=$JWT_SECRET"
echo "ANON_KEY=$ANON_KEY"
echo "SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY"
echo "DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD"
echo ""
echo "================================"
EOF

chmod +x /opt/supabase/generate-secrets.sh
```

### 5.2. Генерация JWT ключей (правильный способ)

Для корректных JWT токенов используйте онлайн-генератор Supabase:

**Перейдите на:** https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys

Или используйте Node.js:

```bash
# Установка Node.js (если не установлен)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Создание скрипта генерации JWT
cat > /opt/supabase/generate-jwt.js << 'EOF'
const crypto = require('crypto');

// Генерация JWT секрета
const jwtSecret = crypto.randomBytes(32).toString('hex');

// Функция создания JWT
function createJWT(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

const now = Math.floor(Date.now() / 1000);
const exp = now + 315360000; // 10 лет

const anonKey = createJWT({
  role: 'anon',
  iss: 'supabase',
  iat: now,
  exp: exp
}, jwtSecret);

const serviceRoleKey = createJWT({
  role: 'service_role',
  iss: 'supabase',
  iat: now,
  exp: exp
}, jwtSecret);

console.log('='.repeat(60));
console.log('СОХРАНИТЕ ЭТИ ЗНАЧЕНИЯ В НАДЁЖНОЕ МЕСТО!');
console.log('='.repeat(60));
console.log('');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('');
console.log(`ANON_KEY=${anonKey}`);
console.log('');
console.log(`SERVICE_ROLE_KEY=${serviceRoleKey}`);
console.log('');
console.log('='.repeat(60));
EOF

node /opt/supabase/generate-jwt.js
```

**Сохраните вывод в надёжное место!**

---

## 6. Настройка конфигурации

### 6.1. Редактирование .env файла

```bash
cd /opt/supabase/supabase/docker
nano .env
```

### 6.2. Основные параметры для изменения

```bash
############
# Secrets
############

# Замените на сгенерированные значения
POSTGRES_PASSWORD=ваш_сгенерированный_пароль
JWT_SECRET=ваш_jwt_secret
ANON_KEY=ваш_anon_key
SERVICE_ROLE_KEY=ваш_service_role_key

############
# Dashboard
############

DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=ваш_надёжный_пароль

############
# API
############

# Ваш домен
SITE_URL=https://belbird.ru
API_EXTERNAL_URL=https://api.belbird.ru

# Дополнительные redirect URLs (через запятую)
ADDITIONAL_REDIRECT_URLS=https://belbird.ru,https://www.belbird.ru

############
# Auth
############

# Отключение подтверждения email (для тестирования)
ENABLE_EMAIL_AUTOCONFIRM=true

# Настройки SMTP (опционально)
# SMTP_ADMIN_EMAIL=admin@belbird.ru
# SMTP_HOST=smtp.yandex.ru
# SMTP_PORT=465
# SMTP_USER=noreply@belbird.ru
# SMTP_PASS=ваш_smtp_пароль
# SMTP_SENDER_NAME=BelBird

############
# Studio
############

STUDIO_PORT=3000
STUDIO_DEFAULT_ORGANIZATION=BelBird
STUDIO_DEFAULT_PROJECT=belbird

############
# Database
############

# Порт PostgreSQL (внутренний)
POSTGRES_PORT=5432
```

### 6.3. Полный пример .env

```bash
cat > /opt/supabase/supabase/docker/.env << 'EOF'
############
# Secrets
# YOU MUST CHANGE THESE BEFORE GOING INTO PRODUCTION
############

POSTGRES_PASSWORD=ЗАМЕНИТЕ_НА_СВОЙ_ПАРОЛЬ
JWT_SECRET=ЗАМЕНИТЕ_НА_СВОЙ_JWT_SECRET
ANON_KEY=ЗАМЕНИТЕ_НА_СВОЙ_ANON_KEY
SERVICE_ROLE_KEY=ЗАМЕНИТЕ_НА_СВОЙ_SERVICE_ROLE_KEY
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=ЗАМЕНИТЕ_НА_СВОЙ_ПАРОЛЬ

############
# Database - You can change these to any PostgreSQL database that has logical replication enabled.
############

POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432
# default user is postgres

############
# API Proxy - Configuration for the Kong Reverse proxy.
############

KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############
# API - Configuration for PostgREST.
############

PGRST_DB_SCHEMAS=public,storage,graphql_public

############
# Auth - Configuration for the GoTrue authentication server.
############

## General
SITE_URL=https://belbird.ru
ADDITIONAL_REDIRECT_URLS=https://belbird.ru,https://www.belbird.ru
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
API_EXTERNAL_URL=https://api.belbird.ru

## Mailer Config
MAILER_URLPATHS_CONFIRMATION="/auth/v1/verify"
MAILER_URLPATHS_INVITE="/auth/v1/verify"
MAILER_URLPATHS_RECOVERY="/auth/v1/verify"
MAILER_URLPATHS_EMAIL_CHANGE="/auth/v1/verify"

## Email auth
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
SMTP_ADMIN_EMAIL=admin@belbird.ru
SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_NAME=BelBird

## Phone auth
ENABLE_PHONE_SIGNUP=false
ENABLE_PHONE_AUTOCONFIRM=false

############
# Studio - Configuration for the Dashboard
############

STUDIO_DEFAULT_ORGANIZATION=BelBird
STUDIO_DEFAULT_PROJECT=belbird

STUDIO_PORT=3000
# replace if you intend to use Studio outside of localhost
SUPABASE_PUBLIC_URL=https://api.belbird.ru

# Enable webp support
IMGPROXY_ENABLE_WEBP_DETECTION=true

############
# Functions - Configuration for Functions
############
# NOTE: VERIFY_JWT applies to all functions. Per-function duplicates will be ignored.
# FUNCTIONS_VERIFY_JWT=true

############
# Logs - Configuration for Logflare
# Please refer to https://supabase.com/docs/reference/self-hosting-analytics/introduction
############

LOGFLARE_LOGGER_BACKEND_API_KEY=your-super-secret-and-long-logflare-key

# Change vector.toml sridge_pipeline for analytics
LOGFLARE_API_KEY=your-super-secret-and-long-logflare-key

# Docker socket location - this value will differ depending on your OS
DOCKER_SOCKET_LOCATION=/var/run/docker.sock

# Google Cloud Project details
GOOGLE_PROJECT_ID=GOOGLE_PROJECT_ID
GOOGLE_PROJECT_NUMBER=GOOGLE_PROJECT_NUMBER
EOF
```

---

## 7. Запуск Supabase

### 7.1. Запуск всех сервисов

```bash
cd /opt/supabase/supabase/docker

# Первый запуск (скачивание образов занимает время)
docker compose up -d

# Проверка статуса
docker compose ps
```

### 7.2. Ожидаемый вывод

```
NAME                      STATUS
supabase-analytics        Up
supabase-auth             Up
supabase-db               Up (healthy)
supabase-edge-functions   Up
supabase-imgproxy         Up
supabase-kong             Up (healthy)
supabase-meta             Up
supabase-realtime         Up
supabase-rest             Up
supabase-storage          Up
supabase-studio           Up
supabase-vector           Up
```

### 7.3. Проверка логов

```bash
# Все логи
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f supabase-auth
docker compose logs -f supabase-db
```

### 7.4. Проверка работоспособности

```bash
# Health check
curl http://localhost:8000/rest/v1/ -H "apikey: ВАШ_ANON_KEY"

# Должен вернуть пустой массив или данные
```

---

## 8. Настройка Nginx + SSL

### 8.1. Конфигурация Nginx для API

```bash
cat > /etc/nginx/sites-available/supabase-api << 'EOF'
# Supabase API (Kong)
server {
    listen 80;
    server_name api.belbird.ru;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, apikey, x-client-info' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
EOF
```

### 8.2. Конфигурация Nginx для Studio (опционально)

```bash
cat > /etc/nginx/sites-available/supabase-studio << 'EOF'
# Supabase Studio (Dashboard)
server {
    listen 80;
    server_name db.belbird.ru;

    # Basic Auth для защиты Studio
    auth_basic "Supabase Studio";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

### 8.3. Конфигурация Nginx для Frontend

```bash
cat > /etc/nginx/sites-available/belbird << 'EOF'
# BelBird Frontend
server {
    listen 80;
    server_name belbird.ru www.belbird.ru;

    root /var/www/belbird;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

### 8.4. Активация конфигураций

```bash
# Удаление default
rm -f /etc/nginx/sites-enabled/default

# Создание симлинков
ln -sf /etc/nginx/sites-available/supabase-api /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/supabase-studio /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/belbird /etc/nginx/sites-enabled/

# Создание пароля для Studio
apt install -y apache2-utils
htpasswd -c /etc/nginx/.htpasswd admin
# Введите пароль

# Проверка конфигурации
nginx -t

# Перезапуск Nginx
systemctl reload nginx
```

### 8.5. Получение SSL сертификатов

```bash
# Получение сертификатов для всех доменов
certbot --nginx -d belbird.ru -d www.belbird.ru -d api.belbird.ru -d db.belbird.ru --non-interactive --agree-tos -m your@email.com

# Автообновление (добавляется автоматически)
systemctl status certbot.timer
```

---

## 9. Миграция данных из Lovable Cloud

### 9.1. Экспорт данных из Lovable Cloud

**Шаг 1: Откройте Lovable Cloud Dashboard**

В Lovable нажмите "View Backend" для доступа к панели управления.

**Шаг 2: Экспорт таблиц**

Для каждой таблицы:
1. Перейдите в Database → Tables
2. Выберите таблицу
3. Нажмите Export → CSV

**Шаг 3: Экспорт схемы (SQL)**

Выполните SQL запрос в SQL Editor:

```sql
-- Получение DDL всех таблиц
SELECT 
  'CREATE TABLE ' || schemaname || '.' || tablename || ' (...);' as ddl
FROM pg_tables 
WHERE schemaname = 'public';
```

### 9.2. Получение полного дампа базы

Если у вас есть доступ к connection string Lovable Cloud:

```bash
# Установка PostgreSQL клиента
apt install -y postgresql-client

# Экспорт (замените на реальные данные)
PGPASSWORD="ваш_пароль" pg_dump \
  -h db.pxyioamzwokwfudzjwuk.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  --no-owner \
  --no-acl \
  -f /opt/supabase/lovable-backup.sql
```

### 9.3. Импорт данных в self-hosted Supabase

```bash
cd /opt/supabase/supabase/docker

# Получение ID контейнера PostgreSQL
POSTGRES_CONTAINER=$(docker compose ps -q db)

# Копирование дампа в контейнер
docker cp /opt/supabase/lovable-backup.sql $POSTGRES_CONTAINER:/tmp/

# Импорт данных
docker exec -it $POSTGRES_CONTAINER psql -U postgres -d postgres -f /tmp/lovable-backup.sql
```

### 9.4. Альтернативный метод: Ручной импорт CSV

```bash
# Копирование CSV файлов
docker cp /path/to/products.csv $POSTGRES_CONTAINER:/tmp/

# Импорт через COPY
docker exec -it $POSTGRES_CONTAINER psql -U postgres -d postgres -c "\COPY products FROM '/tmp/products.csv' WITH CSV HEADER"
```

### 9.5. Миграция Storage (файлов)

```bash
# Создание директории для загрузок
mkdir -p /opt/supabase/volumes/storage

# Скачивание файлов из Lovable Cloud (если доступны URL)
# Используйте скрипт для массового скачивания

cat > /opt/supabase/migrate-storage.sh << 'EOF'
#!/bin/bash

# Пример миграции файлов из публичного bucket
LOVABLE_URL="https://pxyioamzwokwfudzjwuk.supabase.co/storage/v1/object/public"
LOCAL_PATH="/opt/supabase/volumes/storage"

# Список файлов для миграции (получите из базы данных)
# SELECT images FROM products WHERE images IS NOT NULL;

# Пример скачивания
# wget -P $LOCAL_PATH/products "$LOVABLE_URL/products/image.jpg"
EOF

chmod +x /opt/supabase/migrate-storage.sh
```

### 9.6. Проверка миграции

```bash
# Подключение к базе
docker exec -it $(docker compose ps -q db) psql -U postgres -d postgres

# Проверка таблиц
\dt

# Проверка данных
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM orders;

# Выход
\q
```

---

## 10. Настройка Frontend

### 10.1. Клонирование проекта

```bash
mkdir -p /var/www
cd /var/www

# Клонирование из GitHub
git clone https://github.com/YOUR_USERNAME/belbird.git
cd belbird
```

### 10.2. Настройка переменных окружения

```bash
cat > .env.production << EOF
VITE_SUPABASE_URL=https://api.belbird.ru
VITE_SUPABASE_PUBLISHABLE_KEY=ВАШ_ANON_KEY
VITE_SUPABASE_PROJECT_ID=belbird
EOF
```

### 10.3. Сборка проекта

```bash
# Установка Node.js (если не установлен)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Установка зависимостей и сборка
npm install
npm run build

# Копирование в директорию Nginx
rm -rf /var/www/belbird-static
mv dist /var/www/belbird-static

# Обновление конфигурации Nginx
sed -i 's|root /var/www/belbird|root /var/www/belbird-static|g' /etc/nginx/sites-available/belbird

systemctl reload nginx
```

### 10.4. Автоматический деплой (GitHub Webhook)

```bash
# Настройка webhook (см. docker/scripts/webhook-server.js)
# Или используйте GitHub Actions
```

---

## 11. Edge Functions

### 11.1. Использование Docker-контейнеров для Edge Functions

Edge Functions в self-hosted Supabase работают через контейнер `supabase-edge-functions`.

```bash
# Проверка статуса
docker compose logs supabase-edge-functions
```

### 11.2. Добавление собственных функций

```bash
# Директория для функций
mkdir -p /opt/supabase/supabase/docker/volumes/functions

# Пример функции
cat > /opt/supabase/supabase/docker/volumes/functions/hello/index.ts << 'EOF'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  return new Response(
    JSON.stringify({ message: "Hello from self-hosted Supabase!" }),
    { headers: { "Content-Type": "application/json" } }
  )
})
EOF

# Перезапуск для применения
docker compose restart supabase-edge-functions
```

### 11.3. Использование адаптированных функций из проекта

Скопируйте функции из `docker/functions-adapted/`:

```bash
cp -r /var/www/belbird/docker/functions-adapted/* /opt/supabase/supabase/docker/volumes/functions/
docker compose restart supabase-edge-functions
```

---

## 12. Резервное копирование

### 12.1. Скрипт резервного копирования

```bash
cat > /opt/supabase/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/supabase/backups"
DATE=$(date +%Y%m%d_%H%M%S)
POSTGRES_CONTAINER=$(docker compose -f /opt/supabase/supabase/docker/docker-compose.yml ps -q db)

mkdir -p $BACKUP_DIR

# Бэкап базы данных
docker exec $POSTGRES_CONTAINER pg_dump -U postgres -d postgres > "$BACKUP_DIR/db_$DATE.sql"

# Бэкап storage
tar -czf "$BACKUP_DIR/storage_$DATE.tar.gz" /opt/supabase/supabase/docker/volumes/storage

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/supabase/backup.sh
```

### 12.2. Автоматическое резервное копирование (cron)

```bash
# Ежедневный бэкап в 3:00
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/supabase/backup.sh >> /var/log/supabase-backup.log 2>&1") | crontab -
```

---

## 13. Мониторинг

### 13.1. Проверка здоровья сервисов

```bash
cat > /opt/supabase/health-check.sh << 'EOF'
#!/bin/bash

echo "=== Supabase Health Check ==="
echo ""

# Docker containers
echo "Docker Containers:"
docker compose -f /opt/supabase/supabase/docker/docker-compose.yml ps --format "table {{.Name}}\t{{.Status}}"
echo ""

# API check
echo "API Health:"
curl -s http://localhost:8000/rest/v1/ -H "apikey: $ANON_KEY" | head -c 100
echo ""

# Disk usage
echo ""
echo "Disk Usage:"
df -h /

# Memory usage
echo ""
echo "Memory Usage:"
free -h
EOF

chmod +x /opt/supabase/health-check.sh
```

### 13.2. Systemd сервис для автозапуска

```bash
cat > /etc/systemd/system/supabase.service << 'EOF'
[Unit]
Description=Supabase Self-hosted
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/supabase/supabase/docker
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable supabase
```

---

## Полезные команды

```bash
# Перезапуск всех сервисов
cd /opt/supabase/supabase/docker
docker compose restart

# Просмотр логов
docker compose logs -f

# Остановка
docker compose down

# Запуск
docker compose up -d

# Обновление Supabase
git pull
docker compose pull
docker compose up -d

# Подключение к PostgreSQL
docker exec -it $(docker compose ps -q db) psql -U postgres

# Проверка использования ресурсов
docker stats
```

---

## Чек-лист после установки

- [ ] Все контейнеры запущены (`docker compose ps`)
- [ ] API отвечает на запросы (`curl https://api.belbird.ru/rest/v1/`)
- [ ] Studio доступна (`https://db.belbird.ru`)
- [ ] SSL сертификаты установлены
- [ ] Frontend работает (`https://belbird.ru`)
- [ ] Авторизация работает
- [ ] Данные мигрированы
- [ ] Бэкапы настроены
- [ ] Мониторинг настроен

---

## Troubleshooting

### Контейнер не запускается

```bash
docker compose logs <service-name>
```

### Ошибка подключения к API

1. Проверьте ANON_KEY в .env
2. Проверьте CORS настройки
3. Проверьте Nginx конфигурацию

### Ошибка авторизации

1. Проверьте JWT_SECRET
2. Проверьте SITE_URL
3. Проверьте ADDITIONAL_REDIRECT_URLS

### Медленная работа

1. Увеличьте RAM сервера
2. Добавьте swap
3. Проверьте `docker stats`
