# Diseño

## Contexto

Fundación lista (change `estructura` completo): monorepo pnpm/Turbo, `apps/web` Next.js 15 + TS estricto + Tailwind, `packages/db` Prisma + Postgres con solo `SystemConfig`, `packages/shared` con utilidades puras, gates y CI en verde. Ver proposal.md - Por qué. Decisiones de producto ya cerradas con el usuario: turno nace `CONFIRMADO`, mar–sáb 9–21, break 45 min, bloques de 35 min, teléfono como ID de cliente, un solo admin, datos ficticios iniciales.

## Metas / No-metas

**Metas:**

- Primer producto usable punta a punta con un solo deployable (todo en `apps/web`).
- Disponibilidad determinística y testeable como función pura.
- Doble reserva imposible incluso en carrera (garantía a nivel DB, no solo app).
- Auth admin mínima pero correcta (hash + sesión firmada, sin inventos caseros).

**No-metas:**

- Multi-silla / multi-profesional: agenda única del local (una silla). El schema no lo impide a futuro, pero el cálculo y la UI asumen una sola agenda.
- Pagos, recordatorios, roles, facturación, API pública de terceros.

## Decisiones

### 1. Todo en apps/web; apps/api no se toca

UI + route handlers en Next.js (Server Components para lectura, Route Handlers JSON para mutaciones). Un solo deployable en Vercel, cero latencia extra ni otro servicio que operar.
Alternativas: exponer la API en `apps/api` (Hono) — correcto a futuro para webhooks/integraciones, pero para este volumen suma un deploy sin beneficio.

### 2. Auth admin: credenciales + JWT (jose) en cookie httpOnly + middleware

`POST /api/admin/login` verifica bcrypt y firma JWT (jose, Edge-compatible) en cookie httpOnly `SameSite=Lax`; `middleware.ts` exige la cookie en `/admin/*` salvo `/admin/login`. Hash con `bcryptjs` (JS puro: anda en Windows, Docker y Vercel sin binarios nativos).
Alternativas: Auth.js/better-auth (excesivo para 1 usuario sin OAuth), sesiones en DB (innecesario sin revocación), JWT en localStorage (XSS lo lee: rechazado).

### 3. Disponibilidad como función pura en packages/shared

`getSlots({ date, config, occupiedStarts })`: genera bloques de 35 min desde las 9:00 en días mar–sáb, salta los que pisan el break y los ocupados, exige fin ≤ 21:00. Sin I/O → unit tests exhaustivos. El handler suma los `startAt` ocupados (excluyendo `CANCELADO`) y la UI pinta el resultado.
Supuesto registrado: break default 13:00–13:45 (el usuario definió duración, no horario); vive en `SystemConfig`, se cambia sin código.

### 4. Anti-doble-reserva a nivel DB

Índice único parcial en Postgres: `UNIQUE(startAt) WHERE status <> 'CANCELADO'` (vía SQL en la migración, Prisma no expresa parciales). El handler además re-chequea el hueco en transacción para devolver error amable de no-disponibilidad en vez de un 500 por violación de constraint.
Alternativa: solo chequeo en app (pierde en carrera); bloqueo pesimista (overkill para este volumen).

### 5. Zona horaria fija America/Argentina/Buenos_Aires

`startAt` se guarda `timestamptz` (UTC) y toda la lógica de bloques trabaja en pared local de Buenos Aires con `Intl` nativo (sin deps). Riesgo DST cubierto abajo.

### 6. Teléfono como ID con normalización

`Client.phone @unique` guardado normalizado (solo dígitos, con código país si viene). El `POST /api/appointments` hace upsert por teléfono normalizado: reutiliza ficha o la crea en la misma transacción que el turno.

### 7. Config pública vía API + SystemConfig

`GET /api/config` expone solo lo público (datos del local, horarios, WhatsApp del salón, duración de bloque). Nunca expone secrets. El seed escribe estos valores + admin + 3 servicios de ejemplo (Corte, Barba, Corte+Barba, precios placeholder editables).

### 8. Validación con zod en packages/shared

Schemas `createAppointment`, `updateStatus`, `serviceUpsert` compartidos entre handlers y tipos del front. Una sola fuente de verdad para reglas como formato de teléfono.

### 9. WhatsApp 100% frontend

El botón construye `https://wa.me/<dígitos>?text=<encodeURIComponent(mensaje)>` en el cliente. Sin backend, sin API de WhatsApp, sin costo. El número sale de `/api/config`.

## Riesgos / Trade-offs

- **Carrera por el mismo hueco** → Mitigación: índice único parcial + re-chequeo en transacción; el perdedor recibe error de no-disponibilidad (spec).
- **DST / cambios de hora argentina** → Mitigación: todo en pared America/Argentina/Buenos_Aires; si el país reintroduce DST, los bloques se generan igual en hora local (los turnos guardados en UTC no se mueven).
- **Teléfonos con formatos distintos del mismo cliente** → Mitigación: normalización a dígitos en shared + test; duplicados residuales se fusionan a mano en el panel (futuro).
- **Seed con credenciales ficticias en prod** → Mitigación: seed exige `ADMIN_EMAIL`/`ADMIN_PASSWORD` por env (documentado en README/runbook); sin esas vars el seed falla con ruido en vez de crear un admin conocido.
- **Sin rate-limit en reserva pública** → Mitigación aceptada para MVP (abuso = ruido, no dinero); queda como primer hardening post-MVP.
- **Agenda única** → Mitigación: el schema no ata turnos a profesional/silla, así que multi-silla es un change aditivo (columna + cálculo por recurso).

## Plan de migración

Nueva migración Prisma (modelos `Client`, `Service`, `Appointment`, `AdminUser`; índice parcial vía SQL). Deploy: `pnpm db:deploy` + `prisma db seed` contra la DB de Railway (una vez, manual vía `railway run` o desde local apuntando `DATABASE_URL` prod). Rollback: revertir commits del change + `prisma migrate resolve --rolled-back` si la migración ya aplicó; los datos de turnos creados en el medio se pierden (aceptado en MVP, sin clientes reales aún).

## Preguntas abiertas

Ninguna: las decisiones de producto se cerraron con el usuario antes de proponer y las técnicas están resueltas arriba.
