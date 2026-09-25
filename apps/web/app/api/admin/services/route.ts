import { serviceUpsertSchema } from "@peluquita/shared";
import { getDb } from "@/lib/db";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/session";

/** Lista para el panel: GET /api/admin/services */
export async function GET(request: NextRequest) {
  const session = await requireAdmin(request);
  if (session instanceof NextResponse) return session;
  const services = await getDb().service.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(services);
}

/** Crear: POST /api/admin/services */
export async function POST(request: NextRequest) {
  const session = await requireAdmin(request);
  if (session instanceof NextResponse) return session;
  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = serviceUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const created = await getDb().service.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}
