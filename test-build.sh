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

# Временный запуск Backend для Frontend
echo "🚀 Временный запуск Backend для Frontend..."
PORT=8000 nohup node dist/main.js > /tmp/backend-test.log 2>&1 &
BACKEND_PID=$!
echo "Backend запущен с PID: $BACKEND_PID"

# Ждем запуска Backend
echo "⏳ Ожидание запуска Backend..."
sleep 10

# Проверяем, что Backend отвечает
for i in {1..30}; do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "✅ Backend готов к работе"
        break
    fi
    echo "⏳ Ожидание Backend... ($i/30)"
    sleep 2
done

# Проверка Frontend сборки (с работающим Backend)
echo "📦 Сборка Frontend (Backend должен быть запущен)..."
cd ../client
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend собран успешно"
else
    echo "❌ Ошибка сборки Frontend"
    # Останавливаем Backend перед выходом
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Остановка временного Backend
echo "🛑 Остановка временного Backend..."
kill $BACKEND_PID 2>/dev/null || echo "⚠️ Backend процесс уже остановлен"

echo "🎉 Все сборки прошли успешно!"
