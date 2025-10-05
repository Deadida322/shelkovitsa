# Зависимости сборки проекта Shelkovitsa

## 🔗 Критическая зависимость: Frontend → Backend

### ⚠️ Важное замечание

**Frontend (Nuxt.js) требует работающий Backend API во время сборки!**

Это означает, что для корректной сборки Frontend необходимо:

1. ✅ **Сначала собрать Backend**
2. ✅ **Запустить Backend на порту 8000**
3. ✅ **Только потом собирать Frontend**
4. ✅ **Остановить временный Backend**

## 🚫 Неправильный порядок сборки

```bash
# ❌ НЕПРАВИЛЬНО - Frontend не соберется
cd client
npm run build  # Ошибка: API недоступен
```

## ✅ Правильный порядок сборки

### Автоматический (рекомендуется)
```bash
# Используйте скрипт развертывания
sudo ./deploy/deploy.sh
```

### Ручной порядок
```bash
# 1. Сборка Backend
cd server
npm run build

# 2. Временный запуск Backend
PORT=8000 node dist/main.js &
BACKEND_PID=$!

# 3. Ожидание запуска Backend
sleep 10

# 4. Проверка доступности API
curl http://localhost:8000/api/health

# 5. Сборка Frontend
cd ../client
npm run build

# 6. Остановка временного Backend
kill $BACKEND_PID
```

## 🔍 Почему Frontend зависит от Backend?

### 1. **API вызовы во время сборки**
- Nuxt.js делает запросы к API для генерации статических страниц
- ISR (Incremental Static Regeneration) требует доступный API
- Prerendering страниц нуждается в данных из Backend

### 2. **Генерация метаданных**
- SEO метатеги генерируются на основе данных API
- Open Graph теги требуют актуальных данных
- Структурированные данные (JSON-LD) извлекаются из API

### 3. **Статическая генерация**
- Страницы каталога генерируются с данными товаров
- Главная страница с популярными товарами
- Страницы доставки с актуальной информацией

## 🛠️ Решения для разработки

### Локальная разработка
```bash
# Терминал 1: Backend
cd server
npm run start:dev

# Терминал 2: Frontend
cd client
npm run dev
```

### Тестирование сборки
```bash
# Используйте тестовый скрипт
chmod +x test-build.sh
./test-build.sh
```

### CI/CD пайплайн
```yaml
# Пример для GitHub Actions
- name: Build Backend
  run: |
    cd server
    npm run build
    
- name: Start Backend
  run: |
    cd server
    PORT=8000 node dist/main.js &
    sleep 10
    
- name: Build Frontend
  run: |
    cd client
    npm run build
    
- name: Stop Backend
  run: pkill -f "node dist/main.js"
```

## 🚨 Частые ошибки

### Ошибка: "API недоступен"
```
Error: connect ECONNREFUSED 127.0.0.1:8000
```
**Решение**: Запустите Backend перед сборкой Frontend

### Ошибка: "Timeout при запросе к API"
```
Error: Request timeout
```
**Решение**: Увеличьте время ожидания или проверьте, что Backend запустился

### Ошибка: "404 Not Found"
```
Error: 404 - /api/health
```
**Решение**: Проверьте, что Backend запущен на правильном порту (8000)

## 📊 Мониторинг зависимостей

### Проверка доступности API
```bash
# Проверка здоровья API
curl http://localhost:8000/api/health

# Проверка конкретного эндпоинта
curl http://localhost:8000/api/products
```

### Логи Backend
```bash
# Просмотр логов Backend
sudo journalctl -u shelkovitsa-backend -f
```

### Логи Frontend сборки
```bash
# Просмотр логов сборки
npm run build 2>&1 | tee build.log
```

## 🎯 Рекомендации

### Для разработки
1. **Всегда запускайте Backend первым**
2. **Используйте `npm run dev` для обеих частей**
3. **Проверяйте доступность API перед сборкой**

### Для продакшена
1. **Используйте автоматический скрипт развертывания**
2. **Не собирайте Frontend без Backend**
3. **Мониторьте логи сборки**

### Для CI/CD
1. **Добавьте проверки доступности API**
2. **Используйте health checks**
3. **Настройте правильный порядок сборки**

## 🔧 Устранение проблем

### Backend не запускается
```bash
# Проверьте порт
netstat -tlnp | grep :8000

# Проверьте логи
cd server
node dist/main.js
```

### Frontend не собирается
```bash
# Проверьте доступность API
curl http://localhost:8000/api/health

# Проверьте переменные окружения
echo $NUXT_PUBLIC_API_BASE
```

### Проблемы с портами
```bash
# Освободите порт 8000
sudo lsof -ti:8000 | xargs kill -9

# Проверьте, что порт свободен
netstat -tlnp | grep :8000
```
