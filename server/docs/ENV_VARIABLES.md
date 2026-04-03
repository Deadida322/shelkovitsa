# Переменные окружения

Полный список переменных окружения, необходимых для работы сервера.

## 📋 Обязательные переменные

### База данных
| Переменная | Описание | Пример |
|-----------|----------|--------|
| `DB_HOST` | Хост PostgreSQL | `localhost` |
| `DB_PORT` | Порт PostgreSQL | `5432` |
| `DB_USER` | Пользователь БД | `postgres` |
| `DB_PASSWORD` | Пароль БД | `your_password` |
| `DB_NAME` | Имя базы данных | `shelkovitsa` |

### JWT
| Переменная | Описание | Пример |
|-----------|----------|--------|
| `JWT_PUBLIC_KEY` | Секретный ключ для публичных токенов | `your_public_jwt_secret_key_here` |
| `JWT_PUBLIC_EXP` | Время жизни публичного токена | `7d` |
| `JWT_PRIVATE_KEY` | Секретный ключ для приватных токенов | `your_private_jwt_secret_key_here` |
| `JWT_PRIVATE_EXP` | Время жизни приватного токена | `1d` |

### Безопасность
| Переменная | Описание | Пример |
|-----------|----------|--------|
| `PSD_KEY` | Ключ для шифрования паролей | `your_password_encryption_key_here` |

### Файлы
| Переменная | Описание | Пример |
|-----------|----------|--------|
| `TEMP_PATH` | Путь для временных файлов | `temp/src` |
| `DEST_PATH` | Путь для постоянных файлов | `temp/dist` |

## 🔧 Опциональные переменные

### Базовые настройки
| Переменная | Описание | Значение по умолчанию | Пример |
|-----------|----------|----------------------|--------|
| `PORT` | Порт сервера | `8000` | `8000` |
| `NODE_ENV` | Окружение | `development` | `production` |
| `LOG_LEVEL` | Уровень логирования | - | `info`, `debug`, `error` |
| `IS_LOGGING_ROUTE` | Логировать маршруты | - | `true`, `false` |

### CORS
| Переменная | Описание | Пример |
|-----------|----------|--------|
| `CORS` | Разрешенные источники (через запятую) | `http://localhost:3000,https://shelkovitsa.ru` |

### Telegram (опционально)
| Переменная | Описание | Пример |
|-----------|----------|--------|
| `TELEGRAM_TOKEN` | Токен Telegram бота | `123456:ABC-DEF...` |
| `ADMIN_TG_ID` | ID администратора в Telegram | `123456789` |
| `CHAT_TG_ID` | ID чата/канала для уведомлений | `-1001234567890` или `@channel_name` |

### Дополнительные
| Переменная | Описание | Пример |
|-----------|----------|--------|
| `OWNER_ID` | ID владельца системы | `1` |

## 📝 Пример .env файла

```env
# Базовые настройки
PORT=8000
NODE_ENV=development
LOG_LEVEL=info
IS_LOGGING_ROUTE=false

# База данных
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=shelkovitsa

# JWT
JWT_PUBLIC_KEY=your_public_jwt_secret_key_here
JWT_PUBLIC_EXP=7d
JWT_PRIVATE_KEY=your_private_jwt_secret_key_here
JWT_PRIVATE_EXP=1d

# Безопасность
PSD_KEY=your_password_encryption_key_here
OWNER_ID=1

# CORS
CORS=http://localhost:3000

# Файлы
TEMP_PATH=temp/src
DEST_PATH=temp/dist

# Telegram (опционально)
TELEGRAM_TOKEN=your_telegram_bot_token_here
ADMIN_TG_ID=your_admin_telegram_id
CHAT_TG_ID=your_telegram_chat_id
```

## 🔐 Безопасность

⚠️ **ВАЖНО:**
- Никогда не коммитьте файл `.env` в репозиторий
- Используйте сильные случайные ключи для `JWT_PUBLIC_KEY`, `JWT_PRIVATE_KEY` и `PSD_KEY`
- В продакшене используйте `NODE_ENV=production`
- Ограничьте `CORS` только необходимыми доменами

## 🔑 Генерация секретных ключей

Для генерации безопасных ключей можно использовать:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

