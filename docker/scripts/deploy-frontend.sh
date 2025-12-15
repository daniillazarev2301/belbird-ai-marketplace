#!/bin/bash
# Скрипт деплоя фронтенда BelBird на VDS
# Использование: ./deploy-frontend.sh

set -e

# Конфигурация
DEPLOY_DIR="/var/www/belbird"
BACKUP_DIR="/var/www/belbird-backup"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo "🚀 Деплой BelBird Frontend..."

# Проверка наличия dist
if [ ! -d "$PROJECT_DIR/dist" ]; then
    echo "⚠️  Папка dist не найдена. Собираю проект..."
    cd "$PROJECT_DIR"
    
    # Проверка node_modules
    if [ ! -d "node_modules" ]; then
        echo "📦 Установка зависимостей..."
        npm install
    fi
    
    echo "🔨 Сборка проекта..."
    npm run build
fi

# Создание бэкапа текущей версии
if [ -d "$DEPLOY_DIR" ]; then
    echo "💾 Создание бэкапа..."
    rm -rf "$BACKUP_DIR"
    mv "$DEPLOY_DIR" "$BACKUP_DIR"
fi

# Создание директории и копирование билда
echo "📁 Копирование файлов..."
mkdir -p "$DEPLOY_DIR"
cp -r "$PROJECT_DIR/dist/"* "$DEPLOY_DIR/"

# Установка прав
echo "🔐 Установка прав..."
chown -R www-data:www-data "$DEPLOY_DIR"
chmod -R 755 "$DEPLOY_DIR"

# Перезагрузка nginx
echo "🔄 Перезагрузка nginx..."
nginx -t && systemctl reload nginx

echo ""
echo "✅ Деплой завершён!"
echo ""
echo "📋 Проверьте:"
echo "   - Сайт: https://belbird.ru"
echo "   - PWA: установите через браузер"
echo "   - Админка: https://belbird.ru/admin"
echo ""
echo "💡 Для отката к предыдущей версии:"
echo "   rm -rf $DEPLOY_DIR && mv $BACKUP_DIR $DEPLOY_DIR && systemctl reload nginx"
