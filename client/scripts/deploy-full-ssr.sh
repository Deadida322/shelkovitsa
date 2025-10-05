#!/bin/bash
# Полный скрипт развертывания SSR приложения

echo "🚀 Полное развертывание SSR приложения..."

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: запустите скрипт из папки client/"
    exit 1
fi

# 1. Сборка приложения
echo "📦 Шаг 1: Сборка приложения..."
./scripts/build-ssr.sh
if [ $? -ne 0 ]; then
    echo "❌ Ошибка при сборке приложения"
    exit 1
fi

# 2. Развертывание
echo "🚀 Шаг 2: Развертывание..."
./scripts/deploy-ssr.sh
if [ $? -ne 0 ]; then
    echo "❌ Ошибка при развертывании"
    exit 1
fi

# 3. Проверка здоровья сервисов
echo "🏥 Шаг 3: Проверка здоровья сервисов..."

# Проверяем Nuxt сервис
if sudo systemctl is-active --quiet nuxt-app; then
    echo "✅ Nuxt сервис работает"
else
    echo "❌ Nuxt сервис не работает"
    sudo systemctl status nuxt-app --no-pager
fi

# Проверяем Nginx
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx работает"
else
    echo "❌ Nginx не работает"
    sudo systemctl status nginx --no-pager
fi

# Проверяем порты
echo "🔍 Проверка портов:"
sudo netstat -tlnp | grep -E ':(8000|3000|80|443)' || echo "⚠️  Некоторые порты не найдены"

# 4. Тест доступности
echo "🌐 Шаг 4: Тест доступности..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "✅ Nuxt приложение отвечает на порту 3000"
else
    echo "❌ Nuxt приложение не отвечает на порту 3000"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:80 | grep -q "200"; then
    echo "✅ Nginx отвечает на порту 80"
else
    echo "❌ Nginx не отвечает на порту 80"
fi

echo ""
echo "🎉 Развертывание завершено!"
echo ""
echo "📊 Полезные команды для мониторинга:"
echo "  sudo systemctl status nuxt-app"
echo "  sudo journalctl -u nuxt-app -f"
echo "  sudo tail -f /var/log/nginx/access.log"
echo "  sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🔧 Полезные команды для управления:"
echo "  sudo systemctl restart nuxt-app"
echo "  sudo systemctl restart nginx"
echo "  sudo nginx -t"
echo ""
echo "🌐 Проверьте работу сайта:"
echo "  http://your-domain.com"
echo "  http://localhost:3000 (прямой доступ к Nuxt)"
