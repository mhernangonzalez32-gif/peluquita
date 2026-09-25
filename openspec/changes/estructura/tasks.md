# Tareas

## 1. Workspace raíz y onboarding

- [x] 1.1 Crear los archivos raíz del workspace (`pnpm-workspace.yaml`, `.npmrc`, `.nvmrc`, `.editorconfig`, `.gitignore`, `package.json` raíz con `packageManager` y scripts raíz) y verificar que `pnpm install` en la raíz resuelve el workspace limpiamente y produce un `pnpm-lock.yaml` consistente
- [x] 1.2 Agregar `turbo.json` definiendo `lint`, `typecheck`, `test`, `build` (y tareas solo-dev) con `inputs` y `outputs` explícitos, y verificar que `pnpm turbo run build --dry` lista las tareas de los workspaces en orden de dependencias
- [x] 1.3 Escribir el `README.md` raíz con el runbook de onboarding (install, env, postgres, migración de db, dev de web/api, quality gates, hooks de commit) y verificar que cada comando documentado corre tal como está escrito desde un checkout limpio
- [x] 1.4 Agregar hook de pre-commit con husky + lint-staged cableado a los scripts raíz y verificar que un archivo stageado con un error de lint bloquea el commit y que un cambio limpio stageado pasa

## 2. Presets de config compartida

- [x] 2.1 Crear `packages/config` con un `tsconfig.json` base estricto (`strict: true`, resolución de módulos para el workspace) y verificar que `apps/*` lo extienden y que el modo estricto se aplica (un fixture deliberadamente tipado como `any` falla una tarea `typecheck`)
- [x] 2.2 Agregar una config ESLint flat compartida (typescript-eslint + prettier) y verificar que `pnpm lint` marca un error introducido en un archivo fixture y pasa una vez corregido el fixture
- [x] 2.3 Agregar defaults de Prettier y un script `format:check` y verificar que `format:check` falla en un fixture sin formatear y pasa después de `prettier --write`

## 3. Paquete de código compartido

- [x] 3.1 Crear `packages/shared` como paquete del workspace (TypeScript puro) con una pequeña utilidad exportada y un test unitario Vitest, y verificar que `pnpm --filter @peluquita/shared test` pasa
- [x] 3.2 Cablear la utilidad a través del workspace (`workspace:*`) y verificar que tanto `apps/web` como `apps/api` pueden importarla y que su `typecheck` pasa

## 4. App web

- [x] 4.1 Generar el scaffold de `apps/web` con Next.js 15 (App Router, TypeScript estricto, Tailwind) dentro del workspace y verificar que `pnpm --filter @peluquita/web dev` arranca y sirve una página
- [x] 4.2 Agregar una landing placeholder en `/` usando el setup de Tailwind y verificar que el spec smoke de Playwright (agregado en el grupo de e2e) matchea un heading en la página renderizada
- [x] 4.3 Agregar la ruta `GET /api/health` que responde `{"status":"ok"}` y verificar que responde 200 con ese JSON bajo `pnpm --filter @peluquita/web dev`
- [x] 4.4 Aplicar los presets compartidos de ESLint/tsconfig y agregar el cableado de Vitest para utilidades de la web, y verificar que `pnpm --filter @peluquita/web typecheck` y `pnpm lint` pasan
- [x] 4.5 Agregar `vercel.json` en la raíz del repo apuntando a `apps/web` y verificar que un build de producción/preview de la app en Vercel tiene éxito (un `vercel build` en seco es aceptable)

## 5. App API

- [x] 5.1 Generar el scaffold de `apps/api` como servicio Hono con un handler `GET /health` y un script de dev, y verificar que un test unitario del handler responde `{"status":"ok"}`
- [x] 5.2 Agregar Vitest para `apps/api` y verificar que `pnpm --filter @peluquita/api test` pasa
- [x] 5.3 Agregar un `Dockerfile` para `apps/api` (node 22 alpine, contenedor standalone) y verificar que `docker build` tiene éxito y que un contenedor iniciado desde la imagen resultante responde `GET /health` con 200
- [x] 5.4 Documentar la superficie de deploy de la api (nombre del contenedor, env vars, puerto) en un `apps/api/README.md` corto y verificar que el comando de run documentado coincide con lo que expone el Dockerfile

## 6. Fundación de base de datos

- [x] 6.1 Crear `packages/db` con un esquema Prisma (datasource postgres, generador de cliente, modelo placeholder `SystemConfig`) y verificar que `pnpm --filter @peluquita/db generate` produce el cliente tipado
- [x] 6.2 Agregar `docker-compose.yml` corriendo postgres:16 y verificar que `docker compose up -d postgres` inicia y el contenedor reporta saludable
- [x] 6.3 Agregar scripts de db (`db:migrate`, `db:generate`, `db:studio`, `db:reset`, `db:status`) y verificar que la migración inicial aplica y que `prisma migrate status` reporta todas las migraciones al día
- [x] 6.4 Agregar un smoke test de db que conecta con el cliente generado y escribe+lee una fila `SystemConfig`, y verificar que pasa contra el Postgres local
- [x] 6.5 Crear `.env.example` documentando `DATABASE_URL` y cualquier otra variable requerida, y verificar que copiarlo a `.env` más correr los pasos del runbook arranca ambas apps (integración cubierta de nuevo en el grupo 9)

## 7. Quality gates y e2e

- [x] 7.1 Agregar los scripts raíz `lint`, `typecheck`, `test`, `build` orquestando Turborepo y verificar que los cuatro salen 0 desde un checkout limpio
- [x] 7.2 Agregar Playwright con specs smoke para `/` (web) y `/api/health` (web) más `/health` (servidor dev de la api) y verificar que `pnpm e2e` pasa en local
- [x] 7.3 Agregar un script de escaneo de secretos del repo que falla ante cualquier archivo `.env*` commiteado (distinto de `.env.example`) o patrón de secreto detectado, y verificar que falla con un `.env` fixture y pasa tras removerlo
- [x] 7.4 Documentar los quality gates en el README raíz (comandos, cómo los aplica CI) y verificar que el one-liner documentado `pnpm turbo run lint typecheck test build` sale 0

## 8. CI y deployment

- [x] 8.1 Agregar `.github/workflows/ci.yml` corriendo install, lint, typecheck, test y build en la rama por defecto y en cada PR (versiones de Node/pnpm pineadas, caché de Turborepo), y verificar que el workflow referencia solo versiones de actions pineadas y que los comandos equivalentes en local ya pasan
- [x] 8.2 Cablear un deployment de preview en Vercel para pull requests (conexión de app o action usando `vercel.json`) y verificar que una corrida de PR reporta una URL de preview en los checks
- [x] 8.3 Agregar la superficie de config de deploy de la api (runbook de Railway o `railway.toml` + el Dockerfile de la tarea 5.3) y verificar que el comando de deploy documentado construye la misma imagen que la tarea 5.3

## 9. Verificación de integración

- [x] 9.1 Desde un checkout limpio, correr el runbook de onboarding completo de punta a punta (install, env desde `.env.example`, postgres up, migración, arranque de web y api) y verificar que la landing renderiza y que `/api/health` y `/health` responden 200
- [x] 9.2 Correr `pnpm turbo run lint typecheck test build` una vez y verificar que una segunda corrida idéntica reporta cache hits con el mismo exit verde
