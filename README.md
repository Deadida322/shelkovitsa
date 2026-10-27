# Шелковица

Интернет-магазин нижнего белья: витрина с каталогом и корзиной, оформление заказов, админка с импортом
каталога из Excel-выгрузки поставщика и уведомления о заказах в Telegram.

| Часть | Стек |
|---|---|
| Бэкенд — [`server/`](server/) | NestJS 12 (Express 5), PostgreSQL 16 + TypeORM 0.3, Vitest; Node.js 24 |
| Фронт — [`client/`](client/) | Nuxt 3 (SSR/ISR), витрина и админка |
| Хранилище фото | локальный диск или S3-совместимый бакет (`STORAGE_DRIVER`) |
| Деплой — [`deploy/`](deploy/) | Ubuntu, nginx + Let's Encrypt, systemd, бэкапы `pg_dump` |

## Структура репозитория

| Каталог | Что внутри |
|---|---|
| [`server/`](server/) | API: каталог, корзина, заказы, авторизация и роли, импорт Excel, Telegram — [README](server/README.md), [API](server/docs/API.md), [переменные окружения](server/docs/ENV_VARIABLES.md) |
| [`server/data/`](server/data/) | справочники `colors.xlsx` и `sizes.xlsx`: цвет/размер поставщика → цвет/размер на сайте |
| [`client/`](client/) | витрина и админка на Nuxt 3 |
| [`deploy/`](deploy/) | скрипты установки сервера и деплоя — [README](deploy/README.md) |
| [`tests/`](tests/) | Postman-коллекция API и фикстуры — [README](tests/README.md) |
| [`temp-dev/`](temp-dev/) | реальные выгрузки поставщика для разработки (их берут `npm run seed` и `audit:marketplace`) |
| [`docs/customer/`](docs/customer/) | памятка заказчику по подготовке к Яндекс Доставке и Маркету (md, pdf) |

## Быстрый старт

Нужны Node.js из [`.nvmrc`](.nvmrc) (24.22.1, npm 11) и Docker — или локальный PostgreSQL 16.

```bash
# PostgreSQL (и RustFS как S3 — по желанию); занят порт 5432 — POSTGRES_PORT=5433
docker compose up -d

# бэкенд
cd server
cp .env.example .env        # для разработки: NODE_ENV=development, TEMP_PATH=temp/src, DEST_PATH=temp/dist
npm ci
npm run dev:setup           # сборка + схема БД с нуля + тестовый каталог из temp-dev/
npm run start:dev           # http://localhost:8000/api, Swagger — http://localhost:8000/api/docs

# фронт — в другом терминале
cd client
cp .env.example .env.dev    # BASE_URL=http://localhost:8000
npm ci
npm run dev                 # http://localhost:3000
```

Админ после `dev:setup`: `admin@shelkovitsa.local` / `admin12345` (меняется через `SEED_ADMIN_MAIL`,
`SEED_ADMIN_PASSWORD`). Сид — только для разработки, в `production` он не запускается.

Полезные команды бэкенда:

| Команда | Что делает |
|---|---|
| `npm run seed -- --articles 300 --no-images` | больше товаров, без скачивания фото |
| `npm run db:reset` | пересоздать схему БД с нуля (данные удаляются) |
| `npm run admin:create -- <почта> <пароль>` | создать администратора |
| `npm run storage:init -- --public` | создать бакет для `STORAGE_DRIVER=s3` |
| `npm run audit:marketplace` | проверить выгрузку поставщика на готовность к Яндекс Маркету и Доставке |

## Проверки

```bash
cd server
npm run lint:check
npm test                    # unit-тесты
npm run test:e2e            # e2e на отдельной БД shelkovitsa_test (создаётся сама)
TEST_STORAGE_DRIVER=s3 npm run test:e2e   # e2e на S3 (RustFS из docker-compose)
npm run test:postman -- --env-var baseUrl=http://localhost:8000   # Postman на запущенном приложении
```

GitHub Actions ([`backend.yml`](.github/workflows/backend.yml)) на каждый PR в `server/`: lint, unit,
сборка, e2e на локальном диске и на S3, Postman (newman) на засеянном приложении.

## Деплой

Сервер Ubuntu 22.04/24.04, всё от root:

1. `install-server.sh` — Node.js, PostgreSQL, nginx, certbot;
2. `server/.env` и `client/.env` по образцам `.env.example`;
3. один раз `setup-nginx-ssl.sh` — nginx и сертификат;
4. `deploy.sh` — git pull, сборка, миграции, перезапуск systemd; так же — при каждом обновлении.

Подробно — [deploy/README.md](deploy/README.md); развёртывание с нуля и на что обратить внимание —
[server/docs/DEPLOYMENT.md](server/docs/DEPLOYMENT.md).

## Документация

| Документ | О чём |
|---|---|
| [server/README.md](server/README.md) | устройство бэкенда, конфигурация, модули |
| [server/docs/API.md](server/docs/API.md) | эндпоинты API (Swagger — `/api/docs`) |
| [server/docs/ENV_VARIABLES.md](server/docs/ENV_VARIABLES.md) | переменные окружения |
| [server/docs/DEPLOYMENT.md](server/docs/DEPLOYMENT.md) | развёртывание с нуля, чек-лист |
| [deploy/README.md](deploy/README.md) | скрипты деплоя, nginx, SSL, права |
| [server/docs/INTEGRATION_YANDEX.md](server/docs/INTEGRATION_YANDEX.md) | интеграция с Яндекс Доставкой и Маркетом: что сделать разработчику и заказчику |
| [server/docs/INTEGRATION_STATUS.md](server/docs/INTEGRATION_STATUS.md) | что уже сделано, данные выгрузки, вопросы по справочникам |
