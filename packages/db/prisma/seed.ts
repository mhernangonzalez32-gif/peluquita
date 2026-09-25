// Seed inicial del MVP: admin, config del local y servicios de ejemplo.
// Uso: `pnpm db:seed` (corre desde la raíz, levanta .env con dotenv).
// En producción exige ADMIN_EMAIL/ADMIN_PASSWORD por env; en dev usa
// los valores documentados con un aviso bien visible.
import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DEV_EMAIL = "admin@peluquita.local";
const DEV_PASSWORD = "peluquita123";

function credentials(): { email: string; password: string } {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) return { email, password };
  if (process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT) {
    throw new Error("db:seed: en producción definí ADMIN_EMAIL y ADMIN_PASSWORD por env");
  }
  console.warn("db:seed: sin ADMIN_EMAIL/ADMIN_PASSWORD, uso credenciales de desarrollo");
  return { email: DEV_EMAIL, password: DEV_PASSWORD };
}

const CONFIG: Array<[string, string]> = [
  ["SALON_NOMBRE", "Peluquita"],
  ["SALON_DIRECCION", "Av. Ficticia 123, CABA"],
  ["SALON_HORARIO_TEXTO", "Mar a Sáb de 9 a 21"],
  // Ficticio: reemplazar por el real del local.
  ["SALON_WHATSAPP", "5491100000000"],
  // Días JS (0=dom): mar–sáb.
  ["AGENDA_DIAS", "[2,3,4,5,6]"],
  // Minutos desde medianoche (hora local America/Argentina/Buenos_Aires).
  ["AGENDA_APERTURA_MIN", "540"],
  ["AGENDA_CIERRE_MIN", "1260"],
  ["AGENDA_BREAK_INICIO_MIN", "780"],
  ["AGENDA_BREAK_MIN", "45"],
  ["AGENDA_BLOQUE_MIN", "35"],
  ["AGENDA_TZ", "America/Argentina/Buenos_Aires"],
];

const SERVICES = [
  { name: "Corte", price: 15000, durationMin: 35 },
  { name: "Barba", price: 8000, durationMin: 20 },
  { name: "Corte + Barba", price: 20000, durationMin: 50 },
];

async function main(): Promise<void> {
  const { email, password } = credentials();
  const passwordHash = await bcrypt.hash(password, 10);
  await db.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  for (const [key, value] of CONFIG) {
    await db.systemConfig.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  for (const s of SERVICES) {
    const existing = await db.service.findFirst({ where: { name: s.name } });
    if (!existing) await db.service.create({ data: s });
  }

  const counts = {
    admins: await db.adminUser.count(),
    config: await db.systemConfig.count(),
    services: await db.service.count(),
  };
  console.log(`db:seed: listo ${JSON.stringify(counts)}`);
}

await main()
  .catch((error: unknown) => {
    console.error("db:seed: FAILED", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
