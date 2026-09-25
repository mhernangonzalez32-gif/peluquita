import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { createSession } from "@/lib/auth";
import { GET } from "./route.js";

async function adminRequest(url: string): Promise<NextRequest> {
  const token = await createSession("admin-test");
  return new NextRequest(url, { headers: { cookie: `peluquita_admin=${token}` } });
}

describe("GET /api/admin/appointments", () => {
  it("sin sesión con 401", async () => {
    const res = await GET(
      new NextRequest("http://localhost/api/admin/appointments?fecha=2030-06-04"),
    );
    expect(res.status).toBe(401);
  });

  it("fecha inválida con 400", async () => {
    const res = await GET(
      await adminRequest("http://localhost/api/admin/appointments?fecha=no-fecha"),
    );
    expect(res.status).toBe(400);
  });

  it("con sesión devuelve array", async () => {
    const res = await GET(
      await adminRequest("http://localhost/api/admin/appointments?fecha=2030-06-04"),
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });
});
