# Tasks: Admin Contable

## Review Workload Forecast

- **Estimated total lines**: ~940 (backend: ~345, frontend: ~597)
- **400-line budget risk**: High
- **Chained PRs recommended**: Yes
- **Decision needed before apply**: No

### Proposed PR Slices

| Slice | Scope | Est. Lines | Independent |
|-------|-------|-----------|-------------|
| PR 1 | Backend (schema → services → controllers → routes → app.js) | ~345 | Yes — testable via curl/Postman |
| PR 2 | Frontend core (API client + Contabilidad page + IngresoList/Form + BalanceCard + App/Sidebar) | ~397 | Yes — requires PR 1 deployed |
| PR 3 | Frontend gastos (GastoList + GastoForm) | ~195 | Yes — requires PR 2 deployed |

> **Note**: PR 2 delivers a working Contabilidad page with Ingresos + Balance visible. PR 3 adds Gastos to complete the module. Ordering allows each PR to ship independently.

---

## Backend Tasks

### Task 1: Add Prisma models Ingreso and Gasto

**Files**: `backend/prisma/schema.prisma`

**Description**: Add two new models (`Ingreso` and `Gasto`) after the `HistorialCambios` model block. Each has: `id` (UUID PK), `descripcion` (String), `monto` (Decimal 10,2), `partidoId` (String?, optional), `fecha` (DateTime, default now), `createdAt`, `updatedAt`. No Prisma relations to other models yet — `partidoId` is a plain optional string for future FK.

**Verification**:
1. Run `npm run prisma:generate` — client builds without errors
2. Run `npm run prisma:migrate -- --name add_ingreso_gasto` — migration applies
3. Check DB: `\d Ingreso` and `\d Gasto` show correct columns

**Est. lines**: ~20

---

### Task 2: Create ingresoService and gastoService

**Files**:
- `backend/src/services/ingresoService.js` (NEW)
- `backend/src/services/gastoService.js` (NEW)

**Description**: Create two service files with identical method signatures operating on different Prisma models.

`ingresoService.js` exports:
- `getAll(filters)` — builds `where` clause from `fechaDesde`/`fechaHasta` (gte/lte) and optional `partidoId`. Calls `prisma.ingreso.findMany({ where, orderBy: { fecha: 'desc' } })`.
- `getById(id)` — `prisma.ingreso.findUnique`. Throws `Error('Ingreso no encontrado')` if null.
- `create(data)` — `prisma.ingreso.create({ data })`.
- `update(id, data)` — checks existence first, then `prisma.ingreso.update`.
- `remove(id)` — `prisma.ingreso.delete`. Prisma throws if not found.
- `getTotal()` — `prisma.ingreso.aggregate({ _sum: { monto: true } })`. Returns `Number(result._sum.monto || 0)`.

`gastoService.js`: Same structure using `prisma.gasto` throughout. Error messages say "Gasto no encontrado".

**Pattern reference**: `backend/src/services/cuotaService.js` (213 lines with more complex logic). These are simpler — no relations, no compound unique checks.

**Verification**:
1. Import in a test script: each function compiles without reference errors
2. `getAll` with date filters returns correct subset
3. `getTotal` returns sum matching manual SQL query
4. `getById` with nonexistent ID throws descriptive error

**Est. lines**: ~150 (75 + 75)

---

### Task 3: Create ingresoController, gastoController, and route files

**Files**:
- `backend/src/controllers/ingresoController.js` (NEW)
- `backend/src/controllers/gastoController.js` (NEW)
- `backend/src/routes/ingresos.js` (NEW)
- `backend/src/routes/gastos.js` (NEW)
- `backend/src/routes/contabilidad.js` (NEW)

**Description**:

**Controllers** (`ingresoController.js`, `gastoController.js`):
Each exports `getAll`, `getById`, `create`, `update`, `remove` following the exact pattern of `jugadorController.js`:
- `getAll(req, res)` — calls service with `req.query` filters, returns `res.json({ ingresos })` or `res.json({ gastos })`
- `getById(req, res)` — calls service with `req.params.id`, returns 404 on error
- `create(req, res)` — validates with `validationResult(req)`, returns 400 on validation error, 201 on success
- `update(req, res)` — calls service, returns 404/400 on error
- `remove(req, res)` — calls service, returns 404 on error

**Routes**:

`routes/ingresos.js`:
- Applies `auth` + `authorize('ADMIN')` at router level (all endpoints protected)
- GET `/` → `getAll`, GET `/:id` → `getById`
- POST `/` → `create` with validators: `descripcion` notEmpty, `monto` isFloat(min:0.01), `partidoId` optional isUUID, `fecha` optional isISO8601
- PUT `/:id` → `update`, DELETE `/:id` → `remove`

`routes/gastos.js`: Same structure but imports `gastoController`.

`routes/contabilidad.js`:
- Applies `auth` + `authorize('ADMIN')` at router level
- GET `/balance` → inline handler that calls `ingresoService.getTotal()` + `gastoService.getTotal()`, returns `{ totalIngresos, totalGastos, balance }`

**Pattern reference**: `jugadorController.js` (77 lines), `routes/jugadores.js` (25 lines), `routes/pagos.js` (inline handler in route).

**Verification**:
1. All files parse without syntax errors
2. Each route file exports a valid Express Router
3. Controllers handle success and error paths correctly (201/200 for success, 400/404/500 for errors)
4. Balance route sums correctly with mixed data

**Est. lines**: ~155 (55 + 50 + 25 + 25 + 20)

---

### Task 4: Register contabilidad routes in app.js

**Files**: `backend/src/app.js` (MODIFY)

**Description**: Add three `app.use` registrations after existing route registrations (around line 25):
```js
app.use('/api/ingresos', require('./routes/ingresos'));
app.use('/api/gastos', require('./routes/gastos'));
app.use('/api/contabilidad', require('./routes/contabilidad'));
```

**Verification**:
1. Server starts without errors
2. `GET /api/health` still works
3. `GET /api/ingresos` returns `{ ingresos: [] }` (empty array, 200)
4. `GET /api/gastos` returns `{ gastos: [] }` (empty array, 200)
5. `GET /api/contabilidad/balance` returns `{ totalIngresos: 0, totalGastos: 0, balance: 0 }`

**Est. lines**: ~5 (modified)

---

## Frontend Tasks

### Task 5: Create contabilidad API client ✅

**Files**: `frontend/src/api/contabilidad.js` (NEW)

**Description**: Named function exports wrapping `apiClient`:
- `getIngresos(params)`, `getIngreso(id)`, `createIngreso(data)`, `updateIngreso(id, data)`, `deleteIngreso(id)`
- `getGastos(params)`, `getGasto(id)`, `createGasto(data)`, `updateGasto(id, data)`, `deleteGasto(id)`
- `getBalance()`

All use `/ingresos`, `/gastos`, `/contabilidad/balance` as paths. The Vite proxy forwards `/api/*` to the backend.

**Pattern reference**: Uses same Axios client pattern as `Users.jsx` (`.get`, `.post`, `.put`, `.delete` calls).

**Verification**:
1. Import all functions without errors
2. Each function resolves to correct URL path
3. Error responses propagate correctly

**Est. lines**: ~20

---

### Task 6: Create IngresoList and IngresoForm components ✅

**Files**:
- `frontend/src/components/contabilidad/IngresoList.jsx` (NEW)
- `frontend/src/components/contabilidad/IngresoForm.jsx` (NEW)

**Description**:

**IngresoList.jsx**:
- Self-fetching via `getIngresos()` on mount and when filters change
- **Date range filter**: Two date inputs (`fechaDesde`, `fechaHasta`) at the top, trigger refetch on change
- **Loading state**: Spinner in a centered card
- **Empty state**: Icon + "No hay ingresos registrados"
- **Table**: shadcn `<Table>` with columns: Descripción, Monto, Fecha, Acciones
- **Actions per row**: Edit (Pencil) and Delete (Trash2) buttons with `opacity-0 group-hover:opacity-100` pattern
- **Delete confirmation**: `window.confirm('¿Eliminar este ingreso?')` before calling `deleteIngreso(id)`

**IngresoForm.jsx**:
- Props: `{ open, onOpenChange, onSubmit, initialData, loading }`
- Dialog with form fields: descripcion (Input, required), monto (Input type=number step=0.01, required), fecha (Input type=date, optional), partidoId (Input, optional/hidden)
- Same dialog pattern as `UserFormDialog` in `Users.jsx`
- Submit calls `onSubmit(formData)` → parent handles create/update

**Pattern reference**: `Users.jsx` (244 lines) for table + dialog pattern.

**Verification**:
1. IngresoList renders with loading spinner, then empty state
2. Creating an ingreso via IngresoForm closes the dialog and list refreshes
3. Edit pre-fills the form with existing data
4. Delete shows confirmation, then removes the row
5. Date filter narrows results correctly
6. All amounts formatted with `toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })`

**Est. lines**: ~225 (130 + 95)

---

### Task 7: Create GastoList and GastoForm components ✅

**Files**:
- `frontend/src/components/contabilidad/GastoList.jsx` (NEW)
- `frontend/src/components/contabilidad/GastoForm.jsx` (NEW)

**Description**: Identical structure to IngresoList + IngresoForm but operating on gastos. All labels and messages use "gasto"/"gastos" instead of "ingreso"/"ingresos".

**GastoList.jsx**: Same features — date range filter, table (Descripción, Monto, Fecha, Acciones), loading/empty states, edit/delete actions.

**GastoForm.jsx**: Same dialog form — descripcion (required), monto (required, > 0), fecha (optional, defaults today), partidoId (optional).

**Verification**: Same verification pattern as Task 6 but for gastos:
1. GastoList renders loading/empty states
2. Create gasto via form refreshes list
3. Edit/delete work correctly
4. Date filter narrows results

**Est. lines**: ~195 (110 + 85)

---

### Task 8: Create BalanceCard component ✅

**Files**: `frontend/src/components/contabilidad/BalanceCard.jsx` (NEW)

**Description**: Self-fetching component that calls `getBalance()` on mount.
- **Loading**: Spinner placeholder
- **Error**: Error message
- **Data**: Three stat cards in a row: Total Ingresos (green tint), Total Gastos (red tint), Balance
- Balance card tinted green if positive, red if negative, neutral if zero
- Same glassmorphism style as Dashboard cards (`bg-card border border-border/50 rounded-xl`)
- Amounts formatted with `toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })`

**Verification**:
1. Shows spinner during fetch, then displays three cards
2. With ingresos=15000 and gastos=2000, shows balance=13000 (green)
3. With ingresos=0 and gastos=5000, shows balance=-5000 (red)
4. With no data, shows balance=0 (neutral)

**Est. lines**: ~55

---

### Task 9: Create Contabilidad page with tabs and admin gate ✅

**Files**: `frontend/src/pages/Contabilidad.jsx` (NEW)

**Description**: Main contabilidad page.
1. **Admin gate**: Check `useAuth().isAdmin`. If not admin, render "No autorizado" centered message
2. **Tabs**: Three tabs — Ingresos, Gastos, Balance. Either shadcn Tabs (if `npx shadcn@latest add tabs` has been run) or manual button-based tab switcher with `useState('ingresos')`
3. **Tab content**:
   - "Ingresos": date filter + IngresoList + "Nuevo" button
   - "Gastos": date filter + GastoList + "Nuevo" button
   - "Balance": BalanceCard
4. Each list component manages own loading/error/data state
5. BalanceCard refetches when switching to Balance tab

**Pattern reference**: `Users.jsx` (244 lines) for page structure pattern.

**Verification**:
1. Non-admin user sees "No autorizado" message
2. Three tabs render and switch correctly
3. Ingresos tab shows list + new button
4. Gastos tab shows list + new button
5. Balance tab shows BalanceCard
6. After creating an ingreso/gasto in one tab, switching back shows updated data

**Est. lines**: ~85

---

### Task 10: Route and Sidebar integration ✅

**Files**:
- `frontend/src/App.jsx` (MODIFY)
- `frontend/src/components/layout/Sidebar.jsx` (MODIFY)

**Description**:

**App.jsx**:
- Add `import Contabilidad from './pages/Contabilidad';`
- Add `<Route path="/contabilidad" element={<ProtectedRoute><Layout><Contabilidad /></Layout></ProtectedRoute>} />` after the `/usuarios` route

**Sidebar.jsx**:
- Create `adminNavItems` array with `{ to: '/contabilidad', label: 'Contabilidad', icon: Receipt }` alongside existing `{ to: '/usuarios', label: 'Usuarios', icon: Settings }`
- Modify `links` computation to spread both arrays when admin
- `Receipt` is already imported from `lucide-react`

**Verification**:
1. Admin user sees "Contabilidad" link in sidebar
2. Non-admin user does NOT see "Contabilidad" link
3. Clicking the link navigates to `/contabilidad`
4. Direct URL access `/contabilidad` works for authenticated users
5. Direct URL access redirects unauthenticated users to login

**Est. lines**: ~15 (modified)

---

## Task Dependency Graph

```
Task 1 (Prisma schema)
  └── Task 2 (Services) — depends on models existing
       └── Task 3 (Controllers + Routes) — depends on services
            └── Task 4 (app.js registration) — depends on routes
                 │
                 └── Task 5 (API client) — depends on routes working
                      │
                      ├── Task 6 (IngresoList + IngresoForm)
                      │    └── Task 9 (Contabilidad page) — needs ingest list/form
                      │         └── Task 10 (App/Sidebar) — needs page
                      │
                      └── Task 7 (GastoList + GastoForm)
                           └── Task 9 (Contabilidad page) — needs gasto list/form

Task 8 (BalanceCard) — independent of Task 6/7, depends only on Task 5
  └── Task 9 (Contabilidad page) — needs BalanceCard
```

---

## PR Slice Breakdown

### PR 1: Backend (Tasks 1–4) — ~330 lines
All backend work. Testable end-to-end via curl/Postman without any frontend changes.

### PR 2: Frontend Core (Tasks 5, 6, 8, 9, 10) — ~397 lines
API client + Ingreso components + BalanceCard + page + integration. Delivers a working Contabilidad page with Ingresos tab and Balance tab. Gastos tab shows empty state.

### PR 3: Frontend Gastos (Task 7) — ~195 lines
Adds GastoList + GastoForm, completing the Gastos tab. Pure addition — no existing code changed.
