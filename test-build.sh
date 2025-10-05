#!/bin/bash
# Тестовый скрипт для проверки сборки

echo "🔨 Тестирование сборки проекта Shelkovitsa"

# Проверка Backend сборки
echo "📦 Сборка Backend..."
cd server
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Backend собран успешно"
else
    echo "❌ Ошибка сборки Backend"
    exit 1
fi

# Проверка Frontend сборки
echo "📦 Сборка Frontend..."
cd ../client
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend собран успешно"
else
    echo "❌ Ошибка сборки Frontend"
    exit 1
fi

echo "🎉 Все сборки прошли успешно!"
