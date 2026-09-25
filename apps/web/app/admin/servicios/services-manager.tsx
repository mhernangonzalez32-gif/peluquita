"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Service {
  id: string;
  name: string;
  price: number;
  durationMin: number;
}

export function ServicesManager({ initial }: { initial: Service[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [durationMin, setDurationMin] = useState("35");
  const [editing, setEditing] = useState<Service | null>(null);
  const [error, setError] = useState("");

  async function request(url: string, method: string, body?: unknown): Promise<boolean> {
    setError("");
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Operación fallida.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Error de conexión.");
      return false;
    }
  }

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const body = { name, price: Number(price), durationMin: Number(durationMin) };
    const ok = editing
      ? await request(`/api/admin/services/${editing.id}`, "PATCH", body)
      : await request("/api/admin/services", "POST", body);
    if (ok) {
      setName("");
      setPrice("");
      setDurationMin("35");
      setEditing(null);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <form
        onSubmit={(e) => void submit(e)}
        className="flex flex-col gap-2 rounded-lg border border-neutral-800 p-4"
      >
        <h2 className="font-semibold">{editing ? "Editar servicio" : "Nuevo servicio"}</h2>
        <label className="flex flex-col gap-1">
          Nombre
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          Precio ($)
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="numeric"
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          Duración (min)
          <input
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            inputMode="numeric"
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
          />
        </label>
        {error !== "" && <p role="alert">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-full bg-emerald-500 px-5 py-1 font-semibold text-neutral-950"
          >
            Guardar
          </button>
          {editing !== null && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setName("");
                setPrice("");
                setDurationMin("35");
              }}
              className="underline"
            >
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <ul className="flex flex-col gap-2">
        {initial.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-3 rounded-lg border border-neutral-800 px-4 py-2"
          >
            <span className="font-medium">{s.name}</span>
            <span className="text-neutral-400">
              ${s.price} · {s.durationMin} min
            </span>
            <span className="ml-auto flex gap-2">
              <button
                type="button"
                aria-label={`Editar ${s.name}`}
                onClick={() => {
                  setEditing(s);
                  setName(s.name);
                  setPrice(String(s.price));
                  setDurationMin(String(s.durationMin));
                }}
                className="underline"
              >
                Editar
              </button>
              <button
                type="button"
                aria-label={`Eliminar ${s.name}`}
                onClick={() =>
                  void request(`/api/admin/services/${s.id}`, "DELETE").then(() => undefined)
                }
                className="underline"
              >
                Eliminar
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
