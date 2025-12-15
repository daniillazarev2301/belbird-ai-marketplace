# BelBird Self-Hosted Backend

Полностью self-hosted backend на Fastify + TypeScript + Prisma + PostgreSQL.

## Структура

```
backend/
├── prisma/
│   ├── schema.prisma    # Схема базы данных
│   └── seed.ts          # Начальные данные
├── src/
│   ├── config/          # Конфигурация
│   ├── lib/             # Prisma клиент
│   ├── routes/          # API маршруты
│   ├── services/        # Бизнес-логика
│   └── index.ts         # Точка входа
├── uploads/             # Загруженные файлы
├── .env.example         # Пример переменных
├── package.json
└── tsconfig.json
```

## Быстрый старт (локально)

```bash
cd backend
cp .env.example .env
# Отредактируйте .env

npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Деплой на VDS (Ubuntu 22.04)

### 1. Установка зависимостей

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# PM2
sudo npm install -g pm2
```

### 2. Настройка PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE belbird;
CREATE USER belbird WITH ENCRYPTED PASSWORD 'ваш_пароль';
GRANT ALL PRIVILEGES ON DATABASE belbird TO belbird;
\q
```

### 3. Клонирование и настройка

```bash
cd /opt
git clone https://github.com/YOUR_REPO/belbird.git
cd belbird/backend

cp .env.example .env
nano .env  # Заполните все переменные

npm install
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run build
```

### 4. PM2

```bash
pm2 start dist/index.js --name belbird-api
pm2 save
pm2 startup
```

### 5. Nginx

```nginx
server {
    listen 80;
    server_name api.belbird.ru;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo certbot --nginx -d api.belbird.ru
```

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| POST | /api/auth/refresh | Обновление токена |
| GET | /api/products | Список товаров |
| GET | /api/categories | Категории |
| POST | /api/cart | Добавить в корзину |
| POST | /api/orders | Создать заказ |
| POST | /api/ai/chat | AI-ассистент |

## Админ (требуется role=admin)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/admin/dashboard | Дашборд |
| CRUD | /api/admin/products | Управление товарами |
| CRUD | /api/admin/categories | Категории |
| CRUD | /api/admin/orders | Заказы |
| CRUD | /api/admin/users | Пользователи |

## Тестовые данные

После `npm run db:seed`:
- **Админ**: admin@belbird.ru / admin123
- **Промокод**: WELCOME10 (10% скидка)

## Переменные окружения

См. `.env.example` для полного списка.

Критичные:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_ACCESS_SECRET` — секрет для access token
- `JWT_REFRESH_SECRET` — секрет для refresh token  
- `GEMINI_API_KEY` — API ключ Google Gemini
