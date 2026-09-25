# Spec Delta

## Purpose

Permite que cualquier cliente reserve un turno online en 3 pasos sin crear cuenta, viendo disponibilidad real calculada en bloques fijos, y que confirme por WhatsApp con un enlace prearmado sin costo.

## ADDED Requirements

### Requirement: Landing pública del local

La landing DEBERÁ mostrar los datos del local (nombre, dirección, horarios de atención, logo o foto) y un botón "Reservar Turno" visible que inicie el flujo de reserva.

#### Scenario: Visitante ve datos y botón

- **WHEN** un visitante abre `/`
- **THEN** ve nombre, dirección, horarios y logo/foto del local junto a un botón "Reservar Turno" que navega a `/reservar`

### Requirement: Paso 1 - elegir servicio

El turnero DEBERÁ listar los servicios activos con nombre, precio y duración, y DEBERÁ exigir exactamente un servicio seleccionado para continuar.

#### Scenario: Lista de servicios con precio

- **WHEN** el cliente abre el paso 1
- **THEN** ve cada servicio activo con su nombre, precio y duración, y solo puede avanzar con uno seleccionado

### Requirement: Paso 2 - fecha y hueco disponible

El turnero DEBERÁ ofrecer días válidos (mar–sáb, nunca fechas pasadas) y, para el día elegido, los huecos libres en bloques de 35 minutos entre 9:00 y 21:00 excluyendo el break configurado y los turnos ya ocupados (todo estado salvo `CANCELADO` ocupa).

#### Scenario: Días no laborables no seleccionables

- **WHEN** el cliente abre el selector de fecha
- **THEN** domingos, lunes y fechas pasadas no se pueden elegir

#### Scenario: Huecos ocupados no se ofrecen

- **WHEN** el cliente elige un día con turnos confirmados
- **THEN** los bloques ocupados no aparecen y solo se listan los libres entre 9:00 y 21:00 fuera del break

### Requirement: Paso 3 - datos de contacto sin cuenta

El turnero DEBERÁ pedir únicamente nombre y teléfono/WhatsApp, sin contraseña ni registro, y DEBERÁ validar que el nombre no esté vacío y que el teléfono tenga formato válido antes de confirmar.

#### Scenario: Datos inválidos bloquean la confirmación

- **WHEN** el cliente intenta confirmar sin nombre o con un teléfono inválido
- **THEN** ve un error visible por campo y no se crea ningún turno

### Requirement: Confirmación directa con upsert por teléfono

Al confirmar un hueco libre, el sistema DEBERÁ crear el turno en estado `CONFIRMADO` de inmediato, reutilizando la ficha del cliente si el teléfono ya existe o creando una nueva si no. Si el hueco se ocupó entre la visualización y la confirmación, DEBERÁ rechazar con error de no-disponibilidad sin duplicar turnos.

#### Scenario: Teléfono nuevo crea ficha y turno confirmado

- **WHEN** un cliente confirma con un teléfono no registrado en un hueco libre
- **THEN** se crea su ficha y un turno `CONFIRMADO` para ese servicio, fecha y hora

#### Scenario: Teléfono existente reutiliza ficha

- **WHEN** un cliente confirma con un teléfono ya registrado
- **THEN** el turno `CONFIRMADO` se asigna a su ficha existente sin duplicar el cliente

#### Scenario: Hueco tomado en el medio se rechaza

- **WHEN** dos clientes confirman el mismo hueco a la vez
- **THEN** solo uno obtiene el turno `CONFIRMADO` y el otro recibe un error de no-disponibilidad

### Requirement: Confirmación por WhatsApp sin costo

Tras confirmar, el sistema DEBERÁ mostrar un botón "Confirmar por WhatsApp" cuyo enlace abre `wa.me/<teléfono-del-salón>` con un mensaje prearmado que incluye servicio, fecha y hora de la reserva. No DEBERÁ usar la API de WhatsApp ni generar costos.

#### Scenario: Botón con mensaje prearmado

- **WHEN** el cliente confirma su turno
- **THEN** ve un botón cuyo enlace es `wa.me` al teléfono del salón con el texto codificado del servicio, fecha y hora reservados
