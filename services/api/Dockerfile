FROM node:20-slim AS base

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Dependencies ──────────────────────────────────────────
FROM base AS deps

# Copy workspace manifests
COPY package.json ./
COPY services/api/package.json ./services/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/

RUN npm install --workspace=services/api --workspace=packages/database --workspace=packages/types

# ── Build ─────────────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY packages/database ./packages/database
COPY packages/types ./packages/types
COPY services/api ./services/api
COPY package.json ./

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build TypeScript
WORKDIR /app/services/api
RUN npm run build

# ── Production image ──────────────────────────────────────
FROM base AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/api/dist ./services/api/dist
COPY --from=builder /app/services/api/package.json ./services/api/

WORKDIR /app/services/api

EXPOSE 4000

# Run migrations then start
CMD npx prisma migrate deploy --schema=../packages/database/prisma/schema.prisma && node dist/index.js
