# Архитектура SSR приложения Shelkovitsa

## 🏗️ Схема развертывания

```
┌─────────────────────────────────────────────────────────────────┐
│                        Пользователь                             │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS/HTTP
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Nginx                                   │
│                    (Port 80/443)                               │
│              Reverse Proxy + Load Balancer                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ├─── /api/* ────┐
                      │               ▼
                      │    ┌─────────────────┐
                      │    │   NestJS API   │
                      │    │   (Port 8000)  │
                      │    │   Backend API  │
                      │    └─────────────────┘
                      │
                      └─── /* ──────────┐
                                      ▼
                          ┌─────────────────┐
                          │   Nuxt.js SSR   │
                          │   (Port 3000)   │
                          │   Frontend App  │
                          └─────────────────┘
```

## 🔄 Поток запросов

### 1. Статические файлы
```
Пользователь → Nginx → Статические файлы (CSS, JS, изображения)
```

### 2. API запросы
```
Пользователь → Nginx → NestJS API (Port 8000) → База данных
```

### 3. SSR страницы
```
Пользователь → Nginx → Nuxt.js SSR (Port 3000) → NestJS API (Port 8000)
```

## 📊 Порты и сервисы

| Сервис | Порт | Назначение | Протокол |
|--------|------|------------|----------|
| Nginx | 80 | HTTP | HTTP |
| Nginx | 443 | HTTPS | HTTPS |
| NestJS API | 8000 | Backend API | HTTP |
| Nuxt.js SSR | 3000 | Frontend SSR | HTTP |

## 🔧 Конфигурация маршрутизации

### Nginx маршруты:
- `/api/*` → `http://127.0.0.1:8000` (NestJS API)
- `/static/*` → `http://127.0.0.1:8000` (Статические файлы API)
- `/*` → `http://127.0.0.1:3000` (Nuxt.js SSR)

### Nuxt.js маршруты:
- `/` → SSR (главная страница)
- `/catalog` → SSR (каталог товаров)
- `/catalog/**` → SSR (страницы товаров)
- `/contacts` → SSR (контакты)
- `/deliver` → SSR (доставка)
- `/admin` → SPA (админ-панель)
- `/signin` → SPA (авторизация)
- `/signup` → SPA (регистрация)

## 🚀 Процесс развертывания

### 1. Сборка
```bash
cd client
npm run build
# Создается папка .output/ с SSR приложением
```

### 2. Развертывание
```bash
# Копирование файлов
sudo cp -r .output/* /var/www/shelkovitsa/client/

# Настройка сервисов
sudo systemctl enable nuxt-app
sudo systemctl start nuxt-app
```

### 3. Мониторинг
```bash
# Статус сервисов
sudo systemctl status nuxt-app
sudo systemctl status nginx

# Проверка портов
sudo netstat -tlnp | grep -E ':(8000|3000|80|443)'
```

## 🔍 Диагностика

### Проверка доступности:
- **NestJS API**: `http://localhost:8000/api`
- **Nuxt.js SSR**: `http://localhost:3000`
- **Nginx**: `http://localhost` или `https://your-domain.com`

### Логи:
- **Nuxt.js**: `sudo journalctl -u nuxt-app -f`
- **Nginx**: `sudo tail -f /var/log/nginx/access.log`
- **Nginx Errors**: `sudo tail -f /var/log/nginx/error.log`

## 🛡️ Безопасность

### Firewall правила:
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 3000   # Блокируем прямой доступ к Nuxt
sudo ufw deny 8000   # Блокируем прямой доступ к API
```

### Rate Limiting:
- API: 10 запросов/сек
- Login: 5 запросов/мин
- Frontend: 20 запросов/сек

## 📈 Производительность

### Кэширование:
- **Статические файлы**: 1 год
- **SSR страницы**: SWR с настраиваемыми интервалами
- **API ответы**: Зависит от endpoint

### Оптимизация:
- Gzip сжатие
- HTTP/2
- Keep-alive соединения
- Worker процессы Nginx
