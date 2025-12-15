#!/bin/bash
# Скрипт просмотра логов Edge Functions
# Использование: ./logs-functions.sh [function_name] [lines]

set -e

cd "$(dirname "$0")/.."

FUNCTION_NAME=${1:-""}
LINES=${2:-100}

if [ -n "$FUNCTION_NAME" ]; then
    echo "📋 Логи функции: $FUNCTION_NAME (последние $LINES строк)"
    docker logs --tail "$LINES" -f "edge-$FUNCTION_NAME"
else
    echo "📋 Логи всех Edge Functions (последние $LINES строк)"
    docker-compose -f docker-compose.functions.yml logs --tail "$LINES" -f
fi
