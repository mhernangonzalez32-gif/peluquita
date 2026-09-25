import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, verifySession } from "./auth";

export interface AdminSession {
  adminId: string;
}

/** Sesión del admin o respuesta 401 lista para retornar. */
export async function requireAdmin(request: NextRequest): Promise<AdminSession | NextResponse> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const session = token !== undefined ? await verifySession(token) : null;
  if (session === null) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return session;
}
