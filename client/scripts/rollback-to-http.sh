#!/bin/bash
# Скрипт для отката к HTTP конфигурации

echo "🔄 Откат к HTTP конфигурации..."

# Останавливаем nginx
echo "⏹️  Остановка nginx..."
sudo systemctl stop nginx

# Переключаемся на HTTP-only конфигурацию
echo "🔧 Переключение на HTTP-only конфигурацию..."
sudo cp ../deploy/nginx-http-only.conf /etc/nginx/nginx.conf

# Проверяем конфигурацию
echo "🔍 Проверка конфигурации..."
if sudo nginx -t; then
    echo "✅ HTTP конфигурация корректна"
    
    # Запускаем nginx
    echo "🚀 Запуск nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # Проверяем статус
    echo "📊 Статус nginx:"
    sudo systemctl status nginx --no-pager
    
    echo ""
    echo "✅ Откат к HTTP завершен!"
    echo "🌐 Сайт работает на HTTP (порт 80)"
    echo "💡 Для повторной настройки SSL: ./scripts/setup-ssl-step-by-step.sh"
    
else
    echo "❌ Ошибка в HTTP конфигурации"
    echo "📋 Детали ошибки:"
    sudo nginx -t
    exit 1
fi
