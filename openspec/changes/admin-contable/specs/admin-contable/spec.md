# Admin Contable Specification

## Purpose

Financial tracking for club revenue (ingresos) and expenses (gastos) with on-read balance calculation. ADMIN role only.

## Data Model

### Ingreso

| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key |
| descripcion | String | Required |
| monto | Decimal(10,2) | Required, MUST be > 0 |
| partidoId | String? | Optional FK to Partido |
| fecha | DateTime | Defaults to now() |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### Gasto

| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key |
| descripcion | String | Required |
| monto | Decimal(10,2) | Required, MUST be > 0 |
| partidoId | String? | Optional FK to Partido |
| fecha | DateTime | Defaults to now() |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

## API Endpoints

### Ingresos (`/api/ingresos`)

| Method | Path | Description | Query / Body |
|--------|------|-------------|-------------|
| GET | `/api/ingresos` | List all | `?fechaDesde=&fechaHasta=&partidoId=` |
| GET | `/api/ingresos/:id` | Get one | — |
| POST | `/api/ingresos` | Create | `{ descripcion, monto, partidoId?, fecha? }` |
| PUT | `/api/ingresos/:id` | Update | Partial fields |
| DELETE | `/api/ingresos/:id` | Delete | — |

### Gastos (`/api/gastos`)

Same structure as Ingresos with identical fields.

### Balance (`/api/contabilidad/balance`)

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/api/contabilidad/balance` | Calculated on read | `{ totalIngresos, totalGastos, balance }` |

All endpoints SHALL require `Authorization: Bearer <token>` and the ADMIN role. Non-admin requests SHALL receive HTTP 403.

## Requirements

### Requirement: Revenue CRUD

The system MUST allow ADMIN users to create, read, update, and delete revenue entries (ingresos).

#### Scenario: Admin registers match ticket revenue

- GIVEN an authenticated ADMIN user
- WHEN they POST `/api/ingresos` with `{ descripcion: "Entradas partido vs River", monto: 15000, partidoId: "abc" }`
- THEN the system creates the ingreso and responds with HTTP 201

#### Scenario: Admin filters ingresos by date range

- GIVEN ingresos exist across multiple dates
- WHEN the ADMIN GETs `/api/ingresos?fechaDesde=2026-05-01&fechaHasta=2026-05-15`
- THEN only ingresos within that range are returned

#### Scenario: Admin deletes a mis-entered ingreso

- GIVEN an ingreso with id `xyz` exists
- WHEN the ADMIN sends DELETE `/api/ingresos/xyz`
- THEN the ingreso is removed and GET `/api/ingresos/xyz` returns 404

#### Scenario: Non-admin gets 403 on ingresos

- GIVEN an authenticated EDITOR user
- WHEN they call any `/api/ingresos/*` endpoint
- THEN the system returns HTTP 403

### Requirement: Expense CRUD

The system MUST allow ADMIN users to create, read, update, and delete expense entries (gastos).

#### Scenario: Admin registers locker room painting expense

- GIVEN an authenticated ADMIN user
- WHEN they POST `/api/gastos` with `{ descripcion: "Pintado vestuario", monto: 2000 }`
- THEN the system creates the gasto and responds with HTTP 201

### Requirement: Balance Calculation

The system MUST calculate the net balance as totalIngresos minus totalGastos on every read.

#### Scenario: Admin views net balance with mixed transactions

- GIVEN total ingresos = $15000 and total gastos = $2000
- WHEN the ADMIN GETs `/api/contabilidad/balance`
- THEN the response is `{ totalIngresos: 15000, totalGastos: 2000, balance: 13000 }`

### Requirement: Input Validation

The system MUST reject invalid data with HTTP 400.

#### Scenario: Negative amount rejected

- GIVEN an authenticated ADMIN user
- WHEN they POST an ingreso with `monto: -100`
- THEN the system returns HTTP 400 with a validation error

#### Scenario: Missing required field rejected

- GIVEN an authenticated ADMIN user
- WHEN they POST a gasto without `descripcion`
- THEN the system returns HTTP 400 with a validation error

## Error Handling

| Code | Condition |
|------|-----------|
| 400 | Validation error (negative amount, missing fields) |
| 401 | Missing or invalid auth token |
| 403 | Authenticated but not ADMIN role |
| 404 | Ingreso or Gasto not found |
