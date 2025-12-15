# BelBird - SQL файлы для Self-Hosted Supabase

## Быстрая установка

### 1. Откройте SQL Editor в Supabase Studio
Перейдите на `http://your-domain:3000` → SQL Editor

### 2. Выполните скрипты в правильном порядке

#### Шаг 1: Создание схемы БД
```sql
-- Скопируйте содержимое файла 001_schema.sql и выполните
```

#### Шаг 2: Загрузка начальных данных
```sql
-- Скопируйте содержимое файла 002_seed.sql и выполните
```

#### Шаг 3: Назначение администратора
После регистрации пользователя через интерфейс:

```sql
-- Замените email на ваш
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'admin@belbird.ru';
```

## Описание файлов

| Файл | Описание |
|------|----------|
| `001_schema.sql` | Полная схема БД: таблицы, RLS политики, триггеры, индексы, storage buckets |
| `002_seed.sql` | Начальные данные: настройки сайта, категории, бренды, промокоды, статические страницы |

## Что создаётся

### Таблицы (26 шт.)
- `profiles` - Профили пользователей
- `user_roles` - Роли пользователей (admin, moderator, user)
- `categories` - Категории товаров
- `brands` - Бренды
- `products` - Товары
- `favorites` - Избранное
- `pet_profiles` - Профили питомцев
- `chat_messages` - Сообщения AI-чата
- `orders` - Заказы
- `order_items` - Позиции заказов
- `promo_codes` - Промокоды
- `pages` - Статические страницы
- `site_settings` - Настройки сайта
- `reviews` - Отзывы
- `product_views` - История просмотров
- `product_comparisons` - Сравнение товаров
- `wishlist_shares` - Публичные списки желаний
- `blog_posts` - Блог
- `delivery_zones` - Зоны доставки
- `admin_notifications` - Уведомления для админов
- `saved_addresses` - Сохранённые адреса
- `subscriptions` - Подписки на товары
- `ab_experiments` - A/B тесты
- `stories` - Сторисы
- `loyalty_transactions` - Транзакции бонусной программы
- `push_subscriptions` - Push-подписки
- `admin_activity_logs` - Лог действий админов

### Storage Buckets (3 шт.)
- `products` - Изображения товаров
- `site-assets` - Ресурсы сайта (логотип и т.д.)
- `avatars` - Аватары пользователей

### Realtime
Включён для таблиц:
- `orders`
- `products`
- `profiles`
- `admin_notifications`

## Обновление .env в проекте

После установки Supabase обновите `.env` файл:

```env
VITE_SUPABASE_URL=https://api.your-domain.ru
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

## Проверка установки

После выполнения скриптов проверьте:

1. **Таблицы созданы**: Table Editor → должно быть 26 таблиц
2. **Storage работает**: Storage → должно быть 3 bucket'а
3. **RLS включён**: каждая таблица должна иметь RLS policies
4. **Данные есть**: site_settings, categories, brands должны содержать записи
