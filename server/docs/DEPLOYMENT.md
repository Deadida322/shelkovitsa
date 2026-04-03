# Руководство по развертыванию

Подробное руководство по развертыванию сервера Shelkovitsa в продакшене.

## 📋 Предварительные требования

- Ubuntu 20.04+ или аналогичная Linux система
- Node.js 18+
- PostgreSQL 12+
- Nginx (для reverse proxy)
- PM2 или systemd (для управления процессом)
- SSL сертификаты (Let's Encrypt)

## 🚀 Пошаговое развертывание

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Установка Nginx
sudo apt install -y nginx

# Установка PM2 (опционально)
sudo npm install -g pm2
```

### 2. Настройка базы данных

```bash
# Вход в PostgreSQL
sudo -u postgres psql

# Создание базы данных и пользователя
CREATE DATABASE shelkovitsa;
CREATE USER shelkovitsa_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE shelkovitsa TO shelkovitsa_user;
\q
```

### 3. Клонирование и настройка проекта

```bash
# Создание директории
sudo mkdir -p /var/www/shelkovitsa
cd /var/www/shelkovitsa

# Клонирование репозитория (замените на ваш URL)
sudo git clone <your-repo-url> .

# Переход в папку сервера
cd server

# Установка зависимостей
sudo npm ci --production

# Создание .env файла
sudo nano .env
```

### 4. Настройка переменных окружения

Создайте файл `.env` со следующими настройками:

```env
# Продакшн настройки
NODE_ENV=production
PORT=8000

# База данных
DB_HOST=localhost
DB_PORT=5432
DB_USER=shelkovitsa_user
DB_PASSWORD=your_secure_password
DB_NAME=shelkovitsa

# JWT (используйте сильные ключи!)
JWT_PUBLIC_KEY=<generate_strong_key>
JWT_PUBLIC_EXP=7d
JWT_PRIVATE_KEY=<generate_strong_key>
JWT_PRIVATE_EXP=1d

# Безопасность
PSD_KEY=<generate_strong_key>

# CORS (укажите ваш домен)
CORS=https://shelkovitsa.ru,https://www.shelkovitsa.ru

# Файлы
TEMP_PATH=temp/src
DEST_PATH=temp/dist

# Telegram (опционально)
TELEGRAM_TOKEN=your_telegram_bot_token
ADMIN_TG_ID=your_admin_telegram_id
CHAT_TG_ID=your_telegram_chat_id
```

**Генерация сильных ключей:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Применение миграций

```bash
cd /var/www/shelkovitsa/server
npm run migrate:apply
```

### 6. Сборка проекта

```bash
npm run build
```

### 7. Настройка systemd (рекомендуется)

Создайте файл `/etc/systemd/system/shelkovitsa-backend.service`:

```ini
[Unit]
Description=Shelkovitsa Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/shelkovitsa/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=shelkovitsa-backend

[Install]
WantedBy=multi-user.target
```

Запуск сервиса:

```bash
# Перезагрузка systemd
sudo systemctl daemon-reload

# Включение автозапуска
sudo systemctl enable shelkovitsa-backend

# Запуск
sudo systemctl start shelkovitsa-backend

# Проверка статуса
sudo systemctl status shelkovitsa-backend
```

### 8. Альтернатива: PM2

```bash
# Запуск с PM2
cd /var/www/shelkovitsa/server
pm2 start dist/main.js --name shelkovitsa-backend

# Сохранение конфигурации
pm2 save

# Настройка автозапуска
pm2 startup
```

### 9. Настройка Nginx

Создайте файл `/etc/nginx/sites-available/shelkovitsa`:

```nginx
server {
    listen 80;
    server_name shelkovitsa.ru www.shelkovitsa.ru;

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name shelkovitsa.ru www.shelkovitsa.ru;

    # SSL сертификаты (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/shelkovitsa.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shelkovitsa.ru/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Логи
    access_log /var/log/nginx/shelkovitsa-access.log;
    error_log /var/log/nginx/shelkovitsa-error.log;

    # Проксирование на NestJS
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Статические файлы
    location /static {
        alias /var/www/shelkovitsa/server/temp/dist;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Ограничение размера тела запроса
    client_max_body_size 10M;
}
```

Активация конфигурации:

```bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/shelkovitsa /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl reload nginx
```

### 10. Настройка SSL (Let's Encrypt)

```bash
# Установка certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение сертификатов
sudo certbot --nginx -d shelkovitsa.ru -d www.shelkovitsa.ru

# Автоматическое обновление (настроено автоматически)
```

### 11. Настройка прав доступа

```bash
# Установка владельца
sudo chown -R www-data:www-data /var/www/shelkovitsa

# Права на файлы
sudo find /var/www/shelkovitsa -type f -exec chmod 644 {} \;

# Права на директории
sudo find /var/www/shelkovitsa -type d -exec chmod 755 {} \;

# Права на исполняемые файлы
sudo chmod +x /var/www/shelkovitsa/server/dist/main.js
```

### 12. Настройка файрвола

```bash
# Разрешение HTTP и HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Разрешение SSH (важно!)
sudo ufw allow 22/tcp

# Включение файрвола
sudo ufw enable
```

## 🔍 Проверка развертывания

### Проверка работы API

```bash
# Проверка здоровья API
curl http://localhost:8000/api/benefit

# Проверка через Nginx
curl https://shelkovitsa.ru/api/benefit
```

### Проверка логов

```bash
# Логи приложения (systemd)
sudo journalctl -u shelkovitsa-backend -f

# Логи Nginx
sudo tail -f /var/log/nginx/shelkovitsa-access.log
sudo tail -f /var/log/nginx/shelkovitsa-error.log

# Логи PM2 (если используется)
pm2 logs shelkovitsa-backend
```

## 🔄 Обновление

```bash
# Остановка сервиса
sudo systemctl stop shelkovitsa-backend

# Переход в директорию
cd /var/www/shelkovitsa/server

# Получение обновлений
sudo git pull

# Установка зависимостей
sudo npm ci --production

# Применение миграций (если есть)
npm run migrate:apply

# Сборка
npm run build

# Запуск сервиса
sudo systemctl start shelkovitsa-backend
```

## 🐛 Решение проблем

### Сервис не запускается

```bash
# Проверка статуса
sudo systemctl status shelkovitsa-backend

# Просмотр логов
sudo journalctl -u shelkovitsa-backend -n 50
```

### Проблемы с базой данных

```bash
# Проверка подключения
sudo -u postgres psql -d shelkovitsa -c "SELECT 1;"

# Проверка миграций
cd /var/www/shelkovitsa/server
npm run migrate:apply
```

### Проблемы с Nginx

```bash
# Проверка конфигурации
sudo nginx -t

# Перезагрузка
sudo systemctl reload nginx

# Просмотр логов
sudo tail -f /var/log/nginx/error.log
```

## 📊 Мониторинг

### Рекомендуемые инструменты

- **PM2 Monitoring** (если используется PM2)
- **systemd status** для проверки состояния сервиса
- **Nginx access logs** для анализа трафика
- **PostgreSQL logs** для мониторинга БД

### Проверка производительности

```bash
# Использование памяти
free -h

# Использование диска
df -h

# Процессы Node.js
ps aux | grep node
```

## 🔐 Безопасность

1. **Регулярно обновляйте систему:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Используйте сильные пароли** для всех сервисов

3. **Ограничьте доступ к SSH** (используйте ключи вместо паролей)

4. **Настройте регулярные бэкапы** базы данных

5. **Мониторьте логи** на предмет подозрительной активности

6. **Используйте HTTPS** для всех соединений

## 📝 Бэкапы

### Автоматический бэкап базы данных

Создайте скрипт `/usr/local/bin/backup-shelkovitsa.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/shelkovitsa"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Бэкап базы данных
sudo -u postgres pg_dump shelkovitsa > $BACKUP_DIR/db_$DATE.sql

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
```

Добавьте в crontab:
```bash
0 2 * * * /usr/local/bin/backup-shelkovitsa.sh
```

## 📚 Дополнительные ресурсы

- [NestJS документация](https://docs.nestjs.com/)
- [PostgreSQL документация](https://www.postgresql.org/docs/)
- [Nginx документация](https://nginx.org/en/docs/)
- [Let's Encrypt документация](https://letsencrypt.org/docs/)

