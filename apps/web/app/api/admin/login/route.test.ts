import { describe, expect, it } from "vitest";

import { POST as login } from "./route.js";
import { POST as logout } from "../logout/route.js";

async function postLogin(body: unknown): Promise<Response> {
  return login(
    new Request("http://localhost/api/admin/login", { method: "POST", body: JSON.stringify(body) }),
  );
}

describe("POST /api/admin/login", () => {
  it("credenciales válidas crean sesión (cookie httpOnly)", async () => {
    const res = await postLogin({ email: "admin@peluquita.local", password: "peluquita123" });
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("peluquita_admin=");
    expect(cookie).toContain("HttpOnly");
  });

  it("credenciales inválidas con 401 sin cookie", async () => {
    const res = await postLogin({ email: "admin@peluquita.local", password: "incorrecta" });
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("payload inválido con 400", async () => {
    const res = await postLogin({ email: "no-email", password: "" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/admin/logout", () => {
  it("limpia la cookie de sesión", async () => {
    const res = await logout();
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie") ?? "").toContain("Max-Age=0");
  });
});
