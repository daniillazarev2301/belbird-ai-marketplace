#!/bin/bash
# Скрипт обновления Edge Functions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$DOCKER_DIR")"

cd "$PROJECT_DIR"

echo "🔄 Обновление Edge Functions..."

# Определяем команду docker-compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Получаем последние изменения
echo "📥 Получение обновлений из репозитория..."
git pull origin main

# Перезапускаем контейнеры
cd "$DOCKER_DIR"

FUNCTION_NAME=$1

if [ -z "$FUNCTION_NAME" ]; then
    echo "🔄 Перезапуск всех функций..."
    $COMPOSE_CMD -f docker-compose.functions.yml down
    $COMPOSE_CMD -f docker-compose.functions.yml up -d --build
else
    CONTAINER_NAME="edge-$FUNCTION_NAME"
    echo "🔄 Перезапуск функции: $FUNCTION_NAME"
    $COMPOSE_CMD -f docker-compose.functions.yml restart "$CONTAINER_NAME"
fi

echo ""
echo "✅ Обновление завершено!"
$COMPOSE_CMD -f docker-compose.functions.yml ps
