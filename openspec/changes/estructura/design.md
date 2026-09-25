# Diseño

## Contexto

Repositorio greenfield: existen `openspec/`, `.opencode/`, `.agents/`; no hay código de aplicación, ni tooling, ni CI. Ver proposal.md - Por qué. Confirmado con el usuario: este change construye solo la fundación estructural del proyecto, con el stack fijado en Next.js + TypeScript + pnpm/Turborepo + PostgreSQL. Sin features de producto (sin auth, reservas, pagos, WhatsApp, admin).

## Metas / No-metas

**Metas:**

- Un monorepo reproducible desde un checkout limpio: una instalación, un set de comandos raíz, que funciona en Windows (la máquina de desarrollo actual es win32) y en CI (ubuntu).
- Dos aplicaciones arrancables con rutas de health para que la resiliencia sea observable desde el día uno.
- Quality gates (lint, typecheck, test, build) cableados en Turborepo y GitHub Actions para que los futuros changes de producto los hereden.
- Fundación de base de datos que hace revisable la evolución del esquema (migraciones Prisma en git).
- Camino de deploy esbozado para ambas apps para que "desplegarlo" no sea un proyecto después.

**No-metas:**

- Cualquier comportamiento de producto/capability (agenda, reservas, señas, WhatsApp, clientes, auth). Esos son changes futuros que agregan specs y tareas sobre `project-base`.
- Endurecimiento de producción (multi-región, stack de observabilidad, rate limiting, estrategia de backup) más allá de lo que los hosts elegidos proveen por defecto.
- Contenido de landing/marketing más allá de una página placeholder que pruebe que la app renderiza.
- Decisiones de monolito de backend (proveedor de auth, integración de pagos) — diferidas a los changes que las usen.

## Decisiones

### 1. Monorepo: pnpm workspaces + Turborepo

Lockfile reproducible, protocolo de workspace (`workspace:*`), caché por defecto potente que acelera CI, y soporte de primera clase en el ecosistema Next.js/Turborepo.
Alternativas: npm workspaces (sin caché de tareas eficiente), Lerna (legacy), Nx (excesivo para un equipo/proyecto de este tamaño). pnpm+Turborepo es el camino más directo a identidad y caché con menos configuración.

### 2. apps/web: Next.js 15 (App Router) + TypeScript estricto + Tailwind

El producto tiene landings y links públicos de reserva que se benefician de SEO/SSR, además de route handlers para futuros webhooks y server actions. TypeScript `strict: true` desde el inicio (fallar-y-corregir en CI).
Alternativas: SPA Vite (pierde el SSR/SEO y la superficie server-side que el producto va a necesitar), Remix (válido, pero Next mantiene más estándar el ecosistema y la contratación del equipo).

### 3. apps/api: servicio Hono separado (delgado hoy, desplegable distinto)

Hoy solo sirve `GET /health`, pero el roadmap (integraciones Mercado Pago / WhatsApp, webhooks, jobs en background) va a necesitar un worker siempre encendido que no comparta el ciclo de deploy de la web. Esbozar el segundo desplegable ahora hace que ese change posterior sea aditivo en vez de una migración.
Alternativas consideradas: toda la API dentro de route handlers de Next (más simple hoy; acopla los jobs largos de integración al deploy de la web), o ninguna app api (diferir; riesgo de una reestructuración después).
Compromiso consciente del riesgo: `apps/api` queda aislada detrás de `/health` hasta que un change la necesite; si resulta innecesaria al inicio, borrar un stub es barato.

### 4. Base de datos: PostgreSQL + Prisma en packages/db

Prisma da clientes tipados, migraciones revisables en git y un flujo de migración que encaja con la cadencia spec→changes de OpenSpec. Instancia local vía `docker-compose.yml` (puerto 5432) con `DATABASE_URL` desde `.env`.
Alternativas: Drizzle (más crudo, válido, pero el DX de migrate+studio de Prisma es mejor default para un equipo), Supabase solo-administrado (rechazado como primario porque mueve el tooling de esquema a un vendor desde temprano; igual puede ser el host destino después).
La elección del host de prod (Railway vs Neon vs Supabase administrado) se difiere: el esquema y el connection string son agnósticos al proveedor.

### 5. Testing: Vitest (unit) + Playwright (e2e smoke)

Vitest para tests unitarios de los workspaces (nativo ESM, rápido, encaja limpio en el monorepo), Playwright con dos specs smoke que golpean `/` (web) y `/health` (api) contra servidores de desarrollo.
Alternativa: Jest (bloqueado por fricción de config ESM en monorepos), o sin e2e en la fundación (rechazado: el contrato de health es lo primero que un change futuro puede romper).

### 6. CI + deploy: GitHub Actions; Vercel para web, Railway (Docker) para api

CI corre `install → lint → typecheck → test → build` con caché de Turborepo (caché remota opcional, apagada al inicio). La web despliega vía Vercel (`vercel.json`, preview en PR, prod en main). La api viaja como contenedor (Dockerfile) a Railway, prod en main. Instancia Postgres de prod: administrada en Railway, aprovisionada en el change de deploy, no ahora.
Alternativa: hostear todo en Railway (ops más simple, pero web+api comparten blast radius y se pierden las ergonomías de preview de Vercel); proveedor único Vercel+Neon (un solo vendor pero api-como-contenedores no es la forma nativa de Vercel).

### 7. Layout del repo (estructura destino)

```
peluquita/
|- pnpm-workspace.yaml
|- turbo.json
|- package.json                # scripts raíz, husky/lint-staged
|- .nvmrc  .npmrc  .gitignore  .editorconfig
|- .env.example
|- docker-compose.yml          # postgres:16 local
|- vercel.json
|- README.md                   # runbook de onboarding
|- .github/workflows/ci.yml
|- apps/
|  |- web/                     # Next.js 15 App Router + Tailwind
|  |  |- app/page.tsx          # landing placeholder
|  |  |- app/api/health/route.ts
|  |  |- playwright.config.ts  # e2e: "/" + "/api/health"
|  |- api/                     # servicio Hono
|     |- src/index.ts          # GET /health
|     |- Dockerfile
|- packages/
   |- config/                  # presets eslint + tsconfig + prettier
   |- shared/                  # ts puro, vitest smoke
   |- db/                      # esquema prisma, cliente, migraciones
```

## Riesgos / Trade-offs

- **Dos desplegables desde temprano** → Mitigación: `apps/api` es un stub con una ruta; si la carga queda dentro de la web, se borra el stub y se baja la superficie de Railway.
- **Churn de versiones Next.js 15 / Tailwind v4** → Mitigación: pinear versiones exactas, upgrades vía tarea dedicada; CI exige el lockfile.
- **Correctitud de la caché de Turborepo con env vars** → Mitigación: declarar `inputs` en cada tarea; marcar como no-cacheables las tareas sensibles a env vars (`db:*`) donde aplique.
- **Dev en Windows vs CI en Linux** → Mitigación: scriptear todos los comandos vía pnpm/turbo (sin bash-ismos en los scripts de package); `cross-env` solo si un script requiere una env var nativa.
- **Prisma en Postgres 16 con restricciones de recursos de Docker** → Mitigación: documentar expectativas de `docker compose` (puertos, `PGDATA`) y un fallback sin Docker (Postgres local) en el runbook.
- **Quality gates que frenan velocidad** → Mitigación: `lint` con scope vía turbo `--since` en flujos de push; el gate completo corre solo en CI/PR.

## Plan de migración

Nada que migrar (greenfield). Orden de rollout: scaffold raíz + presets, scaffold de packages, scaffold de apps, cableado de db, cableado de quality gates + CI, stubs de deploy, y cierre del change. Rollback: revertir los commits de la fundación; el lockfile y los archivos generados se regeneran con `pnpm install` + `prisma generate`.

## Preguntas abiertas

- **Host Postgres de prod** (administrado en Railway vs Neon vs Supabase): se decide recién en el paso de deploy, y no cambia el contrato del esquema ni del connection string.
- **Estrategia de auth** (sesión vs JWT, proveedor): pertenece al change de auth, no a esta fundación — este change solo reserva las convenciones de nombres de env y una ruta de health.
