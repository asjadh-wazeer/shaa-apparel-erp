# ============================================================
# SHAA Apparel ERP — Developer Makefile
# ============================================================

.PHONY: help up down build logs shell-backend shell-frontend db-migrate db-seed db-reset

help:
	@echo "SHAA Apparel ERP — Available Commands:"
	@echo ""
	@echo "  make up              Start all services (dev)"
	@echo "  make down            Stop all services"
	@echo "  make build           Rebuild all Docker images"
	@echo "  make logs            Tail logs for all services"
	@echo "  make db-migrate      Run Prisma migrations"
	@echo "  make db-seed         Run Prisma seed script"
	@echo "  make db-reset        Reset database and re-seed"
	@echo "  make shell-backend   Open shell in backend container"
	@echo "  make shell-frontend  Open shell in frontend container"
	@echo "  make install         Install deps for backend + frontend"

up:
	cp -n .env.example .env 2>/dev/null || true
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build --no-cache

logs:
	docker-compose logs -f

db-migrate:
	docker-compose exec backend npx prisma migrate dev

db-seed:
	docker-compose exec backend npx ts-node prisma/seed.ts

db-reset:
	docker-compose exec backend npx prisma migrate reset --force
	make db-seed

shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

install:
	cd backend && npm install
	cd frontend && npm install

type-check:
	cd backend && npx tsc --noEmit
	cd frontend && npm run type-check

lint:
	cd backend && npm run lint
	cd frontend && npm run lint
