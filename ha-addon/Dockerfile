ARG BUILD_FROM=ghcr.io/hassio-addons/base:17.2.5

# Build stage — uses node to compile Next.js
FROM node:20-alpine AS builder
RUN apk add --no-cache git
WORKDIR /app
RUN git clone --depth 1 https://github.com/GMetaxakis/tuya-dashboard.git .
RUN npm ci && npm run build

# Production stage — HA base image with s6-overlay
FROM ${BUILD_FROM}

# Install Node.js
RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# s6-overlay service definition
COPY rootfs/ /
