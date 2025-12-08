# Install dependencies only when needed
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build the app
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# Production image with Nginx for large file upload support
FROM node:20-alpine AS runner
WORKDIR /app

# Install Nginx and supervisor to run both services
RUN apk add --no-cache nginx supervisor

ENV NODE_ENV=production

# Copy build and node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Create Nginx config for 500MB uploads (Nginx on 3000 -> Node on 3001)
RUN mkdir -p /etc/nginx/http.d /run/nginx
RUN echo 'server { \
    listen 3000; \
    server_name _; \
    client_max_body_size 500M; \
    client_body_buffer_size 128M; \
    proxy_connect_timeout 300s; \
    proxy_send_timeout 300s; \
    proxy_read_timeout 300s; \
    \
    # Serve uploads directly from disk (bypasses Next.js) \
    location /uploads/ { \
        alias /app/public/uploads/; \
        try_files $uri $uri/ =404; \
        expires 30d; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Proxy everything else to Next.js \
    location / { \
        proxy_pass http://127.0.0.1:3001; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_cache_bypass $http_upgrade; \
    } \
}' > /etc/nginx/http.d/default.conf

# Create supervisor config to run both Nginx and Node.js
RUN mkdir -p /etc/supervisor.d /var/log/supervisor
RUN echo -e '[supervisord]\nnodaemon=true\nlogfile=/var/log/supervisor/supervisord.log\n\n[program:nginx]\ncommand=nginx -g "daemon off;"\nautostart=true\nautorestart=true\nstdout_logfile=/dev/stdout\nstdout_logfile_maxbytes=0\nstderr_logfile=/dev/stderr\nstderr_logfile_maxbytes=0\n\n[program:nextjs]\ncommand=sh -c "PORT=3001 npm run start"\ndirectory=/app\nautostart=true\nautorestart=true\nstdout_logfile=/dev/stdout\nstdout_logfile_maxbytes=0\nstderr_logfile=/dev/stderr\nstderr_logfile_maxbytes=0' > /etc/supervisor.d/app.ini

# Create uploads directory
RUN mkdir -p /app/public/uploads/inputs

# Still expose 3000 - no port change!
EXPOSE 3000
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
