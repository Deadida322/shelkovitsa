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

- Node.js 24 (версия в [`.nvmrc`](../.nvmrc))
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

4. Создайте базу данных PostgreSQL — либо поднимите её в Docker из корня репозитория
   ([`docker-compose.yml`](../docker-compose.yml), параметры совпадают с `.env.example`):
```bash
docker compose up -d
```
   либо создайте вручную в установленном PostgreSQL:
```sql
CREATE DATABASE shelkovitsa;
```

5. Подготовьте БД для разработки — схема с нуля и тестовые данные одной командой:
```bash
npm run dev:setup          # build + db:reset + seed
```
   `seed` создаёт админа (`admin@shelkovitsa.local` / `admin12345`, меняется через
   `SEED_ADMIN_MAIL` / `SEED_ADMIN_PASSWORD`), способы доставки и импортирует 30 артикулов
   из `temp-dev/shel_data_new.xlsx` с картинками и публикует их. Опции:
   `npm run seed -- --articles 200`, `--no-images` (без сети), `--file <xlsx>`.
   `db:reset` удаляет все данные; оба скрипта не запускаются при `NODE_ENV=production`.

   На проде вместо этого: `npm run migrate:apply` и `npm run admin:create -- <почта> <пароль>`,
   каталог загружается через админку (импорт Excel сам создаёт категории).

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
JWT_SECRET=your_public_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

### Администратор
Права администратора задаются ролью пользователя (`user.role = admin`). Создать
администратора или выдать права существующему пользователю:
```bash
npm run build
npm run admin:create -- admin@example.com 'надёжный-пароль' 'Иван Иванов'
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

Фото товаров хранятся через `FileStorage` (`src/storage/`), драйвер — `STORAGE_DRIVER`:

- `local` (по умолчанию) — файлы в `DEST_PATH`, раздаются по `/static/<имя>`;
- `s3` — S3-совместимый бакет (Selectel, Yandex Object Storage, RustFS/MinIO). Адреса для фронта
  те же: `/static/<имя>` редиректит на `S3_PUBLIC_URL` или, если он не задан, бэкенд отдаёт файл
  из бакета сам. Бакет создаётся `npm run storage:init -- --public`.

Для разработки S3 поднимается из `docker-compose.yml` (сервис `s3`, RustFS). E2E-тесты на S3:
`TEST_STORAGE_DRIVER=s3 npm run test:e2e`. При `s3` `deploy/backup.sh` картинки не архивирует —
за сохранность отвечает хранилище (версионирование/репликация у провайдера).

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

## 🗄️ База данных

### Миграции

Проект использует TypeORM для управления миграциями.

**Создание новой миграции** (по разнице между сущностями и текущей БД):
```bash
npm run migrate:add -- src/db/migrations/add_something
```
Сгенерированный класс добавьте в список [`src/db/migrations/index.ts`](src/db/migrations/index.ts):
сущности и миграции подключаются явными списками, без glob.

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
├── docs/               # Документация (Markdown)
├── data/               # Справочные Excel (colors.xlsx, sizes.xlsx) для инициализации
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
npm run migrate:add -- src/db/migrations/<имя>   # Создать миграцию
npm run migrate:apply   # Применить миграции

# Unit-тесты (src/**/*.spec.ts)
npm test

# E2E-тесты (нужен запущенный PostgreSQL)
npm run test:e2e
```

### Тесты

Тесты на [Vitest](https://vitest.dev) — Nest 12 распространяется только как ESM, а Jest его
не загружает. Декораторы компилирует SWC (`unplugin-swc`), конфиги — [`vitest.config.ts`](vitest.config.ts)
и [`vitest.e2e.config.ts`](vitest.e2e.config.ts).

E2E-тесты в [`test/`](test/) поднимают приложение целиком и работают с отдельной базой
`shelkovitsa_test`: она создаётся автоматически, миграции накатываются перед прогоном, а
таблицы очищаются перед каждым тестом. Переменные окружения для тестов заданы в
[`test/setup-env.ts`](test/setup-env.ts) и не зависят от `.env`; подключение к PostgreSQL
можно переопределить через `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`,
`TEST_DB_PASSWORD`, `TEST_DB_NAME`.

Telegram в тестах не вызывается (бот подменяется), ограничение частоты запросов
выключено (`THROTTLE_ENABLED=false`), кроме отдельного теста лимитов. В CI тесты
запускаются на каждый PR, затрагивающий `server/` (`.github/workflows/backend.yml`).

## 🔐 Аутентификация

Токен (JWT, подписан `JWT_SECRET`) выдаётся при входе и регистрации и хранится в
httpOnly-куке `access_token`; выход — `POST /api/auth/logout`.

- `@Auth()` — маршрут только для вошедших пользователей
- `@AdminAuth()` — только для пользователей с ролью `admin`

Пароли хранятся как bcrypt-хеши. Вход и регистрация ограничены 10 запросами в минуту с IP.

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

**Создание заказа (гостем или вошедшим пользователем):**
```bash
POST /api/order
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
