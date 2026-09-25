import { expect, test } from "@playwright/test";

test("la landing renderiza el nombre del producto", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "peluquita" })).toBeVisible();
});
