# Минимальное развертывание Shelkovitsa

Минимальная конфигурация для развертывания Nest + Nuxt в гибридном режиме без оптимизаций и кеширования.

## Особенности

- ✅ Работа от root пользователя (без www-data)
- ✅ Минимальная конфигурация nginx без кеширования
- ✅ Простой скрипт развертывания
- ✅ SSL/HTTPS поддержка
- ✅ Frontend собирается после запуска Backend
- ✅ Обработка статических файлов Nuxt (_nuxt/)
- ✅ Без оптимизаций производительности

## Структура

```
deploy-min/
├── nginx.conf      # Минимальная конфигурация nginx
├── deploy.sh       # Скрипт развертывания
└── README.md       # Этот файл
```

## Использование

1. Скопируйте файлы в папку проекта:
   ```bash
   cp deploy-min/nginx.conf /etc/nginx/nginx.conf
   ```

2. Запустите скрипт развертывания:
   ```bash
   sudo ./deploy-min/deploy.sh
   ```

## Порты

- **Backend (NestJS)**: 8000
- **Frontend (Nuxt.js)**: 3000  
- **Nginx HTTP**: 80 (редирект на HTTPS)
- **Nginx HTTPS**: 443

## Сервисы

Скрипт создает systemd сервисы:
- `shelkovitsa-backend` - NestJS API
- `shelkovitsa-frontend` - Nuxt.js приложение

## Управление

```bash
# Статус сервисов
systemctl status shelkovitsa-backend
systemctl status shelkovitsa-frontend
systemctl status nginx

# Логи
journalctl -u shelkovitsa-backend -f
journalctl -u shelkovitsa-frontend -f

# Перезапуск
systemctl restart shelkovitsa-backend
systemctl restart shelkovitsa-frontend
systemctl restart nginx
```

## Отличия от полной версии

- ✅ SSL/HTTPS поддержка (базовая)
- ❌ Нет кеширования nginx
- ❌ Нет gzip сжатия
- ❌ Нет rate limiting
- ❌ Нет оптимизаций безопасности
- ❌ Работа от root вместо www-data
- ✅ Сборка Frontend после запуска Backend
- ❌ Минимальные логи
