#!/bin/bash
# Скрипт для принудительной очистки кэша проекта Shelkovitsa

set -e

echo "🧹 Очистка кэша проекта Shelkovitsa"
echo "=================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
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

PROJECT_DIR="/var/www/shelkovitsa"

log_info "Начинаем очистку кэша"

# 1. Очистка кэша nginx
log_info "Шаг 1: Очистка кэша nginx"
rm -rf /var/cache/nginx/*
systemctl reload nginx
log_success "Кэш nginx очищен"

# 2. Очистка кэша Frontend
log_info "Шаг 2: Очистка кэша Frontend"
cd $PROJECT_DIR/client
rm -rf .nuxt .output node_modules/.cache
npm cache clean --force
log_success "Кэш Frontend очищен"

# 3. Очистка кэша Backend
log_info "Шаг 3: Очистка кэша Backend"
cd $PROJECT_DIR/server
rm -rf dist temp
npm cache clean --force
log_success "Кэш Backend очищен"

# 4. Перезапуск сервисов
log_info "Шаг 4: Перезапуск сервисов"
systemctl restart shelkovitsa-backend
systemctl restart shelkovitsa-frontend
systemctl restart nginx
log_success "Сервисы перезапущены"

# 5. Проверка статуса
log_info "Шаг 5: Проверка статуса сервисов"

if systemctl is-active --quiet shelkovitsa-backend; then
    log_success "Backend сервис работает"
else
    log_error "Backend сервис не работает"
fi

if systemctl is-active --quiet shelkovitsa-frontend; then
    log_success "Frontend сервис работает"
else
    log_error "Frontend сервис не работает"
fi

if systemctl is-active --quiet nginx; then
    log_success "Nginx работает"
else
    log_error "Nginx не работает"
fi

echo ""
log_success "🎉 Очистка кэша завершена!"
echo ""
echo "📊 Полезные команды для проверки:"
echo "  systemctl status shelkovitsa-backend"
echo "  systemctl status shelkovitsa-frontend"
echo "  systemctl status nginx"
echo "  journalctl -u shelkovitsa-backend -f"
echo "  journalctl -u shelkovitsa-frontend -f"
echo ""
