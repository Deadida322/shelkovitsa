#!/bin/bash
# Минимальный скрипт развертывания для проекта Shelkovitsa
# Без оптимизаций, кеширования и www-data пользователя
# Работа от root

set -e

echo "🚀 Минимальное развертывание проекта Shelkovitsa"
echo "=============================================="

# Переменные
PROJECT_DIR="/var/www/shelkovitsa"

# Проверка прав доступа
if [ "$EUID" -ne 0 ]; then
    echo "❌ Запустите скрипт с правами sudo"
    exit 1
fi

echo "ℹ️  Начинаем развертывание..."

# 1. Обновление из Git
echo "ℹ️  Шаг 1: Обновление кода из Git"
cd $PROJECT_DIR
git pull
echo "✅ Код обновлен"

# 2. Установка зависимостей Backend
echo "ℹ️  Шаг 2: Установка зависимостей Backend"
cd $PROJECT_DIR/server
npm ci --omit=dev
echo "✅ Зависимости Backend установлены"

# 3. Сборка Backend
echo "ℹ️  Шаг 3: Сборка Backend"
npm run build
echo "✅ Backend собран"

# 4. Настройка nginx
echo "ℹ️  Шаг 4: Настройка nginx"
cp $PROJECT_DIR/deploy-min/nginx.conf /etc/nginx/nginx.conf

if nginx -t; then
    systemctl reload nginx
    echo "✅ Nginx настроен"
else
    echo "❌ Ошибка в конфигурации nginx"
    nginx -t
    exit 1
fi

# 5. Настройка systemd сервисов
echo "ℹ️  Шаг 5: Настройка systemd сервисов"

# Backend сервис
cat > /etc/systemd/system/shelkovitsa-backend.service << EOF
[Unit]
Description=Shelkovitsa Backend (NestJS)
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$PROJECT_DIR/server
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=8000
Environment=HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
EOF

# Frontend сервис (зависит от backend)
cat > /etc/systemd/system/shelkovitsa-frontend.service << EOF
[Unit]
Description=Shelkovitsa Frontend (Nuxt.js)
After=network.target shelkovitsa-backend.service
Requires=shelkovitsa-backend.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$PROJECT_DIR/client
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=0.0.0.0
Environment=NUXT_PUBLIC_API_BASE=https://shelkovitsa.ru

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Systemd сервисы настроены"

# 6. Запуск Backend
echo "ℹ️  Шаг 6: Запуск Backend"
systemctl daemon-reload
systemctl enable shelkovitsa-backend

systemctl stop shelkovitsa-backend 2>/dev/null || true
sleep 2

echo "ℹ️  Запуск Backend..."
systemctl start shelkovitsa-backend
sleep 5

# Проверка доступности Backend
echo "ℹ️  Проверка доступности Backend..."
for i in {1..30}; do
    if curl -s http://localhost:8000/api/benefit > /dev/null 2>&1; then
        echo "✅ Backend готов к работе"
        break
    else
        echo "ℹ️  Ожидание Backend... ($i/30)"
        sleep 2
    fi
done

# 7. Установка зависимостей Frontend
echo "ℹ️  Шаг 7: Установка зависимостей Frontend"
cd $PROJECT_DIR/client
npm install
echo "✅ Зависимости Frontend установлены"

# 8. Сборка Frontend (после запуска Backend)
echo "ℹ️  Шаг 8: Сборка Frontend (Backend доступен)"
npm run build
echo "✅ Frontend собран"

# 9. Запуск Frontend
echo "ℹ️  Шаг 9: Запуск Frontend"
systemctl enable shelkovitsa-frontend
systemctl start shelkovitsa-frontend
echo "✅ Frontend запущен"

# Перезагрузка nginx для применения изменений
echo "ℹ️  Перезагрузка nginx..."
systemctl reload nginx
echo "✅ Nginx перезагружен"

# Проверка доступности статических файлов
echo "ℹ️  Проверка статических файлов..."
sleep 3
# Найдем любой .js файл в папке _nuxt для проверки
NUXT_FILE=$(find /var/www/shelkovitsa/client/.output/public/_nuxt/ -name "*.js" | head -1 | xargs basename)
if [ -n "$NUXT_FILE" ]; then
    if curl -s -I https://shelkovitsa.ru/_nuxt/$NUXT_FILE | grep -q "200 OK"; then
        echo "✅ Статические файлы доступны"
    else
        echo "⚠️  Статические файлы недоступны"
    fi
else
    echo "⚠️  Файлы в папке _nuxt не найдены"
fi

# 10. Проверка статуса
echo "ℹ️  Шаг 10: Проверка статуса"
sleep 5

if systemctl is-active --quiet shelkovitsa-backend; then
    echo "✅ Backend работает"
else
    echo "❌ Backend не работает"
    systemctl status shelkovitsa-backend --no-pager
fi

if systemctl is-active --quiet shelkovitsa-frontend; then
    echo "✅ Frontend работает"
else
    echo "❌ Frontend не работает"
    systemctl status shelkovitsa-frontend --no-pager
fi

if systemctl is-active --quiet nginx; then
    echo "✅ Nginx работает"
else
    echo "❌ Nginx не работает"
    systemctl status nginx --no-pager
fi

echo ""
echo "🎉 Минимальное развертывание завершено!"
echo ""
echo "📊 Полезные команды:"
echo "  systemctl status shelkovitsa-backend"
echo "  systemctl status shelkovitsa-frontend"
echo "  systemctl status nginx"
echo "  journalctl -u shelkovitsa-backend -f"
echo "  journalctl -u shelkovitsa-frontend -f"
echo ""
echo "🌐 Проверьте работу сайта:"
echo "  http://localhost"
echo ""
