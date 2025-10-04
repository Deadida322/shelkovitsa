#!/bin/bash

# Скрипт для включения HTTPS редиректа после получения SSL сертификатов

echo "Включение HTTPS редиректа..."

# Создание резервной копии текущей конфигурации
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)

# Обновление конфигурации nginx для включения редиректа с HTTP на HTTPS
sudo sed -i 's/# Редирект на HTTPS/return 301 https:\/\/$server_name$request_uri;/' /etc/nginx/nginx.conf

# Проверка конфигурации
if sudo nginx -t; then
    echo "Конфигурация nginx корректна. Перезагрузка nginx..."
    sudo systemctl reload nginx
    echo "HTTPS редирект включен успешно!"
    echo "Теперь все HTTP запросы будут перенаправляться на HTTPS"
else
    echo "Ошибка в конфигурации nginx. Восстановление резервной копии..."
    sudo cp /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/nginx.conf
    echo "Конфигурация восстановлена из резервной копии"
    exit 1
fi

echo "Проверка работы редиректа:"
echo "curl -I http://shelkovitsa.ru"
curl -I http://shelkovitsa.ru
