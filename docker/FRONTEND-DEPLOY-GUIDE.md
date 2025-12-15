# Деплой Frontend на VDS

## Быстрый старт

### 1. Сборка проекта

На вашем компьютере или на VDS:

```bash
# Клонирование (если ещё не сделано)
git clone <your-repo> /opt/belbird
cd /opt/belbird

# Установка зависимостей
npm install

# Создание .env файла
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://ваш-домен-supabase:8000
VITE_SUPABASE_PUBLISHABLE_KEY=ваш_anon_key
EOF

# Сборка
npm run build
```

### 2. Настройка nginx

```bash
# Копирование конфигурации
sudo cp docker/nginx-frontend.conf /etc/nginx/sites-available/belbird
sudo ln -sf /etc/nginx/sites-available/belbird /etc/nginx/sites-enabled/

# Создание директории
sudo mkdir -p /var/www/belbird

# Копирование билда
sudo cp -r dist/* /var/www/belbird/

# Установка прав
sudo chown -R www-data:www-data /var/www/belbird

# Проверка и перезапуск nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL сертификат (Let's Encrypt)

```bash
# Установка certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата
sudo certbot --nginx -d belbird.ru -d www.belbird.ru
```

## Автоматический деплой

Используйте скрипт:

```bash
chmod +x docker/scripts/deploy-frontend.sh
sudo ./docker/scripts/deploy-frontend.sh
```

## Структура на VDS

```
/var/www/belbird/
├── index.html
├── assets/
│   ├── index-*.js
│   ├── index-*.css
│   └── ...
├── sw.js                    # Service Worker (PWA)
├── manifest.webmanifest     # PWA Manifest
├── pwa-192x192.png
├── pwa-512x512.png
└── robots.txt
```

## Обновление сайта

### Вариант 1: Через скрипт

```bash
cd /opt/belbird
git pull origin main
sudo ./docker/scripts/deploy-frontend.sh
```

### Вариант 2: Вручную

```bash
cd /opt/belbird
git pull origin main
npm run build
sudo rm -rf /var/www/belbird/*
sudo cp -r dist/* /var/www/belbird/
sudo systemctl reload nginx
```

## Откат к предыдущей версии

```bash
sudo rm -rf /var/www/belbird
sudo mv /var/www/belbird-backup /var/www/belbird
sudo systemctl reload nginx
```

## Проверка

- **Сайт**: https://belbird.ru
- **Админка**: https://belbird.ru/admin
- **PWA**: Откройте сайт в Chrome → три точки → "Установить приложение"

## Переменные окружения

Убедитесь что `.env` содержит правильные адреса вашего self-hosted Supabase:

```env
VITE_SUPABASE_URL=https://api.belbird.ru
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...ваш_anon_key
```

## Полная архитектура на VDS

```
┌─────────────────────────────────────────────────────────┐
│                      VDS Server                          │
├─────────────────────────────────────────────────────────┤
│  nginx (порт 80/443)                                    │
│  ├─ belbird.ru → /var/www/belbird (Frontend)            │
│  ├─ api.belbird.ru → localhost:8000 (Supabase API)      │
│  ├─ studio.belbird.ru → localhost:3000 (Studio)         │
│  └─ functions.belbird.ru → localhost:9000 (Functions)   │
├─────────────────────────────────────────────────────────┤
│  Docker Compose (Supabase)                              │
│  ├─ PostgreSQL (5432)                                   │
│  ├─ Kong API Gateway (8000)                             │
│  ├─ GoTrue Auth (9999)                                  │
│  ├─ PostgREST (3000)                                    │
│  ├─ Realtime (4000)                                     │
│  └─ Storage (5000)                                      │
├─────────────────────────────────────────────────────────┤
│  Docker Compose (Edge Functions)                        │
│  ├─ edge-ai-chat (9001)                                 │
│  ├─ edge-delivery-calculate (9003)                      │
│  ├─ edge-pickup-points (9004)                           │
│  └─ ... (9000 gateway)                                  │
└─────────────────────────────────────────────────────────┘
```

## Мониторинг

Логи nginx:
```bash
tail -f /var/log/nginx/belbird_access.log
tail -f /var/log/nginx/belbird_error.log
```

Проверка PWA:
```bash
curl -I https://belbird.ru/sw.js
curl -I https://belbird.ru/manifest.webmanifest
```
