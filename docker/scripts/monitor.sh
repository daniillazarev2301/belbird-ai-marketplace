#!/bin/bash
# ===========================================
# Мониторинг здоровья сервисов BelBird
# С уведомлениями в Telegram при падении
# ===========================================

# Конфигурация - заполните свои данные
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

# Сервисы для мониторинга
SERVICES=(
    "Supabase API|http://localhost:8000/rest/v1/|200"
    "Edge Gateway|http://localhost:9000/health|200"
    "AI Chat|http://localhost:9001/|200"
    "Alfa-Bank|http://localhost:9002/|200"
    "Delivery|http://localhost:9003/|200"
    "Pickup Points|http://localhost:9004/|200"
    "Push|http://localhost:9005/|200"
    "Visual Search|http://localhost:9006/|200"
)

# Docker контейнеры для мониторинга
CONTAINERS=(
    "supabase-kong"
    "supabase-db"
    "supabase-auth"
    "supabase-rest"
    "supabase-storage"
    "edge-gateway"
    "edge-ai-chat"
    "edge-alfa-bank-payment"
    "edge-delivery-calculate"
    "edge-pickup-points"
    "edge-send-push"
)

# Файл для хранения состояния (чтобы не спамить)
STATE_FILE="/tmp/belbird-monitor-state"

# Цвета для логов
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Функция отправки в Telegram
send_telegram() {
    local message="$1"
    local parse_mode="${2:-HTML}"
    
    if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
        echo -e "${YELLOW}⚠️ Telegram не настроен, пропускаем уведомление${NC}"
        return 1
    fi
    
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}" \
        -d "text=${message}" \
        -d "parse_mode=${parse_mode}" \
        > /dev/null 2>&1
}

# Функция проверки HTTP endpoint
check_http() {
    local name="$1"
    local url="$2"
    local expected_code="$3"
    
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$url" 2>/dev/null)
    
    if [ "$response_code" = "$expected_code" ] || [ "$response_code" = "204" ]; then
        echo "OK"
    else
        echo "FAIL:$response_code"
    fi
}

# Функция проверки Docker контейнера
check_container() {
    local name="$1"
    
    local status
    status=$(docker inspect -f '{{.State.Status}}' "$name" 2>/dev/null)
    
    if [ "$status" = "running" ]; then
        echo "OK"
    else
        echo "FAIL:$status"
    fi
}

# Функция получения предыдущего состояния
get_previous_state() {
    local key="$1"
    if [ -f "$STATE_FILE" ]; then
        grep "^$key=" "$STATE_FILE" 2>/dev/null | cut -d= -f2
    else
        echo "OK"
    fi
}

# Функция сохранения состояния
save_state() {
    local key="$1"
    local value="$2"
    
    if [ -f "$STATE_FILE" ]; then
        grep -v "^$key=" "$STATE_FILE" > "${STATE_FILE}.tmp" 2>/dev/null || true
        mv "${STATE_FILE}.tmp" "$STATE_FILE"
    fi
    echo "$key=$value" >> "$STATE_FILE"
}

# Основная функция мониторинга
monitor() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local has_errors=false
    local error_messages=""
    local recovery_messages=""
    
    echo ""
    echo "=========================================="
    echo "🔍 Проверка сервисов: $timestamp"
    echo "=========================================="
    
    # Проверка HTTP endpoints
    echo ""
    echo "📡 HTTP Endpoints:"
    for service in "${SERVICES[@]}"; do
        IFS='|' read -r name url expected <<< "$service"
        result=$(check_http "$name" "$url" "$expected")
        key="http_$(echo "$name" | tr ' ' '_')"
        prev_state=$(get_previous_state "$key")
        
        if [[ "$result" == "OK" ]]; then
            echo -e "  ${GREEN}✓${NC} $name"
            if [[ "$prev_state" != "OK" ]]; then
                recovery_messages+="✅ <b>$name</b> восстановлен\n"
            fi
            save_state "$key" "OK"
        else
            echo -e "  ${RED}✗${NC} $name ($result)"
            has_errors=true
            if [[ "$prev_state" == "OK" ]]; then
                error_messages+="🔴 <b>$name</b> недоступен ($result)\n"
            fi
            save_state "$key" "$result"
        fi
    done
    
    # Проверка Docker контейнеров
    echo ""
    echo "🐳 Docker Containers:"
    for container in "${CONTAINERS[@]}"; do
        result=$(check_container "$container")
        key="container_$container"
        prev_state=$(get_previous_state "$key")
        
        if [[ "$result" == "OK" ]]; then
            echo -e "  ${GREEN}✓${NC} $container"
            if [[ "$prev_state" != "OK" ]]; then
                recovery_messages+="✅ <b>$container</b> запущен\n"
            fi
            save_state "$key" "OK"
        else
            echo -e "  ${RED}✗${NC} $container ($result)"
            has_errors=true
            if [[ "$prev_state" == "OK" ]]; then
                error_messages+="🔴 <b>$container</b> остановлен ($result)\n"
            fi
            save_state "$key" "$result"
        fi
    done
    
    # Проверка дискового пространства
    echo ""
    echo "💾 Disk Space:"
    local disk_usage
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
    if [ "$disk_usage" -gt 90 ]; then
        echo -e "  ${RED}✗${NC} Root: ${disk_usage}% (критично!)"
        prev_state=$(get_previous_state "disk_space")
        if [[ "$prev_state" == "OK" ]]; then
            error_messages+="🔴 <b>Диск</b> заполнен на ${disk_usage}%\n"
        fi
        save_state "disk_space" "CRITICAL"
        has_errors=true
    elif [ "$disk_usage" -gt 80 ]; then
        echo -e "  ${YELLOW}⚠${NC} Root: ${disk_usage}% (внимание)"
    else
        echo -e "  ${GREEN}✓${NC} Root: ${disk_usage}%"
        save_state "disk_space" "OK"
    fi
    
    # Проверка RAM
    echo ""
    echo "🧠 Memory:"
    local mem_usage
    mem_usage=$(free | awk 'NR==2 {printf "%.0f", $3/$2*100}')
    if [ "$mem_usage" -gt 95 ]; then
        echo -e "  ${RED}✗${NC} RAM: ${mem_usage}% (критично!)"
        prev_state=$(get_previous_state "memory")
        if [[ "$prev_state" == "OK" ]]; then
            error_messages+="🔴 <b>RAM</b> заполнена на ${mem_usage}%\n"
        fi
        save_state "memory" "CRITICAL"
        has_errors=true
    elif [ "$mem_usage" -gt 85 ]; then
        echo -e "  ${YELLOW}⚠${NC} RAM: ${mem_usage}% (внимание)"
    else
        echo -e "  ${GREEN}✓${NC} RAM: ${mem_usage}%"
        save_state "memory" "OK"
    fi
    
    # Отправка уведомлений
    if [ -n "$error_messages" ]; then
        local message="🚨 <b>BelBird Alert</b>\n\n${error_messages}\n⏰ $timestamp"
        send_telegram "$message"
        echo ""
        echo -e "${RED}🚨 Отправлено уведомление об ошибках${NC}"
    fi
    
    if [ -n "$recovery_messages" ]; then
        local message="✅ <b>BelBird Recovery</b>\n\n${recovery_messages}\n⏰ $timestamp"
        send_telegram "$message"
        echo ""
        echo -e "${GREEN}✅ Отправлено уведомление о восстановлении${NC}"
    fi
    
    echo ""
    if $has_errors; then
        echo -e "${RED}❌ Обнаружены проблемы!${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Все сервисы работают нормально${NC}"
        return 0
    fi
}

# Обработка аргументов
case "$1" in
    --once)
        monitor
        ;;
    --daemon)
        INTERVAL="${2:-60}"
        echo "🔄 Запуск мониторинга каждые $INTERVAL секунд..."
        echo "Для остановки нажмите Ctrl+C"
        while true; do
            monitor
            sleep "$INTERVAL"
        done
        ;;
    --test-telegram)
        echo "📤 Отправка тестового сообщения..."
        send_telegram "🧪 <b>Тестовое сообщение</b>\n\nМониторинг BelBird настроен корректно!"
        echo "✅ Готово!"
        ;;
    *)
        echo "BelBird Health Monitor"
        echo ""
        echo "Использование:"
        echo "  $0 --once              Однократная проверка"
        echo "  $0 --daemon [секунды]  Непрерывный мониторинг (по умолчанию 60 сек)"
        echo "  $0 --test-telegram     Тест отправки в Telegram"
        echo ""
        echo "Переменные окружения:"
        echo "  TELEGRAM_BOT_TOKEN     Токен бота Telegram"
        echo "  TELEGRAM_CHAT_ID       ID чата для уведомлений"
        echo ""
        echo "Пример:"
        echo "  export TELEGRAM_BOT_TOKEN='123456:ABC-DEF...'"
        echo "  export TELEGRAM_CHAT_ID='-1001234567890'"
        echo "  $0 --daemon 30"
        ;;
esac
