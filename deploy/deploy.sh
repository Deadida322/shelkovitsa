#!/bin/bash
# Единый скрипт развертывания для проекта Shelkovitsa
# Домен: shelkovitsa.ru
# Backend: NestJS на порту 8000
# Frontend: Nuxt.js на порту 3000 (гибридный режим)

set -e

echo "🚀 Развертывание проекта Shelkovitsa"
echo "=================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Проверка прав доступа
if [ "$EUID" -ne 0 ]; then
    log_error "Запустите скрипт с правами sudo"
    exit 1
fi

# Переменные
PROJECT_DIR="/var/www/shelkovitsa"
DOMAIN="shelkovitsa.ru"

log_info "Начинаем развертывание проекта Shelkovitsa"

# 1. Обновление из Git
log_info "Шаг 1: Обновление кода из Git"
cd $PROJECT_DIR
# git pull origin main
git pull
log_success "Код обновлен из Git"

# 2. Настройка прав доступа для npm
log_info "Шаг 2: Настройка прав доступа для npm"
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
# Создаем директории для npm кэша
mkdir -p /root/.npm
chown -R root:root /root/.npm
log_success "Права доступа настроены"

# 3. Установка зависимостей Backend
log_info "Шаг 3: Установка зависимостей Backend"
cd $PROJECT_DIR/server
npm ci --omit=dev
log_success "Зависимости Backend установлены"

# 4. Сборка Backend
log_info "Шаг 4: Сборка Backend"
npm run build
log_success "Backend собран"

# 5. Временный запуск Backend для генерации Frontend
log_info "Шаг 5: Временный запуск Backend для генерации Frontend"
# Создаем временный процесс для Backend
cd $PROJECT_DIR/server
PORT=8000 nohup node dist/main.js > /tmp/backend-temp.log 2>&1 &
BACKEND_PID=$!
log_info "Backend запущен с PID: $BACKEND_PID"

# Ждем запуска Backend
log_info "Ожидание запуска Backend..."
sleep 10

# Проверяем, что Backend отвечает
for i in {1..30}; do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        log_success "Backend готов к работе"
        break
    fi
    log_info "Ожидание Backend... ($i/30)"
    sleep 2
done

# 7. Установка зависимостей Frontend
log_info "Шаг 7: Установка зависимостей Frontend"
cd $PROJECT_DIR/client
npm i --force
log_success "Зависимости Frontend установлены"

# 8. Сборка Frontend (с работающим Backend)
log_info "Шаг 8: Сборка Frontend (Backend должен быть запущен)"
npm run build
log_success "Frontend собран"

# 9. Остановка временного Backend
log_info "Шаг 9: Остановка временного Backend"
kill $BACKEND_PID 2>/dev/null || log_warning "Backend процесс уже остановлен"
log_success "Временный Backend остановлен"

# 10. Настройка systemd сервисов
log_info "Шаг 10: Настройка systemd сервисов"

# Backend сервис
cat > /etc/systemd/system/shelkovitsa-backend.service << EOF
[Unit]
Description=Shelkovitsa Backend (NestJS)
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$PROJECT_DIR/server
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=8000

[Install]
WantedBy=multi-user.target
EOF

# Frontend сервис
cat > /etc/systemd/system/shelkovitsa-frontend.service << EOF
[Unit]
Description=Shelkovitsa Frontend (Nuxt.js)
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$PROJECT_DIR/client
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=NUXT_PUBLIC_API_BASE=https://$DOMAIN

[Install]
WantedBy=multi-user.target
EOF

log_success "Systemd сервисы настроены"

# 11. Перезапуск сервисов
log_info "Шаг 11: Перезапуск сервисов"
systemctl daemon-reload
systemctl enable shelkovitsa-backend
systemctl enable shelkovitsa-frontend
systemctl restart shelkovitsa-backend
systemctl restart shelkovitsa-frontend
log_success "Сервисы перезапущены"

# 12. Настройка nginx
log_info "Шаг 12: Настройка nginx"
cp $PROJECT_DIR/deploy/nginx.conf /etc/nginx/nginx.conf

# Проверка конфигурации nginx
if nginx -t; then
    systemctl reload nginx
    log_success "Nginx настроен и перезагружен"
else
    log_error "Ошибка в конфигурации nginx"
    nginx -t
    exit 1
fi

# 13. Проверка статуса
log_info "Шаг 13: Проверка статуса сервисов"

# Проверка Backend
if systemctl is-active --quiet shelkovitsa-backend; then
    log_success "Backend сервис работает"
else
    log_error "Backend сервис не работает"
    systemctl status shelkovitsa-backend --no-pager
fi

# Проверка Frontend
if systemctl is-active --quiet shelkovitsa-frontend; then
    log_success "Frontend сервис работает"
else
    log_error "Frontend сервис не работает"
    systemctl status shelkovitsa-frontend --no-pager
fi

# Проверка nginx
if systemctl is-active --quiet nginx; then
    log_success "Nginx работает"
else
    log_error "Nginx не работает"
    systemctl status nginx --no-pager
fi

# 14. Проверка портов
log_info "Шаг 14: Проверка портов"
netstat -tlnp | grep -E ':(8000|3000|80|443)' || log_warning "Некоторые порты не найдены"

# 15. Тест доступности
log_info "Шаг 15: Тест доступности"

# Тест Backend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health | grep -q "200"; then
    log_success "Backend API отвечает"
else
    log_warning "Backend API не отвечает на порту 8000"
fi

# Тест Frontend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    log_success "Frontend отвечает"
else
    log_warning "Frontend не отвечает на порту 3000"
fi

# Тест nginx
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    log_success "Nginx отвечает"
else
    log_warning "Nginx не отвечает на порту 80"
fi

echo ""
log_success "🎉 Развертывание завершено!"
echo ""
echo "📊 Полезные команды:"
echo "  systemctl status shelkovitsa-backend"
echo "  systemctl status shelkovitsa-frontend"
echo "  systemctl status nginx"
echo "  journalctl -u shelkovitsa-backend -f"
echo "  journalctl -u shelkovitsa-frontend -f"
echo "  tail -f /var/log/nginx/access.log"
echo ""
echo "🌐 Проверьте работу сайта:"
echo "  http://$DOMAIN (редирект на HTTPS)"
echo "  https://$DOMAIN"
echo ""
