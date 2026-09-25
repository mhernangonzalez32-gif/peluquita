import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";
import path from "node:path";

// El .env vive en la raíz del monorepo (una sola fuente); Next solo mira
// el suyo propio, así que se carga acá con ruta absoluta al archivo.
// Sin .env (CI/Vercel/Docker) es no-op y mandan las variables de entorno.
loadEnv({ path: path.join(import.meta.dirname, "..", "..", ".env") });

// standalone SOLO con NEXT_STANDALONE=1 (build de Docker en Linux).
// El trazado standalone crea symlinks y falla con EPERM en Windows sin
// Modo Desarrollador: el build local y Vercel usan el modo clásico.
const nextConfig: NextConfig = {
  ...(process.env.NEXT_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  // Prisma trae binario nativo (query engine): fuera del bundle para que
  // cargue desde node_modules (la importación transitiva vía barrel del
  // workspace rompe la carga del engine en dev y en build).
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
