#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Получаем путь к корню проекта
grandParentDir=$(dirname "$(realpath $0)")/..

echo -e "\n${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Apply Migration Script               ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}🚀 Compiling application...${NC}"
echo -e "${GRAY}─────────────────────────────────────────${NC}"

# Переходим в корень проекта
cd "$grandParentDir" || exit 1

# Запускаем билд
if ! nest build; then
    echo -e "\n${RED}❌ Build failed! Migration application aborted.${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Compilation completed successfully!${NC}"
echo -e "\n${GREEN}📦 Applying migrations...${NC}"
echo -e "${GRAY}─────────────────────────────────────────${NC}"

# Применяем миграции
if ! npx typeorm-ts-node-esm migration:run -d "$grandParentDir/dist/db/datasource.js"; then
    echo -e "\n${RED}❌ Migration application failed!${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Migrations applied successfully!${NC}"
echo -e "\n${CYAN}✨ Done!${NC}\n"
