import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE } from "./src/lib/cookies";

/**
 * Guardia liviana para Edge: solo verifica PRESENCIA de la cookie de sesión.
 * La verificación criptográfica real ocurre en cada página (requireAdminPage)
 * y ruta API (requireAdmin), que corren en Node y sí pueden importar jose.
 */
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }
  if (request.cookies.get(ADMIN_COOKIE)?.value === undefined) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
