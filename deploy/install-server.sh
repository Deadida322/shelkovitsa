#!/usr/bin/env bash
#
# Установка зависимостей ОС на чистом Ubuntu (24.04 LTS / 22.04).
# Запуск только от root: sudo ./install-server.sh
#
# Перед запуском задайте пароль для роли PostgreSQL приложения:
#   export DB_PASSWORD='секрет'
#   sudo -E ./install-server.sh
#
# Опционально: DB_NAME, DB_USER (по умолчанию shelkovitsa / shelkovitsa).
# Node: NVM_INSTALL_VERSION (тег nvm, по умолчанию v0.40.3), NODE_VERSION (например 20.19.5), NVM_DIR (/root/.nvm).
#
# Модель пользователей:
#   root     — этот скрипт, apt, certbot, правки /etc
#   postgres — системный пользователь демона PostgreSQL
#   www-data — Nginx (воркеры) и позже Node через systemd (см. deploy.sh)
#

set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
	echo "Запустите от root: sudo $0" >&2
	exit 1
fi

export DEBIAN_FRONTEND=noninteractive

DB_NAME="${DB_NAME:-shelkovitsa}"
DB_USER="${DB_USER:-shelkovitsa}"
DB_PASSWORD="${DB_PASSWORD:-}"

echo "==> apt: update и upgrade"
apt-get update -y
apt-get upgrade -y

echo "==> apt: curl и build-essential (для установки nvm и сборки нативных модулей npm)"
apt-get install -y curl build-essential ca-certificates

echo "==> nvm и Node.js"
export NVM_DIR="${NVM_DIR:-/root/.nvm}"
NVM_INSTALL_VERSION="${NVM_INSTALL_VERSION:-v0.40.3}"
NODE_VERSION="${NODE_VERSION:-20.19.5}"

if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
	echo "    установка nvm ($NVM_INSTALL_VERSION)"
	curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_INSTALL_VERSION}/install.sh" | bash
fi

set +u
# shellcheck disable=SC1091
source "$NVM_DIR/nvm.sh"
set -u

echo "    nvm install $NODE_VERSION"
nvm install "$NODE_VERSION"
nvm alias default "$NODE_VERSION"
nvm use default

mkdir -p /usr/local/bin
# Релиз целиком в /opt: systemd (User=www-data) не может exec через /root/.nvm/... (каталог /root закрыт).
# Одного bin/node в /usr/local недостаточно — у бинаря RPATH на ../lib (libnode и т.д.).
NODE_VERSION_ROOT="$(dirname "$(dirname "$(command -v node)")")"
OPT_NODE="/opt/node-${NODE_VERSION}"
echo "    копия ${NODE_VERSION_ROOT} -> ${OPT_NODE}"
rm -rf "${OPT_NODE}"
cp -a "${NODE_VERSION_ROOT}" "${OPT_NODE}"
chown -R root:root "${OPT_NODE}"
find "${OPT_NODE}" -type d -exec chmod 755 {} \;
if [[ -d "${OPT_NODE}/bin" ]]; then find "${OPT_NODE}/bin" -maxdepth 1 -type f -exec chmod 755 {} \;; fi
[[ -d "${OPT_NODE}/lib" ]] && chmod -R a+r "${OPT_NODE}/lib"
ln -sf "${OPT_NODE}/bin/node" /usr/local/bin/node
ln -sf "${OPT_NODE}/bin/npm" /usr/local/bin/npm
ln -sf "${OPT_NODE}/bin/npx" /usr/local/bin/npx
echo "    /usr/local/bin/{node,npm,npx} -> ${OPT_NODE}/bin/"

echo "==> apt: nginx, PostgreSQL, git, certbot"
apt-get install -y \
	git \
	gnupg \
	nginx \
	postgresql \
	postgresql-contrib \
	certbot \
	python3-certbot-nginx

echo "==> Каталог для ACME webroot"
mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www/certbot

if [[ -n "$DB_PASSWORD" ]]; then
	echo "==> PostgreSQL: роль и база (user=$DB_USER db=$DB_NAME)"
	if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
		sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE USER \"${DB_USER}\" WITH PASSWORD '${DB_PASSWORD}';"
	else
		sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER USER \"${DB_USER}\" WITH PASSWORD '${DB_PASSWORD}';"
	fi
	if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
		sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
	fi
	sudo -u postgres psql -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON DATABASE \"${DB_NAME}\" TO \"${DB_USER}\";"
	sudo -u postgres psql -v ON_ERROR_STOP=1 -d "${DB_NAME}" <<SQL
GRANT ALL ON SCHEMA public TO "${DB_USER}";
GRANT CREATE ON SCHEMA public TO "${DB_USER}";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${DB_USER}";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${DB_USER}";
SQL
	echo "    Укажите в server/.env: DB_HOST=localhost DB_PORT=5432 DB_USER DB_PASSWORD DB_NAME"
else
	echo "==> PostgreSQL: пропуск (задайте DB_PASSWORD и перезапустите скрипт для создания БД)"
fi

echo "==> Версии"
node -v
nginx -v
psql --version

echo ""
echo "Дальше:"
echo "  (Этот скрипт НЕ клонирует Git — переменная GIT_REPO здесь не используется.)"
echo "  1) Код в PROJECT_DIR: git clone или deploy/deploy.sh + GIT_REPO (см. README)"
echo "  2) server/.env, client/.env — затем один раз: deploy/setup-nginx-ssl.sh (nginx + сертификат)"
echo "  3) Деплой приложения: deploy/deploy.sh (nginx уже не меняет)"
