import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

/** Claves de SystemConfig seguras para exponer en público. */
const PUBLIC_KEYS = [
  "SALON_NOMBRE",
  "SALON_DIRECCION",
  "SALON_HORARIO_TEXTO",
  "SALON_WHATSAPP",
  "AGENDA_DIAS",
  "AGENDA_APERTURA_MIN",
  "AGENDA_CIERRE_MIN",
  "AGENDA_BREAK_INICIO_MIN",
  "AGENDA_BREAK_MIN",
  "AGENDA_BLOQUE_MIN",
  "AGENDA_TZ",
] as const;

export async function GET() {
  const rows = await getDb().systemConfig.findMany({ where: { key: { in: [...PUBLIC_KEYS] } } });
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}
