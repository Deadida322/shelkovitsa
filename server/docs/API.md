# API

Все маршруты — с префиксом `/api`. Полная схема с телами запросов и ответов —
Swagger UI: `http://localhost:8000/api/docs`.

Авторизация — httpOnly-кука `access_token`, которую ставят `register` и `login`.
Ошибки приходят в едином формате:

```json
{ "error": { "statusCode": 400, "message": "…", "path": "/api/…", "timestamp": "…" } }
```

Ошибки валидации — `422`, `message` — массив `{ property, message }`. Списки отдаются
как `{ data, count, page, itemsPerPage }`, `page` считается с нуля, `itemsPerPage` — до 20.

## Публичные

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/health` | Проверка сервиса и БД |
| POST | `/auth/register` | Регистрация `{ mail, fio, password, rePassword }`; лимит 10/мин |
| POST | `/auth/login` | Вход `{ mail, password }`; лимит 10/мин |
| POST | `/auth/logout` | Выход (сбрасывает куку) |
| GET | `/auth/me` | Текущий пользователь `{ mail, fio, isAdmin }` 🔒 |
| GET | `/product-article` | Каталог: `page`, `itemsPerPage`, `categoryId`, `subcategoryId`, `minPrice`, `maxPrice`, `query` |
| GET | `/product-article/popular` | Популярные за месяц (3 шт.) |
| GET | `/product-article/:id` | Карточка; `productSizeId` — цвета только этого размера |
| GET | `/product` | Вариант с остатком: `productArticleId`, `productColorId`, `productSizeId` |
| GET | `/product-category` | Категории с подкатегориями |
| GET | `/product-color`, `/product-size`, `/delivery-type` | Справочники |
| POST | `/order` | Оформить заказ (гостем или вошедшим); лимит 20/мин |
| GET | `/order` | Мои заказы: `page`, `itemsPerPage` 🔒 |
| GET / PUT | `/user/basket` | Корзина пользователя (массив позиций, до 100) 🔒 |

🔒 — нужен вход.

## Админка — `/api/admin/*`, только роль `admin`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/admin/product-article` | Все артикулы, включая скрытые и архивные (`is_deleted`) |
| GET | `/admin/product-article/:id` | Карточка для редактирования |
| PATCH | `/admin/product-article/:id` | `name`, `description`, `isVisible`, `is_deleted`, `productSubcategoryId`, `productColorIds`, `productSizeIds` |
| POST | `/admin/product-article/:id/images` | Загрузка фото (multipart, поле `image`, до 5 МБ) |
| PATCH | `/admin/product-article/images/:fileId/logo` | Сделать фото логотипом → 204 |
| DELETE | `/admin/product-article/images/:fileId` | Удалить фото → 204 |
| POST | `/admin/product-article/import` | Импорт Excel (multipart `file`, `isDeletedOther`) → Excel со строками-ошибками |
| GET | `/admin/product` | Вариант любого (в т.ч. скрытого) артикула |
| GET | `/admin/order` | Все заказы, новые сначала |
| PATCH | `/admin/order/:id` | Смена статуса `{ status }` |
| POST | `/admin/order/:id/telegram-retry` | Повторить Telegram-уведомление |
| GET | `/admin/order/telegram-failed` | Заказы с неотправленным уведомлением |
| POST | `/admin/product-category` | Создать категорию `{ name }` |
| PATCH / DELETE | `/admin/product-category/:id` | Переименовать / удалить пустую (204) |
| POST | `/admin/product-category/:id/subcategories` | Создать подкатегорию `{ name }` |
| PATCH / DELETE | `/admin/product-subcategory/:id` | `{ name, categoryId? }` / удалить пустую (204) |
| POST | `/admin/product-color` | Создать цвет |

### Правила, которые проверяет сервер

- **Публикация артикула** (`isVisible: true`) — нужны имя, хотя бы одно фото, подкатегория
  и хотя бы один вариант; иначе 400 и ни одно изменение из запроса не сохраняется.
- **Варианты** — все сочетания `productColorIds × productSizeIds`. Убранные уходят в архив
  (на них могут ссылаться заказы), вернувшиеся восстанавливаются с прежним остатком.
- **Архив** (`is_deleted: true`) — артикул скрывается с витрины, но остаётся в старых заказах.
- **Импорт** сам создаёт недостающие категории и подкатегории; `isDeletedOther=true` заменяет
  каталог содержимым файла (товары с заказами уходят в архив, остальные удаляются).
- **Заказ** списывает остаток; параллельные заказы последней единицы не проходят оба.
