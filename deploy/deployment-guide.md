# Руководство по развертыванию проекта Shelkovitsa с nginx

## Обзор проекта

Проект состоит из двух частей:
- **Серверная часть**: NestJS API (порт 3000)
- **Клиентская часть**: Nuxt.js SPA (порт 3001 для SSR или статические файлы)

## Структура файлов nginx

- `nginx.conf` - основная конфигурация nginx
- `nginx-env.conf` - переменные окружения и настройки для разных сред
- `deployment-guide.md` - данное руководство

## Установка и настройка

### 1. Установка nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
# или
sudo dnf install nginx
```

### 2. Копирование конфигурации

```bash
# Скопируйте основные файлы
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo cp nginx-env.conf /etc/nginx/conf.d/

# Проверьте конфигурацию
sudo nginx -t

# Перезапустите nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 3. Настройка SSL сертификатов

#### Получение Let's Encrypt сертификата:

```bash
# Установка certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d shelkovitsa.ru -d www.shelkovitsa.ru

# Автоматическое обновление
sudo crontab -e
# Добавьте строку:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Ручная настройка SSL:

```bash
# Создайте директории для сертификатов
sudo mkdir -p /etc/ssl/certs /etc/ssl/private

# Скопируйте ваши сертификаты
sudo cp your-cert.crt /etc/ssl/certs/shelkovitsa.ru.crt
sudo cp your-key.key /etc/ssl/private/shelkovitsa.ru.key

# Установите правильные права доступа
sudo chmod 644 /etc/ssl/certs/shelkovitsa.ru.crt
sudo chmod 600 /etc/ssl/private/shelkovitsa.ru.key
```

### 4. Настройка директорий

```bash
# Создайте директорию для статических файлов
sudo mkdir -p /var/www/shelkovitsa/client/dist

# Установите права доступа
sudo chown -R www-data:www-data /var/www/shelkovitsa
sudo chmod -R 755 /var/www/shelkovitsa
```

### 5. Настройка переменных окружения

#### Для серверной части (NestJS):

Создайте файл `.env` в директории `server/`:

```env
# Основные настройки
PORT=3000
NODE_ENV=production

# База данных
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=shelkovitsa_db

# JWT настройки
JWT_PRIVATE_KEY=your_private_key
JWT_PRIVATE_EXP=7d
JWT_PUBLIC_KEY=your_public_key
JWT_PUBLIC_EXP=1d

# CORS настройки
CORS=https://shelkovitsa.ru,https://www.shelkovitsa.ru

# Пути для файлов
TEMP_PATH=./temp/src
DEST_PATH=./temp/dist

# Telegram настройки (опционально)
TELEGRAM_TOKEN=your_telegram_token
ADMIN_TG_ID=your_admin_telegram_id
CHAT_TG_ID=your_chat_telegram_id
```

#### Для клиентской части (Nuxt.js):

Создайте файл `.env.production` в директории `client/`:

```env
# API базовый URL
BASE_URL=https://shelkovitsa.ru/api

# Другие настройки
NUXT_PUBLIC_API_BASE=https://shelkovitsa.ru/api
```

### 6. Сборка и запуск приложений

#### Серверная часть:

```bash
cd server

# Установка зависимостей
npm install

# Сборка проекта
npm run build

# Запуск в продакшене
npm run start:prod
```

#### Клиентская часть:

```bash
cd client

# Установка зависимостей
npm install

# Сборка для статического хостинга
npm run generate

# Копирование собранных файлов в nginx директорию
sudo cp -r dist/* /var/www/shelkovitsa/client/dist/
```

### 7. Настройка systemd сервисов

#### Для API сервера:

Создайте файл `/etc/systemd/system/shelkovitsa-api.service`:

```ini
[Unit]
Description=Shelkovitsa API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/your/project/server
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Включите и запустите сервис
sudo systemctl daemon-reload
sudo systemctl enable shelkovitsa-api
sudo systemctl start shelkovitsa-api
```

### 8. Мониторинг и логи

```bash
# Просмотр логов nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Просмотр логов API
sudo journalctl -u shelkovitsa-api -f

# Проверка статуса сервисов
sudo systemctl status nginx
sudo systemctl status shelkovitsa-api
```

## Дополнительные настройки

### Настройка кэширования

Для улучшения производительности можно настроить Redis для кэширования:

```bash
# Установка Redis
sudo apt install redis-server

# Настройка в nginx.conf
# Добавьте upstream для Redis в секцию http
upstream redis {
    server 127.0.0.1:6379;
}
```

### Настройка мониторинга

Рекомендуется настроить мониторинг с помощью:

- **Prometheus + Grafana** для метрик
- **ELK Stack** для логов
- **Uptime monitoring** для проверки доступности

### Бэкапы

Настройте автоматические бэкапы:

```bash
# Создайте скрипт бэкапа
sudo nano /usr/local/bin/backup-shelkovitsa.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/shelkovitsa"
mkdir -p $BACKUP_DIR

# Бэкап базы данных
pg_dump shelkovitsa_db > $BACKUP_DIR/db_$DATE.sql

# Бэкап статических файлов
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/shelkovitsa

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# Добавьте в crontab
sudo crontab -e
# 0 2 * * * /usr/local/bin/backup-shelkovitsa.sh
```

## Безопасность

### Firewall настройки

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# iptables (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Дополнительные заголовки безопасности

В nginx.conf уже включены основные заголовки безопасности. Для дополнительной защиты можно добавить:

```nginx
# В секцию server добавить:
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self';" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

## Производительность

### Оптимизация nginx

- Настройте `worker_processes` равным количеству CPU ядер
- Увеличьте `worker_connections` при необходимости
- Настройте кэширование для статических файлов
- Используйте HTTP/2 (уже включен в конфигурации)

### Оптимизация приложений

- Используйте PM2 для управления Node.js процессами
- Настройте кластеризацию для API сервера
- Используйте CDN для статических файлов
- Настройте сжатие gzip/brotli

## Troubleshooting

### Частые проблемы:

1. **502 Bad Gateway** - проверьте, что API сервер запущен и доступен
2. **SSL ошибки** - проверьте пути к сертификатам и их валидность
3. **Проблемы с CORS** - проверьте настройки CORS в API сервере
4. **Статические файлы не загружаются** - проверьте права доступа к директориям

### Полезные команды:

```bash
# Проверка конфигурации nginx
sudo nginx -t

# Перезагрузка nginx
sudo systemctl reload nginx

# Проверка портов
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :3000

# Проверка процессов
ps aux | grep node
ps aux | grep nginx
```
