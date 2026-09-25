import { describe, expect, it } from "vitest";

import { createSession } from "./auth.js";
import { requireAdminPage } from "./session.js";

describe("requireAdminPage", () => {
  it("token válido devuelve la sesión", async () => {
    const token = await createSession("admin-test");
    await expect(requireAdminPage(token)).resolves.toEqual({ adminId: "admin-test" });
  });

  it("token inválido redirige al login", async () => {
    await expect(requireAdminPage("invalido")).rejects.toThrow("NEXT_REDIRECT");
  });
});
