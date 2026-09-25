import { getDb } from "@/lib/db";
import { requireAdminPage } from "@/lib/session";
import Link from "next/link";

export default async function AdminClientes() {
  await requireAdminPage();
  const clients = await getDb().client.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { appointments: true } } },
  });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Clientes</h1>
      {clients.length === 0 ? (
        <p>Todavía no hay clientes. Aparecen solos con cada reserva.</p>
      ) : (
        <ul className="flex max-w-2xl flex-col gap-2">
          {clients.map((c) => (
            <li key={c.id} className="rounded-lg border border-neutral-800 px-4 py-2">
              <Link href={`/admin/clientes/${c.id}`} className="font-medium underline">
                {c.name}
              </Link>
              <span className="ml-3 text-neutral-400">{c.phone}</span>
              <span className="ml-3 text-neutral-400">({c._count.appointments} visitas)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
