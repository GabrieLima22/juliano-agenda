# Multi-stage build: build React app, then serve with Apache + PHP

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci || npm i
COPY . .
# Build with API base defaulting to /api for production
ENV VITE_API_BASE=/api
RUN npm run build

FROM php:8.2-apache
RUN a2dismod mpm_event mpm_worker || true \
 && a2enmod mpm_prefork rewrite \
 && echo "ServerName localhost" > /etc/apache2/conf-available/servername.conf \
 && a2enconf servername \
 && docker-php-ext-install pdo pdo_mysql
WORKDIR /var/www/html

# Copy frontend build and PHP backend
COPY --from=build /app/dist/ ./
COPY --from=build /app/api/ ./api/
COPY --from=build /app/app/ ./app/
COPY --from=build /app/public/ ./public/
COPY docker/apache-start.sh /usr/local/bin/apache-start.sh
RUN chmod +x /usr/local/bin/apache-start.sh

# SPA fallback and basic hardening
COPY <<'HTACCESS' /var/www/html/.htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On

  # Allow API and existing files
  RewriteCond %{REQUEST_URI} ^/api/ [OR]
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Otherwise serve SPA index
  RewriteRule ^ index.html [L]
</IfModule>
HTACCESS

EXPOSE 80
CMD ["/usr/local/bin/apache-start.sh"]

