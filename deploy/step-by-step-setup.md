# Пошаговая настройка проекта Shelkovitsa

## Этап 1: Первоначальная настройка nginx (без SSL)

### 1.1 Установка nginx

```bash
sudo apt update
sudo apt install nginx -y
```

### 1.2 Копирование HTTP конфигурации

```bash
# Создание резервной копии
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Копирование HTTP конфигурации
sudo cp nginx-http-only.conf /etc/nginx/nginx.conf

# Проверка конфигурации
sudo nginx -t
```

### 1.3 Создание необходимых директорий

```bash
# Создание директории для статических файлов
sudo mkdir -p /var/www/shelkovitsa/client/dist

# Установка прав доступа
sudo chown -R www-data:www-data /var/www/shelkovitsa
sudo chmod -R 755 /var/www/shelkovitsa
```

### 1.4 Запуск nginx

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

## Этап 2: Настройка приложения

### 2.1 Установка Node.js и зависимостей

```bash
# Установка Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PM2
sudo npm install -g pm2
```

### 2.2 Настройка базы данных PostgreSQL

```bash
# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Создание базы данных и пользователя
sudo -u postgres psql
```

В консоли PostgreSQL:
```sql
CREATE DATABASE shelkovitsa_db;
CREATE USER shelkovitsa_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE shelkovitsa_db TO shelkovitsa_user;
ALTER USER shelkovitsa_user CREATEDB;
\q
```

### 2.3 Развертывание приложения

```bash
# Создание пользователя для приложения
sudo adduser --system --group --home /opt/shelkovitsa shelkovitsa

# Копирование проекта (замените на ваш способ)
sudo cp -r /path/to/your/project /opt/shelkovitsa
sudo chown -R shelkovitsa:shelkovitsa /opt/shelkovitsa
```

### 2.4 Настройка серверной части

```bash
# Переход в директорию сервера
cd /opt/shelkovitsa/server

# Установка зависимостей
npm install

# Создание файла .env
sudo nano .env
```

Содержимое `.env`:
```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_USER=shelkovitsa_user
DB_PASSWORD=your_secure_password
DB_NAME=shelkovitsa_db
JWT_PRIVATE_KEY=your_very_secure_private_key_here
JWT_PRIVATE_EXP=7d
JWT_PUBLIC_KEY=your_very_secure_public_key_here
JWT_PUBLIC_EXP=1d
CORS=http://shelkovitsa.ru,http://www.shelkovitsa.ru
TEMP_PATH=./temp/src
DEST_PATH=./temp/dist
```

### 2.5 Сборка и запуск серверной части

```bash
# Сборка проекта
npm run build

# Создание директорий для файлов
mkdir -p temp/src temp/dist

# Запуск миграций
npm run migrate:apply

# Запуск через PM2
pm2 start dist/main.js --name "shelkovitsa-api"
pm2 save
pm2 startup
```

### 2.6 Настройка клиентской части

```bash
# Переход в директорию клиента
cd /opt/shelkovitsa/client

# Установка зависимостей
npm install

# Создание файла .env.production
sudo nano .env.production
```

Содержимое `.env.production`:
```env
BASE_URL=http://shelkovitsa.ru/api
NUXT_PUBLIC_API_BASE=http://shelkovitsa.ru/api
```

### 2.7 Сборка клиентской части

```bash
# Сборка для статического хостинга
npm run generate

# Копирование собранных файлов
sudo cp -r dist/* /var/www/shelkovitsa/client/dist/
sudo chown -R www-data:www-data /var/www/shelkovitsa/client/dist
```

## Этап 3: Тестирование без SSL

### 3.1 Проверка работы

```bash
# Проверка nginx
sudo nginx -t
sudo systemctl status nginx

# Проверка API
curl http://shelkovitsa.ru/api/

# Проверка фронтенда
curl http://shelkovitsa.ru/
```

### 3.2 Проверка в браузере

Откройте браузер и перейдите на:
- `http://shelkovitsa.ru` - главная страница
- `http://shelkovitsa.ru/api/` - API (должен вернуть 404, что нормально)
- `http://shelkovitsa.ru/admin` - админ панель

## Этап 4: Получение SSL сертификатов

### 4.1 Установка Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 4.2 Получение SSL сертификата

```bash
# Получение сертификата (nginx должен быть запущен)
sudo certbot --nginx -d shelkovitsa.ru -d www.shelkovitsa.ru
```

Certbot автоматически:
- Получит сертификат
- Обновит конфигурацию nginx
- Настроит редирект с HTTP на HTTPS

### 4.3 Проверка SSL

```bash
# Проверка сертификата
sudo certbot certificates

# Проверка конфигурации nginx
sudo nginx -t

# Перезагрузка nginx
sudo systemctl reload nginx
```

## Этап 5: Финальная настройка с SSL

### 5.1 Обновление CORS в API

```bash
# Редактирование .env файла
sudo nano /opt/shelkovitsa/server/.env
```

Обновите CORS:
```env
CORS=https://shelkovitsa.ru,https://www.shelkovitsa.ru
```

### 5.2 Обновление API URL в клиенте

```bash
# Редактирование .env.production
sudo nano /opt/shelkovitsa/client/.env.production
```

Обновите URL:
```env
BASE_URL=https://shelkovitsa.ru/api
NUXT_PUBLIC_API_BASE=https://shelkovitsa.ru/api
```

### 5.3 Пересборка и перезапуск

```bash
# Перезапуск API
pm2 restart shelkovitsa-api

# Пересборка клиента
cd /opt/shelkovitsa/client
npm run generate
sudo cp -r dist/* /var/www/shelkovitsa/client/dist/
sudo chown -R www-data:www-data /var/www/shelkovitsa/client/dist
```

## Этап 6: Настройка автоматического обновления SSL

### 6.1 Настройка cron для обновления сертификатов

```bash
sudo crontab -e
```

Добавьте строку:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

### 6.2 Проверка автоматического обновления

```bash
sudo certbot renew --dry-run
```

## Этап 7: Финальная проверка

### 7.1 Проверка всех сервисов

```bash
# Статус nginx
sudo systemctl status nginx

# Статус PM2
pm2 status

# Статус PostgreSQL
sudo systemctl status postgresql

# Проверка портов
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :3000
```

### 7.2 Тестирование в браузере

1. Откройте `https://shelkovitsa.ru`
2. Проверьте, что происходит редирект с HTTP на HTTPS
3. Проверьте работу API: `https://shelkovitsa.ru/api/`
4. Проверьте админ панель: `https://shelkovitsa.ru/admin`

## Troubleshooting

### Если nginx не запускается

```bash
# Проверка конфигурации
sudo nginx -t

# Просмотр логов
sudo tail -f /var/log/nginx/error.log

# Проверка портов
sudo netstat -tlnp | grep :80
```

### Если API не отвечает

```bash
# Проверка PM2
pm2 status
pm2 logs shelkovitsa-api

# Проверка порта 3000
sudo netstat -tlnp | grep :3000
```

### Если SSL не работает

```bash
# Проверка сертификатов
sudo certbot certificates

# Проверка конфигурации nginx
sudo nginx -t

# Просмотр логов certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

## Полезные команды

```bash
# Перезагрузка nginx
sudo systemctl reload nginx

# Перезапуск nginx
sudo systemctl restart nginx

# Просмотр логов nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Просмотр логов PM2
pm2 logs --lines 100

# Проверка статуса всех сервисов
sudo systemctl status nginx postgresql
pm2 status
```

Теперь у вас есть пошаговая инструкция для настройки проекта без проблем с SSL сертификатами!
