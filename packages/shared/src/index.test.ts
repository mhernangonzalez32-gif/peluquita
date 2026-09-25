import { describe, expect, it } from "vitest";

import { healthPayload, slugify } from "./index.js";

describe("slugify", () => {
  it("convierte un nombre con acentos y espacios en slug", () => {
    expect(slugify("Corte Clásico de Caballero")).toBe("corte-clasico-de-caballero");
  });

  it("colapsa separadores repetidos y bordes", () => {
    expect(slugify("  Color / Mechas  ")).toBe("color-mechas");
  });
});

describe("healthPayload", () => {
  it("devuelve status ok", () => {
    expect(healthPayload()).toEqual({ status: "ok" });
  });
});
