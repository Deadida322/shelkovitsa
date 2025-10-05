# Руководство по развертыванию SSR приложения

## 🎯 Обзор

Данное руководство описывает полный процесс развертывания Nuxt.js приложения в режиме SSR (Server-Side Rendering) с использованием Node.js сервера.

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Nuxt.js SSR   │    │   NestJS API   │
│   (Port 80/443) │───▶│   (Port 3000)   │───▶│   (Port 8000)  │
│   Reverse Proxy │    │   Node.js App   │    │   Backend API  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Предварительные требования

- Ubuntu 20.04+ или аналогичная Linux система
- Node.js 18+ 
- Nginx
- PM2 (опционально, для управления процессами)
- Git

## 🚀 Пошаговое развертывание

### Шаг 1: Подготовка сервера

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Устанавливаем Nginx
sudo apt install nginx -y

# Устанавливаем PM2 глобально
sudo npm install -g pm2

# Создаем директории
sudo mkdir -p /var/www/shelkovitsa
sudo mkdir -p /var/log/pm2
sudo chown -R www-data:www-data /var/www/shelkovitsa
```

### Шаг 2: Клонирование и настройка проекта

```bash
# Клонируем репозиторий
cd /var/www/shelkovitsa
sudo git clone <your-repo-url> .

# Устанавливаем зависимости
cd client
sudo npm ci

# Создаем переменные окружения
sudo nano .env.production
```

Содержимое `.env.production`:
```bash
NODE_ENV=production
NUXT_PUBLIC_API_BASE=https://your-domain.com/api
```

### Шаг 3: Сборка приложения

```bash
# Делаем скрипты исполняемыми
chmod +x scripts/*.sh

# Собираем приложение
./scripts/build-ssr.sh
```

### Шаг 4: Развертывание

```bash
# Развертываем приложение
./scripts/deploy-ssr.sh
```

### Шаг 5: Настройка Nginx

```bash
# Копируем конфигурацию Nginx
sudo cp deploy/nginx-ssr-optimized.conf /etc/nginx/nginx.conf

# Проверяем конфигурацию
sudo nginx -t

# Перезапускаем Nginx
sudo systemctl reload nginx
```

### Шаг 6: Проверка развертывания

```bash
# Проверяем статус сервисов
./scripts/monitor.sh

# Проверяем здоровье системы
./scripts/health-check.sh
```

## 🔧 Управление сервисами

### Основные команды

```bash
# Статус сервисов
sudo systemctl status nuxt-app
sudo systemctl status nginx

# Перезапуск сервисов
sudo systemctl restart nuxt-app
sudo systemctl restart nginx

# Включение автозапуска
sudo systemctl enable nuxt-app
sudo systemctl enable nginx

# Остановка сервисов
sudo systemctl stop nuxt-app
sudo systemctl stop nginx
```

### Мониторинг логов

```bash
# Логи Nuxt приложения
sudo journalctl -u nuxt-app -f

# Логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Все логи системы
sudo journalctl -f
```

## 📊 Мониторинг и диагностика

### Скрипты мониторинга

```bash
# Полный мониторинг
./scripts/monitor.sh

# Проверка здоровья
./scripts/health-check.sh

# Проверка портов
sudo netstat -tlnp | grep -E ':(8000|3000|80|443)'
```

### Ключевые метрики

- **Память**: Использование RAM для Node.js процессов
- **CPU**: Нагрузка на процессор
- **Диск**: Свободное место на диске
- **Сеть**: Активные соединения
- **Логи**: Ошибки и предупреждения

## 🔄 Обновление приложения

### Автоматическое обновление

```bash
# Полное обновление
./scripts/deploy-full-ssr.sh
```

### Ручное обновление

```bash
# 1. Обновляем код
git pull origin main

# 2. Устанавливаем зависимости
npm ci

# 3. Пересобираем приложение
./scripts/build-ssr.sh

# 4. Развертываем
./scripts/deploy-ssr.sh
```

## 🚨 Устранение неполадок

### Проблема: 502 Bad Gateway

**Причины:**
- Nuxt сервис не запущен
- Неправильная конфигурация Nginx
- Порт 3001 заблокирован

**Решение:**
```bash
# Проверяем статус Nuxt
sudo systemctl status nuxt-app

# Перезапускаем сервис
sudo systemctl restart nuxt-app

# Проверяем порт
sudo netstat -tlnp | grep 3000

# Проверяем логи
sudo journalctl -u nuxt-app -f
```

### Проблема: Медленная загрузка

**Причины:**
- Высокая нагрузка на сервер
- Недостаточно памяти
- Проблемы с базой данных

**Решение:**
```bash
# Проверяем использование ресурсов
./scripts/monitor.sh

# Оптимизируем Nginx
sudo nano /etc/nginx/nginx.conf

# Настраиваем кэширование
# Добавляем Redis для кэширования
```

### Проблема: Ошибки в логах

**Анализ логов:**
```bash
# Критические ошибки Nuxt
sudo journalctl -u nuxt-app --since "1 hour ago" | grep -i "error\|fatal"

# Ошибки Nginx
sudo tail -n 100 /var/log/nginx/error.log | grep -i "error"

# Системные ошибки
sudo dmesg | grep -i "error\|fail"
```

## 🔒 Безопасность

### Настройки безопасности

1. **Firewall:**
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

2. **SSL сертификаты:**
```bash
# Установка Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com
```

3. **Ограничения доступа:**
```bash
# Ограничение доступа к админке по IP
sudo nano /etc/nginx/nginx.conf
# Раскомментируйте блоки allow/deny для /admin
```

## 📈 Оптимизация производительности

### Настройки Node.js

```bash
# Увеличиваем лимит памяти
export NODE_OPTIONS="--max-old-space-size=2048"

# Настройки PM2
pm2 start ecosystem.config.js --env production
```

### Настройки Nginx

```bash
# Оптимизация worker процессов
worker_processes auto;
worker_connections 1024;

# Кэширование
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=nuxt_cache:10m;
```

### Мониторинг производительности

```bash
# Установка htop для мониторинга
sudo apt install htop

# Мониторинг в реальном времени
htop

# Анализ использования памяти
free -h
```

## 📝 Полезные команды

### Управление процессами

```bash
# Список процессов Node.js
ps aux | grep node

# Убить процесс по PID
sudo kill -9 <PID>

# Перезапуск всех Node.js процессов
sudo pkill -f node
```

### Резервное копирование

```bash
# Создание бэкапа
sudo tar -czf /var/backups/shelkovitsa-$(date +%Y%m%d).tar.gz /var/www/shelkovitsa/

# Восстановление из бэкапа
sudo tar -xzf /var/backups/shelkovitsa-YYYYMMDD.tar.gz -C /
```

### Очистка логов

```bash
# Очистка старых логов
sudo journalctl --vacuum-time=7d

# Ротация логов Nginx
sudo logrotate -f /etc/logrotate.d/nginx
```

## 🎯 Заключение

SSR режим обеспечивает:
- ✅ Отличный SEO
- ✅ Быструю загрузку
- ✅ Динамические данные
- ✅ Гибкость настройки

Следуйте данному руководству для успешного развертывания вашего SSR приложения!
