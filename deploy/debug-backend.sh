#!/bin/bash
# Скрипт для диагностики проблем с Backend

set -e

echo "🔍 Диагностика Backend API"
echo "========================"

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

PROJECT_DIR="/var/www/shelkovitsa"

# 1. Проверка процессов
log_info "Шаг 1: Проверка процессов Node.js"
ps aux | grep node | grep -v grep || log_warning "Процессы Node.js не найдены"

# 2. Проверка портов
log_info "Шаг 2: Проверка портов"
netstat -tlnp | grep -E ':(8000|3000|80|443)' || log_warning "Порты не найдены"

# 3. Проверка Backend напрямую
log_info "Шаг 3: Проверка Backend на порту 8000"
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    log_success "Backend отвечает на порту 8000"
    curl -s http://localhost:8000/api/health | head -3
else
    log_error "Backend не отвечает на порту 8000"
fi

# 4. Проверка nginx
log_info "Шаг 4: Проверка nginx"
if systemctl is-active --quiet nginx; then
    log_success "Nginx работает"
else
    log_error "Nginx не работает"
    systemctl status nginx --no-pager
fi

# 5. Проверка API через nginx
log_info "Шаг 5: Проверка API через nginx"
if curl -s http://localhost/api/health > /dev/null 2>&1; then
    log_success "API доступен через nginx"
    curl -s http://localhost/api/health | head -3
else
    log_error "API недоступен через nginx"
fi

# 6. Проверка конкретных эндпоинтов
log_info "Шаг 6: Проверка конкретных эндпоинтов"

# product-category
if curl -s http://localhost/api/product-category > /dev/null 2>&1; then
    log_success "/api/product-category доступен"
else
    log_error "/api/product-category недоступен"
    curl -s http://localhost/api/product-category || true
fi

# product-size
if curl -s http://localhost/api/product-size > /dev/null 2>&1; then
    log_success "/api/product-size доступен"
else
    log_error "/api/product-size недоступен"
    curl -s http://localhost/api/product-size || true
fi

# product-color
if curl -s http://localhost/api/product-color > /dev/null 2>&1; then
    log_success "/api/product-color доступен"
else
    log_error "/api/product-color недоступен"
    curl -s http://localhost/api/product-color || true
fi

# 7. Проверка логов
log_info "Шаг 7: Проверка логов"
if [ -f /tmp/backend-temp.log ]; then
    log_info "Логи Backend:"
    tail -10 /tmp/backend-temp.log
else
    log_warning "Логи Backend не найдены"
fi

# 8. Проверка конфигурации nginx
log_info "Шаг 8: Проверка конфигурации nginx"
if nginx -t; then
    log_success "Конфигурация nginx корректна"
else
    log_error "Ошибка в конфигурации nginx"
    nginx -t
fi

# 9. Проверка systemd сервисов
log_info "Шаг 9: Проверка systemd сервисов"
if systemctl is-active --quiet shelkovitsa-backend; then
    log_success "Сервис shelkovitsa-backend работает"
else
    log_warning "Сервис shelkovitsa-backend не работает"
    systemctl status shelkovitsa-backend --no-pager
fi

if systemctl is-active --quiet shelkovitsa-frontend; then
    log_success "Сервис shelkovitsa-frontend работает"
else
    log_warning "Сервис shelkovitsa-frontend не работает"
    systemctl status shelkovitsa-frontend --no-pager
fi

echo ""
log_info "🎯 Рекомендации:"
echo "1. Если Backend не отвечает на порту 8000:"
echo "   cd $PROJECT_DIR/server && PORT=8000 node dist/main.js"
echo ""
echo "2. Если nginx не проксирует запросы:"
echo "   sudo systemctl restart nginx"
echo ""
echo "3. Если сервисы не работают:"
echo "   sudo systemctl restart shelkovitsa-backend"
echo "   sudo systemctl restart shelkovitsa-frontend"
