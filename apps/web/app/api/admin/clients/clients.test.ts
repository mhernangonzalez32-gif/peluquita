import { getDb } from "@/lib/db";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";

import { createSession } from "@/lib/auth";
import { GET as detail } from "./[id]/route.js";
import { GET as list } from "./route.js";

const createdAppointmentIds: string[] = [];
const createdClientIds: string[] = [];

async function adminRequest(url: string): Promise<NextRequest> {
  const token = await createSession("admin-test");
  return new NextRequest(url, { headers: { cookie: `peluquita_admin=${token}` } });
}

afterAll(async () => {
  const db = getDb();
  if (createdAppointmentIds.length > 0) {
    await db.appointment.deleteMany({ where: { id: { in: createdAppointmentIds } } });
  }
  if (createdClientIds.length > 0) {
    await db.client.deleteMany({ where: { id: { in: createdClientIds } } });
  }
  await db.$disconnect();
});

describe("clientes admin", () => {
  it("GET sin sesión con 401", async () => {
    const res = await list(new NextRequest("http://localhost/api/admin/clients"));
    expect(res.status).toBe(401);
  });

  it("listado incluye cliente con visitas e historial completo", async () => {
    const db = getDb();
    const phone = `115555${Date.now() % 100000}`;
    const client = await db.client.create({ data: { phone, name: "Historial Cli" } });
    createdClientIds.push(client.id);
    const service = await db.service.findFirstOrThrow({ where: { name: "Barba" } });
    for (const startAt of ["2030-09-01T12:00:00.000Z", "2030-09-08T12:00:00.000Z"]) {
      const appointment = await db.appointment.create({
        data: { clientId: client.id, serviceId: service.id, startAt: new Date(startAt) },
      });
      createdAppointmentIds.push(appointment.id);
    }

    const listed = (await (
      await list(await adminRequest("http://localhost/api/admin/clients"))
    ).json()) as Array<{ id: string; visits: number }>;
    expect(listed.find((c) => c.id === client.id)?.visits).toBe(2);

    const ficha = (await (
      await detail(await adminRequest(`http://localhost/api/admin/clients/${client.id}`), {
        params: Promise.resolve({ id: client.id }),
      })
    ).json()) as { history: Array<{ service: { name: string }; status: string }> };
    expect(ficha.history).toHaveLength(2);
    expect(ficha.history[0]?.service.name).toBe("Barba");
  });

  it("ficha inexistente con 404", async () => {
    const res = await detail(await adminRequest("http://localhost/api/admin/clients/nope"), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(res.status).toBe(404);
  });
});
