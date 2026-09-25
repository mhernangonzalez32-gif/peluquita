import { dayRangeUtc } from "@peluquita/shared";
import Link from "next/link";

import { getSalonConfig } from "@/lib/config";
import { getDb } from "@/lib/db";
import { requireAdminPage } from "@/lib/session";
import { AgendaButtons } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
  COMPLETADO: "Completado",
};

function todayBA(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shiftDay(dateISO: string, delta: number): string {
  const d = new Date(`${dateISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function formatTime(iso: string | Date, timeZone: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export default async function AdminAgenda({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha } = await searchParams;
  await requireAdminPage();
  const config = await getSalonConfig();
  const day =
    fecha !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : todayBA(config.timeZone);
  const range = dayRangeUtc(day, config.timeZone);
  const appointments =
    range === null
      ? []
      : await getDb().appointment.findMany({
          where: { startAt: { gte: new Date(range.startISO), lt: new Date(range.endISO) } },
          orderBy: { startAt: "asc" },
          include: { client: true, service: true },
        });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Agenda del {day}</h1>
      <nav className="mb-4 flex gap-3" aria-label="Navegar días">
        <Link href={`/admin?fecha=${shiftDay(day, -1)}`} className="underline">
          Anterior
        </Link>
        <Link href="/admin" className="underline">
          Hoy
        </Link>
        <Link href={`/admin?fecha=${shiftDay(day, 1)}`} className="underline">
          Siguiente
        </Link>
      </nav>
      {appointments.length === 0 ? (
        <p>Sin turnos este día.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {appointments.map((a) => {
            const time = formatTime(a.startAt, config.timeZone);
            return (
              <li key={a.id} className="rounded-lg border border-neutral-800 px-4 py-3">
                <span className="font-medium">{time}</span>
                <span className="ml-3">{a.client.name}</span>
                <span className="ml-3 text-neutral-400">{a.service.name}</span>
                <span className="ml-3 text-neutral-400">({STATUS_LABEL[a.status]})</span>
                {a.status === "CONFIRMADO" && (
                  <span className="ml-3">
                    <AgendaButtons id={a.id} clientName={a.client.name} time={time} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
