#!/bin/bash
# Универсальный скрипт для исправления всех проблем

echo "🔧 Исправление всех проблем с развертыванием..."

# 1. Делаем все скрипты исполняемыми
echo "📝 Делаем скрипты исполняемыми..."
chmod +x scripts/*.sh

# 2. Останавливаем проблемные сервисы
echo "⏹️  Остановка сервисов..."
sudo systemctl stop nuxt-app 2>/dev/null || echo "Nuxt сервис не был запущен"
sudo systemctl stop nginx 2>/dev/null || echo "Nginx не был запущен"

# 3. Создаем необходимые директории
echo "📁 Создание необходимых директорий..."
sudo mkdir -p /var/www/shelkovitsa/client
sudo mkdir -p /var/log/pm2
sudo mkdir -p /var/www/shelkovitsa/backup
sudo chown -R www-data:www-data /var/www/shelkovitsa
sudo chown www-data:www-data /var/log/pm2
sudo chmod 755 /var/log/pm2

# 4. Используем HTTP-only конфигурацию nginx
echo "🔧 Настройка nginx (HTTP только)..."
sudo cp ../deploy/nginx-http-only.conf /etc/nginx/nginx.conf

# 5. Проверяем конфигурацию nginx
echo "🔍 Проверка конфигурации nginx..."
if sudo nginx -t; then
    echo "✅ Конфигурация nginx корректна"
else
    echo "❌ Ошибка в конфигурации nginx"
    echo "📋 Содержимое ошибки:"
    sudo nginx -t
    exit 1
fi

# 6. Запускаем nginx
echo "🚀 Запуск nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# 7. Проверяем статус
echo "📊 Проверка статуса..."
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager

echo "=== Port Check ==="
sudo netstat -tlnp | grep -E ':(80|443)' || echo "⚠️  Порты 80/443 не найдены"

echo ""
echo "✅ Базовые исправления завершены!"
echo ""
echo "🚀 Следующие шаги:"
echo "1. Соберите приложение: ./scripts/build-ssr.sh"
echo "2. Разверните (HTTP): ./scripts/deploy-http-only.sh"
echo "3. Настройте SSL: ./scripts/setup-ssl.sh"
echo ""
echo "💡 Для мониторинга: sudo tail -f /var/log/nginx/error.log"
