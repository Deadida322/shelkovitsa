#!/bin/bash
# Скрипт для исправления проблем с правами доступа

set -e

echo "🔧 Исправление проблем с правами доступа"
echo "====================================="

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

log_info "Исправление прав доступа для проекта Shelkovitsa"

# 1. Создание директорий для npm и Backend
log_info "Шаг 1: Создание директорий для npm и Backend"
mkdir -p /root/.npm
mkdir -p /home/www-data/.npm
mkdir -p $PROJECT_DIR/server/node_modules
mkdir -p $PROJECT_DIR/client/node_modules

# Создаем необходимые директории для Backend
mkdir -p $PROJECT_DIR/server/temp/src
mkdir -p $PROJECT_DIR/server/temp/dest
mkdir -p $PROJECT_DIR/server/docs
mkdir -p $PROJECT_DIR/server/static
mkdir -p $PROJECT_DIR/server/logs
mkdir -p $PROJECT_DIR/client/logs
log_success "Директории созданы"

# 2. Настройка прав доступа
log_info "Шаг 2: Настройка прав доступа"
chown -R root:root /root/.npm
chown -R www-data:www-data /home/www-data/.npm
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# Дополнительные права для Backend директорий
chown -R www-data:www-data $PROJECT_DIR/server/temp
chown -R www-data:www-data $PROJECT_DIR/server/docs
chown -R www-data:www-data $PROJECT_DIR/server/static
chown -R www-data:www-data $PROJECT_DIR/server/logs
chown -R www-data:www-data $PROJECT_DIR/client/logs
chmod -R 755 $PROJECT_DIR/server/temp
chmod -R 755 $PROJECT_DIR/server/docs
chmod -R 755 $PROJECT_DIR/server/static
chmod -R 755 $PROJECT_DIR/server/logs
chmod -R 755 $PROJECT_DIR/client/logs
log_success "Права доступа настроены"

# 3. Очистка npm кэша
log_info "Шаг 3: Очистка npm кэша"
npm cache clean --force
log_success "npm кэш очищен"

# 4. Установка зависимостей Backend
log_info "Шаг 4: Установка зависимостей Backend"
cd $PROJECT_DIR/server
rm -rf node_modules package-lock.json
npm install --omit=dev
log_success "Зависимости Backend установлены"

# 5. Установка зависимостей Frontend
log_info "Шаг 5: Установка зависимостей Frontend"
cd $PROJECT_DIR/client
rm -rf node_modules package-lock.json
# Устанавливаем зависимости с legacy-peer-deps для решения конфликтов
npm install --legacy-peer-deps
log_success "Зависимости Frontend установлены"

# 6. Финальная настройка прав
log_info "Шаг 6: Финальная настройка прав"
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
log_success "Права доступа окончательно настроены"

echo ""
log_success "🎉 Проблемы с правами доступа исправлены!"
echo ""
echo "📊 Полезные команды:"
echo "  ls -la $PROJECT_DIR"
echo "  ls -la $PROJECT_DIR/server/node_modules"
echo "  ls -la $PROJECT_DIR/client/node_modules"
echo ""
echo "🚀 Теперь можно запустить основной скрипт развертывания:"
echo "  sudo ./deploy/deploy.sh"
