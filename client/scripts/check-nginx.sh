#!/bin/bash
# Скрипт для проверки состояния nginx

echo "🔍 Проверка состояния nginx..."

echo "📊 Статус nginx:"
sudo systemctl status nginx --no-pager

echo ""
echo "🔍 Проверка конфигурации:"
if sudo nginx -t; then
    echo "✅ Конфигурация nginx корректна"
else
    echo "❌ Ошибка в конфигурации nginx"
    echo "📋 Детали ошибки:"
    sudo nginx -t
fi

echo ""
echo "🔍 Проверка портов:"
sudo netstat -tlnp | grep nginx || echo "Nginx не слушает порты"

echo ""
echo "📋 Последние ошибки nginx:"
sudo tail -n 5 /var/log/nginx/error.log 2>/dev/null || echo "Логи ошибок пусты"

echo ""
echo "💡 Рекомендации:"
echo "  - Если есть ошибки SSL: ./scripts/fix-nginx-ssl.sh"
echo "  - Для полного сброса: ./scripts/reset-nginx.sh"
echo "  - Для HTTP-only развертывания: ./scripts/deploy-http-only.sh"
