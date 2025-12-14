# Edge Functions на VDS

Инструкция по развёртыванию Edge Functions локально на VDS с использованием Docker.

## Структура

```
docker/
├── docker-compose.functions.yml  # Docker Compose для всех функций
├── Dockerfile.deno               # Dockerfile для Deno runtime
├── nginx-functions.conf          # Nginx конфигурация для роутинга
├── .env.example                  # Пример переменных окружения
└── README.md                     # Эта инструкция
```

## Порты функций

| Функция | Внутренний порт | Внешний порт |
|---------|-----------------|--------------|
| ai-chat | 8000 | 9001 |
| alfa-bank-payment | 8000 | 9002 |
| delivery-calculate | 8000 | 9003 |
| pickup-points | 8000 | 9004 |
| send-push | 8000 | 9005 |
| visual-search | 8000 | 9006 |
| generate-blog-content | 8000 | 9007 |
| generate-category-content | 8000 | 9008 |
| generate-product-content | 8000 | 9009 |
| generate-reviews | 8000 | 9010 |
| **Gateway (Nginx)** | 80 | **9000** |

## Быстрый старт

### 1. Подготовка

```bash
cd docker
cp .env.example .env
nano .env  # Заполните переменные
```

### 2. Запуск

```bash
docker-compose -f docker-compose.functions.yml up -d
```

### 3. Проверка

```bash
# Статус контейнеров
docker-compose -f docker-compose.functions.yml ps

# Логи конкретной функции
docker logs edge-ai-chat -f

# Тест healthcheck
curl http://localhost:9000/health
```

### 4. Вызов функций

Все функции доступны через единый gateway на порту 9000:

```bash
# Пример вызова ai-chat
curl -X POST http://localhost:9000/functions/v1/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Привет!"}]}'

# Пример вызова pickup-points
curl -X POST http://localhost:9000/functions/v1/pickup-points \
  -H "Content-Type: application/json" \
  -d '{"provider": "cdek", "city": "Москва"}'
```

## Настройка Nginx на хосте

Добавьте в основной Nginx сервер проксирование на Edge Functions:

```nginx
# /etc/nginx/sites-available/belbird

server {
    listen 443 ssl http2;
    server_name api.belbird.ru;

    ssl_certificate /etc/letsencrypt/live/api.belbird.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.belbird.ru/privkey.pem;

    # Supabase API (Kong)
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Edge Functions
    location /functions/v1/ {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
        proxy_buffering off;
    }
}
```

## Обновление функций

При изменении кода функций:

```bash
# Перезапуск конкретной функции
docker-compose -f docker-compose.functions.yml restart edge-ai-chat

# Полный перезапуск
docker-compose -f docker-compose.functions.yml down
docker-compose -f docker-compose.functions.yml up -d --build
```

## Логи и отладка

```bash
# Все логи
docker-compose -f docker-compose.functions.yml logs -f

# Логи конкретной функции
docker logs edge-ai-chat -f --tail 100

# Войти в контейнер
docker exec -it edge-ai-chat sh
```

## AI API на российском VDS

Поскольку Lovable AI Gateway недоступен на VDS, вам нужно заменить AI провайдера.

### Варианты:

1. **OpenAI API** (через VPN/прокси)
   - Замените URL: `https://api.openai.com/v1/chat/completions`
   - Модель: `gpt-4o-mini` или `gpt-4o`

2. **YandexGPT**
   - URL: `https://llm.api.cloud.yandex.net/foundationModels/v1/completion`
   - Модель: `yandexgpt-lite` или `yandexgpt`

3. **GigaChat (Сбер)**
   - URL: `https://gigachat.devices.sberbank.ru/api/v1/chat/completions`
   - Модель: `GigaChat`

4. **OpenRouter** (агрегатор)
   - URL: `https://openrouter.ai/api/v1/chat/completions`
   - Любая модель

### Пример изменения для YandexGPT

В файле функции замените:

```typescript
// Было
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
  },
  ...
});

// Стало
const response = await fetch("https://llm.api.cloud.yandex.net/foundationModels/v1/completion", {
  headers: {
    Authorization: `Api-Key ${YANDEX_API_KEY}`,
    "x-folder-id": YANDEX_FOLDER_ID,
  },
  body: JSON.stringify({
    modelUri: `gpt://${YANDEX_FOLDER_ID}/yandexgpt-lite`,
    completionOptions: {
      stream: false,
      temperature: 0.6,
    },
    messages: [...],
  }),
});
```

## Troubleshooting

### Функция не запускается

```bash
# Проверьте логи
docker logs edge-ai-chat

# Частые причины:
# 1. Не установлены env переменные
# 2. Ошибка синтаксиса в коде функции
# 3. Недоступны внешние API
```

### CORS ошибки

CORS обрабатывается в nginx-functions.conf. Если проблемы сохраняются:

```bash
# Проверьте что OPTIONS возвращает 204
curl -X OPTIONS http://localhost:9000/functions/v1/ai-chat -i
```

### Таймауты

Для AI функций увеличьте таймаут в nginx:

```nginx
proxy_read_timeout 300s;
```
