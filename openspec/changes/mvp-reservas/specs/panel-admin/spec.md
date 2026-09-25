# Spec Delta

## Purpose

Da al dueño un panel con login propio para ver la agenda del día, cambiar estados de turnos, gestionar servicios con precios y duraciones, y consultar fichas de clientes con su historial de visitas.

## ADDED Requirements

### Requirement: Login de administrador único

El panel DEBERÁ exigir email y contraseña de un único usuario administrador, mantener la sesión y DEBERÁ redirigir a `/admin/login` cualquier acceso a `/admin/*` sin sesión válida. DEBERÁ ofrecer cierre de sesión.

#### Scenario: Credenciales válidas entran

- **WHEN** se ingresa el email y la contraseña del administrador semeados
- **THEN** se crea la sesión y se accede al panel

#### Scenario: Credenciales inválidas no entran

- **WHEN** se ingresa email o contraseña incorrectos
- **THEN** se muestra un error y no se crea ninguna sesión

#### Scenario: Ruta protegida sin sesión redirige

- **WHEN** se visita `/admin` o cualquier subruta sin sesión válida
- **THEN** se redirige a `/admin/login`

#### Scenario: Logout cierra la sesión

- **WHEN** el administrador cierra sesión
- **THEN** la sesión se invalida y `/admin/*` vuelve a redirigir al login

### Requirement: Agenda del día

El panel DEBERÁ mostrar los turnos de un día (hoy por defecto, navegable por fecha) con cliente, servicio, hora y estado, e indicar vacío cuando no hay turnos.

#### Scenario: Ver quién viene hoy

- **WHEN** el administrador abre la agenda del día
- **THEN** ve cada turno con nombre del cliente, servicio, hora y estado

#### Scenario: Día sin turnos

- **WHEN** el día elegido no tiene turnos
- **THEN** se muestra un estado vacío explícito

### Requirement: Cambio de estado del turno

El administrador DEBERÁ poder pasar un turno `CONFIRMADO` a `CANCELADO` o `COMPLETADO`. Los estados `CANCELADO` y `COMPLETADO` son finales y no DEBERÁN cambiar. Cancelar DEBERÁ liberar el hueco para que vuelva a ofrecerse.

#### Scenario: Cancelar libera el hueco

- **WHEN** se cancela un turno confirmado
- **THEN** su bloque vuelve a aparecer como disponible en el turnero público

#### Scenario: Completar cierra el turno

- **WHEN** se marca un turno como completado
- **THEN** queda registrado con ese estado final y no admite más cambios

### Requirement: CRUD de servicios

El panel DEBERÁ permitir crear, editar y eliminar servicios con nombre, precio y duración. Editar DEBERÁ aplicarse hacia adelante sin alterar turnos ya registrados. Eliminar un servicio con turnos futuros no cancelados DEBERÁ rechazarse con error.

#### Scenario: Crear y editar servicio

- **WHEN** el administrador crea un servicio o edita precio o duración de uno existente
- **THEN** el turnero público refleja el cambio y los turnos pasados conservan sus datos

#### Scenario: Eliminar servicio con futuro comprometido se rechaza

- **WHEN** se intenta eliminar un servicio que tiene turnos futuros no cancelados
- **THEN** se rechaza con error y el servicio sigue activo

### Requirement: Ficha de clientes con historial

El panel DEBERÁ listar automáticamente a los clientes generados por las reservas, y al abrir uno DEBERÁ mostrar su historial de visitas con fecha, servicio y estado de cada turno.

#### Scenario: Cliente que reservó aparece en el listado

- **WHEN** un cliente confirma su primera reserva
- **THEN** aparece en el listado de clientes del panel

#### Scenario: Historial por cliente

- **WHEN** el administrador abre la ficha de un cliente
- **THEN** ve todos sus turnos con fecha, servicio y estado
