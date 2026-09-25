import { expect, test } from "@playwright/test";

/**
 * Martes propio de este spec (44+ días): cada spec e2e usa su propio martes
 * porque Playwright corre los archivos en paralelo y compartir día genera
 * interferencia entre bookings.
 */
function tuesdayAhead(): string {
  const d = new Date(Date.now() + 44 * 86400000);
  while (d.getDay() !== 2) d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

test("flujo completo de reserva con confirmación por WhatsApp", async ({ page }) => {
  await page.goto("/reservar");
  await page.getByRole("button", { name: /Corte/ }).first().click();
  await page.getByRole("textbox", { name: "Fecha" }).fill(tuesdayAhead());
  await page
    .getByRole("button", { name: /^\d{2}:\d{2}$/ })
    .first()
    .click();
  await page.getByLabel("Nombre").fill("E2E Cliente");
  await page.getByLabel("Teléfono / WhatsApp").fill(`90${Date.now() % 100000000}`);
  await page.getByRole("button", { name: "Confirmar turno" }).click();

  await expect(page.getByRole("heading", { name: "¡Turno confirmado!" })).toBeVisible();
  const wa = page.getByRole("link", { name: "Confirmar por WhatsApp" });
  await expect(wa).toBeVisible();
  const href = await wa.getAttribute("href");
  expect(href).toContain("wa.me/5491100000000");
  expect(href).toContain("Corte");
});
