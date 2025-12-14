# 🚀 Полная инструкция по миграции BelBird на VDS

Пошаговое руководство по развёртыванию BelBird на собственном VDS сервере.

## 📋 Содержание

1. [Требования к серверу](#требования-к-серверу)
2. [Подготовка сервера](#подготовка-сервера)
3. [Установка Supabase](#установка-supabase)
4. [Развёртывание Edge Functions](#развёртывание-edge-functions)
5. [Сборка и деплой фронтенда](#сборка-и-деплой-фронтенда)
6. [Настройка Nginx](#настройка-nginx)
7. [SSL сертификаты](#ssl-сертификаты)
8. [Настройка мониторинга](#настройка-мониторинга)
9. [Миграция данных](#миграция-данных)
10. [Проверка работоспособности](#проверка-работоспособности)

---

## 📦 Требования к серверу

### Минимальные требования
- **CPU**: 2 ядра
- **RAM**: 4 GB (рекомендуется 8 GB)
- **SSD**: 40 GB
- **OS**: Ubuntu 22.04 LTS / Debian 12

### Рекомендуемые требования
- **CPU**: 4 ядра
- **RAM**: 8 GB
- **SSD**: 80 GB
- **OS**: Ubuntu 22.04 LTS

### Необходимые порты
| Порт | Сервис |
|------|--------|
| 22 | SSH |
| 80 | HTTP |
| 443 | HTTPS |
| 5432 | PostgreSQL (только локально) |
| 8000 | Supabase Kong API Gateway |
| 9000 | Edge Functions Gateway |

---

## 🔧 Подготовка сервера

### Шаг 1: Подключение к серверу

```bash
ssh root@YOUR_SERVER_IP
```

### Шаг 2: Обновление системы

```bash
apt update && apt upgrade -y
```

### Шаг 3: Установка необходимых пакетов

```bash
apt install -y \
  curl \
  wget \
  git \
  htop \
  nano \
  ufw \
  fail2ban \
  certbot \
  python3-certbot-nginx
```

### Шаг 4: Установка Docker

```bash
# Установка Docker
curl -fsSL https://get.docker.com | sh

# Добавление пользователя в группу docker
usermod -aG docker $USER

# Установка Docker Compose Plugin
apt install docker-compose-plugin -y

# Проверка
docker --version
docker compose version
```

### Шаг 5: Установка Nginx

```bash
apt install nginx -y
systemctl enable nginx
systemctl start nginx
```

### Шаг 6: Настройка файрвола

```bash
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable
ufw status
```

### Шаг 7: Создание структуры директорий

```bash
mkdir -p /opt/belbird
mkdir -p /opt/supabase
mkdir -p /var/www/belbird
```

---

## 🗄️ Установка Supabase

### Шаг 1: Клонирование Supabase

```bash
cd /opt/supabase
git clone --depth 1 https://github.com/supabase/supabase.git .
cd docker
```

### Шаг 2: Настройка переменных окружения

```bash
cp .env.example .env
nano .env
```

**Обязательно измените следующие переменные:**

```bash
############
# Secrets - ОБЯЗАТЕЛЬНО ЗАМЕНИТЕ!
############

# Генерация JWT Secret (минимум 32 символа)
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long

# Генерация ключей (выполните на локальной машине)
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Anon Key - публичный ключ для клиента
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key - приватный ключ для сервера
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Dashboard пароль
DASHBOARD_PASSWORD=your-secure-dashboard-password

# PostgreSQL пароль
POSTGRES_PASSWORD=your-secure-postgres-password

############
# URLs
############
SITE_URL=https://belbird.ru
API_EXTERNAL_URL=https://api.belbird.ru

############
# Email (опционально)
############
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=noreply@belbird.ru
SMTP_PASS=your-smtp-password
SMTP_SENDER_NAME=BelBird
```

### Шаг 3: Генерация JWT ключей

На локальной машине (или на сервере с Node.js):

```bash
# Установка supabase CLI (если нужно)
npm install -g supabase

# Генерация ключей
node -e "
const jwt = require('jsonwebtoken');
const jwtSecret = require('crypto').randomBytes(32).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);
console.log('');

const anonPayload = {
  role: 'anon',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60)
};
console.log('ANON_KEY=' + jwt.sign(anonPayload, jwtSecret));
console.log('');

const servicePayload = {
  role: 'service_role',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60)
};
console.log('SERVICE_ROLE_KEY=' + jwt.sign(servicePayload, jwtSecret));
"
```

### Шаг 4: Запуск Supabase

```bash
cd /opt/supabase/docker
docker compose up -d

# Проверка статуса
docker compose ps

# Просмотр логов
docker compose logs -f
```

### Шаг 5: Проверка работоспособности

```bash
# API должно отвечать
curl http://localhost:8000/rest/v1/

# Studio Dashboard
curl http://localhost:3000
```

---

## ⚡ Развёртывание Edge Functions

### Шаг 1: Копирование проекта

```bash
cd /opt/belbird

# Клонирование репозитория (замените на ваш репозиторий)
git clone https://github.com/YOUR_USERNAME/belbird.git .

# Или копирование через SCP с локальной машины
# scp -r ./docker root@YOUR_SERVER_IP:/opt/belbird/
```

### Шаг 2: Настройка переменных окружения

```bash
cd /opt/belbird/docker
cp .env.example .env
nano .env
```

**Заполните переменные:**

```bash
# Supabase (используйте данные из шага выше)
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=your-anon-key-from-above
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-above

# AI провайдеры (выберите один)
AI_PROVIDER=yandex

# YandexGPT
YANDEX_API_KEY=your-yandex-api-key
YANDEX_FOLDER_ID=your-folder-id

# Или GigaChat
# GIGACHAT_TOKEN=your-gigachat-token

# Или OpenRouter
# OPENROUTER_API_KEY=your-openrouter-key

# Push уведомления (VAPID ключи)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Доставка
CDEK_CLIENT_ID=your-cdek-client-id
CDEK_CLIENT_SECRET=your-cdek-secret
BOXBERRY_TOKEN=your-boxberry-token

# Оплата
ALFA_USERNAME=your-alfa-username
ALFA_PASSWORD=your-alfa-password
```

### Шаг 3: Использование YandexGPT версий функций

```bash
# Замена AI функций на YandexGPT версии
cp /opt/belbird/docker/functions-adapted/ai-chat-yandex/index.ts \
   /opt/belbird/supabase/functions/ai-chat/index.ts

cp /opt/belbird/docker/functions-adapted/visual-search-yandex/index.ts \
   /opt/belbird/supabase/functions/visual-search/index.ts

cp /opt/belbird/docker/functions-adapted/generate-product-content-yandex/index.ts \
   /opt/belbird/supabase/functions/generate-product-content/index.ts

cp /opt/belbird/docker/functions-adapted/generate-blog-content-yandex/index.ts \
   /opt/belbird/supabase/functions/generate-blog-content/index.ts

cp /opt/belbird/docker/functions-adapted/generate-reviews-yandex/index.ts \
   /opt/belbird/supabase/functions/generate-reviews/index.ts
```

### Шаг 4: Генерация VAPID ключей

```bash
# Установка web-push CLI
npm install -g web-push

# Генерация ключей
web-push generate-vapid-keys

# Скопируйте ключи в .env файл
```

### Шаг 5: Запуск Edge Functions

```bash
cd /opt/belbird/docker

# Сделать скрипты исполняемыми
chmod +x scripts/*.sh

# Запуск
./scripts/start.sh

# Проверка
docker compose -f docker-compose.functions.yml ps
```

### Шаг 6: Установка systemd сервисов

```bash
cd /opt/belbird/docker/systemd
chmod +x *.sh
sudo ./install-services.sh

# Запуск сервисов
sudo systemctl start belbird-supabase
sudo systemctl start belbird-functions

# Проверка статуса
sudo systemctl status belbird-supabase
sudo systemctl status belbird-functions
```

---

## 🎨 Сборка и деплой фронтенда

### Шаг 1: Сборка на локальной машине

```bash
# На локальной машине
cd /path/to/belbird

# Установка зависимостей
npm install

# Создание .env для продакшена
cat > .env.production << EOF
VITE_SUPABASE_URL=https://api.belbird.ru
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=belbird
EOF

# Сборка
npm run build

# Копирование на сервер
scp -r dist/* root@YOUR_SERVER_IP:/var/www/belbird/
```

### Шаг 2: Альтернатива — сборка на сервере

```bash
# На сервере
cd /opt/belbird

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Установка зависимостей и сборка
npm install
npm run build

# Копирование в директорию веб-сервера
cp -r dist/* /var/www/belbird/
```

---

## 🌐 Настройка Nginx

### Шаг 1: Создание конфигурации сайта

```bash
nano /etc/nginx/sites-available/belbird
```

**Содержимое файла:**

```nginx
# HTTP -> HTTPS редирект
server {
    listen 80;
    server_name belbird.ru www.belbird.ru;
    return 301 https://$server_name$request_uri;
}

# Основной сайт
server {
    listen 443 ssl http2;
    server_name belbird.ru www.belbird.ru;

    # SSL сертификаты (будут созданы позже)
    ssl_certificate /etc/letsencrypt/live/belbird.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/belbird.ru/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Корневая директория
    root /var/www/belbird;
    index index.html;

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Кэширование статики
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA роутинг
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Edge Functions API
    location /functions/v1/ {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### Шаг 2: Конфигурация API (опционально — если нужен отдельный домен)

```bash
nano /etc/nginx/sites-available/belbird-api
```

```nginx
server {
    listen 80;
    server_name api.belbird.ru;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.belbird.ru;

    ssl_certificate /etc/letsencrypt/live/api.belbird.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.belbird.ru/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Supabase API
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

### Шаг 3: Активация конфигурации

```bash
ln -s /etc/nginx/sites-available/belbird /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/belbird-api /etc/nginx/sites-enabled/

# Удаление дефолтного сайта
rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
nginx -t

# Перезапуск
systemctl reload nginx
```

---

## 🔒 SSL сертификаты

### Шаг 1: Временная конфигурация без SSL

```bash
# Временно закомментируйте SSL строки в nginx конфиге
nano /etc/nginx/sites-available/belbird
# Закомментируйте ssl_certificate и ssl_certificate_key

# Измените listen 443 ssl http2 на listen 80
# Перезапустите nginx
nginx -t && systemctl reload nginx
```

### Шаг 2: Получение сертификатов

```bash
# Для основного домена
certbot --nginx -d belbird.ru -d www.belbird.ru

# Для API домена (если используется)
certbot --nginx -d api.belbird.ru

# Автоматическое обновление
certbot renew --dry-run
```

### Шаг 3: Восстановление SSL конфигурации

```bash
# Верните SSL настройки в nginx конфиг
nano /etc/nginx/sites-available/belbird

# Перезапустите nginx
nginx -t && systemctl reload nginx
```

---

## 📊 Настройка мониторинга

### Шаг 1: Создание Telegram бота

1. Откройте @BotFather в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям, получите токен
4. Создайте группу и добавьте бота
5. Получите Chat ID:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates"
   ```

### Шаг 2: Настройка мониторинга

```bash
cd /opt/belbird/docker
cp .env.monitor.example .env.monitor
nano .env.monitor
```

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-100123456789
```

### Шаг 3: Установка сервиса мониторинга

```bash
# Копирование сервиса
cp /opt/belbird/docker/systemd/belbird-monitor.service /etc/systemd/system/

# Редактирование пути к .env
nano /etc/systemd/system/belbird-monitor.service
# Измените EnvironmentFile на /opt/belbird/docker/.env.monitor

# Активация
systemctl daemon-reload
systemctl enable belbird-monitor
systemctl start belbird-monitor

# Проверка
systemctl status belbird-monitor
journalctl -u belbird-monitor -f
```

### Шаг 4: Ручной запуск мониторинга

```bash
# Однократный запуск
source /opt/belbird/docker/.env.monitor
/opt/belbird/docker/scripts/monitor.sh

# Демон с проверкой каждые 60 секунд
/opt/belbird/docker/scripts/monitor.sh --daemon 60
```

---

## 📤 Миграция данных

### Шаг 1: Экспорт данных из Lovable Cloud

В админ-панели BelBird:
1. Перейдите в каждый раздел (Товары, Категории, Заказы и т.д.)
2. Используйте кнопку "Экспорт в Excel"
3. Сохраните все файлы

### Шаг 2: Создание схемы базы данных

```bash
# Подключение к PostgreSQL
docker exec -it supabase-db psql -U postgres

# Или через psql
psql "postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres"
```

Выполните SQL миграции из папки `supabase/migrations/` в порядке создания.

### Шаг 3: Импорт данных

```bash
# Через Supabase Studio
# Откройте http://YOUR_SERVER_IP:3000
# Перейдите в Table Editor
# Используйте Import CSV/JSON

# Или через SQL
psql "postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres" < backup.sql
```

### Шаг 4: Миграция файлов Storage

```bash
# Скачайте файлы из Lovable Cloud Storage
# Загрузите через Supabase Studio -> Storage
# Или используйте Supabase CLI
```

---

## ✅ Проверка работоспособности

### Чек-лист

```bash
# 1. Проверка Docker контейнеров
docker ps

# 2. Проверка Supabase API
curl -s https://api.belbird.ru/rest/v1/ | head

# 3. Проверка Edge Functions
curl -s https://belbird.ru/functions/v1/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Привет"}'

# 4. Проверка фронтенда
curl -I https://belbird.ru

# 5. Проверка SSL
openssl s_client -connect belbird.ru:443 -servername belbird.ru

# 6. Проверка systemd сервисов
systemctl status belbird-supabase
systemctl status belbird-functions
systemctl status belbird-monitor

# 7. Проверка логов
journalctl -u belbird-functions -n 50
docker logs edge-gateway --tail 50
```

### Тестирование функционала

1. **Главная страница** — https://belbird.ru
2. **Каталог товаров** — https://belbird.ru/catalog
3. **AI чат** — нажмите на виджет чата
4. **Авторизация** — https://belbird.ru/auth
5. **Админ-панель** — https://belbird.ru/admin

---

## 🔄 Обновление

### Обновление кода

```bash
cd /opt/belbird
git pull origin main

# Пересборка фронтенда
npm install
npm run build
cp -r dist/* /var/www/belbird/

# Перезапуск Edge Functions
./docker/scripts/update.sh
```

### Обновление Supabase

```bash
cd /opt/supabase/docker
git pull
docker compose pull
docker compose up -d
```

---

## 🆘 Решение проблем

### Контейнеры не запускаются

```bash
# Проверка логов
docker compose logs

# Проверка ресурсов
df -h
free -m

# Перезапуск Docker
systemctl restart docker
```

### 502 Bad Gateway

```bash
# Проверка backend
curl http://localhost:8000/rest/v1/
curl http://localhost:9000/

# Проверка nginx
nginx -t
tail -f /var/log/nginx/error.log
```

### Проблемы с SSL

```bash
# Обновление сертификатов
certbot renew --force-renewal

# Проверка срока действия
certbot certificates
```

### Высокая нагрузка

```bash
# Мониторинг
htop
docker stats

# Логи
journalctl -u belbird-functions -f
```

---

## 📞 Поддержка

- **Документация**: `/opt/belbird/docker/README.md`
- **Edge Functions**: `/opt/belbird/docker/functions-adapted/README.md`
- **Systemd сервисы**: `/opt/belbird/docker/systemd/README.md`

---

*Последнее обновление: Декабрь 2024*
