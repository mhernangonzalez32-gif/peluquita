import { getDb } from "@/lib/db";

import { ServicesManager } from "./services-manager";

export default async function AdminServicios() {
  const services = await getDb().service.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Servicios</h1>
      <ServicesManager initial={services} />
    </div>
  );
}
