# Развёртывание: с нуля и на что обратить внимание

Скрипты и подробности по каждому — [deploy/README.md](../../deploy/README.md). Здесь — порядок
развёртывания с нуля, настройки, без которых приложение не заработает, и проверка после деплоя.

## Как устроено на сервере

```
             https://домен
                  │
               nginx  (TLS Let's Encrypt, лимиты запросов, client_max_body_size 20M)
       ┌──────────┼───────────────┐
       │ /        │ /api/         │ /static/
       ▼          ▼               ▼
  Nuxt :3000   NestJS :8000 ◄─────┘   systemd: shelkovitsa-frontend, shelkovitsa-backend (www-data)
                  │
     PostgreSQL (локально) · фото: /temp/dist или S3 · загрузки: /temp/src
```

## Развёртывание с нуля

Ubuntu 22.04 или 24.04, все команды от root. Старые данные не переносятся: схема БД новая
(см. «На что обратить внимание», п. 1).

1. **DNS:** A-запись домена (и `www`, если нужен) на IP сервера.
2. **Пакеты, Node.js 24.22.1, PostgreSQL и база:**
   ```bash
   export DB_PASSWORD='пароль_роли_БД'
   sudo -E ./install-server.sh        # из каталога deploy/ (скопируйте его на сервер)
   ```
3. **Код:** `export GIT_REPO=git@github.com:Deadida322/shelkovitsa.git && sudo -E ./deploy.sh` —
   склонирует в `/var/www/shelkovitsa` и остановится без `server/.env`. Это ожидаемо.
4. **`server/.env`** — из `server/.env.example`, обязательные значения — в таблице ниже. Права:
   `chown root:www-data server/.env && chmod 640 server/.env`.
5. **`client/.env`** — из `client/.env.example`: `BASE_URL=https://домен` (без `/api`). Читается при
   сборке фронта.
6. **nginx и сертификат, один раз:**
   ```bash
   cd /var/www/shelkovitsa/deploy
   export PROJECT_DIR=/var/www/shelkovitsa DOMAIN=домен EMAIL=почта@для.letsencrypt
   sudo -E ./setup-nginx-ssl.sh
   nginx -t
   ```
7. **Деплой:** `export DOMAIN=домен && sudo -E ./deploy.sh` — сборка бэка, миграции, временный бэк для
   сборки фронта, сборка фронта, systemd, проверка `/api/health`.
8. **Администратор:**
   `cd /var/www/shelkovitsa/server && sudo -u www-data npm run admin:create -- <почта> <пароль>`.
9. **S3** (если `STORAGE_DRIVER=s3`): `sudo -u www-data npm run storage:init -- --public`.
10. **Каталог:** войти в админку → импорт Excel-выгрузки поставщика. Товары появляются скрытыми,
    публикуются в админке.
11. **Бэкапы:** cron из шапки [`backup.sh`](../../deploy/backup.sh), затем один ручной запуск
    `sudo ./backup.sh` для проверки.
12. **Проверка** — раздел «После деплоя».

### `server/.env` для продакшена

| Переменная | Значение |
|---|---|
| `NODE_ENV` | `production` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | как в `install-server.sh` (по умолчанию роль и база `shelkovitsa`) |
| `JWT_SECRET` | свой, `openssl rand -hex 32`; смена разлогинит всех |
| `JWT_EXPIRES_IN` | например `"1 day"` |
| `CORS` | `https://домен` (и `https://www.домен`, если используется), через запятую |
| `TEMP_PATH`, `DEST_PATH` | `/temp/src`, `/temp/dist` — абсолютные пути, `deploy.sh` создаёт их с владельцем `www-data` |
| `UPLOAD_MAX_FILE_SIZE_MB` | `20` — синхронно с `client_max_body_size` в nginx |
| `STORAGE_DRIVER` | `local` или `s3` (+ `S3_*`, `S3_PUBLIC_URL` — см. `.env.example`) |
| `TELEGRAM_ENABLED` | `false`, пока бот и чат не готовы; иначе `TELEGRAM_TOKEN`, `CHAT_TG_ID`, `ADMIN_TG_ID` |
| `THROTTLE_ENABLED` | `true` |

Полный список — [ENV_VARIABLES.md](ENV_VARIABLES.md). Неверные или пустые обязательные значения —
бэкенд не стартует и пишет, какое поле не прошло проверку (`journalctl -u shelkovitsa-backend`).

## На что обратить внимание

1. **База — только новая.** На ветке схема переписана одной миграцией. На базу со старой схемой
   она не накатится. Для развёртывания с нуля — новая пустая база (`install-server.sh` её создаёт).
   Если база осталась от старого прода: `DROP DATABASE` и создать заново, или новое имя в `DB_NAME`.
2. **Node.js 24.22.1** (`.nvmrc`, `engines` в обоих `package.json`). На старом сервере с Node 18/20
   `npm ci` откажется ставить пакеты — перезапустить `install-server.sh` или обновить
   `/opt/node-<версия>` по инструкции в [deploy/README.md](../../deploy/README.md).
3. **Только HTTPS.** В `production` cookie авторизации — `Secure; SameSite=None`: по http вход и
   корзина не работают. Порядок: сертификат (`setup-nginx-ssl.sh`) → `deploy.sh`.
4. **`CORS` и `BASE_URL` — точный домен с `https://`.** Ошибка — фронт не достучится до API.
   `BASE_URL` зашит при сборке: после изменения — `deploy.sh` (пересборка).
5. **Фронт собирается при работающем бэке** (ISR тянет данные). `deploy.sh` сам поднимает временный
   бэк; при ручной сборке сначала запустите бэкенд.
6. **Импорт каталога — один долгий запрос.** Полная выгрузка (~36 тыс. строк) — около 1,5 мин без
   фото, со скачиванием фото дольше. В [nginx.conf](../../deploy/nginx.conf) для
   `/api/admin/product-article/import` таймаут 3600 с (у остального API — 30 с). Конфиг nginx ставит
   только `setup-nginx-ssl.sh`; на уже настроенном сервере скопируйте блок вручную и выполните
   `nginx -t && systemctl reload nginx`. Долгосрочно — фоновый импорт со статусом.
7. **Размер загрузки** ограничен дважды: `client_max_body_size 20M` в nginx и
   `UPLOAD_MAX_FILE_SIZE_MB=20` в `.env`. Меняйте вместе. Принимается только `.xlsx`.
8. **Справочники цветов и размеров** — `server/data/colors.xlsx`, `sizes.xlsx` в репозитории. Правка —
   коммит и `deploy.sh`; новые цвета и размеры каталога добавляются в БД при старте бэкенда.
   Известные ошибки в файлах — [INTEGRATION_STATUS.md](INTEGRATION_STATUS.md#4-вопросы-и-замечания-по-файлам-соответствий).
9. **Бэкапы фото — только для `STORAGE_DRIVER=local`.** `backup.sh` архивирует `DEST_PATH`; при S3
   резервирование бакета настраивается у провайдера.
10. **Опасные команды защищены.** `npm run seed` и `npm run db:reset` в `production` без `--force` не
    запускаются. `db:reset` удаляет все данные.
11. **Фронт: 62 уязвимости в зависимостях** (`npm audit` в `client/`, Nuxt 3.10). Бэкенд — 0.
    Обновление Nuxt — отдельная задача.

## После деплоя

```bash
curl -s https://домен/api/health                       # {"status":"ok"}
systemctl is-active shelkovitsa-backend shelkovitsa-frontend nginx
journalctl -u shelkovitsa-backend -n 50 --no-pager      # без ошибок валидации .env и подключения к БД
```

Вручную: главная и каталог открываются; вход админа; импорт небольшого файла (например,
`tests/fixtures/import.xlsx`) возвращает файл ошибок; заказ с сайта появляется в админке (и в Telegram,
если включён).

## Обновление и откат

- **Обновление:** `cd /var/www/shelkovitsa/deploy && sudo -E ./deploy.sh` — новые миграции
  применяются автоматически.
- **Откат кода:** `git revert <коммит>` в `main`, push, затем обычный `deploy.sh`. `deploy.sh` работает
  только с веткой (`GIT_BRANCH`), не с отдельным коммитом. Миграцию, которая уже изменила схему,
  `revert` кода не откатит — для этого восстановление из бэкапа.
- **Откат данных:** `pg_restore --clean --if-exists -h localhost -U <DB_USER> -d <DB_NAME> <файл>.dump`
  из `/var/backups/shelkovitsa`.
