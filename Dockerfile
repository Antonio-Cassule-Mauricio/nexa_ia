# Multi-stage production build for NEXA Assistant (Node.js 22 LTS)
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build Vite frontend bundle
COPY . .
RUN npm run build

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend and server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src/types.ts ./src/types.ts

# Persistent directory for WhatsApp session authentication state
RUN mkdir -p /app/data/wa-auth && chown -R node:node /app/data

USER node

EXPOSE 3000

# Start server using tsx
CMD ["npx", "tsx", "server.ts"]
