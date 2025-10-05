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
    
    # Переключаемся на полную конфигурацию nginx с SSL
    echo "🔧 Переключение на полную конфигурацию nginx..."
    sudo cp ../deploy/nginx-ssr-optimized.conf /etc/nginx/nginx.conf
    
    # Обновляем домен в конфигурации
    sudo sed -i "s/shelkovitsa.ru/$DOMAIN/g" /etc/nginx/nginx.conf
    
    # Проверяем конфигурацию
    if sudo nginx -t; then
        echo "✅ Конфигурация nginx с SSL корректна"
        sudo systemctl reload nginx
        echo "🎉 SSL настроен успешно!"
        echo "🌐 Проверьте работу сайта: https://$DOMAIN"
    else
        echo "❌ Ошибка в конфигурации nginx с SSL"
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
