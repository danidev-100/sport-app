# Design: Production-Grade Upgrade

## Technical Approach

Incremental hardening across 9 areas, each scoped as a safe PR slice. Phase 1 (schema fix) is the hard prerequisite — it unblocks `prisma generate` and DB consistency. Phases 2-4 add security, error handling, and performance. Phases 5-7 add bulk ops, tests, and tooling. Phase 8 syncs docs.

---

### Area 1: Prisma Schema Fix

**Files affected**:
| File | Action | Reason |
|------|--------|--------|
| `backend/prisma/schema.prisma` | Modify | Add `Fecha` model, `fechaId` on Ingreso/Gasto, `RefreshToken` model, drop `posicion` refs |
| `backend/prisma/migrations/*` | New | Auto-generated migration adding Fecha + RefreshToken tables |
| `backend/src/controllers/dashboardController.js:72` | Modify | Remove `posicion: true` from `getRecientes` select |
| `backend/src/services/jugadorService.js:16-18` | Modify | Remove `filters.posicion` block |
| `frontend/src/utils/formatters.js:22-30` | Remove | Delete `getPosicionLabel()` |
| `frontend/src/components/dashboard/RecientesList.jsx:2,73` | Modify | Remove `getPosicionLabel` import + usage |
| `frontend/src/api/contabilidad.js` | Modify | Add `getFechas`, `deleteFecha`, `createFecha` exports that FechaList.jsx imports |

**Approach**: Add Fecha model matching the existing migration SQL. Add optional `fechaId` on Ingreso/Gasto. Add RefreshToken model. Remove dead Posicion references. The frontend `contabilidad.js` is missing `getFechas`/`deleteFecha`/`createFecha` — add them as wrapper calls to `/api/fechas` (which routes exist but were unmounted; mount them in app.js).

**schema.prisma additions**:
```prisma
model Fecha {
  id        String    @id @default(uuid())
  titulo    String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  ingresos  Ingreso[]
  gastos    Gasto[]
}
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
Add to Ingreso: `fechaId String?` + `fecha Fecha? @relation(fields: [fechaId], references: [id], onDelete: Cascade)`. Same for Gasto.

**Tradeoff**: Re-adding Fecha via new migration (not modifying add_partido) preserves migration history integrity.

---

### Area 2: Error Handling Architecture

**Files affected**:
| File | Action | Reason |
|------|--------|--------|
| `backend/src/utils/errors.js` | Create | Error class hierarchy (AppError, NotFoundError, ValidationError, AuthError) |
| `backend/src/middleware/errorHandler.js` | Create | Centralized error middleware with Prisma/JWT error mapping |
| `backend/src/app.js:42-45` | Modify | Replace bare handler with `app.use(errorHandler)` — must be LAST middleware |
| `backend/src/controllers/*.js` | Modify (all 10) | Replace `res.status(N).json({message:error.message})` with `next(error)` |
| `frontend/src/components/common/ErrorBoundary.jsx` | Create | React error boundary wrapping routes in App.jsx |
| `frontend/src/components/common/ConfirmDialog.jsx` | Create | Reusable shadcn AlertDialog-based confirm |
| `frontend/src/App.jsx` | Modify | Wrap `<Routes>` with `<ErrorBoundary>`, add `<Toaster />` |
| `frontend/package.json` | Modify | Add `sonner` dependency |

**Class hierarchy**:
```
AppError(statusCode, message, code?)
  NotFoundError(message, code?) → statusCode=404
  ValidationError(message, code?) → statusCode=400
  AuthError(message, code?) → statusCode=401
```

**errorHandler middleware** maps:
- Prisma P2002 → 400 ValidationError
- Prisma P2025 → 404 NotFoundError
- JsonWebTokenError/TokenExpiredError → 401 AuthError
- Unknown → 500 generic

**Controllers pattern**: controllers call `next(error)` instead of `res.status().json()`. Errors propagate to the centralized handler. No try/catch changes needed in services.

**Tradeoff**: Using `next(error)` requires async handler wrapping. Since Express 5+ supports async errors natively and the codebase uses `express@^4.18.2`, we wrap with a small `asyncHandler` or use `express-async-errors` (preferred — just require it once in app.js).

---

### Area 3: Security

**Files affected**:
| File | Action | Reason |
|------|--------|--------|
| `backend/package.json` | Modify | Add `helmet`, `express-rate-limit` |
| `backend/src/app.js:15-16` | Modify | Add `app.use(helmet())`, rate-limit middleware before routes |
| `backend/src/app.js` | Modify | Add auth route rate-limiter (5/15min) |
| `backend/src/services/mercadoPagoService.js` | Modify | Add `verifyWebhookSignature(signature, body, secret)` |
| `backend/src/routes/pagos.js:41-48` | Modify | Add HMAC validation before `processWebhook` |
| `backend/src/services/authService.js` | Modify | Add `generateRefreshToken(userId)`, `verifyRefreshToken(token)`, `revokeRefreshToken(token)` |
| `backend/src/controllers/authController.js` | Modify | Add `refresh` and `logout` handlers |
| `backend/src/routes/auth.js` | Modify | Add `POST /refresh` and `POST /logout` routes |
| `backend/prisma/schema.prisma` | Modify | Add `RefreshToken` model (done in Area 1) |
| `frontend/src/api/apiClient.js` | Modify | Add 401 interceptor → attempt refresh → logout on failure |
| `backend/.env` | Modify | Add `MERCADO_PAGO_WEBHOOK_SECRET` |

**Helmet config**: `app.use(helmet())` with CSP allowing the frontend origin. Rate-limit: global 100/15min, auth 5/15min.

**Webhook HMAC**: `crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex')` compared via `crypto.timingSafeEqual`.

**Refresh token flow**:
1. Login: returns `{ accessToken }` (15min) + sets `refreshToken` in httpOnly cookie (7d)
2. Refresh: POST /auth/refresh — reads cookie, validates token against DB (not revoked, not expired), issues new pair, revokes old
3. Logout: revokes current refresh token
4. Reuse detection: if revoked token is used, revoke ALL tokens for that user (theft mitigation)

**Frontend interceptor**: on 401, call `/auth/refresh` with `{withCredentials: true}`, store new access token, retry original request. On failure, clear state and redirect to `/login`.

**Tradeoff**: httpOnly cookie for refresh token (XSS-safe but requires `withCredentials: true` on all requests). Access token in `Authorization: Bearer` header. This aligns with the existing auth pattern.

---

### Area 4: Pagination

**Files affected**:
| File | Action | Reason |
|------|--------|--------|
| `backend/src/utils/helpers.js` | Modify | Add `paginatedResponse(data, total, page, limit)` |
| `backend/src/controllers/jugadorController.js:6-7` | Modify | Read `page`/`limit` from query, wrap in paginatedResponse |
| `backend/src/controllers/cuotaController.js:6-7` | Modify | Same |
| `backend/src/controllers/pagoController.js:6-8` | Modify | Same |
| `backend/src/controllers/partidoController.js:4-6` | Modify | Same |
| `backend/src/controllers/ingresoController.js:6-8` | Modify | Same |
| `backend/src/controllers/gastoController.js:4-6` | Modify | Same |
| `backend/src/controllers/userController.js:4-8` | Modify | Same |
| `backend/src/controllers/dashboardController.js:63-76` | Modify | Same — `getRecientes` |
| `frontend/package.json` | Modify | Add shadcn Pagination component or build simple prev/next |

**`paginatedResponse` structure**:
```js
function paginatedResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
      total,
      totalPages: Math.ceil(total / Math.max(1, limit))
    }
  };
}
```

Defaults: `page=1, limit=25`. Controllers use `paginate(page, limit)` for `skip/take` and `paginatedResponse()` for output shape.

**Tradeoff**: Offset pagination chosen over cursor-based (simpler, the data is small enough that offset drift is negligible, all current UI expects page numbers). Spec mentions cursor-based but this app has <10k records per table — offset is appropriate.

---

### Area 5: Dashboard N+1 Fix

**Files affected**:
| File | Action | Reason |
|------|--------|--------|
| `backend/src/controllers/dashboardController.js:31-56` | Modify | Replace 12-query loop with single aggregate |

**Approach**: Single Prisma `groupBy` query:
```js
const grouped = await prisma.cuota.groupBy({
  by: ['mes'],
  where: { anio },
  _count: { id: true },
  _count: { pagos: true } // Note: groupBy doesn't support nested count
});
```
Since `groupBy` can't count related `pagos`, use raw SQL for the aggregate or two queries (one for total, one for pagadas via `pagos.some`). Fallback: raw SQL `SELECT mes, COUNT(*) as total, COUNT(p.id) as pagadas FROM cuota LEFT JOIN pago ON ... GROUP BY mes ORDER BY mes`.

Response shape preserved: `{ meses: [...], pagadas: [...], pendientes: [...] }`.

---

### Area 6: Bulk Cuota Generation

**Files affected**:
| File | Action | Reason |
|------|--------|--------|
| `backend/src/services/cuotaService.js` | Add | `generarMasivas(mes, anio, montosPorCategoria)` method |
| `backend/src/controllers/cuotaController.js` | Add | `generarMasivas` handler |
| `backend/src/routes/cuotas.js` | Modify | Add `POST /generar-masivas` route (auth, ADMIN) |
| `frontend/src/pages/Cuotas.jsx` | Modify | Add "Generar para todos" button + confirm dialog |

**Service method**:
```js
async function generarMasivas(mes, anio, montosPorCategoria) {
  const jugadores = await prisma.jugador.findMany({ where: { activo: true } });
  let generadas = 0, omitidas = 0;
  const fechaVencimiento = new Date(anio, mes - 1, 5);
  const data = [];
  for (const j of jugadores) {
    const existing = await prisma.cuota.findUnique({
      where: { jugadorId_mes_anio: { jugadorId: j.id, mes, anio } }
    });
    if (existing) { omitidas++; continue; }
    const monto = montosPorCategoria[j.categoria] || Object.values(montosPorCategoria)[0];
    data.push({ jugadorId: j.id, mes, anio, monto, fechaVencimiento });
  }
  if (data.length) await prisma.cuota.createMany({ data });
  return { generadas: data.length, omitidas };
}
```

Response: `{ generadas: N, omitidas: M, errores: [] }`.

---

### Area 7: Testing Infrastructure

**Files affected**:
| File | Action | Reason |
|------|--------|--------|
| `backend/vitest.config.js` | Create | Vitest config with setup file |
| `backend/src/tests/setup.js` | Create | Test DB setup (separate DATABASE_URL or in-memory) |
| `backend/src/tests/authService.test.js` | Create | Auth service tests |
| `backend/src/tests/cuotaService.test.js` | Create | Cuota service tests |
| `backend/package.json` | Modify | Add `vitest`, `supertest`, `test` script |
| `frontend/vitest.config.js` | Create | Vitest config with jsdom |
| `frontend/src/tests/setup.js` | Create | Testing library matchers, MSW server |
| `frontend/src/tests/AuthContext.test.jsx` | Create | Auth context tests |
| `frontend/src/tests/Dashboard.test.jsx` | Create | Dashboard render test |
| `frontend/package.json` | Modify | Add test deps + `test` script |

**Backend strategy**: Use a separate test DB (DATABASE_URL_TEST). `setup.js` runs `prisma db push` before tests. Supertest hits the Express app without binding a port. Tests clean up data between runs.

**Frontend strategy**: jsdom environment, MSW for API interception, React Testing Library for component rendering.

---

### Area 8: Dev Tooling

**Files affected**:
| File | Action | Reason |
|------|--------|--------|
| `backend/Dockerfile` | Create | Multi-stage build (node:18-alpine) |
| `frontend/Dockerfile` | Create | nginx static serving |
| `docker-compose.yml` | Create | 3 services: backend, frontend, postgres:16-alpine |
| `backend/prisma/seed.js` | Create | Sample data: 2 users, 10 jugadores, cuotas, pagos, partido |
| `eslint.config.js` | Create | Flat config covering backend (Node/CJS) + frontend (React/JSX) |
| `.prettierrc` | Create | `semi:true, singleQuote:true, trailingComma:'es5', printWidth:100` |
| `backend/nodemon.json` | Create | Watch src, ignore tests |
| `backend/src/server.js` | Modify | Add graceful shutdown (SIGTERM/SIGINT → prisma.$disconnect → exit) |
| `backend/package.json` | Modify | Add `prisma:seed`, `lint`, `format` scripts |
| `frontend/package.json` | Modify | Add `lint`, `format` scripts |

**Graceful shutdown**:
```js
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});
```

**Seed idempotency**: `deleteMany` on all tables before inserting.

---

### Area 9: SPEC.md Rewrite

**Files affected**:
| File | Action | Reason |
|------|--------|--------|
| `SPEC.md` | Rewrite | Sync with actual schema + endpoints |

**Structure**:
1. Project overview + folder structure
2. DB Schema: all 9 models (User, Jugador, Cuota, Pago, HistorialCambios, Partido, Ingreso, Gasto, Fecha, RefreshToken) with fields, types, relations
3. Categoria enum values
4. API endpoints table: method, path, auth, description, request/response shape
5. Auth flow (JWT access + refresh)
6. Environment variables reference
7. Error response format
