import { expect, test } from "@playwright/test";

/** Martes propio de este spec (37 días): ver comentario en reservar.spec.ts. */
function tuesdayAhead(): string {
  const d = new Date(Date.now() + 37 * 86400000);
  while (d.getDay() !== 2) d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

test("cancelar un turno libera el hueco en el turnero", async ({ page, request }) => {
  const date = tuesdayAhead();
  const clientName = `E2E Cancel ${Date.now() % 100000}`;
  const phone = `93${Date.now() % 100000000}`;

  const services = (await (await request.get("/api/services")).json()) as Array<{
    id: string;
    name: string;
  }>;
  const serviceId = (services.find((s) => s.name === "Corte") ?? (services[0] as { id: string }))
    .id;
  const slots = (
    (await (await request.get(`/api/availability?date=${date}`)).json()) as {
      slots: string[];
    }
  ).slots;
  const slot = slots[0] as string;
  const created = await request.post("/api/appointments", {
    data: { serviceId, startAt: slot, name: clientName, phone },
  });
  expect(created.status()).toBe(201);

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("admin@peluquita.local");
  await page.getByLabel("Contraseña").fill("peluquita123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/admin(\?|$)/);

  await page.goto(`/admin?fecha=${date}`);
  const row = page.locator("li").filter({ hasText: clientName });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: `Cancelar turno de ${clientName}` }).click();
  await expect(row.getByText("(Cancelado)")).toBeVisible();

  const after = (await (await request.get(`/api/availability?date=${date}`)).json()) as {
    slots: string[];
  };
  expect(after.slots).toContain(slot);
});
