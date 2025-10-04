# Руководство по развертыванию проекта Shelkovitsa на Ubuntu

## Обзор проекта

Проект состоит из двух частей:
- **Серверная часть**: NestJS API (порт 3000)
- **Клиентская часть**: Nuxt.js SPA (статические файлы)

## Системные требования

- Ubuntu 20.04 LTS или новее
- Минимум 2GB RAM
- Минимум 20GB свободного места
- Домен shelkovitsa.ru (настроенный DNS)

## 1. Подготовка сервера

### Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

### Установка необходимых пакетов

```bash
# Основные инструменты
sudo apt install -y curl wget git unzip software-properties-common

# Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Nginx
sudo apt install -y nginx

# PM2 для управления Node.js процессами
sudo npm install -g pm2

# Certbot для SSL сертификатов
sudo apt install -y certbot python3-certbot-nginx
```

### Проверка установки

```bash
node --version  # Должно быть v18.x.x
npm --version
nginx -v
psql --version
```

## 2. Настройка базы данных PostgreSQL

### Создание пользователя и базы данных

```bash
# Переключение на пользователя postgres
sudo -u postgres psql

# В консоли PostgreSQL выполните:
CREATE DATABASE shelkovitsa_db;
CREATE USER shelkovitsa_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE shelkovitsa_db TO shelkovitsa_user;
ALTER USER shelkovitsa_user CREATEDB;
\q
```

### Настройка PostgreSQL для внешних подключений

```bash
# Редактирование конфигурации PostgreSQL
sudo nano /etc/postgresql/*/main/postgresql.conf

# Найдите и раскомментируйте/измените:
listen_addresses = 'localhost'

# Редактирование файла аутентификации
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Добавьте строку для локальных подключений:
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5

# Перезапуск PostgreSQL
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

## 3. Настройка Nginx

### Копирование конфигурации

```bash
# Создание резервной копии оригинальной конфигурации
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Копирование новой конфигурации
sudo cp nginx.conf /etc/nginx/nginx.conf

# Копирование дополнительных конфигураций
sudo cp nginx-env.conf /etc/nginx/conf.d/

# Проверка конфигурации
sudo nginx -t

# Если ошибка с пользователем nginx, проверьте какой пользователь используется:
ps aux | grep nginx
# Или проверьте конфигурацию nginx:
grep "user " /etc/nginx/nginx.conf
```

### Создание директорий

```bash
# Создание директории для статических файлов
sudo mkdir -p /var/www/shelkovitsa/client/dist

# Установка прав доступа
sudo chown -R www-data:www-data /var/www/shelkovitsa
sudo chmod -R 755 /var/www/shelkovitsa

# Проверка пользователя nginx (должен быть www-data на Ubuntu)
id www-data
```

### Запуск Nginx

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

## 4. Развертывание приложения

### Создание пользователя для приложения

```bash
# Создание пользователя для приложения
sudo adduser --system --group --home /opt/shelkovitsa shelkovitsa

# Добавление пользователя в группу www-data
sudo usermod -a -G www-data shelkovitsa
```

### Клонирование и настройка проекта

```bash
# Переключение на пользователя shelkovitsa
sudo -u shelkovitsa -i

# Клонирование репозитория (замените на ваш URL)
git clone https://github.com/your-username/shelkovitsa.git /opt/shelkovitsa

# Переход в директорию проекта
cd /opt/shelkovitsa
```

### Настройка серверной части

```bash
# Переход в директорию сервера
cd server

# Установка зависимостей
npm install

# Создание файла переменных окружения
nano .env
```

Содержимое файла `.env`:

```env
# Основные настройки
PORT=3000
NODE_ENV=production

# База данных
DB_HOST=localhost
DB_PORT=5432
DB_USER=shelkovitsa_user
DB_PASSWORD=your_secure_password
DB_NAME=shelkovitsa_db

# JWT настройки
JWT_PRIVATE_KEY=your_very_secure_private_key_here
JWT_PRIVATE_EXP=7d
JWT_PUBLIC_KEY=your_very_secure_public_key_here
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

### Сборка и запуск серверной части

```bash
# Сборка проекта
npm run build

# Создание директорий для файлов
mkdir -p temp/src temp/dist

# Запуск миграций базы данных
npm run migrate:apply

# Тестовый запуск
npm run start:prod
```

### Настройка клиентской части

```bash
# Переход в директорию клиента
cd ../client

# Установка зависимостей
npm install

# Создание файла переменных окружения
nano .env.production
```

Содержимое файла `.env.production`:

```env
# API базовый URL
BASE_URL=https://shelkovitsa.ru/api

# Другие настройки
NUXT_PUBLIC_API_BASE=https://shelkovitsa.ru/api
```

### Сборка клиентской части

```bash
# Сборка для статического хостинга
npm run generate

# Копирование собранных файлов в nginx директорию
sudo cp -r dist/* /var/www/shelkovitsa/client/dist/
sudo chown -R www-data:www-data /var/www/shelkovitsa/client/dist
```

## 5. Настройка PM2 для управления процессами

### Создание конфигурации PM2

```bash
# Создание файла конфигурации PM2
nano /opt/shelkovitsa/ecosystem.config.js
```

Содержимое файла `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'shelkovitsa-api',
    script: 'dist/main.js',
    cwd: '/opt/shelkovitsa/server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/shelkovitsa-api-error.log',
    out_file: '/var/log/pm2/shelkovitsa-api-out.log',
    log_file: '/var/log/pm2/shelkovitsa-api.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

### Запуск приложения через PM2

```bash
# Создание директории для логов PM2
sudo mkdir -p /var/log/pm2
sudo chown -R shelkovitsa:shelkovitsa /var/log/pm2

# Запуск приложения
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска PM2
pm2 startup
# Выполните команду, которую покажет PM2
```

## 6. Настройка SSL сертификатов

### Получение Let's Encrypt сертификата

```bash
# Получение сертификата
sudo certbot --nginx -d shelkovitsa.ru -d www.shelkovitsa.ru

# Проверка автоматического обновления
sudo certbot renew --dry-run

# Настройка автоматического обновления
sudo crontab -e
# Добавьте строку:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 7. Настройка Firewall

```bash
# Настройка UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Проверка статуса
sudo ufw status
```

## 8. Мониторинг и логи

### Настройка ротации логов

```bash
# Создание конфигурации logrotate для PM2
sudo nano /etc/logrotate.d/pm2
```

Содержимое файла:

```
/var/log/pm2/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 shelkovitsa shelkovitsa
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Просмотр логов

```bash
# Логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Логи PM2
pm2 logs shelkovitsa-api

# Логи системы
sudo journalctl -u nginx -f
```

## 9. Настройка бэкапов

### Создание скрипта бэкапа

```bash
# Создание скрипта бэкапа
sudo nano /usr/local/bin/backup-shelkovitsa.sh
```

Содержимое скрипта:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/shelkovitsa"
mkdir -p $BACKUP_DIR

# Бэкап базы данных
sudo -u postgres pg_dump shelkovitsa_db > $BACKUP_DIR/db_$DATE.sql

# Бэкап статических файлов
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/shelkovitsa

# Бэкап кода приложения
tar -czf $BACKUP_DIR/code_$DATE.tar.gz /opt/shelkovitsa

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# Установка прав на выполнение
sudo chmod +x /usr/local/bin/backup-shelkovitsa.sh

# Создание директории для бэкапов
sudo mkdir -p /backups/shelkovitsa
sudo chown -R shelkovitsa:shelkovitsa /backups/shelkovitsa

# Настройка cron для ежедневных бэкапов
sudo crontab -e
# Добавьте строку:
# 0 2 * * * /usr/local/bin/backup-shelkovitsa.sh
```

## 10. Настройка мониторинга

### Установка htop для мониторинга

```bash
sudo apt install -y htop
```

### Создание скрипта мониторинга

```bash
# Создание скрипта проверки состояния
sudo nano /usr/local/bin/health-check.sh
```

Содержимое скрипта:

```bash
#!/bin/bash

# Проверка Nginx
if ! systemctl is-active --quiet nginx; then
    echo "Nginx is not running!"
    systemctl restart nginx
fi

# Проверка PM2
if ! pm2 list | grep -q "shelkovitsa-api.*online"; then
    echo "API is not running!"
    pm2 restart shelkovitsa-api
fi

# Проверка PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    echo "PostgreSQL is not running!"
    systemctl restart postgresql
fi

# Проверка доступности API
if ! curl -f http://localhost/api/ > /dev/null 2>&1; then
    echo "API is not responding!"
fi
```

```bash
# Установка прав на выполнение
sudo chmod +x /usr/local/bin/health-check.sh

# Настройка cron для проверки каждые 5 минут
sudo crontab -e
# Добавьте строку:
# */5 * * * * /usr/local/bin/health-check.sh
```

## 11. Финальная проверка

### Проверка всех сервисов

```bash
# Статус всех сервисов
sudo systemctl status nginx
sudo systemctl status postgresql
pm2 status

# Проверка портов
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :3000

# Проверка доступности сайта
curl -I https://shelkovitsa.ru
curl -I https://shelkovitsa.ru/api
```

### Тестирование функциональности

1. Откройте браузер и перейдите на `https://shelkovitsa.ru`
2. Проверьте работу API: `https://shelkovitsa.ru/api/`
3. Проверьте админ панель: `https://shelkovitsa.ru/admin`
4. Проверьте загрузку статических файлов

## 12. Обновление приложения

### Скрипт обновления

```bash
# Создание скрипта обновления
sudo nano /usr/local/bin/update-shelkovitsa.sh
```

Содержимое скрипта:

```bash
#!/bin/bash
cd /opt/shelkovitsa

# Остановка приложения
pm2 stop shelkovitsa-api

# Обновление кода
git pull origin main

# Обновление серверной части
cd server
npm install
npm run build
npm run migrate:apply

# Обновление клиентской части
cd ../client
npm install
npm run generate
sudo cp -r dist/* /var/www/shelkovitsa/client/dist/
sudo chown -R www-data:www-data /var/www/shelkovitsa/client/dist

# Запуск приложения
cd ..
pm2 start ecosystem.config.js

echo "Update completed!"
```

```bash
# Установка прав на выполнение
sudo chmod +x /usr/local/bin/update-shelkovitsa.sh
```

## Troubleshooting

### Частые проблемы и решения

1. **502 Bad Gateway**
   ```bash
   # Проверьте статус API
   pm2 status
   pm2 logs shelkovitsa-api
   
   # Перезапустите API
   pm2 restart shelkovitsa-api
   ```

2. **SSL ошибки**
   ```bash
   # Проверьте сертификаты
   sudo certbot certificates
   
   # Обновите сертификаты
   sudo certbot renew
   ```

3. **Проблемы с базой данных**
   ```bash
   # Проверьте статус PostgreSQL
   sudo systemctl status postgresql
   
   # Проверьте подключение
   sudo -u postgres psql -c "SELECT 1;"
   ```

4. **Проблемы с правами доступа**
   ```bash
   # Исправьте права доступа
   sudo chown -R www-data:www-data /var/www/shelkovitsa
   sudo chown -R shelkovitsa:shelkovitsa /opt/shelkovitsa
   ```

### Полезные команды

```bash
# Перезагрузка всех сервисов
sudo systemctl restart nginx
sudo systemctl restart postgresql
pm2 restart all

# Просмотр логов
sudo journalctl -u nginx -f
pm2 logs --lines 100

# Проверка конфигурации
sudo nginx -t
pm2 show shelkovitsa-api

# Мониторинг ресурсов
htop
df -h
free -h
```

## Безопасность

### Дополнительные меры безопасности

1. **Настройка fail2ban**
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   ```

2. **Регулярные обновления**
   ```bash
   # Настройка автоматических обновлений безопасности
   sudo apt install -y unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

3. **Мониторинг безопасности**
   ```bash
   # Установка AIDE для мониторинга файловой системы
   sudo apt install -y aide
   sudo aideinit
   ```

Теперь ваш проект Shelkovitsa полностью развернут на Ubuntu сервере с nginx, SSL сертификатами, мониторингом и автоматическими бэкапами!
