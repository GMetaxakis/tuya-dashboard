ARG BUILD_FROM=node:20-alpine

# Build stage
FROM node:20-alpine AS builder
RUN apk add --no-cache git
WORKDIR /app
RUN git clone --depth 1 https://github.com/GMetaxakis/tuya-dashboard.git .
RUN npm ci && npm run build

# Production stage
FROM ${BUILD_FROM}

# Install Node.js if not using node base image (for HA base images)
RUN apk add --no-cache nodejs npm || true

WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# HA add-on ingress support
COPY run.sh /
RUN chmod a+x /run.sh

EXPOSE 3000
CMD ["/run.sh"]
