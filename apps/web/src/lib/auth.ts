import { jwtVerify, SignJWT } from "jose";

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 16) return new TextEncoder().encode(value);
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET requerido en producción");
  }
  return new TextEncoder().encode("dev-secret-cambiar-en-produccion");
}

export async function createSession(adminId: string): Promise<string> {
  return new SignJWT({ adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySession(token: string): Promise<{ adminId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload["adminId"] === "string" ? { adminId: payload["adminId"] } : null;
  } catch {
    return null;
  }
}
