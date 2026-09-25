import { describe, expect, it } from "vitest";

import { GET } from "./route.js";

describe("GET /api/config", () => {
  it("expone datos públicos del local sin secretos", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, string>;
    expect(body["SALON_NOMBRE"]).toBe("Peluquita");
    expect(body["AGENDA_TZ"]).toBe("America/Argentina/Buenos_Aires");
    for (const key of Object.keys(body)) {
      expect(key.startsWith("ADMIN_")).toBe(false);
    }
  });
});
