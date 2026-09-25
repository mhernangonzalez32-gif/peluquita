import { describe, expect, it } from "vitest";

import {
  createAppointmentSchema,
  normalizePhone,
  phoneSchema,
  serviceUpsertSchema,
  updateAppointmentStatusSchema,
} from "./validation.js";

describe("normalizePhone", () => {
  it("deja solo dígitos", () => {
    expect(normalizePhone("+54 9 11 1234-5678")).toBe("5491112345678");
  });
});

describe("phoneSchema", () => {
  it("acepta dígitos de 8 a 15", () => {
    expect(phoneSchema.safeParse("1100000000").success).toBe(true);
  });

  it("rechaza letras y longitudes fuera de rango", () => {
    expect(phoneSchema.safeParse("abc").success).toBe(false);
    expect(phoneSchema.safeParse("1234567").success).toBe(false);
  });
});

describe("createAppointmentSchema", () => {
  it("acepta un payload válido", () => {
    const result = createAppointmentSchema.safeParse({
      serviceId: "svc-1",
      startAt: "2026-09-29T12:00:00.000Z",
      name: "Juan",
      phone: "1100000000",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza nombre vacío y fecha sin offset", () => {
    const result = createAppointmentSchema.safeParse({
      serviceId: "svc-1",
      startAt: "2026-09-29 12:00",
      name: "  ",
      phone: "1100000000",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateAppointmentStatusSchema", () => {
  it("acepta los tres estados", () => {
    for (const status of ["CONFIRMADO", "CANCELADO", "COMPLETADO"] as const) {
      expect(updateAppointmentStatusSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it("rechaza PENDIENTE", () => {
    expect(updateAppointmentStatusSchema.safeParse({ status: "PENDIENTE" }).success).toBe(false);
  });
});

describe("serviceUpsertSchema", () => {
  it("acepta servicio válido y rechaza precio negativo", () => {
    expect(
      serviceUpsertSchema.safeParse({ name: "Corte", price: 15000, durationMin: 35 }).success,
    ).toBe(true);
    expect(
      serviceUpsertSchema.safeParse({ name: "Corte", price: -1, durationMin: 35 }).success,
    ).toBe(false);
  });
});
