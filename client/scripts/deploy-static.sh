#!/bin/bash
# Скрипт для развертывания статического сайта

echo "🚀 Развертывание статического сайта..."

# Проверяем наличие папки dist
if [ ! -d "dist" ]; then
    echo "❌ Папка dist не найдена. Запустите сначала build-static.sh"
    exit 1
fi

# Создаем директорию на сервере (замените на ваш путь)
SERVER_PATH="/var/www/shelkovitsa/client"
BACKUP_PATH="/var/www/shelkovitsa/backup/$(date +%Y%m%d_%H%M%S)"

echo "📁 Создание резервной копии..."
sudo mkdir -p "$BACKUP_PATH"
sudo cp -r "$SERVER_PATH" "$BACKUP_PATH/" 2>/dev/null || echo "⚠️  Резервная копия не создана (первое развертывание?)"

echo "📦 Копирование файлов..."
sudo mkdir -p "$SERVER_PATH"
sudo cp -r dist/* "$SERVER_PATH/"

echo "🔧 Настройка прав доступа..."
sudo chown -R www-data:www-data "$SERVER_PATH"
sudo chmod -R 755 "$SERVER_PATH"

echo "🔄 Перезапуск nginx..."
sudo systemctl reload nginx

echo "✅ Статический сайт успешно развернут!"
echo "🌐 Проверьте работу сайта: http://your-domain.com"
