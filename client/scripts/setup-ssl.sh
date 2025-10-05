#!/bin/bash
# Скрипт для настройки SSL сертификатов

echo "🔒 Настройка SSL сертификатов..."

# Проверяем, что nginx работает на HTTP
echo "🔍 Проверка текущего статуса nginx..."
if ! sudo systemctl is-active --quiet nginx; then
    echo "❌ Nginx не запущен. Сначала запустите deploy-http-only.sh"
    exit 1
fi

# Устанавливаем certbot если не установлен
echo "📦 Установка certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
else
    echo "✅ Certbot уже установлен"
fi

# Получаем SSL сертификаты
echo "🔐 Получение SSL сертификатов..."
echo "Введите ваш домен (например: shelkovitsa.ru):"
read -p "Домен: " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ Домен не указан"
    exit 1
fi

echo "🔐 Получение сертификата для $DOMAIN..."
sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN"

# Проверяем результат
if [ $? -eq 0 ]; then
    echo "✅ SSL сертификаты успешно получены!"
    
    # Certbot автоматически обновляет nginx конфигурацию
    # Проверяем, что nginx работает с SSL
    echo "🔍 Проверка nginx с SSL..."
    if sudo nginx -t; then
        echo "✅ Nginx с SSL работает корректно"
        sudo systemctl reload nginx
        echo "🎉 SSL настроен успешно!"
        echo "🌐 Проверьте работу сайта: https://$DOMAIN"
    else
        echo "❌ Ошибка в конфигурации nginx с SSL"
        echo "📋 Детали ошибки:"
        sudo nginx -t
        echo "🔄 Возвращаемся к HTTP конфигурации..."
        sudo cp ../deploy/nginx-http-only.conf /etc/nginx/nginx.conf
        sudo systemctl reload nginx
        exit 1
    fi
else
    echo "❌ Ошибка при получении SSL сертификатов"
    echo "💡 Убедитесь, что:"
    echo "   - Домен указывает на ваш сервер"
    echo "   - Порт 80 открыт"
    echo "   - Nginx работает"
    exit 1
fi

echo ""
echo "🔒 SSL настройка завершена!"
echo "🌐 HTTP: http://$DOMAIN"
echo "🌐 HTTPS: https://$DOMAIN"
echo "📊 Проверка сертификата: sudo certbot certificates"
