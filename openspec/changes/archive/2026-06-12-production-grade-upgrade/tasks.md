# Tasks: Production-Grade Upgrade

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2,500 (total across 6 PRs) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 6 chained PRs |
| Delivery strategy | force-chained (C3) |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Schema fix + dead code | PR #1 | Base: main — hard blocker, all else depends |
| 2 | Error handling architecture | PR #2 | Base: PR#1-branch |
| 3 | Security hardening | PR #3 | Base: PR#2-branch |
| 4 | Pagination + N+1 fix | PR #4 | Base: PR#3-branch |
| 5 | Bulk ops + backend tests | PR #5 | Base: PR#4-branch |
| 6 | Dev tooling + SPEC.md | PR #6 | Base: PR#5-branch |

---

## Slice 1: Schema Fix + Dead Code (PR #1 → main)

**Estimated lines**: ~200 (safe - well under 800)

**Files**:
- `backend/prisma/schema.prisma` (modify) — add Fecha model, RefreshToken model, fechaId on Ingreso/Gasto
- `backend/prisma/migrations/*` (new) — auto-generated migration
- `backend/src/controllers/dashboardController.js` (modify) — remove `posicion: true` from getRecientes select (line 72)
- `backend/src/services/jugadorService.js` (modify) — remove `filters.posicion` block
- `backend/src/app.js` (modify) — add `mount('/fechas', require('./routes/fechas'))`
- `frontend/src/api/contabilidad.js` (modify) — add `getFechas`, `createFecha`, `deleteFecha` exports
- `frontend/src/utils/formatters.js` (modify) — delete `getPosicionLabel()`
- `frontend/src/components/dashboard/RecientesList.jsx` (modify) — remove import + usage of `getPosicionLabel`

**Tasks**:
- [x] 1.1: Add `Fecha` and `RefreshToken` models to `backend/prisma/schema.prisma` with `fechaId` on Ingreso/Gasto
- [x] 1.2: Run `prisma migrate dev` to generate migration SQL
- [x] 1.3: Mount fechas routes in `backend/src/app.js` — add line `mount('/fechas', require('./routes/fechas'))`
- [x] 1.4: Remove dead `posicion` references — dashboardController (line 72), jugadorService (filters block)
- [x] 1.5: Remove `getPosicionLabel` from `frontend/src/utils/formatters.js` and its import/usage in RecientesList
- [x] 1.6: Add `getFechas`, `createFecha`, `deleteFecha` exports to `frontend/src/api/contabilidad.js`

**Verification**: `prisma generate` succeeds; dashboard loads without "posicion" errors; Fecha routes respond 200 on GET /api/fechas (with auth)

**Rollback**: `prisma migrate down 1` + revert all file changes

---

## Slice 2: Error Handling Architecture (PR #2 → PR#1-branch)

**Estimated lines**: ~400

**Files**:
- `backend/src/utils/errors.js` (new) — AppError, NotFoundError, ValidationError, AuthError classes
- `backend/src/middleware/errorHandler.js` (new) — centralized handler with Prisma/JWT error mapping
- `backend/src/app.js` (modify) — add `express-async-errors` require, replace bare error handler with `app.use(errorHandler)`
- `backend/package.json` (modify) — add `express-async-errors` dep
- All 10 controllers (modify) — replace `res.status(N).json(...)` with `next(error)`
- `frontend/src/components/common/ErrorBoundary.jsx` (new) — React error boundary with "Reintentar" button
- `frontend/src/components/common/ConfirmDialog.jsx` (new) — reusable shadcn AlertDialog wrapper
- `frontend/src/App.jsx` (modify) — wrap `<Routes>` with `<ErrorBoundary>`, add `<Toaster />`
- `frontend/package.json` (modify) — add `sonner` dep
- `frontend/src/pages/Cuotas.jsx` (modify) — replace 8 alert/confirm calls with toast/AlertDialog
- `frontend/src/pages/Jugadores.jsx` (modify) — replace 3 alert/confirm calls
- `frontend/src/pages/Users.jsx`, `frontend/src/pages/Pagos.jsx` (modify) — replace alert/confirm
- `frontend/src/components/contabilidad/FechaList.jsx`, `GastoList.jsx`, `IngresoList.jsx` (modify) — replace window.confirm with ConfirmDialog

**Tasks**:
- [x] 2.1: Create `backend/src/utils/errors.js` with AppError class hierarchy (4 classes, inferred statusCode)
- [x] 2.2: Create `backend/src/middleware/errorHandler.js` — catch AppError, map Prisma P2002→400, P2025→404, JWT errors→401, unknown→500
- [x] 2.3: Modify `backend/src/app.js` — add `express-async-errors` (line 1), replace bare handler with errorHandler (last middleware)
- [x] 2.4: Update all 10 controllers — replace `res.status(N).json({message})` with `next(error)`
- [x] 2.5: Create `ErrorBoundary.jsx` — catches render errors, shows "Algo salió mal" + "Reintentar"
- [x] 2.6: Create `ConfirmDialog.jsx` — reusable AlertDialog with confirm/cancel pattern
- [x] 2.7: Install `sonner`, add `<Toaster />` in `App.jsx`, wrap routes with `<ErrorBoundary>`
- [x] 2.8: Replace all `alert()` → `toast.error()` / `toast.success()` and `confirm()` → `<ConfirmDialog>` in all pages

**Verification**: API returns `{ message, code }` with correct status codes; toast appears on frontend errors; ErrorBoundary catches render crashes; no `alert()` or `confirm()` calls remain

**Rollback**: Revert all file changes, `npm uninstall` express-async-errors and sonner

---

## Slice 3: Security Hardening (PR #3 → PR#2-branch)

**Estimated lines**: ~400

**Files**:
- `backend/src/app.js` (modify) — add `helmet()` + CSP, global rate-limit (100/15min), auth route rate-limit (5/15min)
- `backend/package.json` (modify) — add `helmet`, `express-rate-limit`
- `backend/src/services/authService.js` (modify) — add `generateRefreshToken`, `verifyRefreshToken`, `revokeRefreshToken`; modify login/register to use 15min access + 7d refresh
- `backend/src/controllers/authController.js` (modify) — add `refresh` and `logout` handlers; modify login/register to set httpOnly refresh cookie
- `backend/src/routes/auth.js` (modify) — add `POST /refresh`, `POST /logout` routes
- `backend/src/services/mercadoPagoService.js` (modify) — add `verifyWebhookSignature(signature, body, secret)` using `crypto.timingSafeEqual`
- `backend/src/routes/pagos.js` (modify) — add HMAC validation before webhook handler
- `frontend/src/api/apiClient.js` (modify) — add 401 interceptor that calls `/auth/refresh`, retries request, falls back to logout
- `backend/.env` (modify) — add `MERCADO_PAGO_WEBHOOK_SECRET`

**Tasks**:
- [x] 3.1: Add helmet (with CSP for frontend origin) + express-rate-limit (global 100/15min, auth 5/15min) in `app.js`
- [x] 3.2: Add refresh token methods to `authService.js` — generate, verify, revoke; modify login to return 15min access token + refresh token
- [x] 3.3: Add `refresh` (rotate token, revoke old) and `logout` (revoke token) handlers to `authController.js`; add reuse-theft detection (revoke ALL on reused revoked token)
- [x] 3.4: Add `POST /refresh` and `POST /logout` routes to `backend/src/routes/auth.js`
- [x] 3.5: Add `verifyWebhookSignature` to `mercadoPagoService.js` — HMAC-SHA256 with `crypto.timingSafeEqual`
- [x] 3.6: Add HMAC validation middleware to `pagos.js` webhook route — return 401 if invalid/missing
- [x] 3.7: Modify `apiClient.js` response interceptor — on 401, attempt `/auth/refresh`, retry original request, redirect to /login on failure

**Verification**: `curl` with rapid login attempts returns 429 after 5; webhook with bad signature returns 401; access token expires after 15min; `/auth/refresh` returns new access + rotated refresh; reuse of old refresh token revokes ALL user tokens

**Rollback**: Revert app.js, auth system, MP service, apiClient; remove helmet/rate-limit deps

---

## Slice 4: Pagination + N+1 Fix (PR #4 → PR#3-branch)

**Estimated lines**: ~400

**Files**:
- `backend/src/utils/helpers.js` (modify) — add `paginatedResponse(data, total, page, limit)` normalized
- `backend/src/controllers/jugadorController.js` (modify) — parse page/limit query, wrap in paginatedResponse
- `backend/src/controllers/cuotaController.js` (modify) — same
- `backend/src/controllers/pagoController.js` (modify) — same
- `backend/src/controllers/partidoController.js` (modify) — same
- `backend/src/controllers/ingresoController.js` (modify) — same
- `backend/src/controllers/gastoController.js` (modify) — same
- `backend/src/controllers/userController.js` (modify) — same
- `backend/src/controllers/dashboardController.js` (modify) — paginate getRecientes; replace N+1 loop (lines 39-50) with single aggregate query for getCuotasGrafico
- `frontend/src/pages/Cuotas.jsx` (modify) — add prev/next pagination controls
- `frontend/src/pages/Jugadores.jsx` (modify) — add prev/next pagination controls
- `frontend/src/pages/Pagos.jsx` (modify) — add prev/next pagination controls

**Tasks**:
- [x] 4.1: Add `paginatedResponse(data, total, page, limit)` to `helpers.js` — normalize page≥1, limit 1-100, compute totalPages
- [x] 4.2: Modify all 8 list controllers — parse `page`/`limit` from query, use `paginate()` for skip/take, wrap with `paginatedResponse()`
- [x] 4.3: Replace N+1 loop in `getCuotasGrafico` (dashboard lines 39-50) with single query + in-memory processing, preserving response shape
- [x] 4.4: Add prev/next pagination controls to Jugadores and Users pages using pagination metadata

**Verification**: `GET /api/jugadores?page=2&limit=5` returns `{ data, pagination: { page, limit, total, totalPages } }`; N+1 dashboard query drops from 12 DB calls to 1; frontend shows page controls

**Rollback**: Revert helpers.js, all controllers, frontend page changes

---

## Slice 5: Bulk Ops + Testing (PR #5 → PR#4-branch)

**Estimated lines**: ~700

**Files**:
- `backend/src/services/cuotaService.js` (modify) — add `generarMasivas(mes, anio, montosPorCategoria)` using `createMany`
- `backend/src/controllers/cuotaController.js` (modify) — add `generarMasivas` handler
- `backend/src/routes/cuotas.js` (modify) — add `POST /generar-masivas` (auth, ADMIN only)
- `frontend/src/pages/Cuotas.jsx` (modify) — add "Generar para todos" button with ConfirmDialog + success toast
- `backend/vitest.config.js` (new) — vitest config with setup file
- `backend/src/tests/setup.js` (new) — test DB setup with `prisma db push`
- `backend/src/tests/authService.test.js` (new) — register, login, getCurrentUser tests
- `backend/src/tests/cuotaService.test.js` (new) — generarMensuales, getAll tests
- `backend/package.json` (modify) — add `vitest`, `supertest`, `test` script
- `frontend/vitest.config.js` (new) — vitest config with jsdom environment
- `frontend/src/tests/setup.js` (new) — testing-library matchers, MSW setup
- `frontend/src/tests/AuthContext.test.jsx` (new) — login, logout, register tests
- `frontend/src/tests/Dashboard.test.jsx` (new) — render test with mocked API
- `frontend/package.json` (modify) — add test deps + `npm test` script

**Tasks**:
- [x] 5.1: Add `generarMasivas` to `cuotaService.js` — fetch active jugadores, iterate with per-category pricing, upsert via `createMany`, return `{ generadas, omitidas, errores }`
- [x] 5.2: Wire `generarMasivas` controller + route (POST, ADMIN-only) in `cuotaController.js` / `cuotas.js`
- [x] 5.3: Add "Generar para todos" button to `Cuotas.jsx` with ConfirmDialog + toast feedback
- [x] 5.4: Set up backend vitest config + test setup (separate test DB, supertest app helper)
- [x] 5.5: Write `authService.test.js` — test register (success, duplicate email, bcrypt hash), login (valid, wrong password, inactive user), getCurrentUser
- [x] 5.6: Write `cuotaService.test.js` — test generarMensuales (creates for active, skips duplicates), getAll (filters)
- [x] 5.7: Set up frontend vitest config (jsdom, setup file) with test deps
- [x] 5.8: Write `AuthContext.test.jsx` — login stores token/sets user, logout clears state/redirects, register
- [x] 5.9: Write `Dashboard.test.jsx` — renders MetricasCards, CuotasChart, RecientesList with mocked API

**Verification**: `POST /api/cuotas/generar-masivas` with 30 active jugadores generates all 30 cuotas; `npm test` in backend passes all tests; `npm test` in frontend passes all tests

**Rollback**: Revert cuotaService, controller, route, Cuotas.jsx; remove test files; `npm uninstall` test deps

---

## Slice 6: Dev Tooling + SPEC.md Rewrite (PR #6 → PR#5-branch)

**Estimated lines**: ~600

**Files**:
- `backend/Dockerfile` (new) — multi-stage: node:18-alpine build → run, prisma generate during build
- `frontend/Dockerfile` (new) — nginx static serving for built assets
- `docker-compose.yml` (new) — 3 services: backend (:3000), frontend (:5173), postgres:16-alpine (persistent volume)
- `backend/prisma/seed.js` (new) — sample data: 2 users, 10 jugadores, cuotas for 2 months, pagos, 1 partido with ingresos/gastos
- `backend/package.json` (modify) — add `prisma:seed`, `lint`, `format` scripts; add `nodemon` dep
- `eslint.config.js` (new) — flat config: backend (Node/CJS) + frontend (React/JSX)
- `.prettierrc` (new) — `semi:true, singleQuote:true, trailingComma:'es5', printWidth:100`
- `backend/nodemon.json` (new) — watch src, ignore tests
- `backend/src/server.js` (modify) — add graceful shutdown (SIGTERM/SIGINT → prisma.$disconnect → server.close)
- `frontend/package.json` (modify) — add `lint`, `format` scripts
- `SPEC.md` (modify) — full rewrite: add missing models (Partido, Ingreso, Gasto, Fecha, RefreshToken), Categoria enum, all endpoints (contabilidad, fechas, google auth, bulk ops), updated folder structure, JWT refresh flow, environment variables

**Tasks**:
- [x] 6.1: Create `backend/Dockerfile` (multi-stage alpine) + `frontend/Dockerfile` (nginx) + `docker-compose.yml` (3 services with Postgres volume)
- [x] 6.2: Create `backend/prisma/seed.js` — idempotent (deleteMany first), sample data across all models; add `prisma:seed` script to package.json
- [x] 6.3: Create root `eslint.config.js` (flat config covering both packages) + `.prettierrc`; add lint/format scripts to both package.json files
- [x] 6.4: Create `backend/nodemon.json`; modify `server.js` with graceful shutdown (SIGTERM/SIGINT handlers)
- [x] 6.5: Rewrite `SPEC.md` — sync schema (9 models + Categoria enum), document all API endpoints (including new ones from Slices 1-5), auth flow, env vars, folder structure

**Verification**: `docker compose up` boots full stack; `npx prisma db seed` inserts data idempotently; `npx eslint .` passes; Ctrl+C on backend produces clean shutdown; SPEC.md accurately reflects every schema model and endpoint

**Rollback**: Revert all new files; revert server.js changes; revert package.json script additions; restore SPEC.md from git
