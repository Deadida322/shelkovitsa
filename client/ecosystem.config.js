module.exports = {
  apps: [
    {
      name: 'shelkovitsa-nuxt',
      script: '.output/server/index.mjs',
      cwd: '/var/www/shelkovitsa/client',
      instances: 'max', // Используем все доступные CPU ядра
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NUXT_PUBLIC_API_BASE: 'https://shelkovitsa.ru/api'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NUXT_PUBLIC_API_BASE: 'https://shelkovitsa.ru/api'
      },
      // Настройки перезапуска
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Логирование
      log_file: '/var/log/pm2/shelkovitsa-nuxt.log',
      out_file: '/var/log/pm2/shelkovitsa-nuxt-out.log',
      error_file: '/var/log/pm2/shelkovitsa-nuxt-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Настройки производительности
      min_uptime: '10s',
      max_restarts: 10,
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Health check
      health_check_grace_period: 3000,
      
      // Дополнительные настройки
      node_args: '--max-old-space-size=1024',
      merge_logs: true,
      time: true
    }
  ],

  // Настройки деплоя
  deploy: {
    production: {
      user: 'www-data',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/shelkovitsa.git',
      path: '/var/www/shelkovitsa',
      'pre-deploy-local': '',
      'post-deploy': 'cd client && npm ci && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
