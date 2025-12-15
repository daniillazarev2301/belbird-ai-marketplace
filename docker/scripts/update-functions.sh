#!/bin/bash
# Скрипт обновления Edge Functions
# Использование: ./update-functions.sh

set -e

cd "$(dirname "$0")/../.."

echo "📥 Получение обновлений из репозитория..."
git pull origin main

cd docker

echo "🔨 Пересборка контейнеров..."
docker-compose -f docker-compose.functions.yml build

echo "🚀 Перезапуск функций..."
docker-compose -f docker-compose.functions.yml up -d

echo "🧹 Очистка старых образов..."
docker image prune -f

echo ""
echo "✅ Edge Functions обновлены!"
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep edge-
