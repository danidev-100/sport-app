# Design: Admin Contable Module

## Technical Approach

### Architecture Overview

New standalone module following the existing backend pattern (route → controller → service → Prisma) and frontend pattern (page → components → API client). The spec defines separate endpoints for ingresos (`/api/ingresos`), gastos (`/api/gastos`), and balance (`/api/contabilidad/balance`), so the backend uses separate controllers/services per entity. The balance is calculated on-read (no stored aggregate).

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Separate vs single controller | Separate (`ingresoController`, `gastoController`) | Spec defines different route paths; keeps each file focused. Balance logic lives inline in the contabilidad route since it's a simple aggregation of both services. |
| Balance calculation | On-read (`SUM` both tables) | No stored aggregate to desync. Matches spec requirement. |
| Date filter approach | Prisma `gte`/`lte` on `fecha` field | Follows existing Prisma query patterns (see `cuotaService.js`). |
| Frontend tabs | Requires adding shadcn Tabs component (`npx shadcn@latest add tabs`) | No tabs component exists yet; this is the simplest path. Alternatively, implement a manual button-based tab switcher (lower dependency, more control). |
| Decimal precision | `@db.Decimal(10, 2)` | Matches existing `Cuota.monto` pattern in schema.prisma. |

---

## Backend Design

### Prisma Schema (new models in `schema.prisma`)

Add after the `HistorialCambios` model block:

```prisma
model Ingreso {
  id          String   @id @default(uuid())
  descripcion String
  monto       Decimal  @db.Decimal(10, 2)
  partidoId   String?
  fecha       DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Gasto {
  id          String   @id @default(uuid())
  descripcion String
  monto       Decimal  @db.Decimal(10, 2)
  partidoId   String?
  fecha       DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### File Structure (new backend files)

```
backend/src/
├── controllers/
│   ├── ingresoController.js    (NEW)
│   └── gastoController.js      (NEW)
├── services/
│   ├── ingresoService.js       (NEW)
│   └── gastoService.js         (NEW)
├── routes/
│   ├── ingresos.js             (NEW)
│   ├── gastos.js               (NEW)
│   └── contabilidad.js         (NEW)
└── app.js                      (MODIFY — register 3 new route groups)
```

### Route Registration (`backend/src/app.js`)

Add after existing route registrations (after line 25):

```js
app.use('/api/ingresos', require('./routes/ingresos'));
app.use('/api/gastos', require('./routes/gastos'));
app.use('/api/contabilidad', require('./routes/contabilidad'));
```

### Routes Detail

#### `routes/ingresos.js`

```js
const express = require('express');
const { body } = require('express-validator');
const ingresoController = require('../controllers/ingresoController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

// All routes require auth + ADMIN role
router.use(auth);
router.use(authorize('ADMIN'));

router.get('/', ingresoController.getAll);
router.get('/:id', ingresoController.getById);
router.post('/', [
  body('descripcion').notEmpty().withMessage('Descripción es requerida'),
  body('monto').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  body('partidoId').optional().isUUID().withMessage('ID de partido inválido'),
  body('fecha').optional().isISO8601().withMessage('Fecha inválida')
], ingresoController.create);
router.put('/:id', ingresoController.update);
router.delete('/:id', ingresoController.remove);

module.exports = router;
```

> Pattern reference: same `auth` + `authorize` middleware pattern as `routes/pagos.js` line 13 and `routes/jugadores.js` lines 9-23. Validation with `express-validator` matches `routes/auth.js` lines 7-11.

#### `routes/gastos.js`

Identical structure to `ingresos.js` but imports `gastoController` and uses `gastoController` methods.

#### `routes/contabilidad.js`

```js
const express = require('express');
const ingresoService = require('../services/ingresoService');
const gastoService = require('../services/gastoService');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

router.use(auth);
router.use(authorize('ADMIN'));

router.get('/balance', async (req, res) => {
  try {
    const totalIngresos = await ingresoService.getTotal();
    const totalGastos = await gastoService.getTotal();
    const balance = totalIngresos - totalGastos;
    res.json({ totalIngresos, totalGastos, balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
```

> This is a lightweight route with inline handler (no separate controller needed since it's a single aggregation). Pattern follows `routes/pagos.js` lines 50-61 and `routes/jugadores.js` line 12 which have inline handlers for simple endpoints.

### Controller Detail

#### `controllers/ingresoController.js`

Follows the exact pattern of `jugadorController.js`:

| Method | Signature | Returns | Error |
|--------|-----------|---------|-------|
| `getAll` | `async (req, res)` → calls `ingresoService.getAll(req.query)` | `res.json({ ingresos })` | 500 |
| `getById` | `async (req, res)` → calls `ingresoService.getById(req.params.id)` | `res.json({ ingreso })` | 404 |
| `create` | `async (req, res)` → validates, then `ingresoService.create(req.body)` | `res.status(201).json({ ingreso })` | 400 |
| `update` | `async (req, res)` → calls `ingresoService.update(req.params.id, req.body)` | `res.json({ ingreso })` | 404/400 |
| `remove` | `async (req, res)` → calls `ingresoService.remove(req.params.id)` | `res.json(result)` | 404 |

**Validation pattern** (create): use `validationResult(req)` from express-validator, same as `jugadorController.js` lines 25-28.

**Filter parsing** (getAll): extract `fechaDesde`, `fechaHasta`, `partidoId` from `req.query`. Pass as filters object to service.

#### `controllers/gastoController.js`

Identical structure to `ingresoController.js` but operating on gastos.

### Service Detail

#### `services/ingresoService.js`

All services import `const prisma = require('../config/database');` (same pattern as `authService.js` line 1 and all other services).

| Method | Logic | Returns |
|--------|-------|---------|
| `getAll(filters)` | Build `where` clause from filters (date range with `gte`/`lte`, optional `partidoId`). `prisma.ingreso.findMany({ where, orderBy: { fecha: 'desc' } })` | Array of ingresos |
| `getById(id)` | `prisma.ingreso.findUnique({ where: { id } })`. If null → throw `Error('Ingreso no encontrado')` | Single ingreso |
| `create(data)` | `prisma.ingreso.create({ data })` | Created ingreso |
| `update(id, data)` | First checks existence with `findUnique`. Then `prisma.ingreso.update({ where: { id }, data })` | Updated ingreso |
| `remove(id)` | `prisma.ingreso.delete({ where: { id } })`. If not found → Prisma throws → controller catches 404 | `{ message: 'Ingreso eliminado' }` |
| `getTotal()` | `prisma.ingreso.aggregate({ _sum: { monto: true } })`. Returns `result._sum.monto || 0` converted to Number | Float |

**Filters implementation** (getAll):
```js
const where = {};
if (filters.fechaDesde || filters.fechaHasta) {
  where.fecha = {};
  if (filters.fechaDesde) where.fecha.gte = new Date(filters.fechaDesde);
  if (filters.fechaHasta) where.fecha.lte = new Date(filters.fechaHasta);
}
if (filters.partidoId) where.partidoId = filters.partidoId;
```

#### `services/gastoService.js`

Identical structure to `ingresoService.js` but uses `prisma.gasto` throughout.

---

## Frontend Design

### File Structure (new frontend files)

```
frontend/src/
├── api/
│   └── contabilidad.js          (NEW — API client functions)
├── pages/
│   └── Contabilidad.jsx         (NEW — main page with tabs)
├── components/
│   └── contabilidad/
│       ├── BalanceCard.jsx      (NEW — summary card)
│       ├── IngresoForm.jsx      (NEW — create/edit dialog)
│       ├── IngresoList.jsx      (NEW — table + filters)
│       ├── GastoForm.jsx        (NEW — create/edit dialog)
│       └── GastoList.jsx        (NEW — table + filters)
├── App.jsx                      (MODIFY — add route + sidebar link)
```

### API Client (`api/contabilidad.js`)

Exports named functions wrapping `apiClient`:

```js
import apiClient from './apiClient';

export const getIngresos = (params) => apiClient.get('/ingresos', { params });
export const getIngreso = (id) => apiClient.get(`/ingresos/${id}`);
export const createIngreso = (data) => apiClient.post('/ingresos', data);
export const updateIngreso = (id, data) => apiClient.put(`/ingresos/${id}`, data);
export const deleteIngreso = (id) => apiClient.delete(`/ingresos/${id}`);

export const getGastos = (params) => apiClient.get('/gastos', { params });
export const getGasto = (id) => apiClient.get(`/gastos/${id}`);
export const createGasto = (data) => apiClient.post('/gastos', data);
export const updateGasto = (id, data) => apiClient.put(`/gastos/${id}`, data);
export const deleteGasto = (id) => apiClient.delete(`/gastos/${id}`);

export const getBalance = () => apiClient.get('/contabilidad/balance');
```

> Pattern reference: follows existing Axios client usage in `Users.jsx` (`.get`, `.post`, `.put`, `.delete` calls).

### Page: `Contabilidad.jsx`

**Structure**:
1. **Admin gate**: Check `useAuth().isAdmin`. If `!isAdmin`, render "No autorizado" message (centered, muted text with lock icon).
2. **Tabs**: Two implementation options (implementation choice):
   - **Option A (recommended)**: Run `npx shadcn@latest add tabs` to add the shadcn Tabs component, then use `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>`.
   - **Option B**: Manual button-based tab switcher using `useState('ingresos')` and conditional rendering.
3. **Data**: Both `IngresoList` and `GastoList` fetch their own data via `useEffect` + API calls. `BalanceCard` fetches on mount and after any create/update/delete.

**Tab layout**:
```
┌─────────────────────────────────────────────┐
│  Contabilidad                                │
│  ┌──────────┬──────────┬──────────┐          │
│  │ Ingresos │  Gastos  │ Balance  │ (tabs)   │
│  └──────────┴──────────┴──────────┘          │
│                                              │
│  [Tab content area]                          │
│  - Ingresos: filter + IngresoList + "Nuevo"  │
│  - Gastos:   filter + GastoList   + "Nuevo"  │
│  - Balance:  BalanceCard                     │
└─────────────────────────────────────────────┘
```

**State management**:
- Each tab's list component manages its own loading/error/data state (no global store needed).
- After successful create/update/delete in a form dialog, the list refetches.
- BalanceCard refetches when it becomes visible (tab change) via an effect or a refresh trigger.

### Component: `BalanceCard.jsx`

**Props**: none (self-fetching via API call in `useEffect`)

**States**:
- **Loading**: Spinner placeholder
- **Error**: Error message (unlikely, but catch)
- **Data**: Three stat cards in a row:

```
┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
│  Total Ingresos │  │  Total Gastos  │  │  Balance             │
│  $15,000.00     │  │  $2,000.00     │  │  $13,000.00 ▲        │
│  (green tint)   │  │  (red tint)    │  │  (green if >0, red   │
└──────────────┘  └──────────────┘  │   if <0, neutral if 0) │
                                    └──────────────────────┘
```

**Visual treatment** (following existing glassmorphism style from `Dashboard.jsx`/`Sidebar.jsx`):
- Cards use the same `glass-strong` or `bg-card border border-border/50 rounded-xl` pattern.
- Amounts formatted with `toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })`.
- Balance card background/icon tinted green (`text-green-500`) if positive, red (`text-red-500`) if negative.

### Component: `IngresoList.jsx`

**Data flow**: Fetches `getIngresos()` on mount and whenever a filter changes.

**Features**:
- **Date range filter**: Two date inputs (fechaDesde, fechaHasta) at the top, triggering refetch on change.
- **Empty state**: Same pattern as `Users.jsx` — icon + "No hay ingresos registrados" message.
- **Loading state**: Spinner in a centered card.
- **Table**: Uses shadcn `<Table>` component (same as `Users.jsx`). Columns: Descripción, Monto, Fecha, Acciones.
- **Actions per row**: Edit (Pencil icon) and Delete (Trash2 icon) buttons, matching `Users.jsx` pattern (opacity-0 group-hover:opacity-100).
- **Delete confirmation**: `window.confirm('¿Eliminar este ingreso?')` before calling `deleteIngreso(id)`.

### Component: `IngresoForm.jsx`

**Pattern**: Dialog with form, identical structure to `UserFormDialog` in `Users.jsx`.

**Props**: `{ open, onOpenChange, onSubmit, initialData, loading }`

**Form fields**:
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| descripcion | `<Input>` | Required | Text |
| monto | `<Input type="number" step="0.01" min="0.01">` | Required, > 0 | Numeric |
| fecha | `<Input type="date">` | Optional, defaults to today | Date picker |
| partidoId | `<Input>` | Optional | Hidden/advanced, can be omitted initially |

**Submit flow**: `onSubmit(formData)` → parent calls `createIngreso()` or `updateIngreso()` → on success closes dialog + refetches list.

### Component: `GastoList.jsx`

Identical structure to `IngresoList.jsx` but operates on gastos.

### Component: `GastoForm.jsx`

Identical structure to `IngresoForm.jsx` but operates on gastos.

### App.jsx Changes

**New route** (add after existing `/usuarios` route, before the catch-all):

```jsx
<Route
  path="/contabilidad"
  element={
    <ProtectedRoute>
      <Layout>
        <Contabilidad />
      </Layout>
    </ProtectedRoute>
  }
/>
```

**Import**: `import Contabilidad from './pages/Contabilidad';`

### Sidebar.jsx Changes

Add `Contabilidad` nav item — only visible for ADMIN.

In `navItems` array (line 5-10), add:

```js
{ to: '/contabilidad', label: 'Contabilidad', icon: Receipt },
```

The existing admin-only logic (lines 16-18) already adds extra items only for admin. However, Contabilidad should be admin-only. Two approaches:
- **Option A (recommended)**: Add it to `navItems` always, but render it only when `isAdmin` — same pattern as the existing `links` filter on line 16-18.
- **Option B**: Add it inside the admin-only `links` spread on line 17.

Option A is cleaner — add a separate `adminNavItems` array:

```js
const adminNavItems = [
  { to: '/usuarios', label: 'Usuarios', icon: Settings },
  { to: '/contabilidad', label: 'Contabilidad', icon: Receipt },
];

const links = isAdmin
  ? [...navItems, ...adminNavItems]
  : navItems;
```

> Note: Import `Receipt` from `lucide-react`. It's already imported in Sidebar.jsx.

---

## Entity Relationship

```
[User] ──<admin action>── [Ingreso]
[User] ──<admin action>── [Gasto]

Ingreso ──optional──> [Partido]  (future FK, partidoId stored but no relation defined yet)
Gasto   ──optional──> [Partido]  (future FK, same)
```

No direct Prisma relations between Ingreso/Gasto and other models yet — `partidoId` is a plain String? that can be linked to a Partido model in a future iteration.

---

## Auth Flow

```
Request → auth middleware (JWT verify) → authorize('ADMIN') (role check) → controller → service → response
                      │                       │
                      │ 401 if invalid token   │ 403 if rol !== 'ADMIN'
                      └────────────────────────┘
```

All three route files (`ingresos.js`, `gastos.js`, `contabilidad.js`) apply the same middleware chain at the router level, so every endpoint is protected.

---

## Error Mapping

| HTTP | Condition | Source |
|------|-----------|--------|
| 400 | Validation error (missing descripcion, monto <= 0, invalid date) | express-validator in route |
| 401 | Missing/invalid/expired JWT | `middleware/auth.js` |
| 403 | Authenticated user is not ADMIN | `middleware/roles.js` |
| 404 | Ingreso/Gasto not found by ID | Service throws, controller catches |
| 500 | Unexpected server error | Catch-all in controller |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Decimal rounding in balance calculation | Low | Low | Prisma returns Decimal as string; convert to Number with `Number()` in `getTotal()` |
| Date filter timezone mismatch | Medium | Low | `fechaDesde`/`fechaHasta` compare against UTC. Use `new Date()` consistently. Document that dates are server-timezone. |
| Performance with large datasets | Low (club-scale) | Low | Add Prisma `@index` on `fecha` if needed in future. Current scale doesn't need it. |
| No shadcn Tabs component installed | Low | Low | Fallback to manual button tabs (Option B). Document in implementation notes. |
