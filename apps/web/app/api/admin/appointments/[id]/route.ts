import { updateAppointmentStatusSchema } from "@peluquita/shared";
import { getDb } from "@/lib/db";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/session";

/** Cambio de estado: PATCH /api/admin/appointments/:id { status } */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = updateAppointmentStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }
  const db = getDb();
  const current = await db.appointment.findUnique({ where: { id } });
  if (current === null) {
    return NextResponse.json({ error: "Turno inexistente" }, { status: 404 });
  }
  if (current.status !== "CONFIRMADO") {
    return NextResponse.json({ error: "El turno ya está cerrado" }, { status: 409 });
  }
  const updated = await db.appointment.update({
    where: { id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json({ id: updated.id, status: updated.status });
}
