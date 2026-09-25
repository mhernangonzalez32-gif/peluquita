import Link from "next/link";

import { LogoutButton } from "./logout-button";

// Las páginas admin consultan la DB y exigen sesión: nunca prerenderizar
// (en build fallaría sin DATABASE_URL y en prod serviría datos congelados).
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <nav className="flex items-center gap-6 border-b border-neutral-800 px-6 py-3">
        <span className="font-bold">peluquita · admin</span>
        <Link href="/admin" className="underline">
          Agenda
        </Link>
        <Link href="/admin/servicios" className="underline">
          Servicios
        </Link>
        <Link href="/admin/clientes" className="underline">
          Clientes
        </Link>
        <span className="ml-auto">
          <LogoutButton />
        </span>
      </nav>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
