# Hybrid Architecture: Lovable Cloud + Self-Hosted

## Обзор архитектуры

```
┌─────────────────────────────────────────────────────────────────┐
│                        BelBird Frontend                         │
│                    (Lovable / React / Vite)                     │
└────────────────────────┬───────────────────────┬────────────────┘
                         │                       │
                         ▼                       ▼
┌─────────────────────────────────┐  ┌─────────────────────────────┐
│        Lovable Cloud            │  │    Self-Hosted Backend      │
│        (Supabase)               │  │    (Fastify + PostgreSQL)   │
├─────────────────────────────────┤  ├─────────────────────────────┤
│ ✓ Авторизация (auth.users)      │  │ ✓ Заказы (orders)           │
│ ✓ Товары (products)             │  │ ✓ Позиции заказов           │
│ ✓ Категории (categories)        │  │ ✓ Клиенты (customers)       │
│ ✓ Бренды (brands)               │  │ ✓ Адреса доставки           │
│ ✓ Отзывы (reviews)              │  │ ✓ Платежи (payments)        │
│ ✓ Избранное (favorites)         │  │ ✓ Транзакции лояльности     │
│ ✓ Настройки сайта               │  │ ✓ История покупок           │
│ ✓ Блог, страницы, stories       │  │                             │
│ ✓ Edge Functions (AI, доставка) │  │                             │
└─────────────────────────────────┘  └─────────────────────────────┘
```

## Почему Hybrid?

| Критерий | Lovable Cloud | Self-Hosted |
|----------|---------------|-------------|
| Удобство разработки | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Контроль данных | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| GDPR/ФЗ-152 | Облако | Ваш сервер |
| Масштабирование | Автоматическое | Ручное |
| Стоимость | Pay-as-you-go | Фиксированная VDS |

**Hybrid даёт лучшее из двух миров:**
- Быстрая разработка через Lovable
- Критичные данные клиентов на вашем сервере
- Соответствие требованиям о локализации данных

## Настройка

### 1. Переменные окружения

В `.env` добавьте URL вашего self-hosted API:

```env
VITE_EXTERNAL_API_URL=https://api.belbird.ru
```

### 2. Self-Hosted Backend

Используйте готовый backend из `backend/` директории:

```bash
cd backend
cp .env.example .env
# Настройте DATABASE_URL, JWT секреты

npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

### 3. Аутентификация

Backend принимает JWT токены из Lovable Cloud (Supabase):

```typescript
// backend/src/index.ts
app.addHook('onRequest', async (request) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (token) {
    // Валидация JWT через Supabase или публичный ключ
    const payload = await verifySupabaseJWT(token);
    request.user = payload;
  }
});
```

### 4. Миграция данных

Для переноса существующих заказов из Lovable Cloud:

```sql
-- Экспорт из Supabase
COPY (SELECT * FROM orders) TO '/tmp/orders.csv' CSV HEADER;
COPY (SELECT * FROM order_items) TO '/tmp/order_items.csv' CSV HEADER;

-- Импорт в Self-Hosted PostgreSQL
\COPY orders FROM '/tmp/orders.csv' CSV HEADER;
\COPY order_items FROM '/tmp/order_items.csv' CSV HEADER;
```

## API Endpoints Self-Hosted

### Orders
```
GET    /api/orders           # Список заказов пользователя
POST   /api/orders           # Создать заказ
GET    /api/orders/:id       # Детали заказа
PATCH  /api/orders/:id       # Обновить статус
```

### Customers
```
GET    /api/customers/me     # Профиль текущего пользователя
PATCH  /api/customers/me     # Обновить профиль
GET    /api/customers/addresses      # Адреса
POST   /api/customers/addresses      # Добавить адрес
DELETE /api/customers/addresses/:id  # Удалить адрес
```

### Payments
```
POST   /api/payments/create  # Инициировать платёж
POST   /api/payments/verify  # Проверить статус
POST   /api/payments/webhook # Callback от платёжной системы
```

## Fallback механизм

Если `VITE_EXTERNAL_API_URL` не настроен, система автоматически использует Lovable Cloud:

```typescript
// src/hooks/useExternalOrders.ts
if (isExternalApiConfigured()) {
  // Используем Self-Hosted API
  const { data } = await apiRequest('/api/orders');
} else {
  // Fallback на Supabase
  const { data } = await supabase.from('orders').select('*');
}
```

## Безопасность

1. **JWT валидация** — Backend проверяет токены Supabase
2. **HTTPS** — Обязательно для production
3. **CORS** — Разрешить только ваш домен
4. **Rate Limiting** — Защита от DDoS

```typescript
// backend/src/index.ts
app.register(require('@fastify/cors'), {
  origin: ['https://belbird.ru', 'https://preview.lovable.app'],
});

app.register(require('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute',
});
```

## Мониторинг

### Логирование запросов

```typescript
// Логируем какой источник данных используется
console.log(`[${source}] ${method} ${endpoint}`);
// [self-hosted] POST /api/orders
// [lovable-cloud] GET /products
```

### Health Check

```bash
# Проверка Self-Hosted API
curl https://api.belbird.ru/health

# Ответ
{"status":"ok","database":"connected","version":"1.0.0"}
```

## Часто задаваемые вопросы

**Q: Что происходит при недоступности Self-Hosted?**
A: Система показывает ошибку для критичных операций (заказы), но каталог продолжает работать.

**Q: Можно ли мигрировать обратно на full Lovable Cloud?**
A: Да, удалите `VITE_EXTERNAL_API_URL` и импортируйте данные в Supabase.

**Q: Как синхронизировать пользователей?**
A: Используйте Supabase user_id как общий идентификатор. Self-Hosted не хранит пароли.
