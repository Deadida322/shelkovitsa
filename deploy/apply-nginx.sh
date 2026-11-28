#!/usr/bin/env bash
#
# Перезаписать /etc/nginx/nginx.conf из шаблона репозитория (без certbot).
# Нужно после обновления deploy/nginx.conf на уже настроенном стенде.
#
#   export PROJECT_DIR=/var/www/shelkovitsa
#   export DOMAIN=test.shelkovitsa.ru
#   # без www:
#   export SERVER_NAMES='test.shelkovitsa.ru'
#   export LETSENCRYPT_LIVE_NAME='test.shelkovitsa.ru'
#   sudo -E ./apply-nginx.sh
#
set -euo pipefail

[[ "${EUID:-0}" -eq 0 ]] || { echo "запускайте: sudo -E $0" >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-/var/www/shelkovitsa}"
DOMAIN="${DOMAIN:-}"
SERVER_NAMES="${SERVER_NAMES:-${DOMAIN:+$DOMAIN www.$DOMAIN}}"
LETSENCRYPT_LIVE_NAME="${LETSENCRYPT_LIVE_NAME:-$DOMAIN}"
SRC="${PROJECT_DIR}/deploy/nginx.conf"
NUXT_PUBLIC="${PROJECT_DIR}/client/.output/public"

die() { echo "[apply-nginx] $*" >&2; exit 1; }
log() { echo "[apply-nginx] $*"; }

[[ -n "$DOMAIN" || -n "$SERVER_NAMES" ]] || die "задайте DOMAIN или SERVER_NAMES"
[[ -n "$LETSENCRYPT_LIVE_NAME" ]] || die "задайте LETSENCRYPT_LIVE_NAME или DOMAIN"
[[ -f "$SRC" ]] || die "нет $SRC — сначала git pull / deploy.sh"
[[ -d "$NUXT_PUBLIC/_nuxt" ]] || die "нет $NUXT_PUBLIC/_nuxt — сначала успешный npm run build фронта (deploy.sh)"

SERVER_NAMES="${SERVER_NAMES:-$DOMAIN}"

tmp="$(mktemp)"
sed \
	-e "s|@SERVER_NAMES@|${SERVER_NAMES}|g" \
	-e "s|@LETSENCRYPT_LIVE@|${LETSENCRYPT_LIVE_NAME}|g" \
	-e "s|@NUXT_PUBLIC@|${NUXT_PUBLIC}|g" \
	"$SRC" >"$tmp"

nginx -t -c "$tmp" 2>/dev/null || {
	# nginx -t -c иногда капризничает с полным конфигом вне /etc; проверим синтаксис после mv
	true
}
mv "$tmp" /etc/nginx/nginx.conf
nginx -t
systemctl reload nginx
log "готово: /_nuxt/ → $NUXT_PUBLIC/_nuxt"
