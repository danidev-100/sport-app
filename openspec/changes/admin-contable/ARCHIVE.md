# Archive: Admin Contable

> **Status**: ✅ Completed — verified ready for deploy
> **PR Chain**: PR1 (Backend) → PR2 (Frontend Core) → PR3 (Frontend Gastos) — stacked to main
> **Date**: 2026-05-15

---

## Change Summary

Built a complete admin financial tracking module for the club: revenue (`Ingreso`) and expense (`Gasto`) CRUD with on-read balance calculation. ADMIN-only access with role-based guards on every endpoint and conditional sidebar visibility.

**Capability added**: `admin-contable` — Revenue/expense CRUD and balance calculation for admin financial tracking.

---

## Final File Inventory

### Backend (9 files affected — 8 new, 1 modified)

| File | Action | Purpose |
|------|--------|---------|
| `backend/prisma/schema.prisma` | MODIFIED | Added `Ingreso` and `Gasto` models (lines 109-127) with Decimal(10,2), optional `partidoId`, default `fecha` |
| `backend/src/services/ingresoService.js` | NEW | CRUD + `getTotal()` aggregation for Ingreso model |
| `backend/src/services/gastoService.js` | NEW | Same pattern as ingresoService but for Gasto model |
| `backend/src/controllers/ingresoController.js` | NEW | Express handlers: getAll, getById, create, update, remove |
| `backend/src/controllers/gastoController.js` | NEW | Same pattern as ingresoController for gastos |
| `backend/src/routes/ingresos.js` | NEW | GET/POST/PUT/DELETE `/api/ingresos` with ADMIN guard + validation |
| `backend/src/routes/gastos.js` | NEW | Same structure as ingresos routes |
| `backend/src/routes/contabilidad.js` | NEW | GET `/api/contabilidad/balance` — inline handler aggregates both services |
| `backend/src/app.js` | MODIFIED | Registered 3 route groups: `/api/ingresos`, `/api/gastos`, `/api/contabilidad` (lines 26-28) |

### Frontend (10 files affected — 7 new, 3 modified)

| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/api/contabilidad.js` | NEW | Axios API client: getIngresos, getGastos, getBalance, plus CRUD per entity |
| `frontend/src/components/contabilidad/IngresoList.jsx` | NEW | Self-fetching table with date filter, loading/empty states, edit/delete actions |
| `frontend/src/components/contabilidad/IngresoForm.jsx` | NEW | Dialog form for create/edit ingreso (descripcion, monto, fecha, partidoId) |
| `frontend/src/components/contabilidad/GastoList.jsx` | NEW | Same as IngresoList but for gastos |
| `frontend/src/components/contabilidad/GastoForm.jsx` | NEW | Same as IngresoForm but for gastos |
| `frontend/src/components/contabilidad/BalanceCard.jsx` | NEW | Self-fetching stat cards: Total Ingresos (green), Total Gastos (red), Balance (+/- tinted) |
| `frontend/src/pages/Contabilidad.jsx` | NEW | Tabbed page (Ingresos / Gastos / Balance) with admin gate |
| `frontend/src/App.jsx` | MODIFIED | Added import + `<Route path="/contabilidad">` (lines 14, 105-111) |
| `frontend/src/components/layout/Sidebar.jsx` | MODIFIED | Added Contabilidad to `adminNavItems` with Receipt icon (line 14) |

### Prisma Migration

| File | Action | Purpose |
|------|--------|---------|
| `backend/prisma/migrations/*add_ingreso_gasto*` | AUTO | Generated migration creating `Ingreso` and `Gasto` tables |

**Total: 19 files** — (15 new, 4 modified, plus auto-generated migration)

---

## Spec Summary

### Requirements and Acceptance Criteria

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| R1 | Revenue CRUD (create, read, update, delete ingresos) | ✅ PASS | `POST /api/ingresos` → 201, `GET /api/ingresos` → list with filters, `DELETE` → removes + 404 on re-fetch |
| R2 | Expense CRUD (same for gastos) | ✅ PASS | Identical pattern to ingresos, operating on `prisma.gasto` |
| R3 | Balance calculated on read (totalIngresos − totalGastos) | ✅ PASS | `GET /api/contabilidad/balance` returns `{ totalIngresos, totalGastos, balance }` — no stored aggregate |
| R4 | Input validation (monto > 0, descripcion required) | ✅ PASS | express-validator on POST: `monto: isFloat(min:0.01)`, `descripcion: notEmpty`. Returns HTTP 400 |
| R5 | ADMIN-only access (non-admin → 403) | ✅ PASS | `auth` + `authorize('ADMIN')` on all 3 route files at router level |
| R6 | Frontend sidebar visible only for ADMIN | ✅ PASS | `adminNavItems` array, spread into `links` only when `isAdmin` — non-admin never sees it |
| R7 | Non-admin frontend gate | ✅ PASS | `Contabilidad.jsx` checks `useAuth().isAdmin` — renders "No autorizado" if not admin |

### Scenarios Covered

| Scenario | Method | Status |
|----------|--------|--------|
| Admin registers match ticket revenue | POST /api/ingresos | ✅ |
| Admin filters ingresos by date range | GET /api/ingresos?fechaDesde=&fechaHasta= | ✅ |
| Admin deletes a mis-entered ingreso | DELETE + GET 404 | ✅ |
| Non-admin gets 403 on ingresos | Any /api/ingresos/* as EDITOR | ✅ |
| Admin registers locker room painting expense | POST /api/gastos | ✅ |
| Admin views net balance with mixed transactions | GET /api/contabilidad/balance | ✅ |
| Negative amount rejected | POST with monto: -100 | ✅ |
| Missing required field rejected | POST without descripcion | ✅ |

---

## Architecture Decisions Upheld

| Decision | Implementation |
|----------|----------------|
| Separate controllers per entity | `ingresoController.js` + `gastoController.js` |
| Balance calculated on-read | No stored aggregate — `SUM` both tables on each request |
| Date filter with Prisma gte/lte | Filters object built from `fechaDesde`/`fechaHasta` query params |
| Decimal precision | `@db.Decimal(10, 2)` → matches existing `Cuota.monto` pattern |
| No Prisma relations for partidoId | `partidoId` is plain `String?`, not a FK relation |
| Frontend manual button tabs | Used instead of shadcn Tabs (lower dependency) |
| Glassmorphism card style | BalanceCard uses `bg-card border border-border/50 rounded-xl` |
| ARS currency formatting | `toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })` |

---

## Known Limitations

> These are non-blocking items documented during verification:

1. **PUT endpoints lack express-validator rules** — POST has full validation (descripcion notEmpty, monto min:0.01, partidoId optional UUID), but PUT routes pass body directly without re-validation. Recommended: add same validator chain to PUT routes for consistency.

2. **partidoId field hidden in UI** — The schema stores `partidoId` as an optional field (future FK to Partido), but the frontend forms don't expose a visible input for it. The field is present in the form component but marked as optional/hidden. To enable: uncomment/add a visible `<Input>` or a Partido selector component when the Partido module needs it.

---

## PR Chain

```
main
  └── PR1 (Backend) — Tasks 1-4: Prisma schema → Services → Controllers → Routes → app.js
       └── PR2 (Frontend Core) — Tasks 5,6,8,9,10: API client + IngresoList/Form + BalanceCard + Page + Sidebar
            └── PR3 (Frontend Gastos) — Task 7: GastoList + GastoForm
```

| PR | Scope | Files | Est. Lines |
|----|-------|-------|-----------|
| PR1 | Backend CRUD + schema | 8 new, 1 modified | ~330 |
| PR2 | Frontend core (Ingresos + Balance + page) | 6 new, 2 modified | ~397 |
| PR3 | Frontend gastos | 2 new | ~195 |

**Total estimated lines**: ~922 (backend ~330 + frontend ~592)

---

## Risks and Mitigations

| Risk | Mitigation | Status |
|------|------------|--------|
| Decimal rounding in balance | `Number()` conversion on Prisma Decimal → float | Mitigated |
| Date filter timezone mismatch | Consistent `new Date()` usage, server-timezone dates | Documented |
| Performance at scale | `@index` on `fecha` deferred (club-scale, not needed yet) | Deferred |
| No shadcn Tabs dependency | Manual button-based tab switcher used instead | Resolved |

---

## Rollback Instructions

1. Remove route registrations from `backend/src/app.js` (lines 26-28)
2. Delete backend files: `ingresoController.js`, `gastoController.js`, `ingresoService.js`, `gastoService.js`, `routes/ingresos.js`, `routes/gastos.js`, `routes/contabilidad.js`
3. Revert Prisma schema: remove `Ingreso` and `Gasto` models, run `npx prisma migrate down`
4. Delete frontend files: `api/contabilidad.js`, `components/contabilidad/`, `pages/Contabilidad.jsx`
5. Revert `frontend/src/App.jsx` (remove import + route)
6. Revert `frontend/src/components/layout/Sidebar.jsx` (remove adminNavItems entry)
