#!/bin/bash
# Пошаговый скрипт для настройки SSL сертификатов

echo "🔒 Пошаговая настройка SSL сертификатов..."

# Шаг 1: Проверяем текущее состояние
echo "🔍 Шаг 1: Проверка текущего состояния..."
if ! sudo systemctl is-active --quiet nginx; then
    echo "❌ Nginx не запущен. Сначала запустите deploy-http-only.sh"
    exit 1
fi

echo "✅ Nginx работает"

# Шаг 2: Устанавливаем certbot
echo "📦 Шаг 2: Установка certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
    echo "✅ Certbot установлен"
else
    echo "✅ Certbot уже установлен"
fi

# Шаг 3: Получаем домен
echo "🌐 Шаг 3: Ввод домена..."
echo "Введите ваш домен (например: shelkovitsa.ru):"
read -p "Домен: " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ Домен не указан"
    exit 1
fi

echo "✅ Домен: $DOMAIN"

# Шаг 4: Получаем SSL сертификаты
echo "🔐 Шаг 4: Получение SSL сертификатов..."
echo "Получение сертификата для $DOMAIN и www.$DOMAIN..."

# Используем standalone режим для получения сертификатов
sudo certbot certonly --standalone -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN"

# Проверяем результат
if [ $? -eq 0 ]; then
    echo "✅ SSL сертификаты успешно получены!"
    
    # Шаг 5: Проверяем сертификаты
    echo "🔍 Шаг 5: Проверка сертификатов..."
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        echo "✅ Сертификат найден: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    else
        echo "❌ Сертификат не найден"
        exit 1
    fi
    
    # Шаг 6: Создаем конфигурацию nginx с SSL
    echo "🔧 Шаг 6: Создание конфигурации nginx с SSL..."
    
    # Создаем временную конфигурацию с правильными путями к сертификатам
    cat > /tmp/nginx-ssl-temp.conf << EOF
# Основные настройки
user www-data;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    server_tokens off;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone \$binary_remote_addr zone=frontend:10m rate=20r/s;
    
    upstream api_backend {
        server 127.0.0.1:8000;
        keepalive 32;
    }
    
    upstream nuxt_backend {
        server 127.0.0.1:3000;
        keepalive 32;
    }
    
    # HTTP сервер с редиректом на HTTPS
    server {
        listen 80;
        server_name $DOMAIN www.$DOMAIN;
        return 301 https://\$server_name\$request_uri;
    }
    
    # HTTPS сервер
    server {
        listen 443 ssl http2;
        server_name $DOMAIN www.$DOMAIN;
        
        # SSL сертификаты Let's Encrypt
        ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
        
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        
        # API маршруты
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
        }
        
        location /static/ {
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            try_files \$uri @nuxt;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        location ~* \.(ico|webmanifest)\$ {
            try_files \$uri @nuxt;
            expires 1y;
            add_header Cache-Control "public";
        }
        
        location / {
            limit_req zone=frontend burst=50 nodelay;
            proxy_pass http://nuxt_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
        }
        
        location @nuxt {
            proxy_pass http://nuxt_backend;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        location ~ /\. {
            deny all;
            access_log off;
            log_not_found off;
        }
        
        location ~ /(\.env|\.git|node_modules|package\.json|yarn\.lock|package-lock\.json) {
            deny all;
            access_log off;
            log_not_found off;
        }
        
        error_page 404 /404.html;
        error_page 500 502 503 504 /50x.html;
        
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
EOF

    # Копируем временную конфигурацию
    sudo cp /tmp/nginx-ssl-temp.conf /etc/nginx/nginx.conf
    rm /tmp/nginx-ssl-temp.conf
    
    # Шаг 7: Проверяем конфигурацию
    echo "🔍 Шаг 7: Проверка конфигурации nginx..."
    if sudo nginx -t; then
        echo "✅ Конфигурация nginx с SSL корректна"
        sudo systemctl reload nginx
        echo "🎉 SSL настроен успешно!"
        echo "🌐 HTTP: http://$DOMAIN (редирект на HTTPS)"
        echo "🌐 HTTPS: https://$DOMAIN"
    else
        echo "❌ Ошибка в конфигурации nginx с SSL"
        echo "📋 Детали ошибки:"
        sudo nginx -t
        echo "🔄 Возвращаемся к HTTP конфигурации..."
        sudo cp ../deploy/nginx-http-only.conf /etc/nginx/nginx.conf
        sudo systemctl reload nginx
        exit 1
    fi
    
else
    echo "❌ Ошибка при получении SSL сертификатов"
    echo "💡 Убедитесь, что:"
    echo "   - Домен указывает на ваш сервер"
    echo "   - Порт 80 открыт"
    echo "   - Nginx работает"
    exit 1
fi

echo ""
echo "🔒 SSL настройка завершена!"
echo "📊 Проверка сертификата: sudo certbot certificates"
echo "🔄 Автообновление: sudo certbot renew --dry-run"
