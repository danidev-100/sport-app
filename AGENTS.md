# AGENTS (brief, high-signal)

Goal: give an OpenCode agent the exact, repository-specific commands and gotchas to avoid mistakes.

Quick facts
- Repo layout you must use: /backend (Express + Prisma) and /frontend (React + Vite). See SPEC.md for API/schema details.
- Backend entry: backend/src/server.js. Frontend entry: frontend/src/main.jsx. Vite proxy forwards /api -> http://localhost:3000.

Ports & dev servers
- Backend default: PORT=3000 (backend/.env). Start from repo root: cd backend && npm install && npm run dev
- Frontend default: Vite on port 5173. Start: cd frontend && npm install && npm run dev
- Always start backend before frontend (frontend expects /api proxied to backend).

Prisma / database
- Prisma schema & migrations live in backend/prisma. After changing schema run from /backend:
  - npm run prisma:generate (build client)
  - npm run prisma:migrate (applies migrations; uses DATABASE_URL in backend/.env)
  - If you don't want migrations prompts, use npm run prisma:push to push schema.
- The repo contains a sample backend/.env with DATABASE_URL pointing at postgres://postgres:1234@localhost:5432/club_deportivo — ensure a Postgres instance is available or change DATABASE_URL.

Environment variables (must set for real runs)
- backend/.env keys used: DATABASE_URL, JWT_SECRET, PORT, GOOGLE_CLIENT_ID/SECRET, MERCADO_PAGO_ACCESS_TOKEN, MERCADO_PAGO_WEBHOOK_URL (optional), FRONTEND_URL (optional).
- Do not commit secrets. There is an example .env checked in for convenience; treat it as local-only.

Frontend specifics
- API client baseURL is '/api' (frontend/src/api/apiClient.js). Vite proxy (frontend/vite.config.js) forwards /api -> http://localhost:3000. Do not change the client without updating proxy or BACKEND.
- Auth token stored in localStorage under 'token' and 'user' keys; logout behavior is triggered on 401 (client redirects to /login).

Quick smoke test
1) Start DB (or change DATABASE_URL to a running DB). 2) cd backend && npm install && npm run prisma:generate && npm run prisma:migrate && npm run dev  (server on :3000). 3) cd frontend && npm install && npm run dev (Vite :5173). 4) Visit http://localhost:5173 and check GET http://localhost:3000/health for API.

Common pitfalls for agents
- Frontend won't reach backend unless backend is running or the Vite proxy is active (don't test UI with file:// or by opening dist without configuring backend API host).
- Prisma commands must run inside /backend (prisma binary resolved from backend/node_modules/.bin).
- If changing ports or hostnames update FRONTEND_URL and the proxy target in frontend/vite.config.js and any webhook URLs in backend envs.
- Backend uses CommonJS (require) — run with Node (scripts use node src/server.js). Frontend uses ESM via Vite.

Where to look first
- SPEC.md (root) — canonical API and DB schema. backend/prisma/schema.prisma and backend/prisma/migrations are executable sources of truth.
- backend/src/* for server wiring (app.js) and routes. frontend/vite.config.js for proxy config and frontend/src/api for client usage.

If you need to run automated tasks
- No test suites are configured in package.json files. If you add tests, run them per-package (cd backend && npm test; cd frontend && npm test).

Keep it minimal — edit SPEC.md when you change API/schema and update this file only for repo-level workflow changes.
