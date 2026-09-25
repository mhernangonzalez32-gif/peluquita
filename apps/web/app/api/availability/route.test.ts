import { describe, expect, it } from "vitest";

import { GET } from "./route.js";

const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function isoInTZ(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function nextDateWithDay(days: number[]): string {
  const tz = "America/Argentina/Buenos_Aires";
  for (let i = 1; i <= 60; i++) {
    const d = new Date(Date.now() + i * 86400000);
    const short = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(d);
    if (days.includes(WD[short] as number)) return isoInTZ(d, tz);
  }
  throw new Error("sin día válido");
}

async function get(date: string): Promise<Response> {
  return GET(new Request(`http://localhost/api/availability?date=${date}`));
}

describe("GET /api/availability", () => {
  it("devuelve huecos para un día laborable", async () => {
    const date = nextDateWithDay([2, 3, 4, 5, 6]);
    const res = await get(date);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { date: string; slots: string[] };
    expect(body.date).toBe(date);
    expect(body.slots.length).toBeGreaterThan(0);
  });

  it("domingo sin huecos", async () => {
    const res = await get(nextDateWithDay([0]));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { slots: string[] };
    expect(body.slots).toEqual([]);
  });

  it("fecha inválida con 400", async () => {
    const res = await GET(new Request("http://localhost/api/availability?date=no-fecha"));
    expect(res.status).toBe(400);
  });
});
