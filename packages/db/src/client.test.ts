import { afterAll, describe, expect, it } from "vitest";

import { getDb } from "./client.js";

describe("db smoke", () => {
  it("escribe y lee una fila SystemConfig", async () => {
    const db = getDb();
    const key = `smoke-${Date.now()}`;
    await db.systemConfig.create({ data: { key, value: "ok" } });
    const row = await db.systemConfig.findUniqueOrThrow({ where: { key } });
    expect(row.value).toBe("ok");
    await db.systemConfig.delete({ where: { key } });
  });

  afterAll(async () => {
    await getDb().$disconnect();
  });
});
