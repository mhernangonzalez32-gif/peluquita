import { expect, test } from "@playwright/test";

test("la landing muestra datos del local y navega a reservar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Peluquita" })).toBeVisible();
  await expect(page.getByText("Av. Ficticia 123")).toBeVisible();
  await expect(page.getByText("Mar a Sáb")).toBeVisible();
  await page.getByRole("link", { name: "Reservar Turno" }).click();
  await expect(page).toHaveURL(/\/reservar/);
});
