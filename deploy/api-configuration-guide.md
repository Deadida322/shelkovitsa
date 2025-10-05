# Руководство по настройке API для Nuxt.js SSR

## 🔧 Конфигурация API

### Архитектура маршрутизации

```
Пользователь → Nginx → Nuxt.js SSR → NestJS API
    ↓           ↓         ↓            ↓
  /api/*    /api/*    /api/*      /api/*
```

### 📋 Настройка переменных окружения

#### В Nuxt.js приложении:
```bash
# .env.production
NODE_ENV=production
NUXT_PUBLIC_API_BASE=https://your-domain.com
PORT=3000
```

**Важно**: Не добавляйте `/api` в `NUXT_PUBLIC_API_BASE`!

#### В nginx конфигурации:
```nginx
# Все запросы /api/* проксируются к NestJS
location /api/ {
    proxy_pass http://api_backend;  # NestJS на порту 8000
}
```

### 🔄 Поток запросов

#### 1. Запрос от пользователя:
```
GET https://your-domain.com/api/products
```

#### 2. Nginx маршрутизация:
```
/api/products → http://127.0.0.1:8000/api/products
```

#### 3. Nuxt.js SSR запросы к API:
```javascript
// В Nuxt.js коде
const { data } = await $fetch('/api/products')
// Nginx автоматически добавит /api префикс
```

### 📁 Структура файлов

```
client/
├── .env.production          # Переменные окружения
├── nuxt.config.ts          # Конфигурация Nuxt
└── composables/
    └── api.js              # API клиент

deploy/
├── nginx.conf              # Nginx конфигурация
└── nginx-http-only.conf    # HTTP-only конфигурация
```

### 🔧 Пример API клиента для Nuxt.js

```javascript
// composables/api.js
export const useApi = () => {
  const config = useRuntimeConfig()
  
  const api = $fetch.create({
    baseURL: config.public.apiBase, // Без /api префикса
    onRequest({ request, options }) {
      // Добавляем /api префикс для запросов
      if (!request.toString().startsWith('/api/')) {
        options.baseURL = config.public.apiBase + '/api'
      }
    }
  })
  
  return { api }
}
```

### 🚀 Использование в компонентах

```vue
<script setup>
const { api } = useApi()

// Запрос к API
const { data: products } = await api('/products')
// Nginx автоматически направит на /api/products
</script>
```

### 🔍 Проверка конфигурации

#### 1. Проверка nginx:
```bash
sudo nginx -t
curl -I http://localhost/api/health
```

#### 2. Проверка Nuxt.js:
```bash
curl -I http://localhost:3000
```

#### 3. Проверка NestJS:
```bash
curl -I http://localhost:8000/api/health
```

### ⚠️ Частые ошибки

#### ❌ Неправильно:
```bash
NUXT_PUBLIC_API_BASE=https://your-domain.com/api
```

#### ✅ Правильно:
```bash
NUXT_PUBLIC_API_BASE=https://your-domain.com
```

### 🔧 Отладка

#### Логи nginx:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### Логи Nuxt.js:
```bash
sudo journalctl -u nuxt-app -f
```

#### Логи NestJS:
```bash
sudo journalctl -u nestjs-app -f
```

### 📊 Мониторинг API

```bash
# Проверка всех сервисов
./scripts/monitor.sh

# Проверка здоровья
./scripts/health-check.sh

# Проверка портов
sudo netstat -tlnp | grep -E ':(8000|3000|80|443)'
```

## 🎯 Заключение

- **Nginx** добавляет `/api` префикс автоматически
- **Nuxt.js** использует базовый URL без `/api`
- **NestJS** получает запросы с `/api` префиксом
- Все работает через nginx reverse proxy
