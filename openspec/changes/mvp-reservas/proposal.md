# Propuesta

## Por qué

El local pierde reservas por depender del WhatsApp manual y la agenda en papel: los clientes no ven disponibilidad real fuera de horario y el dueño no tiene registro de quién viene, qué pidió ni historial por cliente. Este change entrega el primer producto usable de peluquita —reserva online pública + panel del dueño— sobre la fundación del change `estructura`, sin pagos ni integraciones externas todavía.

## Qué cambia

- **Vista pública**: landing con datos del local (dirección, horarios, logo/foto) y botón "Reservar Turno"; turnero en 3 pasos (servicio con precio → fecha y hueco disponible → nombre + teléfono/WhatsApp, sin crear cuenta ni contraseña); botón "Confirmar por WhatsApp" que abre `wa.me` con mensaje prearmado (costo cero, sin API de WhatsApp).
- **Disponibilidad**: huecos calculados en bloques fijos de 35 minutos, mar–sáb 9:00–21:00 con break de 45 min (default 13:00–13:45, configurable), descontando turnos ocupados. El turno nace `CONFIRMADO` directo si el hueco figuraba libre.
- **Clientes sin login**: el teléfono es el identificador único; si existe se reutiliza la ficha, si no se crea. Sin contraseñas para clientes.
- **Panel admin** (login email + contraseña, un solo usuario, sin roles): agenda del día (lista o calendario simple) con cambio de estado (`CONFIRMADO` / `CANCELADO` / `COMPLETADO`); CRUD de servicios (precio y duración —la duración se guarda por servicio aunque el cálculo use bloque fijo por ahora); listado de clientes auto-generado con historial de visitas por cliente.
- **Datos iniciales**: seed con admin ficticio (`admin@peluquita.local`, password por env) y config del local en `SystemConfig` (WhatsApp ficticio `5491100000000`, horarios, duración de bloque).
- **No incluye**: pagos/señas, recordatorios automáticos, múltiples profesionales o sucursales, roles y permisos, facturación, marketplace. Eso va en changes posteriores.

## Capacidades

### Nuevas capacidades

- `reserva-publica`: reserva online pública en 3 pasos con cálculo de disponibilidad, clientes identificados por teléfono (sin cuentas) y confirmación por WhatsApp vía enlace `wa.me`.
- `panel-admin`: autenticación de un único administrador y gestión del local —agenda con estados, CRUD de servicios y fichas de clientes con historial.

### Capacidades modificadas

- Ninguna (las capabilities existentes —`project-base`, aún no archivada— no cambian de comportamiento).

## Impacto

- **Código**: `packages/db/prisma/schema.prisma` (+ modelos `Client`, `Service`, `Appointment`, `AdminUser`, migración nueva); `SystemConfig` se reutiliza para horario/bloque/WhatsApp/datos del local. Nuevas rutas en `apps/web/app` (`/`, `/reservar`, `/admin/*`) + `middleware.ts`; nuevos route handlers bajo `app/api` (públicos y `/api/admin/*`); validadores en `packages/shared`. `apps/api` (Hono) no se toca.
- **Dependencias nuevas**: `bcryptjs` (hash de password, sin binarios nativos), `jose` (JWT para sesión en cookie httpOnly), `zod` (validación compartida). Sin servicios externos nuevos.
- **Sistemas**: ninguno nuevo; deploy igual (Vercel web, Railway api). La DB prod (Railway) pasa a ser necesaria cuando este change se deploye (`pnpm db:deploy` + seed).
- **OpenSpec**: introduce las capabilities `reserva-publica` y `panel-admin`; cada una con su spec delta en este change.
