#!/bin/bash
# Скрипт для исправления systemd сервиса

echo "🔧 Исправление systemd сервиса для Nuxt.js..."

# Останавливаем сервис если он запущен
echo "⏹️  Остановка сервиса..."
sudo systemctl stop nuxt-app 2>/dev/null || echo "Сервис не был запущен"

# Создаем необходимые директории
echo "📁 Создание необходимых директорий..."
sudo mkdir -p /var/log/pm2
sudo chown www-data:www-data /var/log/pm2
sudo chmod 755 /var/log/pm2

# Копируем исправленный systemd сервис
echo "📝 Обновление systemd сервиса..."
sudo cp ../deploy/nuxt-app.service /etc/systemd/system/nuxt-app.service

# Перезагружаем systemd
echo "🔄 Перезагрузка systemd..."
sudo systemctl daemon-reload

# Запускаем сервис
echo "🚀 Запуск сервиса..."
sudo systemctl enable nuxt-app
sudo systemctl start nuxt-app

# Проверяем статус
echo "📊 Проверка статуса..."
sudo systemctl status nuxt-app --no-pager

echo "✅ Исправление завершено!"
echo "💡 Для мониторинга используйте: sudo journalctl -u nuxt-app -f"
