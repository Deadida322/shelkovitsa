#!/bin/bash
# Скрипт для сборки SSR приложения

echo "🚀 Сборка SSR приложения..."

# Устанавливаем зависимости
echo "📦 Установка зависимостей..."
npm ci

# Собираем приложение
echo "🔨 Сборка приложения..."
npm run build

# Проверяем результат
if [ -d ".output" ]; then
    echo "✅ SSR приложение успешно собрано в папке .output/"
    echo "📁 Размер папки .output:"
    du -sh .output/
    echo "📊 Структура сборки:"
    ls -la .output/
    
    # Проверяем наличие server файла
    if [ -f ".output/server/index.mjs" ]; then
        echo "✅ Server файл найден: .output/server/index.mjs"
    else
        echo "❌ Ошибка: server файл не найден"
        exit 1
    fi
else
    echo "❌ Ошибка: папка .output не найдена"
    exit 1
fi

echo "🎉 Готово! SSR приложение готово к развертыванию."
echo "💡 Для запуска используйте: node .output/server/index.mjs"
echo "💡 Или с PM2: pm2 start ecosystem.config.js"
