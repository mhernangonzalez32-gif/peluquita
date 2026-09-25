import { getDb } from "@/lib/db";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/session";

/** Listado de clientes: GET /api/admin/clients */
export async function GET(request: NextRequest) {
  const session = await requireAdmin(request);
  if (session instanceof NextResponse) return session;
  const clients = await getDb().client.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { appointments: true } } },
  });
  return NextResponse.json(
    clients.map((c) => ({ id: c.id, name: c.name, phone: c.phone, visits: c._count.appointments })),
  );
}
