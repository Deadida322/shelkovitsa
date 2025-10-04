#!/bin/bash

echo "Исправление проблемы с ACME challenge для Let's Encrypt..."

# Создание директории для ACME challenge
echo "Создание директории для ACME challenge..."
sudo mkdir -p /var/www/html/.well-known/acme-challenge
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Копирование исправленной конфигурации nginx
echo "Копирование исправленной конфигурации nginx..."
sudo cp nginx-fixed-acme.conf /etc/nginx/nginx.conf

# Проверка конфигурации nginx
echo "Проверка конфигурации nginx..."
if sudo nginx -t; then
    echo "Конфигурация nginx корректна"
else
    echo "Ошибка в конфигурации nginx"
    exit 1
fi

# Перезагрузка nginx
echo "Перезагрузка nginx..."
sudo systemctl reload nginx

# Проверка доступности ACME challenge
echo "Проверка доступности ACME challenge..."
echo "test" | sudo tee /var/www/html/.well-known/acme-challenge/test > /dev/null

# Тест доступности
if curl -s http://shelkovitsa.ru/.well-known/acme-challenge/test | grep -q "test"; then
    echo "ACME challenge доступен! Можно получать SSL сертификат."
    echo "Запустите: sudo certbot --nginx -d shelkovitsa.ru -d www.shelkovitsa.ru"
else
    echo "ACME challenge недоступен. Проверьте настройки DNS и файрвола."
    echo "Проверьте, что домен shelkovitsa.ru указывает на этот сервер."
fi

# Удаление тестового файла
sudo rm -f /var/www/html/.well-known/acme-challenge/test

echo "Готово!"
