#!/bin/bash
# Установка systemd сервисов для BelBird
# Запускать от root: sudo ./install-services.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔧 Установка systemd сервисов BelBird..."

# Проверка root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Запустите скрипт от root: sudo $0"
    exit 1
fi

# Проверка путей
if [ ! -d "/opt/belbird" ]; then
    echo "⚠️ Директория /opt/belbird не найдена"
    echo "Создаю симлинк на текущую директорию проекта..."
    PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
    ln -sf "$PROJECT_DIR" /opt/belbird
    echo "✅ Создан симлинк: /opt/belbird -> $PROJECT_DIR"
fi

if [ ! -d "/opt/supabase/docker" ]; then
    echo "⚠️ Директория /opt/supabase/docker не найдена"
    echo "Убедитесь что Supabase установлен в /opt/supabase"
fi

# Копирование сервисов
echo "📋 Копирование service файлов..."
cp "$SCRIPT_DIR/belbird-functions.service" /etc/systemd/system/
cp "$SCRIPT_DIR/belbird-supabase.service" /etc/systemd/system/

# Установка прав
chmod 644 /etc/systemd/system/belbird-functions.service
chmod 644 /etc/systemd/system/belbird-supabase.service

# Перезагрузка systemd
echo "🔄 Перезагрузка systemd..."
systemctl daemon-reload

# Включение автозапуска
echo "⚡ Включение автозапуска..."
systemctl enable belbird-supabase.service
systemctl enable belbird-functions.service

echo ""
echo "✅ Сервисы установлены!"
echo ""
echo "📋 Управление сервисами:"
echo ""
echo "  # Supabase"
echo "  sudo systemctl start belbird-supabase"
echo "  sudo systemctl stop belbird-supabase"
echo "  sudo systemctl status belbird-supabase"
echo ""
echo "  # Edge Functions"
echo "  sudo systemctl start belbird-functions"
echo "  sudo systemctl stop belbird-functions"
echo "  sudo systemctl status belbird-functions"
echo ""
echo "  # Логи"
echo "  sudo journalctl -u belbird-supabase -f"
echo "  sudo journalctl -u belbird-functions -f"
echo ""
echo "🚀 Для первого запуска выполните:"
echo "  sudo systemctl start belbird-supabase"
echo "  sudo systemctl start belbird-functions"
