#!/bin/bash
# Скрипт для обновления конфигурации API

echo "🔄 Обновление конфигурации API..."

# 1. Пересборка приложения
echo "🔨 Шаг 1: Пересборка приложения..."
./scripts/build-ssr.sh
if [ $? -ne 0 ]; then
    echo "❌ Ошибка при сборке приложения"
    exit 1
fi

# 2. Остановка сервиса
echo "⏹️  Шаг 2: Остановка Nuxt.js сервиса..."
sudo systemctl stop nuxt-app

# 3. Копирование обновленных файлов
echo "📦 Шаг 3: Копирование обновленных файлов..."
sudo cp -r .output/* /var/www/shelkovitsa/client/

# 4. Обновление systemd сервиса
echo "🔧 Шаг 4: Обновление systemd сервиса..."
sudo cp ../deploy/nuxt-app.service /etc/systemd/system/nuxt-app.service
sudo systemctl daemon-reload

# 5. Настройка прав доступа
echo "🔒 Шаг 5: Настройка прав доступа..."
sudo chown -R www-data:www-data /var/www/shelkovitsa/client
sudo chmod -R 755 /var/www/shelkovitsa/client

# 6. Запуск сервиса
echo "🚀 Шаг 6: Запуск Nuxt.js сервиса..."
sudo systemctl start nuxt-app
sudo systemctl enable nuxt-app

# 7. Проверка статуса
echo "📊 Шаг 7: Проверка статуса..."
sudo systemctl status nuxt-app --no-pager

# 8. Проверка переменных окружения
echo "🔍 Шаг 8: Проверка переменных окружения..."
echo "Переменные окружения:"
sudo systemctl show nuxt-app | grep Environment

# 9. Проверка портов
echo "🔍 Шаг 9: Проверка портов..."
sudo netstat -tlnp | grep -E ':(8000|3000|80|443)'

# 10. Тест доступности
echo "🌐 Шаг 10: Тест доступности..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "✅ Nuxt.js отвечает на порту 3000"
else
    echo "❌ Nuxt.js не отвечает на порту 3000"
fi

echo ""
echo "✅ Обновление конфигурации API завершено!"
echo "📊 Проверка статуса: sudo systemctl status nuxt-app"
echo "📊 Мониторинг: sudo journalctl -u nuxt-app -f"
echo "🌐 Тест: curl http://localhost:3000"
