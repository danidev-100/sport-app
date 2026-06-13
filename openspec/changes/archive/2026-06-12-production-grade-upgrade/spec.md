# Spec: Production-Grade Upgrade

> Delta spec for all 8 areas. Each area contains requirements with scenarios covering happy paths, edge cases, and error states.

---

## Area 1: Prisma Schema Fix

### Context
The `Fecha` model exists in code (route, controller, service) but was dropped from schema.prisma by migration `add_partido`. A new migration must re-add `Fecha` with `fechaId` foreign keys on `Ingreso` and `Gasto`. Additionally, the `RefreshToken` model is required for JWT refresh (Area 3).

#### REQ-1.1: Add Fecha model to schema.prisma

**Must** add the `Fecha` model matching the existing migration SQL:
```prisma
model Fecha {
  id        String    @id @default(uuid())
  titulo    String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  ingresos  Ingreso[]
  gastos    Gasto[]
}
```

**Must** add `fechaId` as optional field on `Ingreso` and `Gasto`:
```
fechaId    String?
fecha      Fecha?   @relation(fields: [fechaId], references: [id], onDelete: Cascade)
```

**Must** NOT remove or alter existing `Partido` relation on `Ingreso`/`Gasto`.

**Scenarios:**
- `prisma generate` succeeds without warnings
- `prisma migrate dev` produces SQL matching the original `add_fecha_v2` migration
- `fechaService.getAll()` returns fechas with nested ingresos and gastos
- An `Ingreso` can belong to either a `Partido` or a `Fecha` (or neither)

#### REQ-1.2: Add RefreshToken model

**Must** add a `RefreshToken` model:
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

**Scenarios:**
- Migration creates `RefreshToken` table with unique constraint on `token`
- Cascade delete removes tokens when user is deleted

---

## Area 2: Error Handling + UX

#### REQ-2.1: Backend error class hierarchy

**Must** define classes in `backend/src/utils/errors.js`:
- `AppError` with `statusCode`, `code`, `message` properties
- `NotFoundError` extends `AppError` (status 404)
- `ValidationError` extends `AppError` (status 400)
- `AuthError` extends `AppError` (status 401)

**Must** accept constructor `(message, code?)` and infer `statusCode` from class type.

**Scenarios:**
- `throw new NotFoundError('Jugador no encontrado', 'JUGADOR_NOT_FOUND')` → `{ status: 404, code: 'JUGADOR_NOT_FOUND', message: 'Jugador no encontrado' }`
- `throw new ValidationError('Email inválido')` → status 400
- `throw new AuthError('Token expirado')` → status 401

#### REQ-2.2: Centralized error handler middleware

**Must** replace the bare error handler in `app.js` with a middleware that:
- Catches `AppError` instances and returns `{ message, code }` with correct `statusCode`
- Catches unknown errors and returns 500 with generic message
- Logs full error stack to console in non-production

**Must** ensure `AppError` instances are NOT nested in try/catch — controller errors propagate naturally via `next(error)`.

**Scenarios:**
- Prisma `P2002` (unique constraint) → mapped to `ValidationError` → 400
- Prisma `P2025` (record not found) → mapped to `NotFoundError` → 404
- JWT `JsonWebTokenError` → mapped to `AuthError` → 401
- Unknown `TypeError` → 500 with generic message, stack logged

#### REQ-2.3: Frontend ErrorBoundary

**Must** create `frontend/src/components/common/ErrorBoundary.jsx` wrapping all routes in App.jsx.

**Must** display a fallback UI with:
- "Algo salió mal" title
- Error message
- "Reintentar" button that resets state
- Only active in production — dev mode re-throws

**Scenarios:**
- Uncaught render error in Dashboard → ErrorBoundary shows fallback
- API fetch error in a child component → caught and displayed without unmounting the app
- User clicks "Reintentar" → component tree remounts, app recovers

#### REQ-2.4: Toast system via sonner

**Must** install `sonner` and wrap the app with `<Toaster />` component.

**Must** replace ALL `alert()` calls with `toast.error()`:
- Cuotas.jsx (lines 232, 252, 261, 328, 347)
- Jugadores.jsx (lines 38, 136)
- Users.jsx (line 140)
- Pagos.jsx (lines 42, 45)

**Must** replace ALL `confirm()` calls with shadcn `<AlertDialog />`:
- Cuotas.jsx (lines 311, 336)
- Jugadores.jsx (line 143)
- Users.jsx (line 143)
- FechaList.jsx (line 40)
- GastoList.jsx (line 37)
- IngresoList.jsx (line 37)

**Scenarios:**
- Successful pago registration → `toast.success('Pago registrado')`
- Failed cuota generation → `toast.error('Error: ' + message)` instead of `alert()`
- Delete jugador → AlertDialog: "¿Eliminar a {nombre}?" with confirm/cancel buttons
- Delete ingreso → AlertDialog instead of `window.confirm()`
- User tries to delete self → `toast.error('No puedes eliminarte a ti mismo')`

---

## Area 3: Security

#### REQ-3.1: Helmet middleware

**Must** add `app.use(helmet())` early in the middleware chain in `app.js`.

**Must** configure Content-Security-Policy to allow the frontend origin.

**Scenarios:**
- Response includes `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`
- CSP blocks inline scripts unless explicitly allowed
- Security scan (e.g., OWASP ZAP) shows A rating for header protection

#### REQ-3.2: Rate limiting

**Must** apply `express-rate-limit` globally: 100 requests per 15 minutes per IP.

**Must** apply stricter limit on auth routes (`POST /auth/login`, `POST /auth/register`): 5 attempts per 15 minutes per IP.

**Must** return standard `Retry-After` header and `429 Too Many Requests` on limit exceeded.

**Scenarios:**
- Normal API usage under 100 req/15min → requests succeed normally
- Brute-force on login endpoint (6+ attempts) → 429 after 5th, `Retry-After` header present
- Global limit test: 101 requests in 1 minute → 101st request returns 429

#### REQ-3.3: Mercado Pago webhook HMAC validation

**Must** verify HMAC-SHA256 signature on `POST /api/pagos/webhook` from Mercado Pago.

**Must** extract signature from `X-Signature` header, compute HMAC with `MERCADO_PAGO_WEBHOOK_SECRET`, and compare using `crypto.timingSafeEqual`.

**Must** return 401 if signature is missing or invalid.

**Scenarios:**
- Valid HMAC signature → webhook processed normally
- Missing `X-Signature` header → 401
- Tampered payload → HMAC mismatch → 401
- Replay attack with valid signature but stale timestamp → reject if `x-request-id` already processed

#### REQ-3.4: JWT refresh token system

**Must** change access token lifetime from `7d` to `15min`.

**Must** implement refresh token flow:
- `POST /auth/login` returns access token (15min) + sets httpOnly cookie with refresh token (7d)
- `POST /auth/refresh` validates refresh token, returns new access token + rotates refresh token
- `POST /auth/logout` revokes the refresh token

**Must** store refresh tokens in `RefreshToken` table with `revoked` flag.

**Must** rotate refresh tokens on each use (issue new, revoke old).

**Scenarios:**
- Login returns access token in body + refresh token in `Set-Cookie` (httpOnly, secure, sameSite=strict)
- Access token expires → client calls `/auth/refresh` → gets new access token + rotated refresh token
- Refresh token is revoked → 401 with "Refresh token revocado"
- Refresh token expires (7d) → 401 with "Refresh token expirado"
- Logout revokes refresh token in DB → subsequent `/auth/refresh` returns 401
- Reused refresh token (stolen) → immediate revocation of ALL tokens for that user

---

## Area 4: Pagination + Performance

#### REQ-4.1: Unified pagination helper

**Must** implement `paginate(page, limit)` returning `{ skip, take }` (already exists in `helpers.js` — keep).

**Must** implement `paginatedResponse(data, total, page, limit)` returning:
```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

**Scenarios:**
- `page=2, limit=10` with 25 total → pagination = `{ page: 2, limit: 10, total: 25, totalPages: 3 }`
- `page=0` → treated as `page=1`
- `limit=0` or negative → default to 10
- `limit > 100` → capped to 100

#### REQ-4.2: Paginate all list endpoints

**Must** add `page` and `limit` query params with paginated response to:
- `GET /api/jugadores`
- `GET /api/cuotas`
- `GET /api/pagos`
- `GET /api/partidos`
- `GET /api/ingresos`
- `GET /api/gastos`
- `GET /api/users`
- `GET /api/dashboard/recientes`

**Must** keep backward compatibility: no pagination params → returns first 50 by default (or all if small dataset).

**Scenarios:**
- `GET /api/jugadores?page=3&limit=20` → returns 20 jugadores, pagination shows page 3 of N
- `GET /api/jugadores?page=999` → empty data array, pagination shows page 999 of total
- `GET /api/cuotas` (no params) → default pagination (page=1, limit=50)

#### REQ-4.3: Fix N+1 in getCuotasGrafico

**Must** replace the 12-iteration loop with a single aggregation query using Prisma `groupBy` or raw SQL.

**Must** maintain the exact same response shape:
```json
{ "meses": [...], "pagadas": [...], "pendientes": [...] }
```

**Must** keep month ordering: 1..12.

**Scenarios:**
- Before: 12 sequential `findMany` queries → After: 1 `groupBy` query
- Year with no cuotas → all months show 0 pagadas, 0 pendientes
- Year with data → correct counts per month
- Performance: response time goes from ~500ms to <50ms with realistic data

#### REQ-4.4: Remove dead code

**Must** remove `getPosicionLabel()` from `frontend/src/utils/formatters.js` — `posicion` column and `Posicion` enum no longer exist.

**Must** remove `posicion` from `getRecientes` select query in `dashboardController.js` (line 72).

**Must** remove `posicion` from `getRecientes` response in `RecientesList.jsx` (line 73).

**Scenarios:**
- Dashboard `getRecientes` query runs without Prisma error about missing `posicion` field
- Frontend RecientesList renders without reference to undefined `posicion`
- formatters.js no longer exports `getPosicionLabel`
- Components that imported `getPosicionLabel` are updated to remove the import

---

## Area 5: Bulk Operations

#### REQ-5.1: POST /cuotas/generar-masivas endpoint

**Must** accept:
```json
{ "mes": 6, "anio": 2026, "montosPorCategoria": { "C7": 20000, "C11": 25000 } }
```

**Must** generate cuotas for ALL active jugadores using Prisma `createMany`.

**Must** skip jugadores that already have a cuota for that `(mes, anio)` (upsert behavior).

**Must** use `montosPorCategoria` to assign per-category pricing (jugadores without matching category get the FIRST category's price).

**Must** return `{ generadas: N, omitidas: M, errores: [] }`.

**Scenarios:**
- 30 active jugadores across C7 and C11 → generates 30 cuotas with correct per-category pricing
- 5 jugadores already have cuotas for the month → 25 generated, 5 omitted
- No active jugadores → 0 generated, response indicates no active jugadores found
- Missing `mes` or `anio` → 400 ValidationError
- `montosPorCategoria` is empty → 400 ValidationError

#### REQ-5.2: Frontend "Generar para todos" button

**Must** add a "Generar para todos" button on the Cuotas page.

**Must** show AlertDialog on click: "¿Generar cuotas para todos los jugadores activos?"

**Must** on confirm, call `POST /api/cuotas/generar-masivas` with current month/year and configured category amounts.

**Must** show toast on success: `"Se generaron {N} cuotas ({M} omitidas)"`.

**Must** show toast on error: `"Error al generar cuotas: {message}"`.

**Scenarios:**
- User clicks "Generar para todos", confirms → cuotas generated, success toast, list refreshes
- User clicks "Generar para todos", cancels → nothing happens
- API returns error → error toast shown

---

## Area 6: Testing Infrastructure

#### REQ-6.1: Backend Vitest + Supertest setup

**Must** install `vitest`, `supertest` as devDependencies in `backend/`.

**Must** create `backend/vitest.config.js` with setup pointing to `backend/src/tests/setup.js`.

**Must** create test helper that initializes app without listening (exports `app` from `backend/src/app.js`).

**Scenarios:**
- `npm test` in backend runs vitest
- Tests that hit HTTP endpoints use `supertest(app)` without binding to a real port

#### REQ-6.2: Backend authService tests

**Must** test `authService.register`:
- Registers new user successfully
- Throws on duplicate email
- Hashes password with bcrypt

**Must** test `authService.login`:
- Returns user + token on valid credentials
- Throws on wrong password
- Throws on inactive user
- Throws on non-existent email

**Must** test `authService.getCurrentUser`:
- Returns user data for valid userId
- Throws for non-existent userId

#### REQ-6.3: Backend cuotaService tests

**Must** test `cuotaService.generarMensuales`:
- Creates cuotas for all active jugadores
- Skips jugadores with existing cuota for that period
- Returns array of cuotas with correct mes/anio/monto

**Must** test `cuotaService.getAll`:
- Filters by jugadorId
- Filters by anio
- Filters by vencida
- Returns all cuotas when no filters

#### REQ-6.4: Frontend Vitest setup

**Must** install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` in `frontend/`.

**Must** create `frontend/vitest.config.js` with `environment: 'jsdom'` and setup file.

**Scenarios:**
- `npm test` in frontend runs vitest with jsdom environment
- Tests can render React components, fire events, assert DOM state

#### REQ-6.5: Frontend AuthContext tests

**Must** test `AuthContext.login`:
- Stores token in localStorage
- Sets user state
- Handles API error gracefully

**Must** test `AuthContext.logout`:
- Removes token from localStorage
- Clears user state
- Navigates to /login

**Must** test `AuthContext.register`:
- Calls API, stores token, sets user state

#### REQ-6.6: Frontend Dashboard page render test

**Must** test that Dashboard page renders key sections:
- MetricasCards (totalJugadores, jugadoresActivos, etc.)
- CuotasChart component mounts
- RecientesList shows recent players

**Must** mock `apiClient` or `useFetch` for deterministic tests.

---

## Area 7: Dev Tooling

#### REQ-7.1: Docker configuration

**Must** create `backend/Dockerfile`:
- Multi-stage: node:18-alpine build → node:18-alpine run
- Copies `package.json` and `prisma/` first for layer caching
- Runs `npx prisma generate` during build

**Must** create `docker-compose.yml` in project root with:
- `backend` service (build from `backend/Dockerfile`, port 3000)
- `frontend` service (build from `frontend/Dockerfile`, port 5173)
- `db` service (postgres:16-alpine, volume for data persistence)
- Environment variables matching `.env` patterns

**Scenarios:**
- `docker compose up` boots all 3 services
- Backend connects to Postgres in the compose network
- Frontend proxied to backend works end-to-end

#### REQ-7.2: Seed script

**Must** create `backend/prisma/seed.js` with sample data:
- 2 users (1 ADMIN, 1 EDITOR)
- 5-10 jugadores across different categorias
- Cuotas for the current and previous month
- Some pagos recorded, some not (mix of pagadas/pendientes)
- 1 Partido with Ingresos and Gastos

**Must** add `prisma:seed` script to `backend/package.json`.

**Scenarios:**
- `npx prisma db seed` inserts sample data without errors
- Running seed twice is idempotent (deletes existing data first)
- Dashboard renders with meaningful data after seeding

#### REQ-7.3: ESLint + Prettier

**Must** create root `eslint.config.js` (flat config format) covering:
- `backend/`: Node.js, CommonJS rules
- `frontend/`: React, JSX rules (extends `eslint:recommended`, `plugin:react/recommended`)

**Must** create root `.prettierrc` with:
- `semi: true`, `singleQuote: true`, `trailingComma: 'es5'`, `printWidth: 100`

**Must** add lint/format scripts to both `package.json` files.

#### REQ-7.4: Nodemon + Graceful shutdown

**Must** create `backend/nodemon.json`:
```json
{ "watch": ["src"], "ext": "js,json", "ignore": ["src/tests/**"] }
```

**Must** update `server.js` with graceful shutdown:
- Listen on `SIGTERM` and `SIGINT`
- Call `prisma.$disconnect()`
- Exit cleanly

**Scenarios:**
- `SIGTERM` → server stops accepting connections, pending requests complete, Prisma disconnects, process exits
- Ctrl+C in dev → same graceful shutdown, no orphan DB connections

---

## Area 8: Documentation

#### REQ-8.1: Rewrite SPEC.md to match actual schema

**Must** remove `Posicion` enum from SPEC.md — it no longer exists in the DB.

**Must** add `Partido`, `Ingreso`, `Gasto` models to the Schema section.

**Must** add `Categoria` enum and `categoria` field on `Jugador`.

**Must** add missing fields: `numeroIdentificacion` on `Cuota`, `googleId` on `Jugador`.

**Must** update folder structure to match actual code (add `services/ingresoService.js`, `services/gastoService.js`, etc.).

#### REQ-8.2: Document all API endpoints

**Must** add documentation for all missing routes:
- `GET/POST/PUT/DELETE /api/partidos`
- `GET/POST/PUT/DELETE /api/ingresos`
- `GET/POST/PUT/DELETE /api/gastos`
- `GET /api/contabilidad/balance`
- `GET /api/contabilidad/balance-por-fecha`
- `GET/POST/PUT/DELETE /api/fechas`
- `GET/POST /api/jugadores/auth/google`
- `POST /api/cuotas/generar-masivas` (Area 5)

**Must** document each endpoint with: method, path, description, request body, response shape, required auth role.

**Scenarios:**
- Developer reads SPEC.md and can implement a new frontend component referencing exact API shapes
- SPEC.md `prisma generate` block matches `schema.prisma` exactly — no drift
- All routes mounted in `app.js` are documented

---

## Requirements Summary

| Area | Total | Added | Modified | Scenarios |
|------|-------|-------|----------|-----------|
| 1. Schema Fix | 2 | 2 | 0 | 7 |
| 2. Error Handling + UX | 4 | 4 | 0 | 18 |
| 3. Security | 4 | 4 | 0 | 15 |
| 4. Pagination + Performance | 4 | 3 | 1 | 12 |
| 5. Bulk Operations | 2 | 2 | 0 | 8 |
| 6. Testing Infrastructure | 6 | 6 | 0 | 16 |
| 7. Dev Tooling | 4 | 4 | 0 | 8 |
| 8. Documentation | 2 | 2 | 0 | 5 |
| **Total** | **28** | **27** | **1** | **89** |

## Coverage Assessment

- **Happy paths**: All covered — each REQ has at least one happy-path scenario
- **Edge cases**: Covered — empty datasets, pagination boundaries, duplicate operations, missing fields
- **Error states**: Covered — validation errors, 401/403/404/429 HTTP responses, network failures, schema desync

## Specs Written

| Area | Type | File |
|------|------|------|
| All 8 areas | Delta spec (comprehensive) | `openspec/changes/production-grade-upgrade/spec.md` |
| Engram | Architecture artifact | `sdd/production-grade-upgrade/spec` |
