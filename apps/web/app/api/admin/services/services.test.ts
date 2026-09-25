import { getDb } from "@/lib/db";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";

import { createSession } from "@/lib/auth";
import { DELETE, PATCH } from "./[id]/route.js";
import { GET, POST } from "./route.js";

const createdServiceIds: string[] = [];
const createdAppointmentIds: string[] = [];
const createdPhones: string[] = [];
let counter = 0;

function unique(suffix: string): string {
  counter += 1;
  return `T-${Date.now() % 100000}-${counter}-${suffix}`;
}

async function adminRequest(url: string, method: string, body?: unknown): Promise<NextRequest> {
  const token = await createSession("admin-test");
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json", cookie: `peluquita_admin=${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

afterAll(async () => {
  const db = getDb();
  if (createdAppointmentIds.length > 0) {
    await db.appointment.deleteMany({ where: { id: { in: createdAppointmentIds } } });
  }
  if (createdServiceIds.length > 0) {
    await db.service.deleteMany({ where: { id: { in: createdServiceIds } } });
  }
  if (createdPhones.length > 0) {
    await db.client.deleteMany({ where: { phone: { in: createdPhones } } });
  }
  await db.$disconnect();
});

describe("servicios admin", () => {
  it("GET sin sesión con 401 y con sesión lista", async () => {
    expect((await GET(new NextRequest("http://localhost/api/admin/services"))).status).toBe(401);
    const res = await GET(await adminRequest("http://localhost/api/admin/services", "GET"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ name: string }>;
    expect(body.map((s) => s.name)).toContain("Corte");
  });

  it("POST crea y POST inválido con 400", async () => {
    const res = await POST(
      await adminRequest("http://localhost/api/admin/services", "POST", {
        name: unique("Servicio"),
        price: 10000,
        durationMin: 30,
      }),
    );
    expect(res.status).toBe(201);
    createdServiceIds.push(((await res.json()) as { id: string }).id);
    const bad = await POST(
      await adminRequest("http://localhost/api/admin/services", "POST", {
        name: "",
        price: -5,
        durationMin: 0,
      }),
    );
    expect(bad.status).toBe(400);
  });

  it("PATCH edita y PATCH inexistente con 404", async () => {
    const created = await POST(
      await adminRequest("http://localhost/api/admin/services", "POST", {
        name: unique("Editar"),
        price: 5000,
        durationMin: 20,
      }),
    );
    const id = ((await created.json()) as { id: string }).id;
    createdServiceIds.push(id);
    const res = await PATCH(
      await adminRequest(`http://localhost/api/admin/services/${id}`, "PATCH", {
        name: unique("Editado"),
        price: 6000,
        durationMin: 25,
      }),
      { params: Promise.resolve({ id }) },
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as { price: number }).price).toBe(6000);
    const missing = await PATCH(
      await adminRequest("http://localhost/api/admin/services/nope", "PATCH", {
        name: "X",
        price: 1,
        durationMin: 1,
      }),
      { params: Promise.resolve({ id: "nope" }) },
    );
    expect(missing.status).toBe(404);
  });

  it("DELETE rechaza con futuro comprometido y elimina sin futuro", async () => {
    const db = getDb();
    const withFuture = (
      (await (
        await POST(
          await adminRequest("http://localhost/api/admin/services", "POST", {
            name: unique("Futuro"),
            price: 1000,
            durationMin: 35,
          }),
        )
      ).json()) as { id: string }
    ).id;
    const phone = `114444${Date.now() % 100000}`;
    createdPhones.push(phone);
    const client = await db.client.create({ data: { phone, name: "Futuro Cli" } });
    const appointment = await db.appointment.create({
      data: {
        clientId: client.id,
        serviceId: withFuture,
        startAt: new Date("2030-08-01T12:00:00.000Z"),
      },
    });
    createdAppointmentIds.push(appointment.id);
    const blocked = await DELETE(
      await adminRequest(`http://localhost/api/admin/services/${withFuture}`, "DELETE"),
      {
        params: Promise.resolve({ id: withFuture }),
      },
    );
    expect(blocked.status).toBe(409);
    createdServiceIds.push(withFuture);

    const free = (
      (await (
        await POST(
          await adminRequest("http://localhost/api/admin/services", "POST", {
            name: unique("Libre"),
            price: 1000,
            durationMin: 35,
          }),
        )
      ).json()) as { id: string }
    ).id;
    const deleted = await DELETE(
      await adminRequest(`http://localhost/api/admin/services/${free}`, "DELETE"),
      {
        params: Promise.resolve({ id: free }),
      },
    );
    expect(deleted.status).toBe(200);
    expect(await db.service.findUnique({ where: { id: free } })).toBeNull();
  });
});
