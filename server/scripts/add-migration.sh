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
echo -e "${CYAN}║   Add Migration Script                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}\n"

# Запрашиваем имя миграции
echo -e "${YELLOW}📝 Enter migration name:${NC} "
read NAME

if [ -z "$NAME" ]; then
    echo -e "\n${RED}❌ Error: Migration name cannot be empty!${NC}"
    exit 1
fi

echo -e "${GRAY}   Migration name: ${NC}${NAME}"

echo -e "\n${GREEN}🚀 Compiling application...${NC}"
echo -e "${GRAY}─────────────────────────────────────────${NC}"

# Переходим в корень проекта
cd "$grandParentDir" || exit 1

# Запускаем билд
if ! nest build; then
    echo -e "\n${RED}❌ Build failed! Migration generation aborted.${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Compilation completed successfully!${NC}"
echo -e "\n${GREEN}📦 Generating migration...${NC}"
echo -e "${GRAY}─────────────────────────────────────────${NC}"

# Генерируем миграцию
if ! npx typeorm-ts-node-esm migration:generate "$grandParentDir/src/db/migrations/$NAME" -d "$grandParentDir/dist/db/datasource.js"; then
    echo -e "\n${RED}❌ Migration generation failed!${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Migration '$NAME' generated successfully!${NC}"
echo -e "${GRAY}   Location: $grandParentDir/src/db/migrations/$NAME${NC}"
echo -e "\n${CYAN}✨ Done!${NC}\n"
