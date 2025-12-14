#!/bin/bash
# Скрипт просмотра логов Edge Functions

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DOCKER_DIR"

# Определяем команду docker-compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

FUNCTION_NAME=$1

if [ -z "$FUNCTION_NAME" ]; then
    echo "📝 Логи всех Edge Functions..."
    echo "Для выхода нажмите Ctrl+C"
    echo ""
    $COMPOSE_CMD -f docker-compose.functions.yml logs -f
else
    CONTAINER_NAME="edge-$FUNCTION_NAME"
    echo "📝 Логи функции: $FUNCTION_NAME"
    echo "Контейнер: $CONTAINER_NAME"
    echo "Для выхода нажмите Ctrl+C"
    echo ""
    docker logs "$CONTAINER_NAME" -f --tail 100
fi
