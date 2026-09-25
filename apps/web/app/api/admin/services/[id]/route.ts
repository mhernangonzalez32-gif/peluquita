import { serviceUpsertSchema } from "@peluquita/shared";
import { getDb } from "@/lib/db";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

/** Editar: PATCH /api/admin/services/:id (aplica hacia adelante). */
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireAdmin(request);
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = serviceUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  try {
    const updated = await getDb().service.update({ where: { id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Servicio inexistente" }, { status: 404 });
  }
}

/** Eliminar: DELETE /api/admin/services/:id (rechaza con futuro comprometido). */
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await requireAdmin(request);
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const db = getDb();
  const existing = await db.service.findUnique({ where: { id } });
  if (existing === null) {
    return NextResponse.json({ error: "Servicio inexistente" }, { status: 404 });
  }
  const future = await db.appointment.count({
    where: { serviceId: id, startAt: { gte: new Date() }, status: { not: "CANCELADO" } },
  });
  if (future > 0) {
    return NextResponse.json({ error: "Tiene turnos futuros" }, { status: 409 });
  }
  await db.appointment.deleteMany({ where: { serviceId: id } });
  await db.service.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
