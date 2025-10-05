#!/bin/bash
# Скрипт мониторинга SSR приложения

echo "📊 Мониторинг SSR приложения Shelkovitsa"
echo "========================================"

# Функция для проверки статуса сервиса
check_service() {
    local service=$1
    local name=$2
    
    if sudo systemctl is-active --quiet $service; then
        echo "✅ $name: АКТИВЕН"
        return 0
    else
        echo "❌ $name: НЕ АКТИВЕН"
        return 1
    fi
}

# Функция для проверки порта
check_port() {
    local port=$1
    local name=$2
    
    if sudo netstat -tlnp | grep -q ":$port "; then
        echo "✅ $name (порт $port): ОТКРЫТ"
        return 0
    else
        echo "❌ $name (порт $port): ЗАКРЫТ"
        return 1
    fi
}

# Функция для проверки HTTP ответа
check_http() {
    local url=$1
    local name=$2
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    if [ "$status" = "200" ]; then
        echo "✅ $name: HTTP $status"
        return 0
    else
        echo "❌ $name: HTTP $status"
        return 1
    fi
}

echo ""
echo "🔍 Проверка сервисов:"
echo "-------------------"
check_service "nuxt-app" "Nuxt.js приложение"
check_service "nginx" "Nginx веб-сервер"

echo ""
echo "🔍 Проверка портов:"
echo "------------------"
check_port "8000" "NestJS API"
check_port "3000" "Nuxt.js SSR"
check_port "80" "Nginx HTTP"
check_port "443" "Nginx HTTPS"

echo ""
echo "🌐 Проверка HTTP ответов:"
echo "-------------------------"
check_http "http://localhost:8000/api" "NestJS API"
check_http "http://localhost:3000" "Nuxt.js SSR"
check_http "http://localhost" "Nginx (HTTP)"

echo ""
echo "📈 Статистика ресурсов:"
echo "----------------------"
echo "💾 Использование памяти:"
free -h

echo ""
echo "💽 Использование диска:"
df -h /var/www/shelkovitsa/

echo ""
echo "🔄 Загрузка системы:"
uptime

echo ""
echo "📊 Процессы Node.js:"
ps aux | grep node | grep -v grep

echo ""
echo "📋 Последние логи Nuxt:"
echo "----------------------"
sudo journalctl -u nuxt-app --no-pager -n 5

echo ""
echo "📋 Последние логи Nginx:"
echo "----------------------"
sudo tail -n 5 /var/log/nginx/error.log 2>/dev/null || echo "Логи ошибок Nginx пусты"

echo ""
echo "🔧 Полезные команды:"
echo "-------------------"
echo "  sudo systemctl status nuxt-app"
echo "  sudo journalctl -u nuxt-app -f"
echo "  sudo tail -f /var/log/nginx/access.log"
echo "  sudo tail -f /var/log/nginx/error.log"
echo "  sudo systemctl restart nuxt-app"
echo "  sudo systemctl restart nginx"
