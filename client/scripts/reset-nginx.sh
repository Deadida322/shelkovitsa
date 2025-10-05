#!/bin/bash
# Скрипт для полного сброса nginx

echo "🔄 Полный сброс nginx..."

# 1. Останавливаем nginx
echo "⏹️  Остановка nginx..."
sudo systemctl stop nginx

# 2. Удаляем текущую конфигурацию
echo "🗑️  Удаление текущей конфигурации..."
sudo rm -f /etc/nginx/nginx.conf

# 3. Создаем резервную копию оригинальной конфигурации
echo "💾 Создание резервной копии..."
sudo cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf 2>/dev/null || echo "Резервная копия не найдена"

# 4. Устанавливаем HTTP-only конфигурацию
echo "🔧 Установка HTTP-only конфигурации..."
sudo cp ../deploy/nginx-http-only.conf /etc/nginx/nginx.conf

# 5. Проверяем конфигурацию
echo "🔍 Проверка конфигурации..."
if sudo nginx -t; then
    echo "✅ Конфигурация корректна"
    
    # 6. Запускаем nginx
    echo "🚀 Запуск nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # 7. Проверяем статус
    echo "📊 Статус nginx:"
    sudo systemctl status nginx --no-pager
    
    echo ""
    echo "✅ Nginx успешно сброшен и настроен!"
    echo "🌐 Работает на HTTP (порт 80)"
    echo "📊 Проверка портов:"
    sudo netstat -tlnp | grep :80
    
else
    echo "❌ Ошибка в конфигурации nginx"
    echo "📋 Детали ошибки:"
    sudo nginx -t
    exit 1
fi
