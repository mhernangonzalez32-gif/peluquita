import { getDb } from "@/lib/db";
import { cache } from "react";

export interface SalonConfig {
  nombre: string;
  direccion: string;
  horarioTexto: string;
  whatsapp: string;
  days: number[];
  openMin: number;
  closeMin: number;
  breakStartMin: number;
  breakMin: number;
  slotMin: number;
  timeZone: string;
}

const DEFAULTS: SalonConfig = {
  nombre: "peluquita",
  direccion: "",
  horarioTexto: "",
  whatsapp: "",
  days: [2, 3, 4, 5, 6],
  openMin: 540,
  closeMin: 1260,
  breakStartMin: 780,
  breakMin: 45,
  slotMin: 35,
  timeZone: "America/Argentina/Buenos_Aires",
};

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Config del local desde SystemConfig, con defaults si la DB no responde. */
export const getSalonConfig = cache(async (): Promise<SalonConfig> => {
  try {
    const rows = await getDb().systemConfig.findMany();
    const cfg = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    let days = DEFAULTS.days;
    try {
      const parsed: unknown = JSON.parse(cfg["AGENDA_DIAS"] ?? "");
      if (Array.isArray(parsed) && parsed.every((d) => typeof d === "number")) days = parsed;
    } catch {
      // conserva default
    }
    return {
      nombre: cfg["SALON_NOMBRE"] ?? DEFAULTS.nombre,
      direccion: cfg["SALON_DIRECCION"] ?? DEFAULTS.direccion,
      horarioTexto: cfg["SALON_HORARIO_TEXTO"] ?? DEFAULTS.horarioTexto,
      whatsapp: cfg["SALON_WHATSAPP"] ?? DEFAULTS.whatsapp,
      days,
      openMin: num(cfg["AGENDA_APERTURA_MIN"], DEFAULTS.openMin),
      closeMin: num(cfg["AGENDA_CIERRE_MIN"], DEFAULTS.closeMin),
      breakStartMin: num(cfg["AGENDA_BREAK_INICIO_MIN"], DEFAULTS.breakStartMin),
      breakMin: num(cfg["AGENDA_BREAK_MIN"], DEFAULTS.breakMin),
      slotMin: num(cfg["AGENDA_BLOQUE_MIN"], DEFAULTS.slotMin),
      timeZone: cfg["AGENDA_TZ"] ?? DEFAULTS.timeZone,
    };
  } catch {
    return DEFAULTS;
  }
});
