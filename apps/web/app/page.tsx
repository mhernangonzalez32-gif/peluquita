import Link from "next/link";

import { getSalonConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function Home() {
  const config = await getSalonConfig();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 px-6 text-center text-neutral-50">
      <h1 className="text-4xl font-bold tracking-tight">{config.nombre}</h1>
      {config.direccion !== "" && <p className="text-lg text-neutral-300">{config.direccion}</p>}
      {config.horarioTexto !== "" && <p className="text-neutral-400">{config.horarioTexto}</p>}
      <Link
        href="/reservar"
        className="mt-4 rounded-full bg-emerald-500 px-8 py-3 text-lg font-semibold text-neutral-950 hover:bg-emerald-400"
      >
        Reservar Turno
      </Link>
    </main>
  );
}
