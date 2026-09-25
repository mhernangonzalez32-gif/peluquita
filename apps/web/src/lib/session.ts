import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";

import { verifySession } from "./auth";
import { ADMIN_COOKIE } from "./cookies";

export interface AdminSession {
  adminId: string;
}

/** Sesión del admin o respuesta 401 lista para retornar (rutas API, runtime Node). */
export async function requireAdmin(request: NextRequest): Promise<AdminSession | NextResponse> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const session = token !== undefined ? await verifySession(token) : null;
  if (session === null) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return session;
}

/**
 * Guardia para páginas admin (Server Components, runtime Node): verifica la
 * firma del JWT y redirige al login si es inválida. El middleware solo revisa
 * presencia de cookie (Edge no puede importar crypto pesada como jose).
 */
export async function requireAdminPage(token?: string): Promise<AdminSession> {
  const value = token ?? (await cookies()).get(ADMIN_COOKIE)?.value;
  const session = value !== undefined ? await verifySession(value) : null;
  if (session === null) redirect("/admin/login");
  return session;
}
