#!/bin/bash

echo "Исправление конфликтов портов для nginx..."

# Проверка процессов, использующих порты 80 и 8080
echo "Проверка процессов на портах 80 и 8080:"
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :8080

# Остановка nginx
echo "Остановка nginx..."
sudo systemctl stop nginx

# Проверка, что порты освободились
echo "Проверка освобождения портов:"
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :8080

# Удаление конфигурации с портом 8080 из nginx.conf
echo "Удаление конфигурации с портом 8080..."
sudo sed -i '/server {/,/}/ { /listen 8080/,/}/d; }' /etc/nginx/nginx.conf

# Проверка конфигурации nginx
echo "Проверка конфигурации nginx..."
if sudo nginx -t; then
    echo "Конфигурация nginx корректна"
else
    echo "Ошибка в конфигурации nginx"
    exit 1
fi

# Запуск nginx
echo "Запуск nginx..."
sudo systemctl start nginx

# Проверка статуса
echo "Проверка статуса nginx:"
sudo systemctl status nginx

echo "Готово! Теперь попробуйте снова получить SSL сертификат:"
echo "sudo certbot --nginx -d shelkovitsa.ru -d www.shelkovitsa.ru"
