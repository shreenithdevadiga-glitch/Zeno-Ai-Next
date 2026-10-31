# ============================================================
# Stage 1: Build Frontend SPA
# ============================================================
FROM node:22-alpine AS client-builder
WORKDIR /build/client

# Install frontend dependencies
COPY client/package*.json ./
RUN npm ci

# Copy frontend source and compile static distribution
COPY client/ ./
RUN npm run build

# ============================================================
# Stage 2: Production Server Runner
# ============================================================
FROM node:22-alpine AS runner
WORKDIR /app

# Install security certificates & lightweight init
RUN apk add --no-cache ca-certificates dumb-init

ENV NODE_ENV=production
ENV PORT=3000

# Install production server dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application server and database migration files
COPY server/ ./server/
COPY .env.example ./.env.example

# Copy compiled frontend from client-builder stage
COPY --from=client-builder /build/client/dist ./client/dist

# Setup non-root persistent data and uploads directories
RUN mkdir -p /app/uploads /app/data /tmp/zeno-sandboxes \
    && chown -R node:node /app /tmp/zeno-sandboxes

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server/index.js"]
