import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Singleton de PrismaClient para el runtime de Next.js.
 * IMPORTANTE: vive acá (y no en @peluquita/db) porque Next debe resolver
 * `@prisma/client` como dependencia DIRECTA de la app; la importación
 * transitiva a través del barrel del workspace rompe la carga del
 * query engine nativo en dev y en build.
 */
export function getDb(): PrismaClient {
  globalForPrisma.prisma ??= new PrismaClient();
  return globalForPrisma.prisma;
}
