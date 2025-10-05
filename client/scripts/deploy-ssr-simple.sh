#!/bin/bash
# Скрипт для развертывания SSR приложения с упрощенным systemd сервисом

echo "🚀 Развертывание SSR приложения (упрощенная версия)..."

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

echo "📝 Создание упрощенного systemd сервиса..."
sudo cp ../deploy/nuxt-app-simple.service /etc/systemd/system/nuxt-app.service

echo "🔄 Перезапуск сервисов..."
sudo systemctl daemon-reload
sudo systemctl enable nuxt-app
sudo systemctl restart nuxt-app

# Обновляем nginx конфигурацию
echo "🔧 Обновление nginx конфигурации..."
sudo cp ../deploy/nginx-ssr-optimized.conf /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl reload nginx

echo "📊 Проверка статуса сервисов..."
echo "=== Nuxt App Status ==="
sudo systemctl status nuxt-app --no-pager

echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager

echo "=== Port Check ==="
sudo netstat -tlnp | grep -E ':(8000|3000|80|443)'

echo "✅ SSR приложение успешно развернуто!"
echo "🌐 Проверьте работу сайта: http://your-domain.com"
echo "📊 Мониторинг Nuxt: sudo journalctl -u nuxt-app -f"
echo "📊 Мониторинг Nginx: sudo tail -f /var/log/nginx/access.log"
