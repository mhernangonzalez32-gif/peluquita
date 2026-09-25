import { z } from "zod";

/**
 * Normaliza un teléfono a solo dígitos para usarlo como identificador único.
 * No valida prefijos de país: eso lo hace `phoneSchema` por longitud.
 */
export function normalizePhone(input: string): string {
  return input.replace(/[^0-9]/g, "");
}

export const phoneSchema = z
  .string()
  .regex(/^[0-9]{8,15}$/, "Teléfono inválido: usá solo dígitos (8 a 15)");

export const createAppointmentSchema = z.object({
  serviceId: z.string().min(1, "Servicio requerido"),
  startAt: z.string().datetime({ offset: true, message: "Fecha/hora inválida (ISO con offset)" }),
  name: z.string().trim().min(1, "Nombre requerido").max(120),
  phone: phoneSchema,
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["CONFIRMADO", "CANCELADO", "COMPLETADO"]),
});

export const serviceUpsertSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(120),
  price: z.number().int().nonnegative("Precio inválido"),
  durationMin: z.number().int().positive("Duración inválida"),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type ServiceUpsertInput = z.infer<typeof serviceUpsertSchema>;
