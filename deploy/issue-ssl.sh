#!/usr/bin/env bash
#
# Выпуск сертификата Let's Encrypt (webroot) — только от root.
# До запуска: DNS A на этот сервер, nginx слушает 80, каталог WEBROOT существует
# (install-server.sh создаёт /var/www/certbot).
#
#   export DOMAIN=test.shelkovitsa.ru
#   export EMAIL=admin@example.com
#   sudo -E ./issue-ssl.sh
#
# Дополнительные имена (например www):
#   export EXTRA_DOMAINS='www.test.shelkovitsa.ru'
#   sudo -E ./issue-ssl.sh
#
# После выпуска проверьте имя каталога: sudo certbot certificates
# Оно должно совпадать с LETSENCRYPT_LIVE_NAME при deploy.sh (по умолчанию = DOMAIN).

set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
	echo "Запустите от root: sudo -E $0" >&2
	exit 1
fi

DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
WEBROOT="${WEBROOT:-/var/www/certbot}"

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
	echo "Задайте: export DOMAIN=ваш.домен EMAIL=you@mail && sudo -E $0" >&2
	exit 1
fi

mkdir -p "$WEBROOT"
chown -R www-data:www-data "$WEBROOT"

cert_cmd=(
	certbot certonly
	--webroot
	-w "$WEBROOT"
	--email "$EMAIL"
	--agree-tos
	--non-interactive
	-d "$DOMAIN"
)

if [[ -n "${EXTRA_DOMAINS:-}" ]]; then
	for d in $EXTRA_DOMAINS; do
		cert_cmd+=( -d "$d" )
	done
fi

echo "==> ${cert_cmd[*]}"
"${cert_cmd[@]}"

echo ""
echo "==> sudo certbot certificates"
certbot certificates
echo ""
echo "Имя каталога live/ нужно для setup-nginx-ssl.sh: переменная LETSENCRYPT_LIVE_NAME (шаг полного nginx)."
