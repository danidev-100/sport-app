# SPEC.md - Sistema de Administración de Club Deportivo

## 1. Modelos de Base de Datos (Prisma Schema)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  EDITOR
}

enum Posicion {
  PORTERO
  DEFENSA
  CENTROCAMPISTA
  DELANTERO
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  nombre    String
  rol       Role     @default(EDITOR)
  activo    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  historialCambios HistorialCambios[]
}

model Jugador {
  id        String   @id @default(uuid())
  nombre    String
  posicion  Posicion
  edad      Int
  telefono  String?
  email     String?
  fotoUrl   String?
  activo    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cuotas    Cuota[]
  historialCambios HistorialCambios[]
}

model Cuota {
  id          String   @id @default(uuid())
  jugadorId   String
  mes         Int
  anio        Int
  monto       Decimal  @db.Decimal(10, 2)
  vencida     Boolean  @default(false)
  fechaVencimiento DateTime
  createdAt   DateTime @default(now())

  jugador     Jugador  @relation(fields: [jugadorId], references: [id], onDelete: Cascade)
  pagos       Pago[]

  @@unique([jugadorId, mes, anio])
}

model Pago {
  id        String   @id @default(uuid())
  cuotaId   String
  monto     Decimal  @db.Decimal(10, 2)
  fechaPago DateTime @default(now())
  metodoPago String?
  observacion String?
  createdAt DateTime @default(now())

  cuota     Cuota    @relation(fields: [cuotaId], references: [id], onDelete: Cascade)
}

model HistorialCambios {
  id         String   @id @default(uuid())
  entidad   String
  entidadId String
  campo      String
  valorAnterior String?
  valorNuevo   String?
  userId    String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
}
```

---

## 2. Endpoints de la API REST

### Auth

| Método | Ruta | Descripción | Request | Response |
|--------|------|-------------|---------|----------|
| POST | `/api/auth/register` | Registrar admin | `{ email, password, nombre }` | `{ user, token }` |
| POST | `/api/auth/login` | Login | `{ email, password }` | `{ user, token }` |
| GET | `/api/auth/me` | Usuario actual | - | `{ user }` |

### Jugadores

| Método | Ruta | Descripción | Request | Response |
|--------|------|-------------|---------|----------|
| GET | `/api/jugadores` | Listar jugadores | Query: `?busqueda=&posicion=&activo=true` | `{ jugadores: [...] }` |
| GET | `/api/jugadores/:id` | Un jugador | - | `{ jugador }` |
| POST | `/api/jugadores` | Crear jugador | `{ nombre, posicion, edad, telefono?, email?, fotoUrl? }` | `{ jugador }` |
| PUT | `/api/jugadores/:id` | Actualizar jugador | `{ nombre?, posicion?, edad?, telefono?, email?, fotoUrl? }` | `{ jugador }` |
| DELETE | `/api/jugadores/:id` | Eliminar jugador | - | `{ message }` |
| GET | `/api/jugadores/:id/historial` | Historial del jugador | - | `{ cambios: [...] }` |

### Cuotas

| Método | Ruta | Descripción | Request | Response |
|--------|------|-------------|---------|----------|
| GET | `/api/cuotas` | Listar cuotas | Query: `?jugadorId=&anio=&vencida=` | `{ cuotas: [...] }` |
| GET | `/api/cuotas/:id` | Una cuota | - | `{ cuota }` |
| POST | `/api/cuotas` | Crear cuota | `{ jugadorId, mes, anio, monto, fechaVencimiento }` | `{ cuota }` |
| PUT | `/api/cuotas/:id` | Actualizar cuota | `{ monto?, fechaVencimiento? }` | `{ cuota }` |
| DELETE | `/api/cuotas/:id` | Eliminar cuota | - | `{ message }` |
| POST | `/api/cuotas/generar` | Generar cuotas mensuales | `{ mes, anio, monto }` | `{ cuotas: [...] }` |

### Pagos

| Método | Ruta | Descripción | Request | Response |
|--------|------|-------------|---------|----------|
| GET | `/api/pagos` | Listar pagos | Query: `?cuotaId=&fechaDesde=&fechaHasta=` | `{ pagos: [...] }` |
| GET | `/api/pagos/:id` | Un pago | - | `{ pago }` |
| POST | `/api/pagos` | Registrar pago | `{ cuotaId, monto, metodoPago?, observacion? }` | `{ pago, cuota }` |
| DELETE | `/api/pagos/:id` | Eliminar pago | - | `{ message }` |

### Dashboard

| Método | Ruta | Descripción | Request | Response |
|--------|------|-------------|---------|----------|
| GET | `/api/dashboard/metricas` | Métricas generales | - | `{ totalJugadores, jugadoresActivos, totalIngresos, totalMorosos }` |
| GET | `/api/dashboard/cuotas-grafico` | Datos gráfico cuotas | Query: `?anio=` | `{ meses: [...], pagadas: [...], pendientes: [...] }` |
| GET | `/api/dashboard/recientes` | Jugadores recientes | Query: `?limit=5` | `{ jugadores: [...] }` |
| GET | `/api/dashboard/morosos` | Lista morosos | - | `{ morosos: [{ jugador, cuotasPendientes, totalAdeudado }] }` |

### Users (Admin)

| Método | Ruta | Descripción | Request | Response |
|--------|------|-------------|---------|----------|
| GET | `/api/users` | Listar usuarios | - | `{ users: [...] }` |
| PUT | `/api/users/:id` | Actualizar usuario | `{ rol?, activo? }` | `{ user }` |
| DELETE | `/api/users/:id` | Eliminar usuario | - | `{ message }` |

---

## 3. Estructura de Carpetas

### Backend

```
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── jugadorController.js
│   │   ├── cuotaController.js
│   │   ├── pagoController.js
│   │   ├── dashboardController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── roles.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── jugadores.js
│   │   ├── cuotas.js
│   │   ├── pagos.js
│   │   ├── dashboard.js
│   │   └── users.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── jugadorService.js
│   │   ├── cuotaService.js
│   │   └── historialService.js
│   ├── utils/
│   │   └── helpers.js
│   ├── app.js
│   └── server.js
├── package.json
└── .env
```

### Frontend

```
frontend/
├── src/
│   ├── api/
│   │   └── apiClient.js
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Table.jsx
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
│   │   └── Users.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useFetch.js
│   ├── utils/
│   │   └── formatters.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── .env
```

---

## 4. Decisiones de Diseño

### Base de Datos

- **Relaciones**: `Cuota` tiene relación 1:N con `Pago` para permitir múltiples pagos parciales. `Jugador` tiene 1:N con `Cuota` para control mensual.
- **HistorialCambios**: Registro genérico con `entidad` y `entidadId` permite trackear cambios en cualquier modelo sin esquemas duplicados.
- **Unique constraint** en `Cuota(jugadorId, mes, anio)` evita duplicados de cuota por jugador/periodo.
- **Soft delete**: El campo `activo` permite mantener datos históricos sin perder información.

### API REST

- **Separación Controller/Service**: Los controllers manejan HTTP, los services la lógica de negocio, facilitando testing y reutilización.
- **Middleware de autenticación**: Token JWT en headers para proteger rutas.
- **Middleware de roles**: Permisos granulares (ADMIN puede gestionar usuarios, EDITOR solo contenido).

### Frontend

- **Vite**: Build rápido y hot reload para desarrollo eficiente.
- **Context API**: Estado global para auth sin dependencias extra.
- **Componentes comunes**: Elementos reutilizables (Button, Input, Modal) para consistencia UI.
- **Separación por dominio**: Estructura por módulos (jugadores, cuotas, pagos) en lugar de tipo de componente.

### Seguridad

- **Passwords**: Hash con bcrypt (10 rounds).
- **JWT**: Tokens con expiración para sesiones seguras.
- **Validación**: express-validator en backend, tipos y validaciones en frontend.