FROM nginx:alpine

# Install PHP untuk API
RUN apk add --no-cache \
    php82 \
    php82-fpm \
    php82-pdo \
    php82-pdo_mysql \
    php82-json \
    php82-session

# Copy application files
COPY . /usr/share/nginx/html/

# Remove unnecessary files
RUN rm -f /usr/share/nginx/html/docker-compose*.yml \
    && rm -f /usr/share/nginx/html/Dockerfile* \
    && rm -f /usr/share/nginx/html/.dockerignore \
    && rm -f /usr/share/nginx/html/setup*.sh \
    && rm -f /usr/share/nginx/html/health-check.sh \
    && rm -f /usr/share/nginx/html/fix-network.sh \
    && rm -f /usr/share/nginx/html/apache.conf \
    && rm -f /usr/share/nginx/html/nginx.conf \
    && rm -f /usr/share/nginx/html/diagnose.sh \
    && rm -f /usr/share/nginx/html/database.sql \
    && rm -f /usr/share/nginx/html/test.html

# Create nginx config with PHP support using printf
RUN printf 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html index.htm;\n\
\n\
    location / {\n\
        try_files $uri $uri/ =404;\n\
    }\n\
\n\
    location ~ \.php$ {\n\
        fastcgi_pass 127.0.0.1:9000;\n\
        fastcgi_index index.php;\n\
        include fastcgi_params;\n\
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;\n\
    }\n\
\n\
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

# Configure PHP-FPM
RUN sed -i 's/listen = \/run\/php\/php82-fpm.sock/listen = 127.0.0.1:9000/' /etc/php82/php-fpm.d/www.conf

# Set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

# Create start script
RUN printf '#!/bin/sh\n\
echo "Starting CE Exam System with PHP support..."\n\
echo "Starting PHP-FPM..."\n\
php-fpm82 -D\n\
echo "Starting Nginx..."\n\
nginx -g "daemon off;"\n' > /start.sh && chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]