import { getDb } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSalonConfig } from "@/lib/config";

const STATUS_LABEL: Record<string, string> = {
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
  COMPLETADO: "Completado",
};

function formatDateTime(iso: string | Date, timeZone: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export default async function AdminClienteDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const config = await getSalonConfig();
  const client = await getDb().client.findUnique({
    where: { id },
    include: { appointments: { orderBy: { startAt: "desc" }, include: { service: true } } },
  });
  if (client === null) notFound();
  return (
    <div>
      <Link href="/admin/clientes" className="underline">
        ← Clientes
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-bold">{client.name}</h1>
      <p className="mb-4 text-neutral-400">{client.phone}</p>
      <h2 className="mb-2 font-semibold">Historial de visitas</h2>
      {client.appointments.length === 0 ? (
        <p>Sin visitas registradas.</p>
      ) : (
        <ul className="flex max-w-2xl flex-col gap-2">
          {client.appointments.map((a) => (
            <li key={a.id} className="rounded-lg border border-neutral-800 px-4 py-2">
              <span>{formatDateTime(a.startAt, config.timeZone)}</span>
              <span className="ml-3">{a.service.name}</span>
              <span className="ml-3 text-neutral-400">({STATUS_LABEL[a.status]})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
