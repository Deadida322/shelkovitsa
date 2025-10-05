#!/bin/bash
# Скрипт для развертывания только с HTTP (без SSL)

echo "🚀 Развертывание SSR приложения (HTTP только)..."

# Проверяем наличие папки .output
if [ ! -d ".output" ]; then
    echo "❌ Папка .output не найдена. Запустите сначала build-ssr.sh"
    exit 1
fi

# Создаем директорию на сервере
SERVER_PATH="/var/www/shelkovitsa/client"
BACKUP_PATH="/var/www/shelkovitsa/backup/$(date +%Y%m%d_%H%M%S)"

echo "📁 Создание резервной копии..."
sudo mkdir -p "$BACKUP_PATH"
sudo cp -r "$SERVER_PATH" "$BACKUP_PATH/" 2>/dev/null || echo "⚠️  Резервная копия не создана (первое развертывание?)"

echo "📦 Копирование файлов..."
sudo mkdir -p "$SERVER_PATH"
sudo cp -r .output/* "$SERVER_PATH/"

echo "🔧 Настройка прав доступа..."
sudo chown -R www-data:www-data "$SERVER_PATH"
sudo chmod -R 755 "$SERVER_PATH"

echo "📝 Создание systemd сервиса для Nuxt..."
# Создаем необходимые директории
sudo mkdir -p /var/log/pm2
sudo chown www-data:www-data /var/log/pm2

# Копируем systemd сервис
sudo cp ../deploy/nuxt-app.service /etc/systemd/system/nuxt-app.service

echo "🔄 Перезапуск сервисов..."
sudo systemctl daemon-reload
sudo systemctl enable nuxt-app
sudo systemctl restart nuxt-app

# Используем HTTP-only конфигурацию nginx
echo "🔧 Настройка nginx (HTTP только)..."
sudo cp ../deploy/nginx-http-only.conf /etc/nginx/nginx.conf

# Проверяем конфигурацию nginx
echo "🔍 Проверка конфигурации nginx..."
if sudo nginx -t; then
    echo "✅ Конфигурация nginx корректна"
    sudo systemctl reload nginx
else
    echo "❌ Ошибка в конфигурации nginx"
    exit 1
fi

echo "📊 Проверка статуса сервисов..."
echo "=== Nuxt App Status ==="
sudo systemctl status nuxt-app --no-pager

echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager

echo "=== Port Check ==="
sudo netstat -tlnp | grep -E ':(8000|3000|80)'

echo "✅ SSR приложение успешно развернуто (HTTP только)!"
echo "🌐 Проверьте работу сайта: http://your-domain.com"
echo "📊 Мониторинг Nuxt: sudo journalctl -u nuxt-app -f"
echo "📊 Мониторинг Nginx: sudo tail -f /var/log/nginx/access.log"
echo ""
echo "💡 Для добавления SSL сертификатов:"
echo "   1. Получите SSL сертификаты с помощью certbot"
echo "   2. Переключитесь на полную конфигурацию nginx"
echo "   3. Используйте: sudo cp ../deploy/nginx-ssr-optimized.conf /etc/nginx/nginx.conf"
