/**
 * Cálculo de disponibilidad en bloques fijos. Función pura (sin I/O):
 * recibe el día, la config del local y los inicios ocupados, devuelve
 * los inicios libres en ISO UTC.
 */
export interface SlotsConfig {
  /** Días JS (0=domingo): p. ej. [2,3,4,5,6] para mar–sáb. */
  days: number[];
  /** Minutos desde medianoche local: apertura, cierre, inicio de break. */
  openMin: number;
  closeMin: number;
  breakStartMin: number;
  breakMin: number;
  /** Duración del bloque en minutos. */
  slotMin: number;
  timeZone: string;
}

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Offset de la zona en minutos para un instante UTC (maneja DST iterando). */
function tzOffsetMinutes(timeZone: string, utcMillis: number): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(new Date(utcMillis)).map((p) => [p.type, p.value]),
  );
  const asUTC = Date.UTC(
    Number(parts["year"]),
    Number(parts["month"]) - 1,
    Number(parts["day"]),
    Number(parts["hour"]) % 24,
    Number(parts["minute"]),
    Number(parts["second"]),
  );
  return (asUTC - utcMillis) / 60000;
}

/** Convierte fecha pared (y/m/d H:M) en milisegundos UTC para la zona. */
function wallToUtcMillis(
  timeZone: string,
  y: number,
  m: number,
  d: number,
  hour: number,
  minute: number,
): number {
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  const first = tzOffsetMinutes(timeZone, guess);
  return guess - first * 60000 - (tzOffsetMinutes(timeZone, guess - first * 60000) - first) * 60000;
}

function dayISOInTZ(timeZone: string, nowMillis: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(nowMillis));
}

function weekdayInTZ(timeZone: string, y: number, m: number, d: number): number {
  const short = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(
    new Date(Date.UTC(y, m - 1, d, 12)),
  );
  return WEEKDAYS[short] ?? -1;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Rango UTC de un día calendario en la zona dada: [inicio, fin).
 * Útil para pedir "los turnos del día" a la base de datos.
 */
export function dayRangeUtc(
  dateISO: string,
  timeZone: string,
): { startISO: string; endISO: string } | null {
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!y || !m || !d) return null;
  const start = wallToUtcMillis(timeZone, y, m, d, 0, 0);
  const next = new Date(Date.UTC(y, m - 1, d) + 86400000);
  const end = wallToUtcMillis(
    timeZone,
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
    0,
    0,
  );
  return { startISO: new Date(start).toISOString(), endISO: new Date(end).toISOString() };
}

/**
 * @param dateISO Día calendario "YYYY-MM-DD" en la zona del local.
 * @param occupiedISO Inicios ocupados en ISO UTC.
 * @returns Inicios libres en ISO UTC, ordenados.
 */
export function getSlots(dateISO: string, config: SlotsConfig, occupiedISO: string[]): string[] {
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!y || !m || !d) return [];

  const now = Date.now();
  const todayISO = dayISOInTZ(config.timeZone, now);
  if (dateISO < todayISO) return [];
  const isToday = dateISO === todayISO;

  if (!config.days.includes(weekdayInTZ(config.timeZone, y, m, d))) return [];

  const occupied = new Set(occupiedISO.map((s) => new Date(s).getTime()));
  const breakEnd = config.breakStartMin + config.breakMin;
  const out: string[] = [];

  for (
    let start = config.openMin;
    start + config.slotMin <= config.closeMin;
    start += config.slotMin
  ) {
    const end = start + config.slotMin;
    if (overlaps(start, end, config.breakStartMin, breakEnd)) continue;
    const millis = wallToUtcMillis(config.timeZone, y, m, d, Math.floor(start / 60), start % 60);
    if (isToday && millis <= now) continue;
    if (occupied.has(millis)) continue;
    out.push(new Date(millis).toISOString());
  }
  return out;
}
