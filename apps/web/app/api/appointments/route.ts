import { getDb } from "@/lib/db";
import { createAppointmentSchema, normalizePhone } from "@peluquita/shared";
import { NextResponse } from "next/server";

class SlotTakenError extends Error {}

/** Crea un turno CONFIRMADO con upsert de cliente por teléfono. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { serviceId, name, phone } = parsed.data;
  const start = new Date(parsed.data.startAt);
  if (start <= new Date()) {
    return NextResponse.json({ error: "El turno debe ser futuro" }, { status: 400 });
  }

  const db = getDb();
  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    return NextResponse.json({ error: "Servicio inexistente" }, { status: 404 });
  }

  try {
    const appointment = await db.$transaction(async (tx) => {
      const taken = await tx.appointment.findFirst({
        where: { startAt: start, status: { not: "CANCELADO" } },
      });
      if (taken) throw new SlotTakenError();
      const client = await tx.client.upsert({
        where: { phone: normalizePhone(phone) },
        update: { name },
        create: { phone: normalizePhone(phone), name },
      });
      return tx.appointment.create({
        data: { clientId: client.id, serviceId, startAt: start, status: "CONFIRMADO" },
        include: { client: true, service: true },
      });
    });
    return NextResponse.json(
      {
        id: appointment.id,
        startAt: appointment.startAt,
        status: appointment.status,
        client: { id: appointment.client.id, name: appointment.client.name },
        service: { id: appointment.service.id, name: appointment.service.name },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SlotTakenError) {
      return NextResponse.json({ error: "Hueco no disponible" }, { status: 409 });
    }
    // Red de seguridad ante carrera: el índice parcial rechaza el duplicado.
    if ((error as { code?: string } | null)?.code === "P2002") {
      return NextResponse.json({ error: "Hueco no disponible" }, { status: 409 });
    }
    throw error;
  }
}
