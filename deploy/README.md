# Развёртывание Shelkovitsa

Основные сценарии — **от root** (`sudo`).

| Скрипт | Назначение |
|--------|------------|
| [`install-server.sh`](./install-server.sh) | Чистый сервер: пакеты, **nvm** + Node, PostgreSQL при `DB_PASSWORD`, `/var/www/certbot` |
| [`setup-nginx-ssl.sh`](./setup-nginx-ssl.sh) | **Один раз:** временный nginx (ACME) → **certbot** → полный [`nginx.conf`](./nginx.conf) в **`/etc/nginx/nginx.conf`** |
| [`deploy.sh`](./deploy.sh) | Git, **`/temp`**, сборка, миграции, systemd; **конфиг nginx не трогает** (уже настроен шагом выше) |
| [`issue-ssl.sh`](./issue-ssl.sh) | Только **certbot** (вызывается из `setup-nginx-ssl.sh`; отдельно — для перевыпуска / доп. имён) |

Дополнительно: [`SSL-SETUP.md`](./SSL-SETUP.md), [`FRONTEND-MODES.md`](./FRONTEND-MODES.md), [`clear-cache.sh`](./clear-cache.sh), шаблоны [`nginx-acme-only.conf`](./nginx-acme-only.conf), [`nginx-bootstrap-site.conf`](./nginx-bootstrap-site.conf).

### Ошибка `bash\r: No such file` или `/usr/bin/env: 'bash\r'`

Скрипты должны иметь окончания строк **LF** (Unix). Если копировали с Windows и в редакторе стоят **CRLF**, shebang ломается: система ищет интерпретатор `bash\r`. На сервере исправьте:

```bash
sed -i 's/\r$//' /root/deploy/*.sh
# или: apt install dos2unix && dos2unix /root/deploy/*.sh
```

В репозитории для `deploy/*.sh` задан [`.gitattributes`](../.gitattributes) с `eol=lf`, чтобы при клоне на Linux строки были корректные.

### `shelkovitsa-backend`: `status=203/EXEC`, `Failed to execute /usr/local/bin/node: Permission denied`

Юниты systemd работают от **www-data**. Симлинк **`/usr/local/bin/node` → `/root/.nvm/.../bin/node`** недопустим: каталог **`/root`** (обычно `700`) не проходим для **www-data**. Нельзя ограничиться копией только **`bin/node`** в `/usr/local`: бинарю нужны **`../lib`** (`libnode.so` и др.). Актуальный [`install-server.sh`](./install-server.sh) **копирует весь релиз** в **`/opt/node-<версия>`** и вешает симлинки в `/usr/local/bin` **уже на `/opt/...`**. На уже настроенном сервере:

```bash
sudo -i
VER=20.19.5
rm -rf "/opt/node-${VER}"
cp -a "/root/.nvm/versions/node/v${VER}" "/opt/node-${VER}"
chown -R root:root "/opt/node-${VER}"
find "/opt/node-${VER}" -type d -exec chmod 755 {} \;
chmod 755 "/opt/node-${VER}/bin"/*
[[ -d "/opt/node-${VER}/lib" ]] && chmod -R a+r "/opt/node-${VER}/lib"
ln -sf "/opt/node-${VER}/bin/node" /usr/local/bin/node
ln -sf "/opt/node-${VER}/bin/npm" /usr/local/bin/npm
ln -sf "/opt/node-${VER}/bin/npx" /usr/local/bin/npx
sudo -u www-data /usr/local/bin/node -v
systemctl restart shelkovitsa-backend shelkovitsa-frontend
```

**Переменная `GIT_REPO`** используется только в **`deploy.sh`**, не в `install-server.sh`. Установка ОС и БД: только `DB_PASSWORD`, `DB_USER`, `DB_NAME` и параметры Node/nvm. Если передали `GIT_REPO` в `install-server.sh`, он **игнорируется** — это нормально.

### Проверка доступа к репозиторию по SSH (GitHub)

После добавления публичного ключа в GitHub → **Settings → SSH and GPG keys**:

```bash
# Должно вывести приветствие и ваш логин (или спросить подтверждение fingerprint при первом разе)
ssh -T git@github.com
```

Проверка именно вашего URL без полного клона:

```bash
git ls-remote git@github.com:Deadida322/shelkovitsa.git
```

Если видите хеши коммитов — доступ на чтение есть. Ошибки `Permission denied (publickey)` — ключ не подхватился: проверьте `ssh-add -l`, путь к ключу (`~/.ssh/id_ed25519`), а для root — что ключ лежит в `/root/.ssh/` и права `chmod 600` на приватный ключ.

Затем клон выполняйте через **`deploy.sh`** (из каталога с скриптом, где лежит копия `deploy/`):

```bash
cd /root/deploy
export GIT_REPO='git@github.com:Deadida322/shelkovitsa.git'
sudo -E ./deploy.sh
```

*(Скрипт остановится без `server/.env` — тогда скопируйте `.env.example`, настройте и снова запустите `deploy.sh`.)*

## Перед первым запуском (репозитория на сервере ещё нет)

**Нужна ли папка проекта заранее?** Обычно **нет**. Если запускаете [`deploy.sh`](./deploy.sh) с переменной **`GIT_REPO`**, скрипт сам создаст родительский каталог (например `/var/www`) и выполнит **`git clone`** в **`PROJECT_DIR`** (по умолчанию `/var/www/shelkovitsa`). Не создавайте вручную пустой каталог `/var/www/shelkovitsa` без `.git` — в этом случае `deploy.sh` завершится с ошибкой.

**От какого пользователя:** оба скрипта — **только от root** (`sudo ./install-server.sh`, `sudo ./deploy.sh`). Отдельный Unix-пользователь для деплоя не нужен: после `git` дерево может принадлежать **root**; [`deploy.sh`](./deploy.sh) сам выставит **chmod** на проект и **chown www-data** на каталоги записи (`server/temp`, `docs`, `static`). Процессы Node в systemd идут от **www-data**.

**Права до деплоя:** ничего специально не выставляйте. После появления `server/.env` сделайте **`chown root:www-data server/.env`** и **`chmod 640 server/.env`**, чтобы **www-data** мог читать секреты, а остальные пользователи ОС — нет.

**Что физически положить на сервер до клона:** достаточно скопировать каталог **`deploy/`** (или хотя бы `install-server.sh` и `deploy.sh`) в удобное место, например `/root/shelkovitsa-deploy/`, выставить **`chmod +x *.sh`**, затем запускать оттуда. Полный клон репозитория до этого **не обязателен**, если первый раз используете **`deploy.sh`** с **`GIT_REPO`**.

**Типичный порядок:** `install-server.sh` → код в **`PROJECT_DIR`** (`git clone` или `deploy.sh` + **`GIT_REPO`**) → **`server/.env`**, **`client/.env`** → один раз **`setup-nginx-ssl.sh`** (nginx + сертификат) → дальше только **`deploy.sh`** при обновлениях.

## Кто чем владеет и что запускает

| Учётная запись | Роль |
|----------------|------|
| **root** | Установка (`install-server.sh`), деплой (`deploy.sh`), master-процесс nginx, certbot, `/etc` |
| **postgres** | Демон PostgreSQL |
| **www-data** | Воркеры nginx; процессы Node в `shelkovitsa-backend` и `shelkovitsa-frontend` |
| Роль в БД (`DB_USER` в `.env`) | Подключение приложения к PostgreSQL (не пользователь ОС) |

Дерево проекта: `chmod 755` для чтения процессами `www-data`. Запись: `server/temp`, `server/docs`, `server/static` — **`www-data:www-data`**. Файл **`server/.env`**: `chown root:www-data`, `chmod 640`.

## 1. Чистый сервер

```bash
cd /path/to/shelkovitsa/deploy   # или скопируйте скрипты на сервер
chmod +x install-server.sh deploy.sh

export DB_PASSWORD='пароль_роли_БД'
sudo -E ./install-server.sh
```

Заполните **`server/.env`**, затем один раз выполните **[`setup-nginx-ssl.sh`](./setup-nginx-ssl.sh)** (см. [SSL-SETUP.md](./SSL-SETUP.md)) или ручной сценарий из документа.

## 2. Первый деплой

**Вариант A — репозиторий уже склонирован**, есть **`server/.env`**, **`client/.env`**, nginx и сертификат уже настроены (**`setup-nginx-ssl.sh`** один раз выполнен):

```bash
cd /var/www/shelkovitsa/deploy
export DOMAIN=test.shelkovitsa.ru
sudo -E ./deploy.sh
```

**Вариант B — кода на сервере ещё нет:** положите на сервер файл `deploy/deploy.sh` (или весь каталог `deploy/`), задайте URL:

```bash
chmod +x deploy.sh
export GIT_REPO='https://github.com/ваш-орг/shelkovitsa.git'
export GIT_BRANCH=main
sudo -E ./deploy.sh
```

Скрипт клонирует репозиторий в `PROJECT_DIR`. Если после клона нет `server/.env`, шаг остановится — скопируйте `server/.env.example` → `server/.env`, настройте БД и снова запустите `sudo ./deploy.sh` из `deploy/` уже внутри клона.

### Deploy уже запускали, скрипт упал — появился только `server/.env`

Сделайте по порядку (подставьте свой домен, например `test.shelkovitsa.ru`):

1. **`server/.env`** — заполните БД, JWT, `CORS=https://ваш-домен`, `TEMP_PATH`/`DEST_PATH` как в [server/.env.example](../server/.env.example). Права:
   ```bash
   sudo chown root:www-data /var/www/shelkovitsa/server/.env
   sudo chmod 640 /var/www/shelkovitsa/server/.env
   ```

2. **`client/.env`** в каталоге проекта — нужен для сборки фронта (`BASE_URL` читается при `npm run build`):
   ```bash
   cd /var/www/shelkovitsa/client
   sudo cp .env.example .env
   # отредактируйте: BASE_URL=https://ваш-домен  (без /api в конце)
   ```
   Отдельные «секретные» права на `client/.env` обычно не нужны (там публичный URL); достаточно владельца root и `chmod 644`.

3. **DNS** — A-запись домена на IP сервера.

4. **Один раз — nginx и SSL** (пока нет сертификата, полный [`nginx.conf`](./nginx.conf) с путями Let’s Encrypt не заведётся):
   ```bash
   cd /var/www/shelkovitsa/deploy
   chmod +x setup-nginx-ssl.sh issue-ssl.sh
   export PROJECT_DIR=/var/www/shelkovitsa
   export DOMAIN=test.shelkovitsa.ru
   export EMAIL=you@example.com
   sudo -E ./setup-nginx-ssl.sh
   ```
   Поддомен без `www`: `export SERVER_NAMES='test.shelkovitsa.ru'`. Подробности — [`SSL-SETUP.md`](./SSL-SETUP.md).

5. **Деплой приложения** (конфиг nginx при этом **не перезаписывается**):
   ```bash
   export DOMAIN=test.shelkovitsa.ru
   sudo -E ./deploy.sh
   ```

## 3. Обычное обновление

```bash
cd /var/www/shelkovitsa/deploy
sudo ./deploy.sh
```

При необходимости задайте переменные (см. [ниже](#переменные-окружения-и-примеры-запуска)).

## Переменные окружения и примеры запуска

Переменные передаются через **окружение процесса**. Удобные способы:

1. **`export` + `sudo -E`** — `-E` сохраняет ваши `export` при переходе в root (иначе `sudo` их обрежет).
2. **`sudo env VAR=значение … ./скрипт.sh`** — без `export`, всё в одной строке.
3. Несколько переменных: `sudo env A=1 B=2 ./deploy.sh` или несколько `export` подряд и один `sudo -E`.

### `install-server.sh`

| Переменная | По умолчанию | Назначение |
|------------|--------------|------------|
| `DB_PASSWORD` | *(пусто)* | Пароль роли PostgreSQL; без неё блок создания БД пропускается |
| `DB_NAME` | `shelkovitsa` | Имя базы |
| `DB_USER` | `shelkovitsa` | Имя роли в PostgreSQL |
| `NODE_VERSION` | `20.19.5` | Версия Node для `nvm install` |
| `NVM_INSTALL_VERSION` | `v0.40.3` | Тег установщика nvm (скрипт с GitHub) |
| `NVM_DIR` | `/root/.nvm` | Каталог nvm |

**Пример — только пароль БД:**

```bash
export DB_PASSWORD='секретный_пароль'
sudo -E ./install-server.sh
```

**Пример — свои имя базы и пользователя + версия Node:**

```bash
export DB_PASSWORD='секретный_пароль'
export DB_NAME=myshop
export DB_USER=myshop
export NODE_VERSION=20.19.0
sudo -E ./install-server.sh
```

**Пример — через `env` без `export`:**

```bash
sudo env DB_PASSWORD='секрет' DB_USER=shelkovitsa DB_NAME=shelkovitsa NODE_VERSION=20.19.5 ./install-server.sh
```

### `deploy.sh`

| Переменная | По умолчанию | Назначение |
|------------|--------------|------------|
| `PROJECT_DIR` | `/var/www/shelkovitsa` | Корень репозитория на диске |
| `DOMAIN` | `shelkovitsa.ru` | Домен для `NUXT_PUBLIC_API_BASE` в systemd (`https://$DOMAIN`) |
| `GIT_REPO` | *(пусто)* | URL репозитория; нужен, если `PROJECT_DIR` ещё нет и нужен первый `git clone` |
| `GIT_BRANCH` | `main` | Ветка для `clone` / `pull` |

Nginx и пути к сертификатам задаются в **`setup-nginx-ssl.sh`**, не здесь.

**Пример — первый клон и нестандартный каталог:**

```bash
export GIT_REPO='https://github.com/ваш-орг/shelkovitsa.git'
export GIT_BRANCH=main
export PROJECT_DIR=/srv/www/shelkovitsa
export DOMAIN=example.com
sudo -E ./deploy.sh
```

**Пример — обновление уже существующего клона:**

```bash
cd /var/www/shelkovitsa/deploy
export DOMAIN=shop.example.com
sudo -E ./deploy.sh
```

### `setup-nginx-ssl.sh`

| Переменная | По умолчанию | Назначение |
|------------|--------------|------------|
| `PROJECT_DIR` | `/var/www/shelkovitsa` | Где лежит `deploy/nginx.conf` в репозитории |
| `DOMAIN` | *(обязательно)* | Домен для certbot `-d` |
| `EMAIL` | *(обязательно)* | Email для Let's Encrypt |
| `SERVER_NAMES` | `$DOMAIN www.$DOMAIN` | Строка `server_name` в nginx |
| `LETSENCRYPT_LIVE_NAME` | `$DOMAIN` | Каталог `/etc/letsencrypt/live/<имя>/` в шаблоне [`nginx.conf`](./nginx.conf) |
| `WEBROOT` | `/var/www/certbot` | Webroot для ACME |
| `EXTRA_DOMAINS` | *(пусто)* | Дополнительные `-d` для certbot |

```bash
export PROJECT_DIR=/var/www/shelkovitsa DOMAIN=test.shelkovitsa.ru EMAIL=admin@mail.ru
export SERVER_NAMES='test.shelkovitsa.ru'
sudo -E ./setup-nginx-ssl.sh
```

**Пример — одной строкой через `env`:**

```bash
sudo env GIT_REPO='https://github.com/ваш-орг/shelkovitsa.git' GIT_BRANCH=main PROJECT_DIR=/var/www/shelkovitsa ./deploy.sh
```

## Node.js

`install-server.sh` ставит **[nvm](https://github.com/nvm-sh/nvm)** в `/root/.nvm`, затем **`nvm install`** по версии **`NODE_VERSION`** (по умолчанию **20.19.5**). В `/usr/local/bin` создаются ссылки на `node` / `npm` / `npx`, их использует **`deploy.sh`** и systemd.

Переопределение версий — через переменные в таблице выше и примеры для `install-server.sh`.
