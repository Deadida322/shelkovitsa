# Shelkovitsa Server

Backend API для интернет-магазина нижнего белья Shelkovitsa, построенный на NestJS.

## 📋 Описание

RESTful API сервер, предоставляющий функционал для:
- Управления продуктами (категории, артикулы, размеры, цвета)
- Обработки заказов
- Аутентификации пользователей и администраторов
- Управления файлами и изображениями
- Интеграции с Telegram для уведомлений о заказах

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+ 
- PostgreSQL 12+
- npm или yarn

### Установка

1. Клонируйте репозиторий и перейдите в папку сервера:
```bash
cd server
```

2. Установите зависимости:
```bash
npm install
```

3. Настройте переменные окружения (см. раздел [Конфигурация](#конфигурация))

4. Создайте базу данных PostgreSQL:
```sql
CREATE DATABASE shelkovitsa;
```

5. Примените миграции:
```bash
npm run migrate:apply
```

6. Запустите сервер:
```bash
# Режим разработки
npm run start:dev

# Продакшн режим
npm run build
npm run start:prod
```

Сервер будет доступен по адресу `http://localhost:8000` (или порт, указанный в `PORT`)

## ⚙️ Конфигурация

Создайте файл `.env` в корне папки `server` со следующими переменными:

### Базовые настройки
```env
PORT=8000
NODE_ENV=development
LOG_LEVEL=info
IS_LOGGING_ROUTE=false
```

### База данных (PostgreSQL)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=shelkovitsa
```

### JWT Аутентификация
```env
# Публичный ключ (для пользователей)
JWT_PUBLIC_KEY=your_public_jwt_secret_key_here
JWT_PUBLIC_EXP=7d

# Приватный ключ (для администраторов)
JWT_PRIVATE_KEY=your_private_jwt_secret_key_here
JWT_PRIVATE_EXP=1d
```

### Безопасность
```env
# Ключ для шифрования паролей
PSD_KEY=your_password_encryption_key_here
OWNER_ID=1
```

### CORS
```env
# Разрешенные источники (через запятую)
CORS=http://localhost:3000,https://shelkovitsa.ru
```

### Файловое хранилище
```env
TEMP_PATH=temp/src
DEST_PATH=temp/dist
```

### Telegram (опционально)
```env
TELEGRAM_TOKEN=your_telegram_bot_token_here
ADMIN_TG_ID=your_admin_telegram_id
CHAT_TG_ID=your_telegram_chat_id
```

## 📚 Документация

### Swagger UI
После запуска сервера Swagger документация доступна по адресу:
```
http://localhost:8000/api/docs
```

### Дополнительная документация
Подробная документация находится в папке [`docs/`](./docs/):
- [API.md](./docs/API.md) - Полная документация по API эндпоинтам
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Руководство по развертыванию
- [ENV_VARIABLES.md](./docs/ENV_VARIABLES.md) - Описание переменных окружения
- [ANALYSIS_REPORT.md](./docs/ANALYSIS_REPORT.md) - Анализ кода и рекомендации
- [DOCUMENTATION_SUMMARY.md](./docs/DOCUMENTATION_SUMMARY.md) - Резюме документации

## 🗄️ База данных

### Миграции

Проект использует TypeORM для управления миграциями.

**Создание новой миграции:**
```bash
npm run migrate:add
```

**Применение миграций:**
```bash
npm run migrate:apply
```

### Структура базы данных

Основные сущности:
- `User` - пользователи системы
- `Order` - заказы
- `OrderProduct` - продукты в заказе
- `Product` - товары (конкретные размер/цвет артикула)
- `ProductArticle` - артикулы товаров
- `ProductCategory` - категории товаров
- `ProductSubcategory` - подкатегории товаров
- `ProductSize` - размеры товаров
- `ProductColor` - цвета товаров
- `ProductFile` - файлы товаров
- `DeliveryType` - типы доставки
- `Benefit` - преимущества/акции
- `TelegramOrderMessage` - статусы отправки Telegram уведомлений

## 🛠️ Разработка

### Структура проекта

```
server/
├── src/
│   ├── auth/           # Аутентификация
│   ├── order/          # Заказы
│   ├── product/        # Продукты
│   ├── product-article/ # Артикулы
│   ├── product-category/ # Категории
│   ├── product-color/  # Цвета
│   ├── product-size/   # Размеры
│   ├── user/           # Пользователи
│   ├── file/           # Управление файлами
│   ├── delivery-type/  # Типы доставки
│   ├── benefit/        # Преимущества
│   ├── db/             # База данных (entities, migrations)
│   ├── helpers/        # Вспомогательные функции
│   ├── middleware/     # Middleware
│   ├── decorators/     # Декораторы
│   ├── config/         # Конфигурация
│   └── main.ts         # Точка входа
├── scripts/            # Скрипты для миграций
├── docs/               # Документация и файлы
└── temp/               # Временные файлы
```

### Команды

```bash
# Разработка
npm run start:dev

# Сборка
npm run build

# Продакшн
npm run start:prod

# Линтинг
npm run lint

# Форматирование
npm run format

# Миграции
npm run migrate:add      # Создать миграцию
npm run migrate:apply   # Применить миграции
```

## 🔐 Аутентификация

API использует два типа токенов:

1. **Публичные токены** (`JWT_PUBLIC_KEY`) - для обычных пользователей
   - Хранятся в cookies как `access_token`
   - Используются через декоратор `@Auth()`

2. **Приватные токены** (`JWT_PRIVATE_KEY`) - для администраторов
   - Передаются через Bearer token в заголовке
   - Используются через декоратор `@AdminAuth()`

### Примеры использования

**Регистрация пользователя:**
```bash
POST /api/auth/register
{
  "fio": "Иван Иванов",
  "mail": "ivan@example.com",
  "password": "password123"
}
```

**Вход:**
```bash
POST /api/auth/login
{
  "mail": "ivan@example.com",
  "password": "password123"
}
```

**Создание заказа (требует аутентификации):**
```bash
POST /api/order
Cookie: access_token=...
{
  "fio": "Иван Иванов",
  "mail": "ivan@example.com",
  "tel": "+79001234567",
  "region": "Москва",
  "address": "ул. Примерная, д. 1",
  "deliveryTypeId": 1,
  "orderProducts": [
    { "productId": 1, "amount": 2 }
  ]
}
```

## 📦 Основные модули

### Order (Заказы)
- Создание заказов с проверкой наличия товаров
- Управление статусами заказов
- Интеграция с Telegram для уведомлений
- Автоматическая реотправка неудачных уведомлений

### Product (Продукты)
- Получение информации о продуктах
- Фильтрация по категориям, размерам, цветам
- Управление остатками на складе

### Auth (Аутентификация)
- Регистрация и вход пользователей
- JWT токены
- Управление корзиной пользователя

## 🔄 Telegram интеграция

Если настроен `TELEGRAM_TOKEN`, система автоматически:
- Отправляет уведомления о новых заказах в Telegram
- Повторяет отправку неудачных сообщений каждые 20 минут
- Отслеживает статус отправки сообщений

## 📝 Логирование

Логирование маршрутов можно включить через переменную `IS_LOGGING_ROUTE=true`.

В режиме разработки (`NODE_ENV=development`) включено детальное логирование ошибок.

## 🐛 Отладка

Для отладки используйте:
- Swagger UI: `http://localhost:8000/api/docs`
- Логи сервера в консоли
- TypeORM logging (можно включить в `datasource.ts`)

## 📄 Лицензия

UNLICENSED

## 🤝 Поддержка

Для вопросов и предложений создавайте issues в репозитории проекта.
