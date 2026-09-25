import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createSession } from "@/lib/auth";
import { ADMIN_COOKIE } from "@/lib/cookies";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

function cookieHeader(token: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
  }
  const admin = await getDb().adminUser.findUnique({ where: { email: parsed.data.email } });
  const valid = admin !== null && (await bcrypt.compare(parsed.data.password, admin.passwordHash));
  if (!valid || admin === null) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }
  const token = await createSession(admin.id);
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", cookieHeader(token, 7 * 24 * 3600));
  return res;
}
