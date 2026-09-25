import { dayRangeUtc } from "@peluquita/shared";
import { getDb } from "@/lib/db";
import { NextResponse, type NextRequest } from "next/server";

import { getSalonConfig } from "@/lib/config";
import { requireAdmin } from "@/lib/session";

/** Agenda de un día: GET /api/admin/appointments?fecha=YYYY-MM-DD (hoy por defecto). */
export async function GET(request: NextRequest) {
  const session = await requireAdmin(request);
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const config = await getSalonConfig();
  const fecha =
    searchParams.get("fecha") ??
    new Intl.DateTimeFormat("en-CA", {
      timeZone: config.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return NextResponse.json({ error: "Fecha inválida (YYYY-MM-DD)" }, { status: 400 });
  }
  const range = dayRangeUtc(fecha, config.timeZone);
  if (range === null) {
    return NextResponse.json({ error: "Fecha inválida (YYYY-MM-DD)" }, { status: 400 });
  }
  const appointments = await getDb().appointment.findMany({
    where: { startAt: { gte: new Date(range.startISO), lt: new Date(range.endISO) } },
    orderBy: { startAt: "asc" },
    include: { client: true, service: true },
  });
  return NextResponse.json(
    appointments.map((a) => ({
      id: a.id,
      startAt: a.startAt,
      status: a.status,
      client: { id: a.client.id, name: a.client.name, phone: a.client.phone },
      service: { id: a.service.id, name: a.service.name, price: a.service.price },
    })),
  );
}
