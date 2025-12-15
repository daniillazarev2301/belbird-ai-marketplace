#!/bin/bash
# Скрипт запуска Edge Functions
# Использование: ./start.sh [function_name]

set -e

cd "$(dirname "$0")/.."

if [ -n "$1" ]; then
    echo "🚀 Запуск функции: $1"
    docker-compose -f docker-compose.functions.yml up -d "edge-$1"
else
    echo "🚀 Запуск всех Edge Functions..."
    docker-compose -f docker-compose.functions.yml up -d
fi

echo ""
echo "✅ Функции запущены!"
echo ""
echo "Проверка статуса:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep edge-
echo ""
echo "Healthcheck: curl http://localhost:9000/health"
