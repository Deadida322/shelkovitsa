#!/bin/bash
# Скрипт для исправления проблем с директориями Backend

set -e

echo "🔧 Исправление проблем с директориями Backend"
echo "=========================================="

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

log_info "Исправление проблем с директориями для проекта Shelkovitsa"

# 1. Создание всех необходимых директорий
log_info "Шаг 1: Создание всех необходимых директорий"

# Основные директории проекта
mkdir -p $PROJECT_DIR/server/temp/src
mkdir -p $PROJECT_DIR/server/temp/dest
mkdir -p $PROJECT_DIR/server/docs
mkdir -p $PROJECT_DIR/server/static
mkdir -p $PROJECT_DIR/server/logs
mkdir -p $PROJECT_DIR/client/logs

# Директории для npm
mkdir -p /root/.npm
mkdir -p /home/www-data/.npm

# Директории для nginx
mkdir -p /var/log/nginx
mkdir -p /var/cache/nginx

log_success "Директории созданы"

# 2. Настройка прав доступа
log_info "Шаг 2: Настройка прав доступа"

# Права для проекта
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# Права для npm кэша
chown -R root:root /root/.npm
chown -R www-data:www-data /home/www-data/.npm

# Права для nginx
chown -R www-data:www-data /var/log/nginx
chown -R www-data:www-data /var/cache/nginx

log_success "Права доступа настроены"

# 3. Проверка переменных окружения
log_info "Шаг 3: Проверка переменных окружения"

# Проверяем, есть ли .env файл
if [ -f "$PROJECT_DIR/server/.env" ]; then
    log_success "Файл .env найден"
    # Показываем TEMP_PATH и DEST_PATH
    if grep -q "TEMP_PATH" $PROJECT_DIR/server/.env; then
        TEMP_PATH=$(grep "TEMP_PATH" $PROJECT_DIR/server/.env | cut -d '=' -f2)
        log_info "TEMP_PATH: $TEMP_PATH"
    else
        log_warning "TEMP_PATH не найден в .env"
    fi
    
    if grep -q "DEST_PATH" $PROJECT_DIR/server/.env; then
        DEST_PATH=$(grep "DEST_PATH" $PROJECT_DIR/server/.env | cut -d '=' -f2)
        log_info "DEST_PATH: $DEST_PATH"
    else
        log_warning "DEST_PATH не найден в .env"
    fi
else
    log_warning "Файл .env не найден, создаем базовый"
    cat > $PROJECT_DIR/server/.env << EOF
NODE_ENV=production
PORT=8000
TEMP_PATH=temp/src
DEST_PATH=temp/dest
EOF
    chown www-data:www-data $PROJECT_DIR/server/.env
    log_success "Базовый .env файл создан"
fi

# 4. Создание директорий согласно переменным окружения
log_info "Шаг 4: Создание директорий согласно переменным окружения"

cd $PROJECT_DIR/server

# Создаем директории согласно TEMP_PATH и DEST_PATH
if [ -f ".env" ]; then
    TEMP_PATH=$(grep "TEMP_PATH" .env | cut -d '=' -f2)
    DEST_PATH=$(grep "DEST_PATH" .env | cut -d '=' -f2)
    
    if [ ! -z "$TEMP_PATH" ]; then
        mkdir -p "$TEMP_PATH"
        chown -R www-data:www-data "$TEMP_PATH"
        chmod -R 755 "$TEMP_PATH"
        log_success "Директория $TEMP_PATH создана"
    fi
    
    if [ ! -z "$DEST_PATH" ]; then
        mkdir -p "$DEST_PATH"
        chown -R www-data:www-data "$DEST_PATH"
        chmod -R 755 "$DEST_PATH"
        log_success "Директория $DEST_PATH создана"
    fi
fi

# 5. Проверка структуры директорий
log_info "Шаг 5: Проверка структуры директорий"

echo "Структура директорий проекта:"
tree $PROJECT_DIR/server -d -L 3 || ls -la $PROJECT_DIR/server

# 6. Тест создания файлов
log_info "Шаг 6: Тест создания файлов"

# Тестируем создание файла в temp/src
if touch $PROJECT_DIR/server/temp/src/test.txt 2>/dev/null; then
    log_success "Можно создавать файлы в temp/src"
    rm -f $PROJECT_DIR/server/temp/src/test.txt
else
    log_error "Не удается создавать файлы в temp/src"
fi

# Тестируем создание файла в temp/dest
if touch $PROJECT_DIR/server/temp/dest/test.txt 2>/dev/null; then
    log_success "Можно создавать файлы в temp/dest"
    rm -f $PROJECT_DIR/server/temp/dest/test.txt
else
    log_error "Не удается создавать файлы в temp/dest"
fi

echo ""
log_success "🎉 Проблемы с директориями исправлены!"
echo ""
echo "📊 Полезные команды:"
echo "  ls -la $PROJECT_DIR/server/temp/"
echo "  ls -la $PROJECT_DIR/server/docs/"
echo "  ls -la $PROJECT_DIR/server/static/"
echo ""
echo "🚀 Теперь можно запустить Backend:"
echo "  cd $PROJECT_DIR/server && PORT=8000 node dist/main.js"
echo ""
echo "🔧 Для диагностики:"
echo "  sudo ./deploy/debug-backend.sh"
