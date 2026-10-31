# ZENO AI NEXT — Production Deployment Guide

## 1. Production Docker Containerization

Create a `Dockerfile` in the root directory:

```dockerfile
FROM node:24-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
RUN npm install
RUN cd client && npm install

COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/uploads ./uploads

EXPOSE 3000
CMD ["node", "server/index.js"]
```

Build and run:
```bash
docker build -t zeno-ai-next .
docker run -p 3000:3000 -v $(pwd)/data:/app/data --env-file .env zeno-ai-next
```

---

## 2. Nginx Reverse Proxy Configuration (Critical for SSE)

When using Nginx, SSE requires disabling proxy buffering:

```nginx
server {
    listen 80;
    server_name zeno.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name zeno.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/zeno.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zeno.yourdomain.com/privkey.pem;

    client_max_body_size 35M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        
        # SSE Streaming requirements:
        proxy_set_header Connection '';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }
}
```

---

## 3. Systemd Service Setup (Linux)

Create `/etc/systemd/system/zeno-ai.service`:

```ini
[Unit]
Description=ZENO AI NEXT Production Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/zeno-ai-next
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/var/www/zeno-ai-next/.env

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable zeno-ai
sudo systemctl start zeno-ai
```
