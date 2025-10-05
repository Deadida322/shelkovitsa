#!/bin/bash
# Скрипт для исправления конфликтов зависимостей Frontend

set -e

echo "🔧 Исправление конфликтов зависимостей Frontend"
echo "============================================="

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

PROJECT_DIR="/var/www/shelkovitsa"

log_info "Исправление конфликтов зависимостей для проекта Shelkovitsa"

# 1. Переход в директорию Frontend
log_info "Шаг 1: Переход в директорию Frontend"
cd $PROJECT_DIR/client

# 2. Очистка зависимостей
log_info "Шаг 2: Очистка зависимостей"
rm -rf node_modules package-lock.json
log_success "Зависимости очищены"

# 3. Создание .npmrc для решения конфликтов
log_info "Шаг 3: Создание .npmrc для решения конфликтов"
cat > .npmrc << 'EOF'
legacy-peer-deps=true
fund=false
audit=false
EOF
log_success ".npmrc создан"

# 4. Установка зависимостей
log_info "Шаг 4: Установка зависимостей"
npm install
log_success "Зависимости установлены"

# 5. Проверка установленных пакетов
log_info "Шаг 5: Проверка установленных пакетов"
npm list --depth=0 | head -10

# 6. Тест сборки
log_info "Шаг 6: Тест сборки Frontend"
if npm run build; then
    log_success "Frontend собран успешно"
else
    log_error "Ошибка сборки Frontend"
    log_info "Попробуйте следующие команды:"
    echo "  cd $PROJECT_DIR/client"
    echo "  rm -rf node_modules package-lock.json"
    echo "  npm install --legacy-peer-deps"
    echo "  npm run build"
    exit 1
fi

echo ""
log_success "🎉 Конфликты зависимостей исправлены!"
echo ""
echo "📊 Полезные команды:"
echo "  cd $PROJECT_DIR/client"
echo "  npm list --depth=0"
echo "  npm run build"
echo ""
echo "🔧 Если проблемы остались:"
echo "  rm -rf node_modules package-lock.json"
echo "  npm install --legacy-peer-deps"
echo "  npm run build"
