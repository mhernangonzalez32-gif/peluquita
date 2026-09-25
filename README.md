# peluquita

Sistema de gestión para peluquerías, barberías y salones de belleza (Argentina/LatAm):
agenda multi-profesional, reservas online 24/7, señas con Mercado Pago, recordatorios por
WhatsApp, fichas de cliente con colorimetría y liquidación de comisiones.

Este repositorio es un monorepo **pnpm + Turborepo**: `apps/web` (Next.js),
`apps/api` (Hono) y paquetes compartidos en `packages/`.

## Requisitos

- Node.js 24 (ver `.nvmrc`; usar `nvm use` o `fnm use`)
- pnpm 10 (`npm install -g pnpm@10` o `corepack prepare pnpm@10 --activate`)
- Docker Desktop (para el PostgreSQL local)
- Git

## Quickstart (checkout limpio)

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed     # admin + config del local + servicios de ejemplo
pnpm dev
```

- Web: http://localhost:3000 (landing en `/`, health en `/api/health`)
- API: http://localhost:3001 (`GET /health` → `{"status":"ok"}`)

## Mapa del workspace

```
apps/web        Next.js 15 (App Router) + TypeScript estricto + Tailwind
apps/api        Servicio Hono (integraciones/webhooks) + Dockerfile
packages/config Presets compartidos: tsconfig, ESLint, Prettier
packages/shared Código TypeScript puro compartido (Vitest)
packages/db     Esquema Prisma + cliente + migraciones (PostgreSQL)
```

## Scripts raíz

| Comando                                 | Qué hace                                     |
| --------------------------------------- | -------------------------------------------- |
| `pnpm dev`                              | Dev servers de web y api en paralelo (turbo) |
| `pnpm build` / `lint` / `typecheck`     | Gates por workspace vía Turborepo            |
| `pnpm test`                             | Tests unitarios (Vitest) por workspace       |
| `pnpm e2e`                              | E2E (Playwright): reserva, admin, healths    |
| `pnpm format` / `pnpm format:check`     | Prettier write / check                       |
| `pnpm secrets:scan`                     | Falla si hay `.env*` commiteados o secretos  |
| `pnpm db:generate/migrate/studio/reset` | Prisma vía `packages/db`                     |
| `pnpm db:status`                        | Estado de migraciones                        |
| `pnpm db:seed` / `db:deploy`            | Datos iniciales / migraciones en prod        |

## Quality gates

Toda PR debe pasar en CI (`.github/workflows/ci.yml`):

```
pnpm install → pnpm lint → pnpm typecheck → pnpm test → pnpm build
```

En local, el one-liner equivalente es:

```bash
pnpm turbo run lint typecheck test build
```

Además hay hook de pre-commit (husky + lint-staged): corre `eslint --fix` y
`prettier --write` sobre los archivos stageados. Se instala solo con `pnpm install`
(vía el script `prepare`).

## Variables de entorno

Copiar `.env.example` a `.env` y completar. Nunca commitear `.env*`
(`secrets:scan` y el `.gitignore` lo impiden).

| Variable                         | Uso                                                            |
| -------------------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`                   | Postgres local (puerto 5433 por defecto)                       |
| `PORT`                           | Puerto de `apps/api` en dev (3001)                             |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciales del admin que crea el seed                        |
| `SESSION_SECRET`                 | Firma de la sesión admin (≥16 caracteres; obligatoria en prod) |

## Base de datos

PostgreSQL 16 local vía `docker-compose.yml`:

```bash
docker compose up -d postgres
pnpm db:migrate   # aplica migraciones pendientes
pnpm db:seed      # admin + config + servicios (idempotente)
pnpm db:studio    # UI de Prisma para inspeccionar datos
```

Orden para correr tests con DB: `migrate` → `seed` → `test` (varios tests
asumen los datos del seed: servicios, config y admin de desarrollo).

## Deploy

- **Web → Vercel**: proyecto conectado al repo con **Root Directory = `apps/web`**
  (así Vercel detecta Next.js en `apps/web/package.json` e instala el workspace
  con pnpm desde el lockfile de la raíz). Preview automático en cada PR,
  producción en `main`. La web usa la DB en runtime: setear `DATABASE_URL`
  (la de Railway) en las env vars del proyecto.
- **API → Railway**: contenedor desde `apps/api/Dockerfile`. Ver `apps/api/README.md`.
- **Postgres prod**: servicio PostgreSQL en el mismo proyecto de Railway; luego,
  una sola vez: `pnpm db:deploy` y `pnpm db:seed` contra esa `DATABASE_URL`
  (con `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`SESSION_SECRET` reales en el entorno).
- **Local prod con Docker**: `docker compose up --build web api` (web en :3000,
  api en :3001, postgres en :5433). Es el mismo artefacto que viaja a producción.

## Notas Windows

Todos los scripts corren vía pnpm/turbo (sin bash-ismos). Playwright descarga el
navegador Chromium en la primera corrida de `pnpm e2e` (`pnpm exec playwright install`
si hace falta manual).
