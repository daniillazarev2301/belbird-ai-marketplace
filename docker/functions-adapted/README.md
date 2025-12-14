# Адаптированные Edge Functions для YandexGPT

Версии всех AI-функций, адаптированные для работы с российскими LLM-провайдерами.

## Поддерживаемые провайдеры

| Провайдер | Модель | Стоимость |
|-----------|--------|-----------|
| **YandexGPT** | yandexgpt-lite, yandexgpt | ~0.2₽ за 1000 токенов |
| **GigaChat** | GigaChat | ~0.1₽ за 1000 токенов |
| **OpenAI** | gpt-4o-mini | $0.15 за 1M токенов |
| **OpenRouter** | любая | зависит от модели |

## Структура

```
functions-adapted/
├── ai-chat-yandex/              # AI чат-бот
├── visual-search-yandex/        # Визуальный поиск
├── generate-product-content-yandex/  # Контент товаров
├── generate-blog-content-yandex/     # Блог-статьи
└── generate-reviews-yandex/     # Генерация отзывов
```

## Настройка YandexGPT

### 1. Создание API-ключа

1. Зайдите в [Yandex Cloud Console](https://console.cloud.yandex.ru/)
2. Создайте сервисный аккаунт с ролью `ai.languageModels.user`
3. Создайте API-ключ для сервисного аккаунта
4. Скопируйте Folder ID и API Key

### 2. Настройка переменных

Добавьте в `/opt/belbird/docker/.env`:

```bash
# YandexGPT
YANDEX_API_KEY=AQVNxxxxxxxxxxxxxxxxxxxxxxxxxxxx
YANDEX_FOLDER_ID=b1gxxxxxxxxxxxxxxxx
AI_PROVIDER=yandexgpt
```

### 3. Замена функций

```bash
# Резервная копия оригиналов
cp -r /opt/belbird/supabase/functions/ai-chat /opt/belbird/supabase/functions/ai-chat.backup

# Копирование адаптированных версий
cp docker/functions-adapted/ai-chat-yandex/index.ts /opt/belbird/supabase/functions/ai-chat/
cp docker/functions-adapted/visual-search-yandex/index.ts /opt/belbird/supabase/functions/visual-search/
cp docker/functions-adapted/generate-product-content-yandex/index.ts /opt/belbird/supabase/functions/generate-product-content/
cp docker/functions-adapted/generate-blog-content-yandex/index.ts /opt/belbird/supabase/functions/generate-blog-content/
cp docker/functions-adapted/generate-reviews-yandex/index.ts /opt/belbird/supabase/functions/generate-reviews/

# Перезапуск функций
docker-compose -f docker-compose.functions.yml restart
```

## Настройка GigaChat (Сбер)

### 1. Получение токена

1. Зарегистрируйтесь на [developers.sber.ru](https://developers.sber.ru/)
2. Создайте проект и получите Client ID и Client Secret
3. Сгенерируйте Basic auth token: `echo -n "CLIENT_ID:CLIENT_SECRET" | base64`

### 2. Переменные

```bash
# GigaChat
GIGACHAT_TOKEN=ваш_base64_токен
AI_PROVIDER=gigachat
```

## Настройка OpenRouter

Универсальный агрегатор с доступом к любым моделям.

```bash
# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx
AI_PROVIDER=openrouter
```

## Переключение провайдера

Измените переменную `AI_PROVIDER` в `.env`:

```bash
# Варианты: yandexgpt, gigachat, openai, openrouter
AI_PROVIDER=yandexgpt
```

Затем перезапустите функции:

```bash
docker-compose -f docker-compose.functions.yml restart
```

## Сравнение провайдеров

| Критерий | YandexGPT | GigaChat | OpenAI |
|----------|-----------|----------|--------|
| Русский язык | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Скорость | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Качество | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Цена | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Доступность в РФ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ (VPN) |

## Рекомендация

Для российского VDS рекомендуется **YandexGPT**:
- Нативная поддержка русского языка
- Серверы в России = низкая задержка
- Оплата в рублях
- Хорошее соотношение цена/качество
