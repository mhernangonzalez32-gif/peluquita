import { getDb } from "@/lib/db";
import { requireAdminPage } from "@/lib/session";

import { ServicesManager } from "./services-manager";

export default async function AdminServicios() {
  await requireAdminPage();
  const services = await getDb().service.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Servicios</h1>
      <ServicesManager initial={services} />
    </div>
  );
}
