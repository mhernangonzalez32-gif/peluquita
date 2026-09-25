import { describe, expect, it } from "vitest";

import { GET } from "./route.js";

describe("GET /api/services", () => {
  it("lista servicios con id, nombre, precio y duración", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{
      id: string;
      name: string;
      price: number;
      durationMin: number;
    }>;
    expect(Array.isArray(body)).toBe(true);
    const names = body.map((s) => s.name);
    expect(names).toContain("Corte");
    for (const s of body) {
      expect(typeof s.id).toBe("string");
      expect(typeof s.price).toBe("number");
      expect(typeof s.durationMin).toBe("number");
    }
  });
});
