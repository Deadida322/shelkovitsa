# Решение проблемы с ACME challenge (Let's Encrypt)

## Проблема: 403 Forbidden для /.well-known/acme-challenge/

Ошибка возникает, когда nginx блокирует доступ к пути `/.well-known/acme-challenge/`, который необходим для проверки домена Let's Encrypt.

## Быстрое решение

### 1. Использование исправленной конфигурации

```bash
# Копирование исправленной конфигурации
sudo cp nginx-fixed-acme.conf /etc/nginx/nginx.conf

# Проверка конфигурации
sudo nginx -t

# Перезагрузка nginx
sudo systemctl reload nginx
```

### 2. Создание директории для ACME challenge

```bash
# Создание директории
sudo mkdir -p /var/www/html/.well-known/acme-challenge

# Установка прав доступа
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

### 3. Автоматическое исправление

Используйте скрипт `fix-acme-challenge.sh`:

```bash
# Сделать скрипт исполняемым
chmod +x fix-acme-challenge.sh

# Запустить исправление
./fix-acme-challenge.sh
```

## Проверка исправления

### 1. Тест доступности ACME challenge

```bash
# Создание тестового файла
echo "test" | sudo tee /var/www/html/.well-known/acme-challenge/test

# Проверка доступности
curl http://shelkovitsa.ru/.well-known/acme-challenge/test

# Должно вернуть "test"
```

### 2. Проверка извне

```bash
# Проверка с внешнего сервера
curl http://shelkovitsa.ru/.well-known/acme-challenge/test

# Или через браузер
# http://shelkovitsa.ru/.well-known/acme-challenge/test
```

## Получение SSL сертификата

После исправления проблемы:

```bash
# Получение SSL сертификата
sudo certbot --nginx -d shelkovitsa.ru -d www.shelkovitsa.ru

# Если все еще есть проблемы, попробуйте с флагом --standalone
sudo certbot certonly --standalone -d shelkovitsa.ru -d www.shelkovitsa.ru
```

## Альтернативные решения

### 1. Ручное добавление location блока

Добавьте в конфигурацию nginx:

```nginx
# Разрешить доступ к ACME challenge для Let's Encrypt
location /.well-known/acme-challenge/ {
    root /var/www/html;
    try_files $uri =404;
}
```

### 2. Использование webroot плагина

```bash
# Получение сертификата с webroot плагином
sudo certbot certonly --webroot -w /var/www/html -d shelkovitsa.ru -d www.shelkovitsa.ru
```

### 3. Использование standalone плагина

```bash
# Остановка nginx
sudo systemctl stop nginx

# Получение сертификата
sudo certbot certonly --standalone -d shelkovitsa.ru -d www.shelkovitsa.ru

# Запуск nginx
sudo systemctl start nginx
```

## Проверка DNS

Убедитесь, что домен правильно настроен:

```bash
# Проверка DNS
nslookup shelkovitsa.ru
nslookup www.shelkovitsa.ru

# Проверка с внешнего сервера
dig shelkovitsa.ru
dig www.shelkovitsa.ru
```

## Проверка файрвола

```bash
# Проверка статуса файрвола
sudo ufw status

# Открытие портов (если нужно)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## Проверка доступности сервера

```bash
# Проверка доступности порта 80
telnet shelkovitsa.ru 80

# Или с помощью nc
nc -zv shelkovitsa.ru 80
```

## Логи для диагностики

```bash
# Логи nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Логи certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Логи системы
sudo journalctl -u nginx -f
```

## Частые причины проблемы

1. **Неправильная конфигурация nginx** - блокировка .well-known
2. **Неправильные права доступа** - nginx не может читать файлы
3. **Неправильный root** - nginx ищет файлы не в той директории
4. **DNS проблемы** - домен не указывает на сервер
5. **Файрвол** - блокировка порта 80
6. **Недоступность сервера** - сервер не доступен из интернета

## Полезные команды для диагностики

```bash
# Проверка конфигурации nginx
sudo nginx -t

# Проверка статуса nginx
sudo systemctl status nginx

# Проверка портов
sudo netstat -tlnp | grep :80

# Проверка прав доступа
ls -la /var/www/html/.well-known/acme-challenge/

# Проверка доступности
curl -I http://shelkovitsa.ru/.well-known/acme-challenge/

# Проверка DNS
dig shelkovitsa.ru +short
```

## Если ничего не помогает

1. **Проверьте DNS** - убедитесь, что домен указывает на сервер
2. **Проверьте файрвол** - убедитесь, что порт 80 открыт
3. **Проверьте доступность** - убедитесь, что сервер доступен из интернета
4. **Используйте standalone режим** - временно остановите nginx
5. **Обратитесь к логам** - проверьте логи nginx и certbot
