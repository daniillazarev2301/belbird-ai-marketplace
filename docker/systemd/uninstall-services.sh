#!/bin/bash
# Удаление systemd сервисов BelBird
# Запускать от root: sudo ./uninstall-services.sh

set -e

echo "🗑️ Удаление systemd сервисов BelBird..."

# Проверка root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Запустите скрипт от root: sudo $0"
    exit 1
fi

# Остановка сервисов
echo "🛑 Остановка сервисов..."
systemctl stop belbird-functions.service 2>/dev/null || true
systemctl stop belbird-supabase.service 2>/dev/null || true

# Отключение автозапуска
echo "⚡ Отключение автозапуска..."
systemctl disable belbird-functions.service 2>/dev/null || true
systemctl disable belbird-supabase.service 2>/dev/null || true

# Удаление файлов
echo "📋 Удаление service файлов..."
rm -f /etc/systemd/system/belbird-functions.service
rm -f /etc/systemd/system/belbird-supabase.service

# Перезагрузка systemd
echo "🔄 Перезагрузка systemd..."
systemctl daemon-reload

echo ""
echo "✅ Сервисы удалены!"
