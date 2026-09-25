import { getDb } from "@/lib/db";
import { afterAll, describe, expect, it } from "vitest";

import { POST } from "./route.js";

const SLOT_A = "2030-06-04T12:00:00.000Z";
const SLOT_B = "2030-06-04T12:35:00.000Z";
const SLOT_C = "2030-06-04T13:00:00.000Z";
const SLOT_D = "2030-06-04T13:35:00.000Z";

const createdAppointmentIds: string[] = [];
const createdPhones: string[] = [];

function phone(tag: string): string {
  const p = `119999${Date.now() % 100000}${tag}`;
  createdPhones.push(p);
  return p;
}

async function serviceId(): Promise<string> {
  const service = await getDb().service.findFirstOrThrow({ where: { name: "Corte" } });
  return service.id;
}

async function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/appointments", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
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

describe("POST /api/appointments", () => {
  it("crea turno CONFIRMADO con ficha nueva", async () => {
    const res = await post({
      serviceId: await serviceId(),
      startAt: SLOT_A,
      name: "Test Uno",
      phone: phone("1"),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; status: string };
    expect(body.status).toBe("CONFIRMADO");
    createdAppointmentIds.push(body.id);
  });

  it("reutiliza la ficha si el teléfono existe", async () => {
    const p = phone("2");
    const first = (await (
      await post({ serviceId: await serviceId(), startAt: SLOT_B, name: "Test Dos", phone: p })
    ).json()) as { id: string; client: { id: string } };
    createdAppointmentIds.push(first.id);
    const second = (await (
      await post({ serviceId: await serviceId(), startAt: SLOT_C, name: "Test Dos B", phone: p })
    ).json()) as { id: string; client: { id: string } };
    createdAppointmentIds.push(second.id);
    expect(second.client.id).toBe(first.client.id);
  });

  it("rechaza doble reserva del mismo hueco con 409", async () => {
    const first = await post({
      serviceId: await serviceId(),
      startAt: SLOT_D,
      name: "Dueño",
      phone: phone("3"),
    });
    expect(first.status).toBe(201);
    createdAppointmentIds.push(((await first.json()) as { id: string }).id);
    const res = await post({
      serviceId: await serviceId(),
      startAt: SLOT_D,
      name: "Otro",
      phone: phone("6"),
    });
    expect(res.status).toBe(409);
  });

  it("carrera por el mismo hueco: solo uno confirma", async () => {
    const slot = "2030-06-05T12:00:00.000Z";
    const [a, b] = await Promise.all([
      post({ serviceId: await serviceId(), startAt: slot, name: "Race A", phone: phone("7") }),
      post({ serviceId: await serviceId(), startAt: slot, name: "Race B", phone: phone("8") }),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    const winner = a.status === 201 ? a : b;
    createdAppointmentIds.push(((await winner.json()) as { id: string }).id);
  });

  it("rechaza payload inválido con 400", async () => {
    const res = await post({
      serviceId: await serviceId(),
      startAt: SLOT_A,
      name: "",
      phone: "abc",
    });
    expect(res.status).toBe(400);
  });

  it("rechaza fecha pasada con 400", async () => {
    const res = await post({
      serviceId: await serviceId(),
      startAt: "2020-01-01T12:00:00.000Z",
      name: "Viejo",
      phone: phone("4"),
    });
    expect(res.status).toBe(400);
  });

  it("rechaza servicio inexistente con 404", async () => {
    const res = await post({
      serviceId: "svc-inexistente",
      startAt: SLOT_C,
      name: "X",
      phone: phone("5"),
    });
    expect(res.status).toBe(404);
  });
});
