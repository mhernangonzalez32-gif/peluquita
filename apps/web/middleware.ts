import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, verifySession } from "./src/lib/auth";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const session = token !== undefined ? await verifySession(token) : null;
  if (session === null) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
