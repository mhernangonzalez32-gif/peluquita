import { expect, test } from "@playwright/test";

test("GET /api/health responde status ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  await expect(res.json()).resolves.toEqual({ status: "ok" });
});

test("GET /health de la api responde status ok", async ({ request }) => {
  const res = await request.get("http://localhost:3001/health");
  expect(res.status()).toBe(200);
  await expect(res.json()).resolves.toEqual({ status: "ok" });
});
