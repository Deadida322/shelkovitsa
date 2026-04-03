# Комплексный анализ бекенд-сервера

## 🔴 КРИТИЧЕСКИЕ ПРОБЛЕМЫ

**Примечание:** Количество товаров на складе обновляется через парсинг Excel файла, поэтому автоматическое обновление при создании заказа не требуется.

---

### 1. НЕПРАВИЛЬНАЯ СВЯЗЬ В БД: User ↔ Order
**Файл:** `server/src/db/entities/User.ts:31-33`

**Проблема:** В сущности `User` связь с `Order` определена как `ManyToOne`, что означает "много пользователей к одному заказу". Это логически неверно.

**Текущий код:**
```typescript
@ManyToOne(() => Order, (order) => order.user)
orders?: Order[];
```

**Правильно должно быть:**
```typescript
@OneToMany(() => Order, (order) => order.user)
orders?: Order[];
```

**Примечание:** В `Order.ts` связь правильная (`ManyToOne`), но в `User.ts` нужно исправить на `OneToMany`.

---

### 2. RACE CONDITION ПРИ ПРОВЕРКЕ КОЛИЧЕСТВА ТОВАРОВ
**Файл:** `server/src/order/order.service.ts:68-104`

**Проблема:** Между проверкой количества товара и созданием заказа может произойти другой заказ, что приведет к продаже большего количества товаров, чем есть на складе.

**Решение:** Использовать `SELECT FOR UPDATE` или оптимистичную блокировку:
```typescript
const dProducts = await queryRunner.manager
    .createQueryBuilder(Product, 'product')
    .setLock('pessimistic_write')
    .where('product.id IN (:...ids)', { ids: orderProducts.map(el => el.productId) })
    .andWhere('product.is_deleted = false')
    .getMany();
```

---

## ⚠️ ПРОБЛЕМЫ ПРОИЗВОДИТЕЛЬНОСТИ

### 4. ИЗБЫТОЧНОЕ ИСПОЛЬЗОВАНИЕ EAGER LOADING
**Проблема:** Много связей помечены как `eager: true`, что приводит к:
- Загрузке лишних данных при каждом запросе
- N+1 проблемам
- Увеличению времени ответа

**Найдено в:**
- `Order.ts`: `deliveryType`, `orderProducts`, `user` - все eager
- `OrderProduct.ts`: `product` - eager
- `Product.ts`: `productSize`, `productColor` - eager
- `ProductArticle.ts`: `productSubcategory`, `productFiles` - eager
- `ProductSubcategory.ts`: `productCategory` - eager

**Рекомендация:** Убрать `eager: true` и загружать связи явно через `relations` только когда они нужны.

**Пример:**
```typescript
// Вместо eager: true в Order.ts
const order = await this.orderRepository.findOne({
    where: { id },
    relations: {
        deliveryType: true,
        orderProducts: {
            product: {
                productArticle: true
            }
        }
    }
});
```

---

### 5. ОТСУТСТВИЕ ИНДЕКСОВ НА ВАЖНЫХ ПОЛЯХ
**Проблема:** Нет индексов на часто используемых полях для фильтрации и поиска.

**Рекомендуемые индексы:**

```typescript
// Order.ts
@Index(['status', 'is_deleted'])
@Index(['created_at'])
@Index(['user', 'is_deleted'])

// Product.ts
@Index(['is_deleted', 'amount'])
@Index(['productArticle', 'is_deleted'])

// ProductArticle.ts
@Index(['isVisible', 'is_deleted'])
@Index(['article']) // уже есть unique, но можно добавить обычный индекс
@Index(['price'])

// TelegramOrderMessage.ts
@Index(['status', 'retryCount'])
@Index(['order'])

// OrderProduct.ts
@Index(['order', 'product'])
```

---

### 6. ЧАСТЫЙ CRON ЗАДАЧИ
**Файл:** `server/src/order/order.service.ts:484`

**Проблема:** Cron задача выполняется каждые 2 минуты (`@Cron('*/2 * * * *')`), что очень часто для реотправки Telegram сообщений.

**Рекомендация:** Изменить на более разумный интервал:
```typescript
@Cron('*/20 * * * *') // Каждые 20 минут
// или
@Cron(CronExpression.EVERY_10_MINUTES)
```

---

### 7. МНОЖЕСТВЕННЫЕ ЗАПРОСЫ В ЦИКЛЕ
**Файл:** `server/src/order/order.service.ts:518-549`

**Проблема:** В методе `retryFailedTelegramMessages` для каждого сообщения выполняется отдельный запрос к БД:
```typescript
for (const telegramMessage of failedMessages) {
    // ...
    await this.telegramMessageRepository.save(telegramMessage);
    await this.sendTgCreateOrder(telegramMessage.order, true);
    const updatedMessage = await this.telegramMessageRepository.findOne(...);
}
```

**Решение:** Использовать batch операции:
```typescript
// Обновить все статусы одним запросом
await this.telegramMessageRepository
    .createQueryBuilder()
    .update(TelegramOrderMessage)
    .set({ status: TelegramMessageStatus.RETRYING })
    .where('id IN (:...ids)', { ids: failedMessages.map(m => m.id) })
    .execute();
```

---

## 🔧 ПРОБЛЕМЫ ЛОГИКИ И АРХИТЕКТУРЫ

### 8. НЕОПТИМАЛЬНАЯ ЗАГРУЗКА СВЯЗЕЙ В getOrderList
**Файл:** `server/src/order/order.service.ts:187-203`

**Проблема:** Загружаются все связи для всех заказов, даже если они не нужны для списка.

**Текущий код:**
```typescript
relations: orderRelations // Загружает все: orderProducts, product, productArticle, productColor, productSize, telegramMessage
```

**Рекомендация:** Для списка заказов загружать только необходимые поля или использовать селекты.

---

### 9. ОТСУТСТВИЕ ПАГИНАЦИИ В getOrdersWithFailedTelegramMessages
**Файл:** `server/src/order/order.service.ts:452-478`

**Проблема:** Метод возвращает все заказы с неудачными сообщениями без ограничений. При большом количестве это может привести к проблемам с памятью.

**Решение:** Добавить пагинацию или лимит.

---

### 10. НЕИСПОЛЬЗОВАНИЕ ТРАНЗАКЦИЙ В НЕКОТОРЫХ МЕСТАХ
**Файл:** `server/src/order/order.service.ts:219-230`

**Проблема:** Метод `changeOrderStatus` не использует транзакцию, хотя может потребоваться дополнительная логика (например, обновление статуса Telegram сообщения).

---

### 11. ДУБЛИРОВАНИЕ ЛОГИКИ ОБНОВЛЕНИЯ СТАТУСА TELEGRAM
**Файл:** `server/src/order/order.service.ts:327-383`

**Проблема:** Метод `updateTelegramStatus` выполняет лишний запрос для поиска существующей записи, хотя в некоторых местах она уже загружена.

---

## 📊 РЕКОМЕНДАЦИИ ПО ОПТИМИЗАЦИИ БД

### 12. ОПТИМИЗАЦИЯ СВЯЗЕЙ

**Текущие проблемы:**
- `OrderProduct.product` с `eager: true` загружает `Product` со всеми его связями при каждом запросе
- `Product.productSize` и `Product.productColor` с `eager: true` загружаются всегда

**Рекомендации:**
1. Убрать все `eager: true`
2. Использовать явную загрузку через `relations` только когда нужно
3. Использовать `QueryBuilder` для сложных запросов с JOIN

---

### 13. МОНИТОРИНГ И ЛОГИРОВАНИЕ

**Рекомендации:**
- Добавить логирование медленных запросов (>100ms)
- Добавить метрики для отслеживания производительности
- Использовать TypeORM logging для отладки

```typescript
// В datasource.ts
logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
maxQueryExecutionTime: 1000, // Логировать запросы > 1s
```

---

## 🎯 ПРИОРИТЕТЫ ИСПРАВЛЕНИЯ

### Высокий приоритет (критично):
1. ✅ Исправить связь User ↔ Order
2. ✅ Добавить блокировку для предотвращения race condition (оставлена для корректной проверки количества)

### Средний приоритет (важно):
4. ✅ Убрать избыточный eager loading
5. ✅ Добавить индексы на важные поля
6. ✅ Оптимизировать частоту Cron задач

### Низкий приоритет (желательно):
7. ✅ Оптимизировать множественные запросы в циклах
8. ✅ Добавить пагинацию где нужно
9. ✅ Улучшить логирование и мониторинг

---

## 📝 ДОПОЛНИТЕЛЬНЫЕ ЗАМЕЧАНИЯ

### Положительные моменты:
- ✅ Использование транзакций при создании заказа
- ✅ Правильная обработка ошибок с rollback
- ✅ Асинхронная отправка Telegram сообщений
- ✅ Использование QueryBuilder для сложных запросов в некоторых местах

### Общие рекомендации:
- Рассмотреть использование Redis для кеширования часто запрашиваемых данных
- Добавить валидацию на уровне БД (constraints)
- Рассмотреть использование database views для сложных запросов
- Добавить unit и integration тесты для критичных методов

