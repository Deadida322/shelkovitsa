# Настройка SSL для проекта Shelkovitsa

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

### Конфигурация nginx.conf

Файл `deploy/nginx.conf` уже настроен для работы с SSL:

- Автоматический редирект HTTP → HTTPS
- SSL сертификаты Let's Encrypt
- Современные SSL протоколы
- HSTS заголовки

### Применение конфигурации

```bash
# Копирование конфигурации
sudo cp /var/www/shelkovitsa/deploy/nginx.conf /etc/nginx/nginx.conf

# Проверка конфигурации
sudo nginx -t

# Перезагрузка nginx
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
