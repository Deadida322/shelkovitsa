# Bruno-коллекция Shelkovitsa API

[`bruno/`](bruno/) — сквозной сценарий по API (OpenCollection YAML). Запросы идут по
порядку и передают данные через runtime-переменные (`bru.setVar`); авторизация —
кука `access_token` (cookie jar Bruno CLI).

Цены в API — **копейки** (Excel/UI — рубли): импорт `1990` ₽ → `199000`, фильтры
`minPrice`/`maxPrice` и PATCH admin `price` тоже в копейках.

| Папка | Что проверяет |
|-------|---------------|
| 00 Сервис | `/api/health` |
| 01 Справочники | категории, цвета, размеры, доставка |
| 02 Покупатель | регистрация, вход/выход, `me`, корзина, 401/403/422 |
| 03 Админка | импорт Excel, цена в копейках, фото, публикация, вариант, категории |
| 04 Витрина (гость) | поиск, фильтр/фасеты цены, карточка, вариант, популярное, 400/404/422 |
| 05 Заказы | заказ гостем (игнор client `price`) и покупателем, статусы, Telegram |
| 06 Уборка | снять с публикации, удалить фото — повторный прогон идемпотентен |

Файлы для загрузки: [`fixtures/`](fixtures/) (`import.xlsx` → артикул `PM-TEST-001`,
`pixel.png`, `not-an-image.png`). В коллекции пути `../fixtures/...`.

## Бэкенд

Админ и способ доставки — `npm run dev:setup` в `server/`
(`admin@shelkovitsa.local` / `admin12345`). Для повторных прогонов:
`THROTTLE_ENABLED=false`.

## Запуск

Из `server/` (бэкенд на `http://localhost:8000`):

```bash
npm run test:bruno
# другой адрес или пароль:
npm run test:bruno -- --env-var baseUrl=http://localhost:8001 --env-var adminPassword=...
```

Или из папки коллекции:

```bash
cd tests/bruno
npx -y @usebruno/cli@4.4.0 run --env local
```

В Bruno Desktop: Open Collection → `tests/bruno`, окружение `local`.

В CI коллекция гоняется после e2e на отдельной БД (`.github/workflows/backend.yml`).
