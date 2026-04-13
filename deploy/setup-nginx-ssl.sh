#!/usr/bin/env bash
#
# Одноразовая настройка: временный nginx (ACME) → certbot → полный deploy/nginx.conf + SSL.
# Запуск только от root. Репозиторий уже должен быть клонирован в PROJECT_DIR (нужен deploy/nginx.conf).
#
#   export PROJECT_DIR=/var/www/shelkovitsa
#   export DOMAIN=test.shelkovitsa.ru
#   export EMAIL=admin@example.com
#   # опционально:
#   # export SERVER_NAMES='test.shelkovitsa.ru'
#   # export LETSENCRYPT_LIVE_NAME='test.shelkovitsa.ru'
#   # export EXTRA_DOMAINS='www.test.shelkovitsa.ru'
#   sudo -E ./setup-nginx-ssl.sh
#
# Дальше деплой только кодом: ./deploy.sh (nginx не перезаписывается).

set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
	echo "Запустите от root: sudo -E $0" >&2
	exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-/var/www/shelkovitsa}"
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
WEBROOT="${WEBROOT:-/var/www/certbot}"

LETSENCRYPT_LIVE_NAME="${LETSENCRYPT_LIVE_NAME:-$DOMAIN}"
SERVER_NAMES="${SERVER_NAMES:-$DOMAIN www.$DOMAIN}"

die() { echo "[setup-nginx-ssl] $*" >&2; exit 1; }
log() { echo "[setup-nginx-ssl] $*"; }

[[ -n "$DOMAIN" ]] || die "задайте DOMAIN"
[[ -n "$EMAIL" ]] || die "задайте EMAIL"
[[ -f "$PROJECT_DIR/deploy/nginx.conf" ]] || die "нет $PROJECT_DIR/deploy/nginx.conf — клонируйте репозиторий в PROJECT_DIR"

mkdir -p "$WEBROOT"
chown -R www-data:www-data "$WEBROOT"

write_from_template() {
	local src="$1"
	local dst="/etc/nginx/nginx.conf"
	[[ -f "$src" ]] || die "нет файла: $src"
	local tmp
	tmp="$(mktemp)"
	sed \
		-e "s|@SERVER_NAMES@|${SERVER_NAMES}|g" \
		-e "s|@LETSENCRYPT_LIVE@|${LETSENCRYPT_LIVE_NAME}|g" \
		"$src" >"$tmp"
	mv "$tmp" "$dst"
	log "записан $dst из $src"
}

log "шаг 1/3: временный nginx (только порт 80, ACME webroot)"
write_from_template "$SCRIPT_DIR/nginx-acme-only.conf"
nginx -t
systemctl reload nginx

log "шаг 2/3: certbot (webroot)"
export DOMAIN EMAIL WEBROOT
export EXTRA_DOMAINS="${EXTRA_DOMAINS:-}"
if [[ -f "$SCRIPT_DIR/issue-ssl.sh" ]]; then
	bash "$SCRIPT_DIR/issue-ssl.sh"
else
	die "нет $SCRIPT_DIR/issue-ssl.sh"
fi

log "шаг 3/3: полный nginx + SSL пути (LETSENCRYPT_LIVE_NAME=$LETSENCRYPT_LIVE_NAME)"
write_from_template "$PROJECT_DIR/deploy/nginx.conf"
nginx -t
systemctl reload nginx

echo ""
log "готово. Дальше только: cd $PROJECT_DIR/deploy && sudo -E ./deploy.sh (nginx не трогается)"
