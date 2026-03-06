ARG BUILD_FROM

# Build stage
FROM node:20-alpine AS builder
RUN apk add --no-cache git
WORKDIR /app
RUN git clone --depth 1 https://github.com/GMetaxakis/tuya-dashboard.git .
RUN npm ci && npm run build

# Production stage — plain alpine, no s6-overlay
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

ENTRYPOINT []
CMD ["node", "server.js"]
