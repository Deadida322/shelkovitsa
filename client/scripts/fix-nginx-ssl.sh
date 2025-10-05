#!/bin/bash
# Скрипт для исправления проблемы с SSL сертификатами

echo "🔧 Исправление проблемы с SSL сертификатами..."

# 1. Останавливаем nginx
echo "⏹️  Остановка nginx..."
sudo systemctl stop nginx

# 2. Переключаемся на HTTP-only конфигурацию
echo "🔧 Переключение на HTTP-only конфигурацию..."
sudo cp ../deploy/nginx-http-only.conf /etc/nginx/nginx.conf

# 3. Проверяем конфигурацию
echo "🔍 Проверка конфигурации nginx..."
if sudo nginx -t; then
    echo "✅ Конфигурация nginx корректна (HTTP только)"
    
    # 4. Запускаем nginx
    echo "🚀 Запуск nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # 5. Проверяем статус
    echo "📊 Проверка статуса..."
    sudo systemctl status nginx --no-pager
    
    echo ""
    echo "✅ Проблема с SSL исправлена!"
    echo "🌐 Nginx теперь работает только на HTTP (порт 80)"
    echo "💡 Для добавления SSL используйте: ./scripts/setup-ssl.sh"
    
else
    echo "❌ Ошибка в конфигурации nginx"
    echo "📋 Содержимое ошибки:"
    sudo nginx -t
    exit 1
fi
