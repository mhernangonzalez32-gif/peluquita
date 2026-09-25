import { expect, test } from "@playwright/test";

test("sin sesión, /admin redirige al login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Acceso administrador" })).toBeVisible();
});
