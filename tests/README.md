# Postman-коллекция Shelkovitsa API

[`Shelkovitsa_API.postman_collection.json`](Shelkovitsa_API.postman_collection.json) — сквозной
сценарий по API (66 запросов, 133 проверки). Запросы идут по порядку и передают друг другу данные
через переменные коллекции; авторизация — кука `access_token`, её держит cookie jar Postman/newman.

| Папка | Что проверяет |
|-------|---------------|
| 00 Сервис | `/api/health` |
| 01 Справочники | категории, цвета, размеры, доставка, преимущества |
| 02 Покупатель | регистрация, вход/выход, `me`, корзина, 401/403/422 |
| 03 Админка | импорт Excel, фото (в т.ч. отказ для не-картинки), логотип, публикация (и отказ без фото), вариант, категории |
| 04 Витрина (гость) | поиск, фильтр по цене, карточка, вариант, популярное, 400/404/422 |
| 05 Заказы | заказ гостем и покупателем, «мои заказы», админский список, статусы, Telegram |
| 06 Уборка | снять товар с публикации, удалить фото — повторный прогон даёт тот же результат |

Файлы для загрузки лежат в [`fixtures/`](fixtures/): `import.xlsx` (тестовый артикул
`PM-TEST-001`, категория «Postman» создаётся импортом), `pixel.png`, `not-an-image.png`.

## Что нужно на стороне бэкенда

Админ и хотя бы один способ доставки — проще всего `npm run dev:setup` в `server/`
(админ `admin@shelkovitsa.local` / `admin12345`). Для повторных прогонов подряд удобно
выключить лимит входов: `THROTTLE_ENABLED=false`.

## Запуск

**newman** (из `server/`, бэкенд на `http://localhost:8000`):

```bash
npm run test:postman
# другой адрес или админ:
npm run test:postman -- --env-var baseUrl=http://localhost:8001 --env-var adminPassword=...
```

**Postman**: Import → файл коллекции → Run collection. Переменные `baseUrl`, `adminMail`,
`adminPassword` — на вкладке Variables коллекции; для запросов с файлами укажите рабочую
папку `tests/` (Settings → Working directory).

В CI коллекция прогоняется после e2e-тестов на отдельной БД с сидом
(`.github/workflows/backend.yml`).
