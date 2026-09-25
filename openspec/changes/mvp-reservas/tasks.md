# Tareas

## 1. Datos y validación

- [x] 1.1 Agregar dependencias (`zod` en `@peluquita/shared`; `bcryptjs` y `jose` en `@peluquita/web`) y verificar que `pnpm install` resuelve el workspace sin errores
- [x] 1.2 Extender `packages/db/prisma/schema.prisma` con `Client` (teléfono único normalizado), `Service`, `Appointment` (estados `CONFIRMADO`/`CANCELADO`/`COMPLETADO`) y `AdminUser`, más índice único parcial por `startAt` excluyendo `CANCELADO` vía SQL en la migración, y verificar que `pnpm db:migrate` aplica y `pnpm db:status` reporta todo al día
- [x] 1.3 Crear seed de Prisma (admin por `ADMIN_EMAIL`/`ADMIN_PASSWORD` de env con hash bcrypt, `SystemConfig` con horarios/break/bloque/WhatsApp/datos del local, 3 servicios de ejemplo) y verificar que corre y deja una fila por modelo esperado
- [x] 1.4 Agregar schemas zod en `@peluquita/shared` (`createAppointment`, `updateStatus`, `serviceUpsert`) más normalización de teléfono, y verificar que sus unit tests cubren casos válidos, inválidos y normalización

## 2. Disponibilidad y catálogo público

- [x] 2.1 Implementar `getSlots` como función pura en `@peluquita/shared` (bloques de 35 min desde 9:00 en mar–sáb, salta break, fin ≤ 21:00, excluye ocupados) y verificar que sus unit tests cubren finde, pasado, break, ocupados y el día tipo de 18 huecos
- [x] 2.2 Agregar `GET /api/services` (solo activos con precio) y `GET /api/config` (solo datos públicos del local) y verificar con tests de handler que responden 200 con el JSON esperado

## 3. Reserva pública

- [x] 3.1 Agregar `POST /api/appointments` (valida con zod, upsert de cliente por teléfono en transacción, re-chequea el hueco y devuelve error de no-disponibilidad si se ocupó, índice parcial como red de seguridad) y verificar con tests contra Postgres local los casos de ficha nueva, ficha existente y hueco tomado
- [x] 3.2 Extender la landing `/` con datos del local y botón "Reservar Turno" que navega a `/reservar`, y verificar con un spec e2e que los datos se ven y el botón navega
- [x] 3.3 Agregar el wizard `/reservar` en 3 pasos (servicio → fecha/huecos calculados → nombre+teléfono) con confirmación directa y botón "Confirmar por WhatsApp" con href `wa.me` prearmado, y verificar con un spec e2e el flujo completo hasta la confirmación y el href del botón

## 4. Panel admin

- [x] 4.1 Agregar login/logout (`POST /api/admin/login|logout`), sesión JWT en cookie httpOnly y `middleware.ts` protegiendo `/admin/*`, y verificar con tests los casos de credenciales válidas/inválidas, redirect sin sesión y logout
- [x] 4.2 Agregar agenda del día navegable por fecha con cambio de estado (`CONFIRMADO` → `CANCELADO`/`COMPLETADO`, finales inmutables) y verificar con un spec e2e que cancelar libera el hueco en el turnero público
- [x] 4.3 Agregar CRUD de servicios (crear/editar con precio y duración hacia adelante; eliminar rechaza si hay turnos futuros no cancelados) y verificar con tests ambos caminos
- [x] 4.4 Agregar listado de clientes auto-generado y ficha con historial de visitas (fecha, servicio, estado) y verificar con tests que un cliente con turnos muestra su historial completo

## 5. Cierre

- [x] 5.1 Actualizar el README/runbook (vars `ADMIN_EMAIL`/`ADMIN_PASSWORD`, seed local y en prod vía Railway con `db:deploy`, puerto y horarios configurables) y verificar que cada comando documentado corre tal como está escrito
- [x] 5.2 Correr el gate completo (`pnpm turbo run lint typecheck test build`) más `pnpm e2e` y verificar que todo sale 0 con los nuevos specs incluidos
