import { describe, expect, it } from "vitest";

import { dayRangeUtc, getSlots, type SlotsConfig } from "./slots.js";

const TZ = "America/Argentina/Buenos_Aires";

const CONFIG: SlotsConfig = {
  days: [2, 3, 4, 5, 6],
  openMin: 540,
  closeMin: 1260,
  breakStartMin: 780,
  breakMin: 45,
  slotMin: 35,
  timeZone: TZ,
};

function toISODate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Próxima fecha (desde mañana) cuyo día de semana BA esté en `days`. */
function nextDateWithDay(days: number[]): string {
  for (let i = 1; i <= 14; i++) {
    const d = new Date(Date.now() + i * 86400000);
    const short = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(d);
    if (days.includes(WD[short] as number)) return toISODate(d);
  }
  throw new Error("sin día válido en 2 semanas");
}

/** Minutos locales (pared BA) de un ISO UTC. */
function localMinutes(iso: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return Number(parts["hour"]) * 60 + Number(parts["minute"]);
}

describe("getSlots", () => {
  it("día tipo laborable: 17 huecos, primero 9:00 y último 20:05 hora local", () => {
    const slots = getSlots(nextDateWithDay([2, 3, 4, 5, 6]), CONFIG, []);
    expect(slots).toHaveLength(17);
    expect(localMinutes(slots[0] as string)).toBe(540);
    expect(localMinutes(slots[slots.length - 1] as string)).toBe(1205);
  });

  it("ningún hueco pisa el break ni termina después del cierre", () => {
    const slots = getSlots(nextDateWithDay([2, 3, 4, 5, 6]), CONFIG, []);
    for (const s of slots) {
      const start = localMinutes(s);
      const end = start + CONFIG.slotMin;
      expect(start < 780 || start >= 825).toBe(true);
      expect(end <= 1260).toBe(true);
    }
  });

  it("domingo y lunes cerrados, pasado vacío", () => {
    expect(getSlots(nextDateWithDay([0]), CONFIG, [])).toEqual([]);
    expect(getSlots(nextDateWithDay([1]), CONFIG, [])).toEqual([]);
    const yesterday = toISODate(new Date(Date.now() - 86400000));
    expect(getSlots(yesterday, CONFIG, [])).toEqual([]);
  });

  it("excluye los ocupados", () => {
    const day = nextDateWithDay([2, 3, 4, 5, 6]);
    const all = getSlots(day, CONFIG, []);
    const taken = (all.slice(0, 2) as string[]).concat(all[all.length - 1] as string);
    const rest = getSlots(day, CONFIG, taken);
    expect(rest).toHaveLength(all.length - taken.length);
    for (const t of taken) expect(rest).not.toContain(t);
  });

  it("fecha inválida devuelve vacío", () => {
    expect(getSlots("no-fecha", CONFIG, [])).toEqual([]);
  });
});

describe("dayRangeUtc", () => {
  it("un día BA cubre de 03:00Z a 03:00Z del día siguiente", () => {
    expect(dayRangeUtc("2026-09-29", TZ)).toEqual({
      startISO: "2026-09-29T03:00:00.000Z",
      endISO: "2026-09-30T03:00:00.000Z",
    });
  });

  it("fecha inválida devuelve null", () => {
    expect(dayRangeUtc("no-fecha", TZ)).toBeNull();
  });
});
