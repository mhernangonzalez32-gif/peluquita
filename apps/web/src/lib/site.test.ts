import { describe, expect, it } from "vitest";

import { SITE_NAME } from "./site.js";

describe("site", () => {
  it("expone el nombre del sitio", () => {
    expect(SITE_NAME).toBe("peluquita");
  });
});
