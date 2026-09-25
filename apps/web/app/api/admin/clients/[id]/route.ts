import { getDb } from "@/lib/db";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/session";

/** Ficha con historial: GET /api/admin/clients/:id */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(request);
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const client = await getDb().client.findUnique({
    where: { id },
    include: { appointments: { orderBy: { startAt: "desc" }, include: { service: true } } },
  });
  if (client === null) {
    return NextResponse.json({ error: "Cliente inexistente" }, { status: 404 });
  }
  return NextResponse.json({
    id: client.id,
    name: client.name,
    phone: client.phone,
    history: client.appointments.map((a) => ({
      id: a.id,
      startAt: a.startAt,
      status: a.status,
      service: { id: a.service.id, name: a.service.name },
    })),
  });
}
