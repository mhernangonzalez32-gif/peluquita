import { getDb } from "@/lib/db";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";

import { createSession } from "@/lib/auth";
import { PATCH } from "./route.js";

const createdAppointmentIds: string[] = [];
const createdPhones: string[] = [];

async function adminRequest(url: string, body: unknown): Promise<NextRequest> {
  const token = await createSession("admin-test");
  return new NextRequest(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", cookie: `peluquita_admin=${token}` },
    body: JSON.stringify(body),
  });
}

async function seedAppointment(startAt: string): Promise<string> {
  const db = getDb();
  const phone = `112233${Date.now() % 100000}`;
  createdPhones.push(phone);
  const client = await db.client.create({ data: { phone, name: "Admin Test" } });
  const service = await db.service.findFirstOrThrow({ where: { name: "Corte" } });
  const appointment = await db.appointment.create({
    data: { clientId: client.id, serviceId: service.id, startAt: new Date(startAt) },
  });
  createdAppointmentIds.push(appointment.id);
  return appointment.id;
}

afterAll(async () => {
  const db = getDb();
  if (createdAppointmentIds.length > 0) {
    await db.appointment.deleteMany({ where: { id: { in: createdAppointmentIds } } });
  }
  if (createdPhones.length > 0) {
    await db.client.deleteMany({ where: { phone: { in: createdPhones } } });
  }
  await db.$disconnect();
});

describe("PATCH /api/admin/appointments/:id", () => {
  it("sin sesión con 401", async () => {
    const res = await PATCH(
      new NextRequest("http://localhost/api/admin/appointments/x", { method: "PATCH", body: "{}" }),
      { params: Promise.resolve({ id: "x" }) },
    );
    expect(res.status).toBe(401);
  });

  it("turno inexistente con 404", async () => {
    const res = await PATCH(
      await adminRequest("http://localhost/api/admin/appointments/nope", { status: "CANCELADO" }),
      { params: Promise.resolve({ id: "nope" }) },
    );
    expect(res.status).toBe(404);
  });

  it("CONFIRMADO → CANCELADO y luego terminal con 409", async () => {
    const id = await seedAppointment("2030-07-01T12:00:00.000Z");
    const cancel = await PATCH(
      await adminRequest(`http://localhost/api/admin/appointments/${id}`, { status: "CANCELADO" }),
      {
        params: Promise.resolve({ id }),
      },
    );
    expect(cancel.status).toBe(200);
    const again = await PATCH(
      await adminRequest(`http://localhost/api/admin/appointments/${id}`, { status: "COMPLETADO" }),
      {
        params: Promise.resolve({ id }),
      },
    );
    expect(again.status).toBe(409);
  });

  it("CONFIRMADO → COMPLETADO", async () => {
    const id = await seedAppointment("2030-07-01T12:35:00.000Z");
    const res = await PATCH(
      await adminRequest(`http://localhost/api/admin/appointments/${id}`, { status: "COMPLETADO" }),
      {
        params: Promise.resolve({ id }),
      },
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as { status: string }).status).toBe("COMPLETADO");
  });

  it("estado inválido con 400", async () => {
    const id = await seedAppointment("2030-07-01T13:00:00.000Z");
    const res = await PATCH(
      await adminRequest(`http://localhost/api/admin/appointments/${id}`, { status: "PENDIENTE" }),
      {
        params: Promise.resolve({ id }),
      },
    );
    expect(res.status).toBe(400);
  });
});
