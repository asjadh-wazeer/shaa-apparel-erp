# ================================================================
# SHAA Apparel ERP — Backend Dockerfile (v2)
# ================================================================
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# ---- Development ----
FROM base AS development
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

# ---- Builder ----
FROM base AS builder
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Production ----
FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
# ts-node needed to run prisma seed on startup
RUN npm install ts-node typescript tsconfig-paths --no-save
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY prisma ./prisma

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs
EXPOSE 3001
CMD ["sh", "-c", "npx prisma db seed && node dist/src/main"]
