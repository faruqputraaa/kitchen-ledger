# Production Backend - Multi-stage build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy ONLY server package files + lockfile
COPY package*.json ./
COPY package-lock.json ./

# Install ONLY server deps
RUN npm ci --omit=dev

# Copy server source
COPY src ./src

# Production image
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN mkdir -p /app/src/logs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000
ENV NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]