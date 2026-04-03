# API Документация

Полное описание API эндпоинтов сервера Shelkovitsa.

## 🔗 Базовый URL

```
http://localhost:8000/api
```

## 📚 Swagger UI

Интерактивная документация доступна по адресу:
```
http://localhost:8000/api/docs
```

## 🔐 Аутентификация

API использует два типа аутентификации:

1. **Cookie-based** (для пользователей) - токен хранится в cookie `access_token`
2. **Bearer Token** (для администраторов) - токен передается в заголовке `Authorization: Bearer <token>`

### Получение токена

**Регистрация:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "fio": "Иван Иванов",
  "mail": "ivan@example.com",
  "password": "password123"
}
```

**Вход:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "mail": "ivan@example.com",
  "password": "password123"
}
```

## 📦 Основные эндпоинты

### Auth (Аутентификация)

#### Регистрация
```http
POST /api/auth/register
```

#### Вход
```http
POST /api/auth/login
```

#### Получить текущего пользователя
```http
GET /api/auth/me
Cookie: access_token=...
```

#### Выход
```http
POST /api/auth/logout
Cookie: access_token=...
```

### Order (Заказы)

#### Получить список заказов пользователя
```http
POST /api/order
Cookie: access_token=...
Content-Type: application/json

{
  "page": 1,
  "limit": 10
}
```

#### Создать заказ
```http
POST /api/order/create
Cookie: access_token=...
Content-Type: application/json

{
  "fio": "Иван Иванов",
  "mail": "ivan@example.com",
  "tel": "+79001234567",
  "region": "Москва",
  "address": "ул. Примерная, д. 1",
  "description": "Комментарий к заказу",
  "deliveryTypeId": 1,
  "orderProducts": [
    { "productId": 1, "amount": 2 },
    { "productId": 3, "amount": 1 }
  ]
}
```

#### Получить заказ по ID
```http
GET /api/order/:id
Cookie: access_token=...
```

#### Изменить статус заказа (Админ)
```http
PATCH /api/order/admin/changeStatus
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "orderId": 1,
  "status": "in_work"
}
```

#### Получить список всех заказов (Админ)
```http
POST /api/order/admin/getList
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "page": 1,
  "limit": 20,
  "status": "create"
}
```

### Product (Продукты)

#### Получить информацию о продукте
```http
POST /api/product/get
Content-Type: application/json

{
  "id": 1
}
```

#### Получить информацию о продукте (Админ)
```http
POST /api/product/admin/get
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "id": 1
}
```

### Product Article (Артикулы)

#### Получить список артикулов
```http
POST /api/product-article/getList
Content-Type: application/json

{
  "page": 1,
  "limit": 20,
  "categoryId": 1,
  "subcategoryId": 2
}
```

#### Получить детальную информацию об артикуле
```http
POST /api/product-article/getDetail
Content-Type: application/json

{
  "id": 1
}
```

### Product Category (Категории)

#### Получить список категорий
```http
GET /api/product-category
```

#### Получить категорию с подкатегориями
```http
GET /api/product-category/:id
```

### User (Пользователи)

#### Обновить корзину пользователя
```http
PATCH /api/user/basket
Cookie: access_token=...
Content-Type: application/json

{
  "basket": "[{\"productId\": 1, \"amount\": 2}]"
}
```

### Benefit (Преимущества)

#### Получить список преимуществ
```http
GET /api/benefit
```

### Delivery Type (Типы доставки)

#### Получить список типов доставки
```http
GET /api/delivery-type
```

## 📊 Статусы заказов

```typescript
enum OrderStatus {
  CREATE = 'create',      // Создан
  IN_WORK = 'in_work',    // В работе
  PAYMENT = 'payment',    // Оплата
  DELIVERY = 'delivery',  // Доставка
  CLOSE = 'close'         // Закрыт
}
```

## 🔄 Пагинация

Большинство эндпоинтов списков поддерживают пагинацию:

```json
{
  "page": 1,      // Номер страницы (начиная с 1)
  "limit": 20     // Количество элементов на странице
}
```

Ответ:
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 📁 Загрузка файлов

Для загрузки файлов используйте `multipart/form-data`:

```http
POST /api/file/upload
Content-Type: multipart/form-data

file: <binary>
```

## ⚠️ Обработка ошибок

API возвращает ошибки в следующем формате:

```json
{
  "statusCode": 400,
  "message": "Описание ошибки",
  "error": "Bad Request"
}
```

### Коды статусов

- `200` - Успешно
- `201` - Создано
- `400` - Неверный запрос
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Не найдено
- `422` - Ошибка валидации
- `500` - Внутренняя ошибка сервера

## 🔗 Связанные ресурсы

- [Swagger UI](http://localhost:8000/api/docs) - Интерактивная документация
- [Postman коллекция](../../tests/Shelkovitsa_API.postman_collection.json) - Готовые запросы для тестирования
- [README.md](../README.md) - Основная документация проекта

