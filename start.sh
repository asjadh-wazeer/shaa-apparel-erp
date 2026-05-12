#!/bin/bash
set -e

echo "🚀 Starting SHAA Apparel ERP..."

# Copy .env if missing
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ .env created from .env.example"
fi

# Start all containers
docker compose up -d
echo "⏳ Waiting for MySQL to be ready..."

# Wait for MySQL (up to 60 seconds)
RETRIES=30
until docker compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -eq 0 ]; then
    echo "❌ MySQL did not become ready in time."
    docker compose logs mysql | tail -20
    exit 1
  fi
  sleep 2
done
echo "✅ MySQL ready"

# Sync schema to database (db push avoids shadow-DB permission issues)
echo "⏳ Syncing Prisma schema..."
docker compose exec -T backend npx prisma db push --accept-data-loss
echo "✅ Schema synced"

# Seed database
echo "⏳ Seeding database..."
docker compose exec -T backend npx ts-node prisma/seed.ts 2>/dev/null && echo "✅ Database seeded" || echo "⚠️  Seed skipped (already seeded or no seed file)"

echo ""
echo "✅ SHAA Apparel ERP is running!"
echo ""
echo "  Frontend  → http://localhost:3000"
echo "  API       → http://localhost:3001/api/v1"
echo "  API Docs  → http://localhost:3001/api/docs"
echo "  MinIO     → http://localhost:9001"
echo ""
echo "  Login     → admin@shaaapparel.com"
echo "  Password  → Admin@1234"
echo ""
