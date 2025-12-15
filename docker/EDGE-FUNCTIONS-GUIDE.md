# BelBird - Настройка Edge Functions на Self-Hosted Supabase

Полное руководство по развёртыванию Edge Functions на VDS с использованием Docker и Deno.

## Содержание

1. [Архитектура](#архитектура)
2. [Требования](#требования)
3. [Быстрый старт](#быстрый-старт)
4. [Детальная настройка](#детальная-настройка)
5. [Настройка переменных окружения](#настройка-переменных-окружения)
6. [Запуск функций](#запуск-функций)
7. [Интеграция с фронтендом](#интеграция-с-фронтендом)
8. [Мониторинг и логи](#мониторинг-и-логи)
9. [Обновление функций](#обновление-функций)
10. [Troubleshooting](#troubleshooting)

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                        NGINX Gateway                         │
│                        (порт 9000)                           │
├─────────────────────────────────────────────────────────────┤
│  /functions/v1/ai-chat          → edge-ai-chat:8000         │
│  /functions/v1/alfa-bank-payment → edge-alfa-bank:8000      │
│  /functions/v1/delivery-calculate → edge-delivery:8000      │
│  /functions/v1/pickup-points    → edge-pickup-points:8000   │
│  /functions/v1/send-push        → edge-send-push:8000       │
│  /functions/v1/visual-search    → edge-visual-search:8000   │
│  /functions/v1/generate-*       → edge-generate-*:8000      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Docker Network: edge-functions                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Deno       │  │  Deno       │  │  Deno       │  ...    │
│  │  Container  │  │  Container  │  │  Container  │         │
│  │  :9001      │  │  :9002      │  │  :9003      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Список функций

| Функция | Порт | Описание |
|---------|------|----------|
| `ai-chat` | 9001 | AI-консультант с поддержкой YandexGPT/OpenAI |
| `alfa-bank-payment` | 9002 | Интеграция с Альфа-Банком |
| `delivery-calculate` | 9003 | Расчёт стоимости доставки СДЭК/Boxberry/Почта России |
| `pickup-points` | 9004 | Получение ПВЗ для карты |
| `send-push` | 9005 | Отправка push-уведомлений |
| `visual-search` | 9006 | Поиск по изображению |
| `generate-blog-content` | 9007 | Генерация контента для блога |
| `generate-category-content` | 9008 | Генерация описаний категорий |
| `generate-product-content` | 9009 | Генерация описаний товаров |
| `generate-reviews` | 9010 | Генерация отзывов |

---

## Требования

- Docker 24.0+
- Docker Compose 2.20+
- 2+ GB RAM (для всех функций)
- Self-hosted Supabase (установленный по инструкции)

---

## Быстрый старт

### 1. Клонирование проекта

```bash
cd /opt
git clone https://github.com/your-repo/belbird.git
cd belbird/docker
```

### 2. Создание файла окружения

```bash
cp .env.example .env
nano .env
```

### 3. Заполнение переменных

```env
# Supabase
SUPABASE_URL=https://api.your-domain.ru
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI (выберите один из провайдеров)
AI_PROVIDER=yandex  # yandex, gigachat, openai, openrouter
YANDEX_API_KEY=your_yandex_api_key
YANDEX_FOLDER_ID=your_folder_id

# Доставка
CDEK_CLIENT_ID=your_cdek_client_id
CDEK_CLIENT_SECRET=your_cdek_secret
CDEK_TEST_MODE=true
BOXBERRY_TOKEN=your_boxberry_token

# Push-уведомления
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 4. Запуск

```bash
docker-compose -f docker-compose.functions.yml up -d
```

### 5. Проверка

```bash
# Проверка всех контейнеров
docker ps | grep edge-

# Проверка healthcheck
curl http://localhost:9000/health

# Проверка конкретной функции
curl -X POST http://localhost:9000/functions/v1/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Привет"}'
```

---

## Детальная настройка

### Структура файлов

```
docker/
├── docker-compose.functions.yml  # Docker Compose для всех функций
├── Dockerfile.deno               # Dockerfile для Deno контейнеров
├── nginx-functions.conf          # Nginx конфигурация gateway
├── .env                          # Переменные окружения
├── .env.example                  # Пример переменных
├── functions-adapted/            # Адаптированные функции для YandexGPT
│   ├── ai-chat-yandex/
│   ├── generate-blog-content-yandex/
│   ├── generate-product-content-yandex/
│   ├── generate-reviews-yandex/
│   └── visual-search-yandex/
└── scripts/
    ├── start.sh                  # Запуск функций
    ├── stop.sh                   # Остановка
    ├── logs.sh                   # Просмотр логов
    └── update.sh                 # Обновление
```

### Dockerfile.deno

```dockerfile
# Dockerfile для запуска Deno Edge Functions
FROM denoland/deno:1.40.2

WORKDIR /app

# Кэшируем зависимости при первом запуске
RUN deno cache --reload https://deno.land/std@0.168.0/http/server.ts
RUN deno cache --reload https://deno.land/std@0.190.0/http/server.ts
RUN deno cache --reload https://esm.sh/@supabase/supabase-js@2
RUN deno cache --reload https://esm.sh/@supabase/supabase-js@2.49.1
RUN deno cache --reload https://deno.land/x/xhr@0.1.0/mod.ts

# Порт по умолчанию
EXPOSE 8000

# Запуск Deno
ENTRYPOINT ["deno"]
```

---

## Настройка переменных окружения

### Обязательные переменные

```env
# Supabase подключение
SUPABASE_URL=https://api.your-domain.ru
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### AI провайдеры

#### YandexGPT (рекомендуется для РФ)

```env
AI_PROVIDER=yandex
YANDEX_API_KEY=AQVNxxxxxxxxxxxxxx
YANDEX_FOLDER_ID=b1gxxxxxxxxxx
```

Получить ключи:
1. Создайте сервисный аккаунт в [Yandex Cloud Console](https://console.cloud.yandex.ru)
2. Назначьте роль `ai.languageModels.user`
3. Создайте API-ключ

#### GigaChat (Сбер)

```env
AI_PROVIDER=gigachat
GIGACHAT_AUTH_KEY=your_auth_key
GIGACHAT_SCOPE=GIGACHAT_API_PERS  # или GIGACHAT_API_CORP
```

#### OpenAI

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

#### OpenRouter

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

### Доставка

```env
# СДЭК
CDEK_CLIENT_ID=your_client_id
CDEK_CLIENT_SECRET=your_secret
CDEK_TEST_MODE=true  # false для боевого режима

# Boxberry
BOXBERRY_TOKEN=your_token

# Почта России (опционально)
POCHTA_TOKEN=your_token
POCHTA_KEY=your_key
```

### Push-уведомления

Генерация VAPID ключей:

```bash
# С помощью web-push
npx web-push generate-vapid-keys

# Или онлайн: https://vapidkeys.com
```

```env
VAPID_PUBLIC_KEY=BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Платежи (Альфа-Банк)

```env
ALFA_USERNAME=your_merchant_login
ALFA_PASSWORD=your_merchant_password
ALFA_TEST_MODE=true  # false для боевого режима
```

---

## Запуск функций

### Полный запуск всех функций

```bash
cd /opt/belbird/docker
docker-compose -f docker-compose.functions.yml up -d
```

### Запуск отдельной функции

```bash
docker-compose -f docker-compose.functions.yml up -d edge-ai-chat
```

### Перезапуск с пересборкой

```bash
docker-compose -f docker-compose.functions.yml up -d --build
```

### Остановка

```bash
docker-compose -f docker-compose.functions.yml down
```

### Скрипты управления

```bash
# Запуск
./scripts/start.sh

# Остановка
./scripts/stop.sh

# Просмотр логов
./scripts/logs.sh ai-chat

# Обновление (git pull + rebuild)
./scripts/update.sh
```

---

## Интеграция с фронтендом

### Обновление .env во фронтенде

```env
# Для self-hosted Edge Functions
VITE_SUPABASE_URL=https://api.your-domain.ru
VITE_EDGE_FUNCTIONS_URL=https://functions.your-domain.ru
```

### Создание клиента для вызова функций

```typescript
// src/lib/edgeFunctions.ts
const EDGE_FUNCTIONS_URL = import.meta.env.VITE_EDGE_FUNCTIONS_URL 
  || import.meta.env.VITE_SUPABASE_URL;

export async function invokeEdgeFunction<T>(
  functionName: string,
  body: Record<string, any>
): Promise<T> {
  const response = await fetch(
    `${EDGE_FUNCTIONS_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`Edge function error: ${response.status}`);
  }

  return response.json();
}

// Использование
const result = await invokeEdgeFunction('ai-chat', { message: 'Привет' });
```

### Nginx конфигурация для SSL

```nginx
# /etc/nginx/sites-available/functions.your-domain.ru
server {
    listen 80;
    server_name functions.your-domain.ru;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name functions.your-domain.ru;

    ssl_certificate /etc/letsencrypt/live/functions.your-domain.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/functions.your-domain.ru/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_buffering off;
    }
}
```

Получение SSL сертификата:

```bash
certbot --nginx -d functions.your-domain.ru
```

---

## Мониторинг и логи

### Просмотр логов

```bash
# Все функции
docker-compose -f docker-compose.functions.yml logs -f

# Конкретная функция
docker logs -f edge-ai-chat

# Последние 100 строк
docker logs --tail 100 edge-ai-chat

# Gateway (nginx)
docker logs -f edge-gateway
```

### Healthcheck

```bash
# Проверка gateway
curl http://localhost:9000/health

# Проверка конкретной функции (напрямую)
curl http://localhost:9001/  # ai-chat
curl http://localhost:9002/  # alfa-bank-payment
```

### Systemd сервис для автозапуска

```bash
# Создание сервиса
sudo nano /etc/systemd/system/belbird-functions.service
```

```ini
[Unit]
Description=BelBird Edge Functions
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/belbird/docker
ExecStart=/usr/bin/docker-compose -f docker-compose.functions.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.functions.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Включение автозапуска
sudo systemctl enable belbird-functions
sudo systemctl start belbird-functions
```

---

## Обновление функций

### Обновление кода

```bash
cd /opt/belbird
git pull origin main

cd docker
docker-compose -f docker-compose.functions.yml up -d --build
```

### Обновление отдельной функции

```bash
docker-compose -f docker-compose.functions.yml up -d --build edge-ai-chat
```

### Скрипт автоматического обновления

```bash
#!/bin/bash
# scripts/update.sh

cd /opt/belbird
git pull origin main

cd docker
docker-compose -f docker-compose.functions.yml pull
docker-compose -f docker-compose.functions.yml up -d --build
docker image prune -f

echo "✅ Функции обновлены!"
```

---

## Troubleshooting

### Функция не отвечает

```bash
# Проверка статуса контейнера
docker ps -a | grep edge-ai-chat

# Проверка логов
docker logs edge-ai-chat

# Перезапуск
docker-compose -f docker-compose.functions.yml restart edge-ai-chat
```

### Ошибка подключения к Supabase

```bash
# Проверка переменных окружения
docker exec edge-ai-chat env | grep SUPABASE

# Тест подключения из контейнера
docker exec edge-ai-chat curl -I $SUPABASE_URL/rest/v1/
```

### Ошибка 502 Bad Gateway

```bash
# Проверка nginx
docker logs edge-gateway

# Проверка сети Docker
docker network inspect docker_edge-functions

# Перезапуск gateway
docker-compose -f docker-compose.functions.yml restart edge-gateway
```

### Память/CPU

```bash
# Статистика контейнеров
docker stats --no-stream

# Ограничение памяти (добавить в docker-compose)
services:
  edge-ai-chat:
    deploy:
      resources:
        limits:
          memory: 256M
```

### Очистка

```bash
# Удаление неиспользуемых образов
docker image prune -a

# Удаление всех данных (осторожно!)
docker-compose -f docker-compose.functions.yml down -v
docker system prune -a
```

---

## Использование адаптированных функций для YandexGPT

Если вы используете YandexGPT вместо OpenAI/Lovable AI, используйте адаптированные версии функций из папки `functions-adapted/`:

```yaml
# В docker-compose.functions.yml замените volumes для AI-функций:
services:
  edge-ai-chat:
    volumes:
      - ./functions-adapted/ai-chat-yandex:/app  # Вместо ../supabase/functions/ai-chat
```

Адаптированные функции поддерживают:
- YandexGPT (lite, pro)
- GigaChat
- OpenAI (fallback)
- OpenRouter (fallback)

---

## Полезные ссылки

- [Deno Manual](https://deno.land/manual)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [YandexGPT API](https://cloud.yandex.ru/docs/yandexgpt/)
- [Docker Compose](https://docs.docker.com/compose/)
