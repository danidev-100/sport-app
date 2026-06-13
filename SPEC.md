# SPEC.md — Sistema de Administración de Club Deportivo

**Versión**: 2.0 (Post-Production-Grade Upgrade)

---

## 1. Resumen del Proyecto

Sistema web full-stack para administración de clubes deportivos. Gestión de jugadores, cuotas societarias,
pagos (presenciales y vía Mercado Pago), partidos, contabilidad (ingresos/gastos), y control financiero.

| Capa | Tecnología | Puerto |
|------|-----------|--------|
| Frontend | React 19 + Vite + Tailwind CSS 4 + shadcn/ui | 5173 |
| Backend | Node.js + Express 4 (CommonJS) | 3000 |
| Base de datos | PostgreSQL via Prisma ORM | 5432 |
| Auth | JWT (access 15min + refresh 7d) | — |

---

## 2. Estructura de Carpetas

### Backend

```
backend/
├── prisma/
│   ├── schema.prisma          # Modelo de datos completo
│   ├── seed.js                # Datos de prueba (idempotente)
│   └── migrations/            # Migraciones SQL generadas
├── src/
│   ├── config/
│   │   └── database.js        # Instancia singleton de PrismaClient
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── jugadorController.js
│   │   ├── cuotaController.js
│   │   ├── pagoController.js
│   │   ├── dashboardController.js
│   │   ├── userController.js
│   │   ├── partidoController.js
│   │   ├── ingresoController.js
│   │   ├── gastoController.js
│   │   └── fechaController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── authJugador.js     # JWT verification para jugadores (Google Auth)
│   │   ├── roles.js           # Role-based authorization
│   │   └── errorHandler.js    # Error handler centralizado
│   ├── routes/
│   │   ├── auth.js            # /auth/*
│   │   ├── jugadores.js       # /jugadores/*
│   │   ├── jugadoresAuth.js   # /jugadores/auth/* (Google login)
│   │   ├── cuotas.js          # /cuotas/*
│   │   ├── pagos.js           # /pagos/* (incl. webhook MP, mis-cuotas)
│   │   ├── dashboard.js       # /dashboard/*
│   │   ├── users.js           # /users/*
│   │   ├── partidos.js        # /partidos/*
│   │   ├── ingresos.js        # /ingresos/*
│   │   ├── gastos.js          # /gastos/*
│   │   ├── fechas.js          # /fechas/*
│   │   └── contabilidad.js    # /contabilidad/* (balance)
│   ├── services/
│   │   ├── authService.js     # Registro, login, refresh tokens
│   │   ├── jugadorService.js
│   │   ├── cuotaService.js    # CRUD + generarMensuales + generarMasivas
│   │   ├── historialService.js
│   │   ├── partidoService.js
│   │   ├── ingresoService.js
│   │   ├── gastoService.js
│   │   ├── fechaService.js
│   │   ├── mercadoPagoService.js  # Preferencias + webhook + HMAC
│   │   └── googleService.js       # Google OAuth verification
│   ├── utils/
│   │   ├── helpers.js         # paginate(), paginatedResponse(), formatError()
│   │   ├── errors.js          # AppError, NotFoundError, ValidationError, AuthError
│   │   └── calcularMontoCuota.js
│   ├── tests/
│   │   ├── setup.js
│   │   ├── authService.test.js
│   │   └── cuotaService.test.js
│   ├── app.js                 # Configuración Express (middleware global, mount de rutas)
│   └── server.js              # Entry point (con graceful shutdown)
├── Dockerfile
├── nodemon.json
├── vitest.config.js
├── package.json
└── .env
```

### Frontend

```
frontend/
├── src/
│   ├── api/
│   │   ├── apiClient.js       # Axios instance + 401 interceptor con refresh
│   │   ├── auth.js
│   │   ├── jugadores.js
│   │   ├── cuotas.js
│   │   ├── pagos.js
│   │   ├── dashboard.js
│   │   ├── contabilidad.js    # Ingresos, gastos, fechas + balance
│   │   └── users.js
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── ConfirmDialog.jsx
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── jugadores/
│   │   │   ├── JugadorForm.jsx
│   │   │   ├── JugadorList.jsx
│   │   │   └── JugadorFilters.jsx
│   │   ├── cuotas/
│   │   │   ├── CuotaList.jsx
│   │   │   ├── GenerarCuotas.jsx
│   │   │   └── MorososList.jsx
│   │   ├── pagos/
│   │   │   ├── PagoForm.jsx
│   │   │   └── PagoList.jsx
│   │   └── dashboard/
│   │       ├── MetricasCards.jsx
│   │       ├── CuotasChart.jsx
│   │       └── RecientesList.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Jugadores.jsx
│   │   ├── Cuotas.jsx
│   │   ├── Pagos.jsx
│   │   ├── Users.jsx
│   │   └── Contabilidad.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useFetch.js
│   ├── utils/
│   │   └── formatters.js
│   ├── tests/
│   │   ├── setup.js
│   │   ├── AuthContext.test.jsx
│   │   └── Dashboard.test.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── Dockerfile
├── nginx.conf
├── vite.config.js
├── vitest.config.js
└── package.json
```

---

## 3. Modelos de Base de Datos

### Enum: `Role`

```prisma
enum Role {
  ADMIN
  EDITOR
}
```

### Enum: `Categoria`

```prisma
enum Categoria {
  C7
  C11
  C13
  C15
  C17
  C20
  PRIMERA
  SENIOR
  VETERANO
}
```

### Model: `User`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (UUID) | @id @default(uuid()) |
| email | String | @unique |
| password | String | Hash bcrypt(10) |
| nombre | String | |
| rol | Role | @default(EDITOR) |
| activo | Boolean | @default(true) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

**Relaciones**: `historialCambios HistorialCambios[]`, `refreshTokens RefreshToken[]`

### Model: `Jugador`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (UUID) | @id @default(uuid()) |
| nombre | String | |
| categoria | Categoria? | Nullable |
| edad | Int | |
| telefono | String? | |
| email | String? | @unique |
| fotoUrl | String? | |
| activo | Boolean | @default(true) |
| googleId | String? | @unique (para Google Auth) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

**Relaciones**: `cuotas Cuota[]`, `historialCambios HistorialCambios[]`

### Model: `Cuota`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (UUID) | @id @default(uuid()) |
| numeroIdentificacion | String? | |
| jugadorId | String | FK → Jugador |
| mes | Int | 1-12 |
| anio | Int | |
| monto | Decimal(10,2) | |
| vencida | Boolean | @default(false) |
| fechaVencimiento | DateTime | |
| createdAt | DateTime | @default(now()) |

**Relaciones**: `jugador Jugador @relation`, `pagos Pago[]`
**Unique**: `@@unique([jugadorId, mes, anio])`

### Model: `Pago`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (UUID) | @id @default(uuid()) |
| cuotaId | String | FK → Cuota |
| monto | Decimal(10,2) | |
| fechaPago | DateTime | @default(now()) |
| metodoPago | String? | Efectivo, Transferencia, MercadoPago |
| observacion | String? | |
| createdAt | DateTime | @default(now()) |

**Relaciones**: `cuota Cuota @relation(fields: [cuotaId], references: [id], onDelete: Cascade)`

### Model: `Partido`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (UUID) | @id @default(uuid()) |
| titulo | String | |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

**Relaciones**: `ingresos Ingreso[]`, `gastos Gasto[]`

### Model: `Fecha`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (UUID) | @id @default(uuid()) |
| titulo | String | |
| fecha | DateTime | |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

**Relaciones**: `ingresos Ingreso[]`, `gastos Gasto[]`

### Model: `Ingreso`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (UUID) | @id @default(uuid()) |
| descripcion | String | |
| monto | Decimal(10,2) | |
| partidoId | String? | FK → Partido |
| fechaId | String? | FK → Fecha |
| fecha | DateTime | @default(now()) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

**Relaciones**: `partido Partido?`, `fechaRel Fecha?`

### Model: `Gasto`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (UUID) | @id @default(uuid()) |
| descripcion | String | |
| monto | Decimal(10,2) | |
| partidoId | String? | FK → Partido |
| fechaId | String? | FK → Fecha |
| fecha | DateTime | @default(now()) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

**Relaciones**: `partido Partido?`, `fechaRel Fecha?`

### Model: `HistorialCambios`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (UUID) | @id @default(uuid()) |
| entidad | String | Nombre del modelo (ej: "Jugador") |
| entidadId | String | ID del registro modificado |
| campo | String | Nombre del campo |
| valorAnterior | String? | |
| valorNuevo | String? | |
| userId | String | FK → User |
| createdAt | DateTime | @default(now()) |

**Relaciones**: `user User @relation`, `jugador Jugador? @relation(fields: [entidadId], references: [id])`

### Model: `RefreshToken`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | String (UUID) | @id @default(uuid()) |
| token | String | @unique (40 bytes hex aleatorios) |
| userId | String | FK → User |
| expiresAt | DateTime | 7 días desde creación |
| revoked | Boolean | @default(false) |
| createdAt | DateTime | @default(now()) |

**Relaciones**: `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`

---

## 4. Endpoints de la API REST

Todas las rutas están montadas bajo `/api/*` y también sin prefijo `/*` (compatibilidad Vercel/local).
Ejemplo: `POST /api/auth/login` y `POST /auth/login` son equivalentes.

### Salud

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Health check del servidor |

### Auth

| Método | Ruta | Auth | Rate Limit | Descripción |
|--------|------|------|-----------|-------------|
| POST | `/auth/register` | No | 5/15min | Registrar usuario (ADMIN) |
| POST | `/auth/login` | No | 5/15min | Iniciar sesión |
| POST | `/auth/refresh` | No | — | Rotar refresh token |
| POST | `/auth/logout` | No | — | Revocar refresh token |
| GET | `/auth/me` | Bearer | — | Obtener usuario actual |

**Request/Response — Login**:
```json
POST /auth/login { "email": "...", "password": "..." }
→ { "user": { "id", "email", "nombre", "rol" }, "token": "jwt...", "refreshToken": "hex..." }
```

**Request/Response — Refresh**:
```json
POST /auth/refresh { "refreshToken": "hex..." }
→ { "token": "jwt...", "refreshToken": "new-hex..." }
```

### Jugadores

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| GET | `/jugadores` | Bearer | * | Listar (paginado) |
| GET | `/jugadores/recientes` | Bearer | * | Últimos creados |
| GET | `/jugadores/:id` | Bearer | * | Obtener por ID |
| GET | `/jugadores/:id/historial` | Bearer | * | Historial de cambios |
| POST | `/jugadores` | Bearer | ADMIN, EDITOR | Crear |
| PUT | `/jugadores/:id` | Bearer | ADMIN, EDITOR | Actualizar |
| DELETE | `/jugadores/:id` | Bearer | ADMIN | Eliminar |

**Query params listar**: `?busqueda=&categoria=&activo=true&page=1&limit=25`
**Response paginado**: `{ data: [...], pagination: { page, limit, total, totalPages } }`

### Jugadores Auth (Google)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/jugadores/auth/google` | No | Login/registro con Google credential |
| GET | `/jugadores/auth/me` | Jugador JWT | Datos del jugador autenticado |

### Cuotas

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| GET | `/cuotas` | Bearer | * | Listar (paginado) |
| GET | `/cuotas/morosos` | Bearer | * | Lista de morosos |
| GET | `/cuotas/:id` | Bearer | * | Obtener por ID |
| POST | `/cuotas` | Bearer | ADMIN | Crear cuota |
| PUT | `/cuotas/:id` | Bearer | ADMIN | Actualizar |
| DELETE | `/cuotas/:id` | Bearer | ADMIN | Eliminar |
| POST | `/cuotas/generar` | Bearer | ADMIN | Generar cuotas mensuales |
| POST | `/cuotas/generar-jugador` | Bearer | ADMIN | Generar cuota para un jugador |
| POST | `/cuotas/generar-masivas` | Bearer | ADMIN | Generar masivo por categoría |
| POST | `/cuotas/:id/revertir-pago` | Bearer | ADMIN | Revertir pago de una cuota |

**POST /cuotas/generar-masivas**:
```json
{ "mes": 6, "anio": 2026, "montosPorCategoria": { "C7": 15000, "PRIMERA": 25000 } }
→ { "generadas": 10, "omitidas": 2, "errores": [] }
```

### Pagos

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| GET | `/pagos` | Bearer | ADMIN | Listar (paginado) |
| GET | `/pagos/:id` | Bearer | ADMIN | Obtener por ID |
| POST | `/pagos` | Bearer | ADMIN | Registrar pago presencial |
| DELETE | `/pagos/:id` | Bearer | ADMIN | Eliminar pago |
| POST | `/pagos/crear-preferencia` | Jugador JWT | * | Crear preferencia MP |
| POST | `/pagos/webhook` | HMAC | * | Webhook de Mercado Pago |
| GET | `/pagos/mis-cuotas` | Jugador JWT | * | Cuotas del jugador |

### Dashboard

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/dashboard/metricas` | Bearer | Métricas generales (counts) |
| GET | `/dashboard/cuotas-grafico` | Bearer | Datos para gráfico de cuotas |
| GET | `/dashboard/recientes` | Bearer | Jugadores recientes (paginado) |
| GET | `/dashboard/morosos` | Bearer | Lista detallada de morosos |
| GET | `/dashboard/ingresos-mensuales` | Bearer | Ingresos agrupados por mes |

**GET /dashboard/metricas**:
```json
→ { "totalJugadores": 50, "jugadoresActivos": 45, "totalIngresos": 125000.00, "totalMorosos": 8 }
```

**GET /dashboard/cuotas-grafico?anio=2026**:
```json
→ { "meses": ["Ene","Feb",...], "pagadas": [10,8,...], "pendientes": [5,7,...] }
```

### Users (Admin)

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| GET | `/users` | Bearer | ADMIN | Listar (paginado, sin passwords) |
| POST | `/users` | Bearer | ADMIN | Crear usuario |
| PUT | `/users/:id` | Bearer | ADMIN | Actualizar rol/activo |
| DELETE | `/users/:id` | Bearer | ADMIN | Eliminar usuario |

### Partidos (Admin)

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| GET | `/partidos` | Bearer | ADMIN | Listar (paginado) |
| GET | `/partidos/:id` | Bearer | ADMIN | Obtener por ID |
| POST | `/partidos` | Bearer | ADMIN | Crear |
| PUT | `/partidos/:id` | Bearer | ADMIN | Actualizar |
| DELETE | `/partidos/:id` | Bearer | ADMIN | Eliminar |

### Ingresos (Admin)

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| GET | `/ingresos` | Bearer | ADMIN | Listar (paginado) |
| GET | `/ingresos/:id` | Bearer | ADMIN | Obtener por ID |
| POST | `/ingresos` | Bearer | ADMIN | Crear |
| PUT | `/ingresos/:id` | Bearer | ADMIN | Actualizar |
| DELETE | `/ingresos/:id` | Bearer | ADMIN | Eliminar |

### Gastos (Admin)

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| GET | `/gastos` | Bearer | ADMIN | Listar (paginado) |
| GET | `/gastos/:id` | Bearer | ADMIN | Obtener por ID |
| POST | `/gastos` | Bearer | ADMIN | Crear |
| PUT | `/gastos/:id` | Bearer | ADMIN | Actualizar |
| DELETE | `/gastos/:id` | Bearer | ADMIN | Eliminar |

### Fechas (Admin)

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| GET | `/fechas` | Bearer | ADMIN | Listar |
| GET | `/fechas/:id` | Bearer | ADMIN | Obtener por ID |
| POST | `/fechas` | Bearer | ADMIN | Crear |
| PUT | `/fechas/:id` | Bearer | ADMIN | Actualizar |
| DELETE | `/fechas/:id` | Bearer | ADMIN | Eliminar |

### Contabilidad (Admin)

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| GET | `/contabilidad/balance` | Bearer | ADMIN | Balance total (ingresos - gastos) |
| GET | `/contabilidad/balance-por-fecha` | Bearer | ADMIN | Balance agrupado por fecha |

---

## 5. Pagination

Todos los endpoints de listado aceptan los siguientes query params:

| Parámetro | Default | Límites | Descripción |
|-----------|---------|---------|-------------|
| `page` | 1 | ≥ 1 | Número de página |
| `limit` | 25 | 1-100 | Items por página |

**Response shape**:

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 120,
    "totalPages": 5
  }
}
```

Endpoints con paginación: `GET /jugadores`, `GET /cuotas`, `GET /pagos`, `GET /partidos`,
`GET /ingresos`, `GET /gastos`, `GET /users`, `GET /dashboard/recientes`.

---

## 6. Auth Flow

### Access Token

- Formato: JWT firmado con `JWT_SECRET`
- Expiración: **15 minutos**
- Transporte: Header `Authorization: Bearer <token>`
- Payload: `{ userId, email, rol, iat, exp }`

### Refresh Token

- Formato: 40 bytes hex aleatorios (no JWT)
- Expiración: **7 días** (almacenado en DB como `RefreshToken`)
- Transporte: JSON body en responses y requests
- Almacenamiento: localStorage (`refreshToken`)
- Rotación: cada refresh invalida el anterior y genera uno nuevo

### Flujo de Login

1. `POST /auth/login` → accessToken (15m) + refreshToken (7d)
2. Frontend almacena ambos en localStorage
3. Cada request incluye `Authorization: Bearer <accessToken>`
4. Al recibir 401, frontend intenta `POST /auth/refresh` con refreshToken
5. Si refresh falla → limpia storage y redirige a `/login`
6. `POST /auth/logout` → revoca refreshToken en DB

### Theft Detection

Si un refresh token ya revocado es reutilizado, el sistema **revoca TODOS** los refresh tokens
del usuario afectado como medida de mitigación ante robo.

---

## 7. Seguridad

### Helmet (HTTP Headers)

```js
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.mercadopago.com"],
    },
  },
});
```

### Rate Limiting

| Scope | Límite | Ventana | Aplica a |
|-------|--------|---------|----------|
| Global | 100 requests | 15 min | Todas las rutas |
| Auth | 5 requests | 15 min | `POST /auth/login`, `POST /auth/register` |

### Webhook HMAC

- Algoritmo: HMAC-SHA256
- Secreto: `MERCADO_PAGO_WEBHOOK_SECRET`
- Header: `X-Signature` (formato: `ts=<timestamp>;v1=<hmac>`)
- Manifest: `id:{data.id};request-id:{id};ts:{ts};`
- Comparación: `crypto.timingSafeEqual`

### Passwords

- Hash: bcrypt con 10 rounds de salt
- No se almacenan tokens JWT ni refresh tokens en texto plano en DB

---

## 8. Error Handling

**Formato de error**:

```json
{
  "message": "Descripción del error",
  "code": "ERROR_CODE"  // Opcional
}
```

**Mapeo de errores**:

| Condición | Status | Código |
|-----------|--------|--------|
| Validación (express-validator) | 400 | — |
| Prisma P2002 (unique constraint) | 400 | — |
| Auth: token inválido/expirado | 401 | — |
| Auth: credenciales inválidas | 401 | — |
| Webhook: firma inválida | 401 | INVALID_SIGNATURE |
| Rol insuficiente | 403 | — |
| Recurso no encontrado (Prisma P2025) | 404 | — |
| Rate limit excedido | 429 | RATE_LIMIT |
| Error interno | 500 | — |

---

## 9. Variables de Entorno

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | URL de conexión PostgreSQL |
| `JWT_SECRET` | ✅ | — | Secreto para firmar JWT |
| `PORT` | ❌ | `3000` | Puerto del servidor |
| `MERCADO_PAGO_ACCESS_TOKEN` | ⚠️ | — | Token de acceso MP (para pagos online) |
| `MERCADO_PAGO_WEBHOOK_SECRET` | ⚠️ | — | HMAC secret para webhook |
| `MERCADO_PAGO_WEBHOOK_URL` | ❌ | — | URL pública del webhook MP |
| `FRONTEND_URL` | ❌ | — | URL del frontend (back_urls MP) |
| `BACKEND_URL` | ❌ | — | URL del backend |
| `GOOGLE_CLIENT_ID` | ❌ | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | — | Google OAuth client secret |

✅ = Requerida para funcionar. ⚠️ = Requerida si se usa esa feature.

---

## 10. Decisiones de Diseño

### Arquitectura

- **Separación Controller/Service**: Controllers manejan HTTP request/response; Services contienen
  lógica de negocio. Facilita testing y reutilización.
- **Express async errors**: Se usa `express-async-errors` (require una vez en app.js) para que
  errores en controllers async se propaguen automáticamente al error handler centralizado.
- **Mount dual (/* y /api/*)**: Compatibilidad con Vercel (strips `/api` en producción) y desarrollo
  local (Vite proxy usa `/api`). Cada ruta se monta en ambos prefijos.

### Base de Datos

- **Relaciones**: `Cuota` 1:N con `Pago` (pagos parciales). `Jugador` 1:N con `Cuota` (control mensual).
- **Unique constraint**: `@@unique([jugadorId, mes, anio])` en Cuota evita duplicados.
- **Soft delete**: `activo` en Jugador y User permite mantener datos históricos.
- **HistorialCambios**: Registro genérico polimórfico via `entidad` + `entidadId`.

### Auth

- **Access token + refresh token**: 15 minutos de vida para access, rotación en cada refresh.
- **Theft detection**: Reutilización de refresh token revocado invalida todos los tokens del usuario.
- **Transporte**: Access token via `Authorization: Bearer`, refresh token via JSON body
  (no httpOnly cookie por simplicidad, mitigado por theft detection).

### Paginación

- **Offset-based**: Elegido sobre cursor-based por simplicidad. El volumen de datos (< 10k registros
  por tabla) no justifica la complejidad de cursores.

### Frontend

- **React Context API** para estado de auth (sin Redux/Zustand — suficiente para el alcance).
- **Axios interceptors** para refresh automático de tokens sin lógica repetitiva en cada página.
- **Sonner** para toasts (reemplaza `alert()` y `confirm()` nativos).
- **shadcn/ui** (Radix primitives) para componentes accesibles y consistentes.

### Dev Tooling

- **ESLint flat config**: Configuración única en la raíz que cubre backend (CommonJS) y frontend (ESM/JSX).
- **Prettier**: Formato consistente en todo el proyecto.
- **Vitest**: Testing unificado (backend + frontend) con vitest.
- **Docker**: Desarrollo reproducible con 3 servicios (postgres:16, backend, frontend nginx).

---

## 11. Seed Data

Ejecutar: `cd backend && npx prisma db seed`

**Datos generados**:

| Entidad | Cantidad | Detalle |
|---------|----------|---------|
| Users | 2 | admin@club.com / admin123 (ADMIN), editor@club.com / editor123 (EDITOR) |
| Jugadores | 10 | Distribuidos en todas las categorías |
| Cuotas | ~30 | Últimos 3 meses del año actual, $25.000 c/u |
| Partidos | 1 | "Partido amistoso vs Club Vecino" |
| Ingresos | 2 | Entradas generales ($45.000), Cantina ($12.000) |
| Gastos | 2 | Alquiler ($20.000), Árbitro ($8.000) |

Idempotente: ejecuta `deleteMany` en todas las tablas antes de insertar.
