# Proposal: Admin Contable

## Intent

Admin financial tracking module for logging match ticket revenue and expenses, then calculating the resulting balance. The club needs a dedicated section where an administrator records what came in (entradas del partido) and what went out (gastos), and the system shows the net result.

## Scope

### In Scope
- Revenue logging (match ticket sales — amount, description, date)
- Expense logging (amount, category, description, date)
- Balance calculation (total revenue − total expenses)
- Admin-only access (ADMIN role required)

### Out of Scope
- PDF/Excel export (deferred to future iteration)
- Recurring expense automation
- Integration with Mercado Pago or payment gateways
- Category management CRUD (use string enum initially)

## Capabilities

### New Capabilities
- `admin-contable`: Revenue/expense CRUD and balance calculation for admin financial tracking.

### Modified Capabilities
- None — this is a new module, no existing specs change.

## Approach

**Backend**: Add Prisma models `Ingreso` (revenue) and `Gasto` (expense) with fields for amount (Decimal), description, category, date, and userId. New `contabilidadController.js` + `contabilidadService.js` following existing patterns (controller/service separation). Routes under `api/contabilidad/` protected by ADMIN role middleware. The balance endpoint (`GET /api/contabilidad/balance`) calculates on read — sum all ingresos minus sum all gastos — no stored balance field.

**Frontend**: New `Contabilidad.jsx` page with three tabs: Ingresos (revenue form + list), Gastos (expense form + list), and Balance (calculated result). Reuses common components (Table, Modal, Input). Sidebar link shown only for ADMIN users. Routes follow existing React Router setup.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/prisma/schema.prisma` | New models | Add `Ingreso`, `Gasto` models |
| `backend/src/controllers/contabilidadController.js` | New | CRUD + balance endpoint handlers |
| `backend/src/services/contabilidadService.js` | New | Business logic layer |
| `backend/src/routes/contabilidad.js` | New | Route definitions with ADMIN guard |
| `backend/src/app.js` | Modified | Register `/api/contabilidad` routes |
| `frontend/src/pages/Contabilidad.jsx` | New | Main page with tabs |
| `frontend/src/components/contabilidad/` | New | Sub-components (forms, lists, balance card) |
| `frontend/src/App.jsx` | Modified | Add route + admin-only sidebar link |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Decimal precision for monetary amounts | Low | Prisma `Decimal(10, 2)` — standard approach |
| Non-admin user accessing contabilidad | Low | Role middleware on all routes; conditional sidebar render |
| Balance inconsistency if data deleted | Low | Calculate on read; no stored aggregate to desync |

## Rollback Plan

1. Run `npx prisma migrate down` to revert `Ingreso` and `Gasto` tables
2. Delete `backend/src/controllers/contabilidadController.js`
3. Delete `backend/src/services/contabilidadService.js`
4. Delete `backend/src/routes/contabilidad.js`
5. Remove route registration from `backend/src/app.js`
6. Delete `frontend/src/pages/Contabilidad.jsx` and `frontend/src/components/contabilidad/`
7. Revert `frontend/src/App.jsx` (remove route + sidebar link)

## Dependencies

- None — standalone module with no external integrations.

## Success Criteria

- [ ] Admin can log a revenue entry (description, amount, date, category)
- [ ] Admin can log an expense entry (description, amount, date, category)
- [ ] Admin can view a list of all ingresos and gastos
- [ ] Balance page shows (total revenue − total expenses) correctly
- [ ] Non-admin users get 403 on `/api/contabilidad/*` endpoints
- [ ] Frontend sidebar entry visible only for ADMIN role
