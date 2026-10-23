# Шелковица

Интернет-магазин нижнего белья.

| Каталог | Что внутри |
|---------|------------|
| [`server/`](server/) | API на NestJS + PostgreSQL (TypeORM): каталог, заказы, корзина, импорт из Excel, уведомления в Telegram — [README](server/README.md), [API](server/docs/API.md) |
| [`client/`](client/) | Витрина и админка на Nuxt 3 |
| [`deploy/`](deploy/) | Установка и деплой на Ubuntu: nginx, SSL, systemd, бэкапы — [README](deploy/README.md) |
| [`temp-dev/`](temp-dev/) | Выгрузки поставщика для разработки (их использует `npm run seed`) |

## Быстрый старт (разработка)

Нужны Node.js из [`.nvmrc`](.nvmrc) и PostgreSQL (локальный или из Docker).

```bash
# PostgreSQL в Docker (если не установлен локально; занят порт — POSTGRES_PORT=5433)
docker compose up -d

# бэкенд: зависимости, схема БД с нуля и тестовые данные
cd server
cp .env.example .env        # для разработки: NODE_ENV=development, TEMP_PATH/DEST_PATH=temp/src, temp/dist
npm ci
npm run dev:setup           # build + db:reset + seed (админ admin@shelkovitsa.local / admin12345)
npm run start:dev           # http://localhost:8000/api, Swagger — /api/docs

# фронт (в другом терминале)
cd client
cp .env.example .env.dev    # BASE_URL=http://localhost:8000
npm ci
npm run dev                 # http://localhost:3000
```

## Проверки

```bash
cd server
npm run lint:check
npm run test:e2e            # e2e-тесты на отдельной БД shelkovitsa_test
```

Те же проверки и сборка запускаются в GitHub Actions на каждый PR, затрагивающий `server/`.
