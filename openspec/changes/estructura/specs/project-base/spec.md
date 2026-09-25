# Spec Delta

## Purpose

Define el contrato de reproducibilidad del repositorio peluquita: layout del monorepo, aplicaciones web/api arrancables, cableado de base de datos, convenciones de entorno y secretos, quality gates aplicados en CI, pipeline de deploy y un onboarding de desarrollo reproducible.

## ADDED Requirements

### Requirement: Estructura del monorepo

El repositorio DEBERÁ organizarse como un workspace pnpm orquestado por Turborepo. El código de aplicaciones DEBERÁ vivir en `apps/`, los paquetes compartidos DEBERÁN vivir en `packages/`, y la raíz DEBERÁ proveer un único workspace instalable.

#### Scenario: Instalación fresca resuelve todo el workspace

- **WHEN** un desarrollador ejecuta `pnpm install` en la raíz del repositorio desde un checkout limpio
- **THEN** cada paquete del workspace se resuelve sin errores y el `pnpm-lock.yaml` commiteado se mantiene consistente

#### Scenario: Turborepo orquesta las tareas del workspace

- **WHEN** un desarrollador ejecuta `pnpm turbo run build` en la raíz del repositorio
- **THEN** todas las tareas de build de los workspaces se ejecutan en orden de dependencias, producen sus salidas esperadas, y una ejecución posterior se sirve desde la caché de tareas

### Requirement: Aplicaciones arrancables con rutas de health

El repositorio DEBERÁ incluir dos aplicaciones desplegables: `apps/web`, una aplicación Next.js 15 App Router escrita en TypeScript estricto con Tailwind que renderiza una landing en `/` y responde JSON en `/api/health`; y `apps/api`, un servicio HTTP Hono que responde JSON en `/health`.

#### Scenario: La app web arranca

- **WHEN** un desarrollador inicia el servidor de desarrollo de `apps/web` y solicita `/`
- **THEN** el servidor responde con una página HTML 200

#### Scenario: Ruta de health de la web

- **WHEN** un cliente solicita `GET /api/health` en la app web en ejecución
- **THEN** el servidor responde 200 con el cuerpo JSON `{"status":"ok"}`

#### Scenario: Ruta de health de la API

- **WHEN** un cliente solicita `GET /health` en el servicio api en ejecución
- **THEN** el servidor responde 200 con el cuerpo JSON `{"status":"ok"}`

#### Scenario: El typecheck estricto pasa

- **WHEN** un desarrollador ejecuta `pnpm turbo run typecheck` en la raíz del repositorio
- **THEN** cada workspace compila con cero errores de tipos

### Requirement: Fundación de base de datos

El repositorio DEBERÁ gestionar su esquema PostgreSQL con Prisma en `packages/db`, DEBERÁ mantener las migraciones en control de versiones, y DEBERÁ proveer una instancia local de PostgreSQL vía docker-compose.

#### Scenario: La migración local de base de datos aplica

- **WHEN** un desarrollador inicia el PostgreSQL local (`docker compose up -d postgres`), configura `DATABASE_URL` y ejecuta el script de migración de base de datos
- **THEN** la migración aplica correctamente y `prisma migrate status` reporta todas las migraciones al día

#### Scenario: La configuración de base de datos faltante falla con ruido

- **WHEN** los scripts de base de datos se ejecutan sin la variable `DATABASE_URL`
- **THEN** fallan con un error claro que apunta a `.env.example` y no modifican ninguna base de datos

### Requirement: Manejo de entorno y secretos

El repositorio DEBERÁ cargar la configuración desde variables de entorno, DEBERÁ documentar cada variable requerida en el `.env.example` raíz, y NO DEBERÁ commitear secretos ni archivos `.env`.

#### Scenario: Onboarding de desarrollo

- **WHEN** un desarrollador clona el repositorio, copia `.env.example` a `.env`, inicia el PostgreSQL local y ejecuta los comandos de setup documentados
- **THEN** `apps/web` y `apps/api` arrancan localmente y las rutas de health responden 200

#### Scenario: Los secretos están excluidos del repositorio

- **WHEN** CI ejecuta los checks del repositorio
- **THEN** falla el build si hay algún archivo `.env*` distinto de `.env.example` en el árbol de trabajo, o si se detecta un secreto commiteado

### Requirement: Quality gates

El repositorio DEBERÁ exponer los comandos raíz `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` que corren en cada workspace, y estos gates DEBERÁN pasar antes de que un pull request se fusione.

#### Scenario: Todos los gates pasan en local

- **WHEN** un desarrollador ejecuta `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` en un checkout limpio
- **THEN** cada comando sale con código 0

#### Scenario: CI bloquea pull requests con fallas

- **WHEN** se abre un pull request contra la rama por defecto
- **THEN** GitHub Actions ejecuta install, lint, typecheck, test y build, y el pull request NO DEBERÁ fusionarse mientras alguno de esos pasos falle

### Requirement: Pipeline de deploy

`apps/web` DEBERÁ ser desplegable a Vercel usando un `vercel.json` commiteado, y `apps/api` DEBERÁ ser desplegable como contenedor construido desde su `Dockerfile`.

#### Scenario: Deploy de preview de la web en el pull request

- **WHEN** CI corre en un pull request
- **THEN** se crea un deployment de preview de la web para la rama

#### Scenario: El contenedor de la API sirve health

- **WHEN** un desarrollador ejecuta `docker build` para `apps/api` e inicia un contenedor desde la imagen resultante
- **THEN** solicitar `GET /health` al contenedor responde 200 con JSON
