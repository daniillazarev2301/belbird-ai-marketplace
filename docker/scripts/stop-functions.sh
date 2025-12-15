#!/bin/bash
# Скрипт остановки Edge Functions
# Использование: ./stop-functions.sh [function_name]

set -e

cd "$(dirname "$0")/.."

if [ -n "$1" ]; then
    echo "🛑 Остановка функции: $1"
    docker-compose -f docker-compose.functions.yml stop "edge-$1"
else
    echo "🛑 Остановка всех Edge Functions..."
    docker-compose -f docker-compose.functions.yml down
fi

echo "✅ Функции остановлены!"
