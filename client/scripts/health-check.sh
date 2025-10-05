#!/bin/bash
# Скрипт проверки здоровья SSR приложения

echo "🏥 Проверка здоровья SSR приложения"
echo "==================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Счетчики
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Функция для проверки с подсчетом
check_with_count() {
    local check_name="$1"
    local command="$2"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $check_name${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ $check_name${NC}"
        return 1
    fi
}

echo ""
echo "🔍 Проверка сервисов:"
echo "-------------------"

check_with_count "Nuxt.js сервис активен" "sudo systemctl is-active --quiet nuxt-app"
check_with_count "Nginx сервис активен" "sudo systemctl is-active --quiet nginx"

echo ""
echo "🔍 Проверка портов:"
echo "------------------"

check_with_count "Порт 8000 (NestJS API) открыт" "sudo netstat -tlnp | grep -q ':8000 '"
check_with_count "Порт 3000 (Nuxt SSR) открыт" "sudo netstat -tlnp | grep -q ':3000 '"
check_with_count "Порт 80 (Nginx HTTP) открыт" "sudo netstat -tlnp | grep -q ':80 '"

echo ""
echo "🌐 Проверка HTTP ответов:"
echo "-------------------------"

check_with_count "NestJS API отвечает" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/api | grep -q '200'"
check_with_count "Nuxt SSR отвечает" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 | grep -q '200'"
check_with_count "Nginx HTTP отвечает" "curl -s -o /dev/null -w '%{http_code}' http://localhost | grep -q '200'"

echo ""
echo "📊 Проверка ресурсов:"
echo "-------------------"

# Проверка использования памяти
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✅ Использование памяти: ${MEMORY_USAGE}%${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}⚠️  Использование памяти: ${MEMORY_USAGE}%${NC}"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Проверка использования диска
DISK_USAGE=$(df /var/www/shelkovitsa/ | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✅ Использование диска: ${DISK_USAGE}%${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}⚠️  Использование диска: ${DISK_USAGE}%${NC}"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

echo ""
echo "📋 Проверка логов на ошибки:"
echo "---------------------------"

# Проверка логов Nuxt на критические ошибки
NUXT_ERRORS=$(sudo journalctl -u nuxt-app --since "1 hour ago" --no-pager | grep -i "error\|fatal\|crash" | wc -l)
if [ "$NUXT_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ Логи Nuxt без критических ошибок${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}⚠️  Найдено $NUXT_ERRORS ошибок в логах Nuxt за последний час${NC}"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Проверка логов Nginx на ошибки
NGINX_ERRORS=$(sudo tail -n 100 /var/log/nginx/error.log 2>/dev/null | grep -i "error\|fatal" | wc -l)
if [ "$NGINX_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ Логи Nginx без критических ошибок${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}⚠️  Найдено $NGINX_ERRORS ошибок в логах Nginx${NC}"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

echo ""
echo "📊 Итоговый результат:"
echo "======================"

PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

if [ "$PERCENTAGE" -ge 90 ]; then
    echo -e "${GREEN}🎉 Отличное состояние: $PASSED_CHECKS/$TOTAL_CHECKS проверок пройдено ($PERCENTAGE%)${NC}"
    exit 0
elif [ "$PERCENTAGE" -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Хорошее состояние: $PASSED_CHECKS/$TOTAL_CHECKS проверок пройдено ($PERCENTAGE%)${NC}"
    exit 1
else
    echo -e "${RED}🚨 Критическое состояние: $PASSED_CHECKS/$TOTAL_CHECKS проверок пройдено ($PERCENTAGE%)${NC}"
    exit 2
fi
