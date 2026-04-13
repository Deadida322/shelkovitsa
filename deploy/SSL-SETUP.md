# Настройка SSL для проекта Shelkovitsa

## От какого пользователя и куда что пишется

| Действие | Пользователь | Где оказываются файлы |
|----------|--------------|------------------------|
| Выпуск сертификата (certbot) | **root** / `sudo` | `/etc/letsencrypt/live/<имя>/` (ключи и цепочка) |
| Конфиг nginx | **root** / `sudo` | **`/etc/nginx/nginx.conf`** — записывает **[`setup-nginx-ssl.sh`](./setup-nginx-ssl.sh)** (один раз); [`deploy.sh`](./deploy.sh) конфиг **не меняет** |
| Запуск nginx | systemd | master от **root**, воркеры от **`www-data`** (чтение конфига и сертификатов) |

Руками **`www-data`** ничего в `/etc` не копирует — только администратор.

## Домен и подстановка в nginx

В репозитории [`deploy/nginx.conf`](./nginx.conf) — **шаблон** с `@SERVER_NAMES@` и `@LETSENCRYPT_LIVE@`. Подстановку и запись в **`/etc/nginx/nginx.conf`** делает **[`setup-nginx-ssl.sh`](./setup-nginx-ssl.sh)** (шаг 3 после certbot). При обычном **`deploy.sh`** конфиг nginx **не перезаписывается**.

Переменные для **`setup-nginx-ssl.sh`**: **`DOMAIN`**, **`EMAIL`**, опционально **`SERVER_NAMES`**, **`LETSENCRYPT_LIVE_NAME`**, **`EXTRA_DOMAINS`** — см. [README](README.md).

Рекомендуемый сценарий — один вызов **`setup-nginx-ssl.sh`** (внутри: временный [`nginx-acme-only.conf`](./nginx-acme-only.conf) → **`issue-ssl.sh`** → полный `nginx.conf`).

## Выпуск сертификата

Отдельно можно вызвать только **[`issue-ssl.sh`](./issue-ssl.sh)** (webroot), если nginx на **80** уже отдаёт `/.well-known/`. Обычно удобнее **`setup-nginx-ssl.sh`**, который сам поднимает минимальный nginx для ACME.

Опционально второе имя: `export EXTRA_DOMAINS='www.test.shelkovitsa.ru'`.

## 🔒 Настройка SSL сертификатов

### Предварительные требования

- Домен `shelkovitsa.ru` должен указывать на ваш сервер
- Nginx должен работать на порту 80
- Firewall должен разрешать порты 80 и 443

### 1. Установка Certbot

```bash
# Обновление системы
sudo apt update

# Установка certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Получение SSL сертификатов

```bash
# Получение сертификатов для домена
sudo certbot --nginx -d shelkovitsa.ru -d www.shelkovitsa.ru

# Или в автоматическом режиме
sudo certbot --nginx -d shelkovitsa.ru -d www.shelkovitsa.ru --non-interactive --agree-tos --email admin@shelkovitsa.ru
```

### 3. Проверка сертификатов

```bash
# Список сертификатов
sudo certbot certificates

# Тест обновления
sudo certbot renew --dry-run
```

### 4. Автоматическое обновление

```bash
# Добавление в crontab
sudo crontab -e

# Добавьте строку для автоматического обновления
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Настройка Nginx с SSL

### Шаблон и применение

Файл **`deploy/nginx.conf`** — шаблон; в **`/etc/nginx/nginx.conf`** его кладёт **`setup-nginx-ssl.sh`**. При ручном копировании не забудьте заменить плейсхолдеры (`sed` как в скрипте).

Проверка конфига:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🚨 Устранение проблем с SSL

### Проблема: Сертификаты не найдены

```bash
# Проверьте наличие сертификатов
ls -la /etc/letsencrypt/live/shelkovitsa.ru/

# Если сертификатов нет, получите их заново
sudo certbot --nginx -d shelkovitsa.ru -d www.shelkovitsa.ru
```

### Проблема: Nginx не запускается

```bash
# Проверьте конфигурацию
sudo nginx -t

# Проверьте права доступа к сертификатам
sudo ls -la /etc/letsencrypt/live/shelkovitsa.ru/
```

### Проблема: Ошибка "certificate verify failed"

```bash
# Обновите сертификаты
sudo certbot renew

# Перезапустите nginx
sudo systemctl restart nginx
```

## 🔍 Проверка SSL

### Тест SSL сертификата

```bash
# Проверка с помощью openssl
openssl s_client -connect shelkovitsa.ru:443 -servername shelkovitsa.ru

# Проверка с помощью curl
curl -I https://shelkovitsa.ru
```

### Онлайн проверка

- [SSL Labs](https://www.ssllabs.com/ssltest/) - полная проверка SSL
- [SSL Checker](https://www.sslchecker.com/) - быстрая проверка

## 📊 Мониторинг SSL

### Логи certbot

```bash
# Логи получения сертификатов
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Логи nginx

```bash
# Логи доступа
sudo tail -f /var/log/nginx/access.log

# Логи ошибок
sudo tail -f /var/log/nginx/error.log
```

### Проверка статуса

```bash
# Статус nginx
sudo systemctl status nginx

# Проверка портов
sudo netstat -tlnp | grep -E ':(80|443)'
```

## 🔄 Обновление сертификатов

### Ручное обновление

```bash
# Обновление всех сертификатов
sudo certbot renew

# Обновление конкретного домена
sudo certbot renew --cert-name shelkovitsa.ru
```

### Автоматическое обновление

```bash
# Добавление в crontab
sudo crontab -e

# Добавьте строку для ежедневной проверки
0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

## 🛡️ Безопасность SSL

### Рекомендуемые настройки

- TLS 1.2 и 1.3
- Современные шифры
- HSTS заголовки
- OCSP Stapling

### Проверка безопасности

```bash
# Проверка SSL конфигурации
sudo nginx -t

# Тест безопасности
curl -I https://shelkovitsa.ru
```

## 📈 Оптимизация SSL

### Настройки производительности

- SSL session caching
- HTTP/2
- Gzip сжатие
- Keep-alive соединения

### Мониторинг производительности

```bash
# Статистика SSL
sudo nginx -s reload

# Проверка HTTP/2
curl -I --http2 https://shelkovitsa.ru
```

## 🎯 Заключение

После настройки SSL:

1. ✅ HTTP автоматически редиректится на HTTPS
2. ✅ SSL сертификаты автоматически обновляются
3. ✅ Современные SSL протоколы и шифры
4. ✅ HSTS заголовки для безопасности
5. ✅ HTTP/2 для лучшей производительности

Сайт будет доступен по адресу: https://shelkovitsa.ru
