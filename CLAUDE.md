# SHAA Apparel ERP — Architecture Governance

## Overview

Production-grade Garment Manufacturing ERP + SaaS platform. Multi-tenant, subscription-based, real-time capable. Designed for garment factories worldwide.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5, TailwindCSS, Redux Toolkit, RTK Query, React Hook Form, Zod, React Router v6 |
| Backend | NestJS 10, Prisma ORM, MySQL 8, Redis, BullMQ |
| Auth | JWT (access + refresh), RBAC, Permission guards |
| Realtime | WebSocket (Socket.io via NestJS Gateway) |
| Storage | MinIO / S3-compatible |
| Infra | Docker, Docker Compose, Nginx |
| Charts | Recharts |

---

## Folder Structure Standards

### Backend (`backend/src/`)

```
src/
├── config/               # Environment-driven configuration factories
├── common/
│   ├── constants/        # App-wide string/enum constants
│   ├── decorators/       # Custom param/class decorators
│   ├── dto/              # Shared DTOs (pagination, filtering)
│   ├── enums/            # TypeScript enums
│   ├── exceptions/       # Domain-specific exceptions
│   ├── filters/          # Global exception filters
│   ├── guards/           # Auth, RBAC, tenant guards
│   ├── interceptors/     # Logging, transform, audit interceptors
│   ├── interfaces/       # Shared TypeScript interfaces
│   ├── pipes/            # Validation, transform pipes
│   └── utils/            # Pure utility functions
├── database/             # PrismaService, database utilities
├── gateways/             # WebSocket gateways
└── modules/              # Feature modules (domain-driven)
    └── <domain>/
        ├── dto/
        ├── entities/
        ├── interfaces/
        ├── <domain>.controller.ts
        ├── <domain>.service.ts
        ├── <domain>.repository.ts
        └── <domain>.module.ts
```

### Frontend (`frontend/src/`)

```
src/
├── api/                  # RTK Query base API slice
├── store/                # Redux store, root reducer, middleware
├── routes/               # Router config, ProtectedRoute, role guards
├── shared/
│   ├── components/
│   │   ├── ui/           # Atomic UI primitives (Button, Input, Badge…)
│   │   ├── forms/        # Reusable form fields and form containers
│   │   ├── layout/       # AppLayout, Sidebar, Header, PageHeader
│   │   ├── table/        # DataTable, columns, pagination
│   │   ├── modal/        # ModalProvider, useModal, ConfirmDialog
│   │   └── feedback/     # Toast, LoadingState, ErrorState, EmptyState
│   ├── hooks/            # Shared custom hooks
│   ├── utils/            # Pure utilities (formatters, validators)
│   ├── constants/        # App-wide constants
│   ├── types/            # Shared TypeScript types/interfaces
│   └── schemas/          # Shared Zod schemas
└── features/             # Feature slices (domain-driven)
    └── <feature>/
        ├── api/           # RTK Query endpoints
        ├── components/    # Feature-specific UI
        ├── hooks/         # Feature-specific hooks
        ├── pages/         # Route-level page components
        ├── schemas/       # Zod validation schemas
        ├── store/         # Feature Redux slice
        └── types/         # Feature-specific types
```

---

## Naming Conventions

| Context | Convention | Example |
|---|---|---|
| React components | PascalCase | `ProductionOrderTable` |
| Classes/Interfaces/Types | PascalCase | `CreateOrderDto`, `IOrderService` |
| Variables/Functions/Hooks | camelCase | `useProductionStages` |
| Folders | kebab-case | `purchase-orders/` |
| Env constants | SCREAMING_SNAKE_CASE | `DATABASE_URL` |
| DB tables | PascalCase (Prisma) | `ProductionOrder` |
| REST endpoints | kebab-case | `/api/v1/purchase-orders` |
| Redux actions | camelCase domain/verb | `auth/loginSuccess` |

---

## Architecture Rules

### Backend

1. **Repository pattern is mandatory.** Controllers → Services → Repositories → Prisma. Never query Prisma directly from a service or controller.
2. **DTOs validate all input.** Use `class-validator` decorators on every DTO. No raw `req.body`.
3. **Global exception filter is the only error handler.** Never catch errors silently. Let them bubble to the filter.
4. **All mutations go through a Prisma transaction** when touching more than one table.
5. **Every API response uses the standard envelope:**
   ```json
   { "success": true, "data": {}, "meta": {}, "message": "" }
   ```
6. **Tenant isolation is enforced at the repository layer.** Every query that operates on tenant data must include `tenantId` in the where clause. Never trust the caller to supply it.
7. **RBAC is enforced via Guards.** Use `@Permissions()` decorator + `PermissionsGuard`. Never inline permission checks in service logic.
8. **Sensitive fields (costing, salaries) require field-level authorization.** Use `@SensitiveField()` + `SensitiveFieldInterceptor`.
9. **Configuration is always injected.** Never read `process.env` directly in a module. Always use `ConfigService`.
10. **BullMQ workers are separate from the API process** in production (separate worker Dockerfile).

### Frontend

1. **No business logic in components.** Extract to hooks or service utilities.
2. **All API calls go through RTK Query.** Never use raw Axios in a component.
3. **All forms use React Hook Form + Zod resolver.** No manual `useState` form management.
4. **All modals are managed through `useModal` hook.** No ad-hoc `isOpen` state.
5. **All tables use the shared `DataTable` component.** No one-off table implementations.
6. **All routes are declared in `routes.config.ts`.** No `<Route>` scattered across the app.
7. **Redux slices only for global/cross-feature state.** Local UI state stays in components.
8. **RTK Query cache is the source of truth for server state.** No duplicating server data in Redux slices.

---

## API Standards

- Base path: `/api/v1`
- Auth header: `Authorization: Bearer <token>`
- Tenant header: `X-Tenant-ID: <tenantId>` (multi-tenant phase)
- Pagination query params: `page`, `limit`, `sortBy`, `sortOrder`
- Filter query params: feature-specific, documented in Swagger
- Response envelope:
  ```ts
  interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    meta?: PaginationMeta;
  }
  ```
- Error envelope:
  ```ts
  interface ApiError {
    success: false;
    statusCode: number;
    message: string;
    errors?: ValidationError[];
    timestamp: string;
    path: string;
  }
  ```

---

## Security Standards

1. Passwords hashed with bcrypt (rounds ≥ 12).
2. JWT access tokens: 15-minute expiry. Refresh tokens: 7-day expiry.
3. Refresh token rotation on every use. Old tokens invalidated.
4. All endpoints behind `JwtAuthGuard` by default. Use `@Public()` to opt-out.
5. CORS restricted to allowed origins from config.
6. Helmet middleware enabled globally.
7. Rate limiting via `@nestjs/throttler` on auth endpoints.
8. No secrets in source code. All via `.env` loaded by `ConfigService`.
9. SQL injection impossible via Prisma parameterized queries.
10. File uploads validated for MIME type and size before storage.

---

## Database Standards

1. All IDs are `uuid` (CUID2 via Prisma default).
2. Every model has `createdAt`, `updatedAt`.
3. Soft-deleteable models have `deletedAt DateTime?`.
4. Tenant-scoped models have `tenantId String` with index.
5. Foreign keys are explicit with `onDelete: Restrict` by default.
6. Composite indexes on frequently joined/filtered columns.
7. Never add columns directly in production — always migrations.

---

## Forbidden Anti-Patterns

- `any` type (unless wrapping external untyped libs with explicit cast)
- Raw SQL strings (use Prisma `$queryRaw` only with tagged template literals)
- Calling `process.env` directly outside config factories
- Business logic inside NestJS controllers
- Business logic inside React components
- Hardcoded tenant IDs, user IDs, or credentials anywhere
- Catch-all `catch(e) {}` blocks with no error propagation
- `console.log` in production code (use NestJS Logger or Pino)
- Importing from `@/features/X` inside `@/shared/` (shared must not depend on features)
- Circular module imports

---

## SaaS Architecture Rules

1. **Tenant isolation first.** Every data write/read scoped to `tenantId`.
2. **Feature flags gate module access.** Check `TenantFeature` before serving feature data.
3. **Subscription plans define capabilities.** Enforce plan limits at the service layer.
4. **Billing is event-driven.** Emit usage events to BullMQ; billing worker processes asynchronously.
5. **Onboarding is automated.** `TenantService.provision()` creates default roles, permissions, and settings.

---

## Scalability Rules

1. All list endpoints are paginated. No unbounded queries.
2. Heavy aggregations run in background jobs, cached in Redis.
3. Dashboard data is pre-computed and cache-invalidated on write.
4. File operations are async — upload triggers BullMQ job for processing.
5. WebSocket events are namespaced per tenant.
6. Database indexes are reviewed for every new query pattern.

---

## Testing Standards

- Unit tests: services and utilities in isolation (mock repositories).
- Integration tests: full module tests with in-memory SQLite via Prisma test client.
- E2E tests: Supertest against running NestJS app with test database.
- Frontend: React Testing Library for components, MSW for API mocking.
- Coverage threshold: 80% for services, 70% overall.

---

## Commit Standards

```
feat(module): short description
fix(module): short description  
refactor(module): short description
test(module): short description
chore: dependency/config update
```
