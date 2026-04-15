#!/usr/bin/env bash
#
# Деплой: обновление кода из Git, сборка, миграции, перезапуск systemd.
# Только от root: sudo ./deploy.sh
#
# Первый запуск (клона ещё нет):
#   export GIT_REPO='https://github.com/org/shelkovitsa.git'
#   sudo -E ./deploy.sh
#
# Дальше: скрипт делает git pull в PROJECT_DIR.
#
# Переменные (опционально):
#   PROJECT_DIR   /var/www/shelkovitsa
#   DOMAIN        для NUXT_PUBLIC_API_BASE в systemd (https://$DOMAIN)
#   GIT_BRANCH    main
#
# Nginx и SSL один раз: setup-nginx-ssl.sh (не этот скрипт).
#
# Пользователи: root — деплой; www-data — Node и воркеры nginx.
#

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/shelkovitsa}"
DOMAIN="${DOMAIN:-shelkovitsa.ru}"
GIT_BRANCH="${GIT_BRANCH:-main}"

log() { echo "[deploy] $*"; }
die() { echo "[deploy] Ошибка: $*" >&2; exit 1; }

[[ "${EUID:-0}" -eq 0 ]] || die "запускайте от root: sudo $0"

sync_repo() {
	if [[ -d "${PROJECT_DIR}/.git" ]]; then
		log "git pull ($GIT_BRANCH)"
		git -C "$PROJECT_DIR" fetch origin
		git -C "$PROJECT_DIR" checkout "$GIT_BRANCH"
		git -C "$PROJECT_DIR" pull --ff-only origin "$GIT_BRANCH" || git -C "$PROJECT_DIR" pull origin "$GIT_BRANCH"
	elif [[ ! -e "$PROJECT_DIR" ]]; then
		[[ -n "${GIT_REPO:-}" ]] || die "задайте GIT_REPO или клонируйте репозиторий в $PROJECT_DIR вручную"
		log "git clone -> $PROJECT_DIR"
		mkdir -p "$(dirname "$PROJECT_DIR")"
		git clone -b "$GIT_BRANCH" "$GIT_REPO" "$PROJECT_DIR"
	else
		die "каталог $PROJECT_DIR есть, но нет .git — удалите каталог или клонируйте репозиторий"
	fi
}

# Хранилище загрузок вне каталога проекта (как в server/.env: TEMP_PATH=/temp/src, DEST_PATH=/temp/dist).
# Плюс docs/static внутри репозитория (если используются).
prepare_server_writable_dirs() {
	log "каталоги /temp/src, /temp/dist — вне проекта; server/docs, server/static — при необходимости; владелец www-data"
	mkdir -p /temp/src /temp/dist
	chown -R www-data:www-data /temp
	chmod -R 755 /temp

	local s="$PROJECT_DIR/server"
	if [[ -d "$s" ]]; then
		mkdir -p "$s/docs" "$s/static"
		chown -R www-data:www-data "$s/docs" "$s/static"
		chmod -R 755 "$s/docs" "$s/static"
	fi
}

apply_permissions() {
	log "права: каталоги 755, файлы 644; .git и node_modules не трогаем (иначе git status — mass mode change). Скрипты в репо не chmod: запуск с другого пути — bash /path/to/script.sh"
	cd "$PROJECT_DIR" || die "нет каталога $PROJECT_DIR"
	find . \( -name .git -o -name node_modules \) -prune -o -type d -exec chmod 755 {} +
	find . \( -name .git -o -name node_modules \) -prune -o -type f -exec chmod 644 {} +
	prepare_server_writable_dirs
}

write_systemd_units() {
	log "systemd: shelkovitsa-backend, shelkovitsa-frontend (User=www-data)"
	cat > /etc/systemd/system/shelkovitsa-backend.service <<EOF
[Unit]
Description=Shelkovitsa Backend (NestJS)
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$PROJECT_DIR/server
ExecStart=/usr/local/bin/node dist/main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=8000
Environment=HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
EOF

	cat > /etc/systemd/system/shelkovitsa-frontend.service <<EOF
[Unit]
Description=Shelkovitsa Frontend (Nuxt)
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$PROJECT_DIR/client
ExecStart=/usr/local/bin/node .output/server/index.mjs
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=0.0.0.0
Environment=NUXT_PUBLIC_API_BASE=https://$DOMAIN

[Install]
WantedBy=multi-user.target
EOF
}

log "начало (PROJECT_DIR=$PROJECT_DIR DOMAIN=$DOMAIN)"
sync_repo
prepare_server_writable_dirs

[[ -f "$PROJECT_DIR/server/.env" ]] || die "нет $PROJECT_DIR/server/.env — скопируйте из .env.example и настройте БД"

apply_permissions

log "backend: npm ci, build"
cd "$PROJECT_DIR/server"
npm ci
npm run build

log "миграции БД"
npx typeorm-ts-node-esm migration:run -d dist/db/datasource.js

log "временный backend для сборки frontend"
cd "$PROJECT_DIR/server"
PORT=8000 HOST=0.0.0.0 nohup /usr/local/bin/node dist/main.js > /tmp/shelkovitsa-backend-temp.log 2>&1 &
BACKEND_PID=$!
sleep 8
for i in $(seq 1 30); do
	if curl -sf "http://127.0.0.1:8000/api/benefit" >/dev/null 2>&1; then
		log "backend отвечает"
		break
	fi
	sleep 2
done

log "frontend: npm ci, build"
cd "$PROJECT_DIR/client"
npm ci
npm run build

rm -rf /var/cache/nginx/* 2>/dev/null || true
systemctl reload nginx

log "остановка временного backend (pid $BACKEND_PID)"
kill "$BACKEND_PID" 2>/dev/null || true

write_systemd_units
systemctl daemon-reload
systemctl enable shelkovitsa-backend shelkovitsa-frontend
systemctl stop shelkovitsa-backend 2>/dev/null || true
systemctl stop shelkovitsa-frontend 2>/dev/null || true
sleep 2
systemctl start shelkovitsa-backend
systemctl start shelkovitsa-frontend

log "готово"
systemctl is-active shelkovitsa-backend && systemctl is-active shelkovitsa-frontend && systemctl is-active nginx
log "проверка: journalctl -u shelkovitsa-backend -n 20 --no-pager"
