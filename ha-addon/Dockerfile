ARG BUILD_FROM

# Build stage
FROM node:20-alpine AS builder
RUN apk add --no-cache git
WORKDIR /app
RUN git clone --depth 1 https://github.com/GMetaxakis/tuya-dashboard.git .
RUN npm ci && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# HA Supervisor forces /init as entrypoint and /run.sh as CMD.
# Provide both as simple pass-throughs to node.
RUN printf '#!/bin/sh\nexec "$@"\n' > /init && chmod +x /init
RUN printf '#!/bin/sh\nexec node /app/server.js\n' > /run.sh && chmod +x /run.sh
