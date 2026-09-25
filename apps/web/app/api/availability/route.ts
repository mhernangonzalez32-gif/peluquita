import { getDb } from "@/lib/db";
import { getSlots } from "@peluquita/shared";
import { NextResponse } from "next/server";

import { getSalonConfig } from "@/lib/config";

/** Huecos libres de un día: GET /api/availability?date=YYYY-MM-DD */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Fecha inválida (YYYY-MM-DD)" }, { status: 400 });
  }
  const config = await getSalonConfig();
  // Ventana amplia (±36 h): getSlots filtra por coincidencia exacta de milisegundos.
  const base = Date.parse(`${date}T12:00:00Z`);
  const occupied = await getDb().appointment.findMany({
    where: {
      startAt: { gte: new Date(base - 36 * 3600e3), lt: new Date(base + 36 * 3600e3) },
      status: { not: "CANCELADO" },
    },
    select: { startAt: true },
  });
  const slots = getSlots(
    date,
    {
      days: config.days,
      openMin: config.openMin,
      closeMin: config.closeMin,
      breakStartMin: config.breakStartMin,
      breakMin: config.breakMin,
      slotMin: config.slotMin,
      timeZone: config.timeZone,
    },
    occupied.map((o) => o.startAt.toISOString()),
  );
  return NextResponse.json({ date, slots });
}
