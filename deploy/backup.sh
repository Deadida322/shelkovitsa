#!/usr/bin/env bash
#
# Бэкап: дамп PostgreSQL (pg_dump, custom-формат) + архив загруженных картинок.
# Параметры БД и путь к картинкам берутся из server/.env.
#
# Запуск вручную:  sudo ./backup.sh
# По расписанию (каждую ночь в 03:30), от root:
#   echo '30 3 * * * root /var/www/shelkovitsa/deploy/backup.sh >> /var/log/shelkovitsa-backup.log 2>&1' \
#     > /etc/cron.d/shelkovitsa-backup
#
# Восстановление БД:
#   pg_restore --clean --if-exists -h localhost -U <DB_USER> -d <DB_NAME> <файл>.dump
# Восстановление картинок:
#   tar -xzf <файл>-static.tar.gz -C /
#
# Переменные (опционально):
#   PROJECT_DIR   /var/www/shelkovitsa
#   ENV_FILE      $PROJECT_DIR/server/.env
#   BACKUP_DIR    /var/backups/shelkovitsa
#   KEEP_DAYS     14 — сколько дней хранить бэкапы
#
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/shelkovitsa}"
ENV_FILE="${ENV_FILE:-$PROJECT_DIR/server/.env}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/shelkovitsa}"
KEEP_DAYS="${KEEP_DAYS:-14}"

log() { echo "[backup $(date '+%F %T')] $*"; }
die() { log "ОШИБКА: $*"; exit 1; }

[[ -f "$ENV_FILE" ]] || die "нет $ENV_FILE"

# Читаем только нужные ключи, без source: .env может содержать произвольные строки
env_value() {
	local value
	value="$(grep -E "^$1=" "$ENV_FILE" | tail -n1 | cut -d= -f2- || true)"
	value="${value%$'\r'}"
	value="${value#\"}"; value="${value%\"}"
	value="${value#\'}"; value="${value%\'}"
	printf '%s' "$value"
}

DB_HOST="$(env_value DB_HOST)"
DB_PORT="$(env_value DB_PORT)"
DB_USER="$(env_value DB_USER)"
DB_NAME="$(env_value DB_NAME)"
DEST_PATH="$(env_value DEST_PATH)"
export PGPASSWORD
PGPASSWORD="$(env_value DB_PASSWORD)"

[[ -n "$DB_NAME" && -n "$DB_USER" ]] || die "в $ENV_FILE не заданы DB_NAME/DB_USER"
command -v pg_dump >/dev/null || die "pg_dump не найден"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
stamp="$(date '+%Y%m%d-%H%M%S')"
prefix="$BACKUP_DIR/${DB_NAME}-${stamp}"

log "дамп БД $DB_NAME → ${prefix}.dump"
pg_dump -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "$DB_USER" \
	--format=custom --no-owner --file="${prefix}.dump.part" "$DB_NAME"
mv "${prefix}.dump.part" "${prefix}.dump"

if [[ -n "$DEST_PATH" && -d "$DEST_PATH" ]]; then
	log "архив картинок $DEST_PATH → ${prefix}-static.tar.gz"
	tar -czf "${prefix}-static.tar.gz.part" -P "$DEST_PATH"
	mv "${prefix}-static.tar.gz.part" "${prefix}-static.tar.gz"
else
	log "каталог картинок не найден (DEST_PATH=${DEST_PATH:-не задан}), пропускаю"
fi

log "удаляю бэкапы старше $KEEP_DAYS дней"
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name '*.dump' -o -name '*-static.tar.gz' \) \
	-mtime +"$KEEP_DAYS" -print -delete

log "готово: $(du -sh "$BACKUP_DIR" | cut -f1) в $BACKUP_DIR"
