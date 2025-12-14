#!/bin/bash
# Скрипт запуска Edge Functions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DOCKER_DIR"

echo "🚀 Запуск Edge Functions..."

# Проверка .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "Скопируйте .env.example в .env и заполните переменные:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose не установлен!"
    exit 1
fi

# Определяем команду docker-compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Запуск
echo "📦 Сборка и запуск контейнеров..."
$COMPOSE_CMD -f docker-compose.functions.yml up -d --build

echo ""
echo "✅ Edge Functions запущены!"
echo ""
echo "📋 Статус контейнеров:"
$COMPOSE_CMD -f docker-compose.functions.yml ps

echo ""
echo "🌐 Gateway доступен на: http://localhost:9000"
echo ""
echo "Примеры вызовов:"
echo "  curl http://localhost:9000/health"
echo "  curl -X POST http://localhost:9000/functions/v1/ai-chat -H 'Content-Type: application/json' -d '{\"messages\": [{\"role\": \"user\", \"content\": \"Привет!\"}]}'"
echo ""
echo "📝 Логи:"
echo "  docker logs edge-ai-chat -f"
echo "  $COMPOSE_CMD -f docker-compose.functions.yml logs -f"
