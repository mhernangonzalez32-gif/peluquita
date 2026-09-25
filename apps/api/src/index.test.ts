import { describe, expect, it } from "vitest";

import { app } from "./index.js";

describe("GET /health", () => {
  it("responde 200 con status ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });
});
