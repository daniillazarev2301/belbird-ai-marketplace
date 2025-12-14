#!/bin/bash
# Скрипт остановки Edge Functions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DOCKER_DIR"

echo "🛑 Остановка Edge Functions..."

# Определяем команду docker-compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD -f docker-compose.functions.yml down

echo "✅ Edge Functions остановлены"
