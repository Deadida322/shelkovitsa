# Решение проблем с портами nginx

## Проблема: "Address already in use"

Ошибка возникает, когда порты 80 или 8080 уже заняты другими процессами.

## Быстрое решение

### 1. Проверка занятых портов

```bash
# Проверка порта 80
sudo netstat -tlnp | grep :80

# Проверка порта 8080
sudo netstat -tlnp | grep :8080

# Проверка всех процессов nginx
ps aux | grep nginx
```

### 2. Остановка конфликтующих процессов

```bash
# Остановка nginx
sudo systemctl stop nginx

# Если есть другие процессы nginx
sudo pkill nginx

# Проверка, что порты освободились
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :8080
```

### 3. Использование исправленной конфигурации

```bash
# Копирование исправленной конфигурации (без порта 8080)
sudo cp nginx-http-only.conf /etc/nginx/nginx.conf

# Проверка конфигурации
sudo nginx -t

# Запуск nginx
sudo systemctl start nginx
```

## Автоматическое исправление

Используйте скрипт `fix-port-conflicts.sh`:

```bash
# Сделать скрипт исполняемым
chmod +x fix-port-conflicts.sh

# Запустить исправление
./fix-port-conflicts.sh
```

## Альтернативные решения

### 1. Изменение порта в конфигурации

Если порт 80 занят, можно временно использовать другой порт:

```bash
# Редактирование конфигурации
sudo nano /etc/nginx/nginx.conf

# Измените строку:
listen 80;
# На:
listen 8080;
```

### 2. Освобождение порта 80

Если порт 80 занят Apache или другим веб-сервером:

```bash
# Остановка Apache
sudo systemctl stop apache2

# Отключение автозапуска Apache
sudo systemctl disable apache2

# Остановка других веб-серверов
sudo systemctl stop lighttpd
sudo systemctl stop httpd
```

### 3. Проверка системных служб

```bash
# Проверка всех служб, использующих порт 80
sudo lsof -i :80

# Проверка всех служб, использующих порт 8080
sudo lsof -i :8080
```

## Получение SSL сертификатов после исправления

После исправления проблем с портами:

```bash
# Получение SSL сертификата
sudo certbot --nginx -d shelkovitsa.ru -d www.shelkovitsa.ru

# Если все еще есть проблемы, попробуйте с флагом --standalone
sudo certbot certonly --standalone -d shelkovitsa.ru -d www.shelkovitsa.ru
```

## Проверка после исправления

```bash
# Проверка статуса nginx
sudo systemctl status nginx

# Проверка портов
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Проверка доступности сайта
curl -I http://shelkovitsa.ru
curl -I https://shelkovitsa.ru
```

## Частые причины конфликтов портов

1. **Несколько экземпляров nginx** - остановите все
2. **Apache запущен** - остановите Apache
3. **Другие веб-серверы** - проверьте и остановите
4. **Контейнеры Docker** - проверьте запущенные контейнеры
5. **Системные службы** - проверьте системные службы

## Полезные команды для диагностики

```bash
# Просмотр всех сетевых соединений
sudo netstat -tlnp

# Просмотр процессов по портам
sudo ss -tlnp

# Просмотр активных соединений
sudo lsof -i

# Проверка конфигурации nginx
sudo nginx -t

# Просмотр логов nginx
sudo tail -f /var/log/nginx/error.log
```

## Если ничего не помогает

1. **Перезагрузка сервера** - самый простой способ
2. **Проверка файрвола** - убедитесь, что порты открыты
3. **Проверка DNS** - убедитесь, что домен указывает на сервер
4. **Проверка доступности** - убедитесь, что сервер доступен из интернета
