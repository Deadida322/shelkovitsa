# Развертывание проекта Shelkovitsa

## 🎯 Обзор проекта

**Shelkovitsa** - интернет-магазин нижнего белья с современной архитектурой:

- **Backend**: NestJS API на порту 8000
- **Frontend**: Nuxt.js на порту 3000 (гибридный режим)
- **Домен**: shelkovitsa.ru
- **Веб-сервер**: Nginx с SSL

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Nuxt.js       │    │   NestJS API   │
│   (Port 80/443) │───▶│   (Port 3000)   │───▶│   (Port 8000)  │
│   Reverse Proxy │    │   Hybrid Mode   │    │   Backend API  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Предварительные требования

- Ubuntu 20.04+ или аналогичная Linux система
- Node.js 18+
- Nginx
- Git
- SSL сертификаты (Let's Encrypt)

## 🚀 Быстрое развертывание

### 1. Клонирование репозитория
```bash
sudo mkdir -p /var/www/shelkovitsa
cd /var/www/shelkovitsa
sudo git clone <your-repo-url> .
sudo chown -R www-data:www-data /var/www/shelkovitsa
```

### 2. Установка зависимостей
```bash
# Backend
cd /var/www/shelkovitsa/server
sudo npm ci --production

# Frontend
cd /var/www/shelkovitsa/client
sudo npm ci
```

### 3. Настройка SSL сертификатов
```bash
# Установка certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Получение SSL сертификатов
sudo certbot --nginx -d shelkovitsa.ru -d www.shelkovitsa.ru
```

### 4. Развертывание
```bash
cd /var/www/shelkovitsa
sudo chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh
```

**⚠️ Важно**: Frontend зависит от Backend API во время сборки. Скрипт автоматически:
1. Собирает Backend
2. **Настраивает nginx с SSL сертификатами**
3. Запускает Backend
4. Собирает Frontend (с доступным API через nginx)
5. Останавливает временный Backend
6. Запускает финальные сервисы

## 🔧 Ручное развертывание

### Backend (NestJS)

1. **Сборка**:
```bash
cd /var/www/shelkovitsa/server
npm run build
```

2. **Systemd сервис**:
```bash
sudo systemctl enable shelkovitsa-backend
sudo systemctl start shelkovitsa-backend
```

### Frontend (Nuxt.js)

**⚠️ Важно**: Frontend требует работающий Backend API через nginx для сборки!

1. **Настройка nginx** (обязательно):
```bash
sudo cp /var/www/shelkovitsa/deploy/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl reload nginx
```

2. **Запуск Backend** (обязательно):
```bash
cd /var/www/shelkovitsa/server
PORT=8000 node dist/main.js &
```

3. **Сборка Frontend**:
```bash
cd /var/www/shelkovitsa/client
npm run build
```

4. **Systemd сервис**:
```bash
sudo systemctl enable shelkovitsa-frontend
sudo systemctl start shelkovitsa-frontend
```

### Nginx

1. **Конфигурация**:
```bash
sudo cp /var/www/shelkovitsa/deploy/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 Мониторинг

### Проверка статуса сервисов
```bash
sudo systemctl status shelkovitsa-backend
sudo systemctl status shelkovitsa-frontend
sudo systemctl status nginx
```

### Логи
```bash
# Backend логи
sudo journalctl -u shelkovitsa-backend -f

# Frontend логи
sudo journalctl -u shelkovitsa-frontend -f

# Nginx логи
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Проверка портов
```bash
sudo netstat -tlnp | grep -E ':(8000|3000|80|443)'
```

## 🔄 Обновление

### Автоматическое обновление
```bash
cd /var/www/shelkovitsa
sudo ./deploy/deploy.sh
```

### Ручное обновление
```bash
# 1. Обновление кода
cd /var/www/shelkovitsa
sudo git pull origin main

# 2. Пересборка
cd server && npm run build
cd ../client && npm run build

# 3. Перезапуск сервисов
sudo systemctl restart shelkovitsa-backend
sudo systemctl restart shelkovitsa-frontend
```

## 🚨 Устранение неполадок

### Проблема: 502 Bad Gateway
```bash
# Проверьте статус сервисов
sudo systemctl status shelkovitsa-backend
sudo systemctl status shelkovitsa-frontend

# Перезапустите сервисы
sudo systemctl restart shelkovitsa-backend
sudo systemctl restart shelkovitsa-frontend
```

### Проблема: SSL сертификаты
```bash
# Проверьте сертификаты
sudo certbot certificates

# Обновите сертификаты
sudo certbot renew
```

### Проблема: Права доступа
```bash
# Исправьте права
sudo chown -R www-data:www-data /var/www/shelkovitsa
sudo chmod -R 755 /var/www/shelkovitsa
```

## 🔒 Безопасность

### Firewall
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### SSL настройки
- Автоматический редирект HTTP → HTTPS
- HSTS заголовки
- Современные SSL протоколы

## 📈 Производительность

### Кэширование
- **Главная страница**: 30 минут (популярные товары)
- **Каталог**: 30 минут - 1 час
- **Контакты**: 1 год (статические)
- **Доставка**: 2 часа
- **Админка**: без кэширования

### Оптимизация
- Gzip сжатие
- HTTP/2
- Keep-alive соединения
- Rate limiting

## 🎯 Режимы работы Frontend

### ISR страницы (обновляемые)
- `/` - главная (30 мин, популярные товары)
- `/catalog` - каталог (30 мин)
- `/catalog/**` - товары (1 час)
- `/deliver` - доставка (2 часа)

### Статические страницы (максимальная производительность)
- `/contacts` - контакты (1 год)

### SPA страницы (динамические)
- `/admin` - админка
- `/signin` - авторизация
- `/signup` - регистрация
- `/recover` - восстановление

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи сервисов
2. Проверьте статус портов
3. Проверьте конфигурацию nginx
4. Обратитесь к разделу "Устранение неполадок"
