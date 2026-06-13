# Proposal: Production-Grade Upgrade

## Intent

Transform a working-but-fragile club admin app into a production-grade system that exceeds expectations. Fix the Prisma schema desync (blocker), then harden security, error handling, performance, and developer experience. Each area is tracked as a chained PR slice for safe review.

## Scope

### In Scope
- Fix all 11 gaps identified in exploration (prisma desync, error handling, security, pagination, N+1, JWT refresh, tests, bulk ops, dev tooling, dead code, SPEC.md drift)

### Out of Scope
- Full TypeScript migration (too high effort, deferred)
- Mobile app, CI/CD deployment pipelines, multi-tenant, i18n

## Capabilities

### New Capabilities
- `error-handling`: Backend error hierarchy + frontend toast/error-boundary system
- `pagination`: Cursor-based pagination for list endpoints
- `jwt-auth`: Access/refresh token rotation with httpOnly cookies
- `bulk-operations`: Batch cuota generation for all active jugadores
- `dev-tooling`: Docker, ESLint/Prettier config, seed data

### Modified Capabilities
- `db-schema`: Fix Posicion desync — add migration to drop column + enum, fix `getRecientes` and `jugadorService` references
- `security`: Add helmet, rate-limit, MP webhook HMAC verification
- `performance`: Eliminate N+1 in `getCuotasGrafico` via aggregation query
- `testing`: Add vitest suites for backend services + frontend components
- `dead-code`: Remove `helpers.js/paginate()`, `getPosicionLabel()`, unused `posicion` references

## Approach

**Phase 1 — Foundation (blocker)**: Fix Prisma schema desync. Add migration to drop `posicion` column and `Posicion` enum. Fix `dashboardController.js` (line 72), `jugadorService.js` (lines 16-17), `frontend/formatters.js` (line 22), `RecientesList.jsx` (line 73). Update SPEC.md. Approx +50/-80 lines.

**Phase 2 — Security & Auth**: helmet + express-rate-limit middleware. HMAC verification in `/api/pagos/webhook`. JWT access token (15min) + refresh token (7d httpOnly cookie). Approx +200 lines.

**Phase 3 — Error Handling**: Backend: `AppError` class hierarchy, centralized error middleware replacing 24 bare `res.status(500)`. Frontend: install sonner toasts, `<ErrorBoundary>` wrapper, replace 17 `alert()`/`confirm()` calls. Approx +250/-100 lines.

**Phase 4 — Performance & Pagination**: Re-write `getCuotasGrafico` (12 sequential queries → 1 aggregate query). Add `page`/`limit` params to GET `/jugadores`, `/cuotas`, `/pagos`. Wire `paginate()` from `helpers.js`. Approx +150/-50 lines.

**Phase 5 — Bulk Ops & Testing**: `POST /cuotas/generar-masivo` for all active players. vitest setup, service unit tests, component smoke tests, API integration tests. Approx +400 lines.

**Phase 6 — Dev Tooling & Cleanup**: Dockerfile + docker-compose. ESLint flat config + Prettier. Seed script with sample data. Remove dead code. Bump SPEC.md. Approx +200/-50 lines.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Toast lib | **sonner** | Lightweight (2KB), shadcn-native, no deps |
| Test framework | **vitest** | Already in Vite ecosystem, faster than Jest |
| Pagination | **Cursor-based** over offset | Consistent with ordered data, avoids offset drift |
| Error classes | `AppError(statusCode, code, message)` | One hierarchy, centralized handler, no try/catch in controllers |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/prisma/schema.prisma` | Modified | Drop `Posicion` enum refs, keep current models |
| `backend/prisma/migrations/` | New | Add migration for column/enum cleanup |
| `backend/src/controllers/*` | Modified | Remove raw 500 handlers, use AppError |
| `backend/src/middleware/*` | New | Error handler, rate-limit, helmet |
| `backend/src/routes/pagos.js:41` | Modified | HMAC verification on webhook |
| `backend/src/services/authService.js` | Modified | Add refresh token logic |
| `backend/src/services/mercadoPagoService.js` | Modified | Add webhook HMAC validation |
| `backend/src/controllers/dashboardController.js:31-60` | Modified | Replace N+1 loop with aggregation |
| `backend/src/utils/helpers.js` | Modified | Wire `paginate()` into controllers |
| `frontend/src/pages/*.jsx` | Modified | Replace alerts with sonner toasts |
| `frontend/src/components/common/ErrorBoundary.jsx` | New | React error boundary |
| `frontend/src/hooks/useAuth.js` | Modified | Support token refresh |
| `SPEC.md` | Modified | Sync schema, endpoints, decisions |
| `backend/Dockerfile`, `docker-compose.yml` | New | Docker dev environment |
| `eslint.config.js`, `.prettierrc` | New | Code quality tooling |
| `backend/prisma/seed.js` | New | Sample data |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Prisma schema desync crashes prod `prisma generate` | High | Phase 1 must ship first; test locally |
| Migration dropping `posicion` loses data | Medium | Pre-check for non-null data; manual review before apply |
| Webhook HMAC breaks MP integration | Low | Test in sandbox before prod; keep backward-compatible fallback |

## Rollback Plan

Per phase: revert the migration (or apply inverse), restore deleted files from git, redeploy. Phase 1 is the only DB-altering phase — its rollback is `prisma migrate down 1` to restore `posicion` column and `Posicion` enum.

## Dependencies

- Phase 1 is a HARD prerequisite for all other phases
- Phase 2 (helmet) is prerequisite for production deploy
- No external services beyond existing (Postgres, Mercado Pago)

## Success Criteria

- [ ] `prisma generate` succeeds without warnings
- [ ] Dashboard loads in < 3s (down from N+1 loop)
- [ ] Zero `alert()`/`confirm()` calls in frontend
- [ ] Webhook rejects unauthenticated POSTs with 401
- [ ] JWT access tokens rotate via refresh endpoint
- [ ] All list endpoints accept `page`/`limit`
- [ ] Batch cuota generation creates N cuotas in 1 request
- [ ] `npm test` runs with > 70% line coverage
- [ ] `docker compose up` boots full stack
- [ ] SPEC.md matches actual schema and endpoints
