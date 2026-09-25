"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AgendaButtons({
  id,
  clientName,
  time,
}: {
  id: string;
  clientName: string;
  time: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function change(status: "CANCELADO" | "COMPLETADO"): Promise<void> {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setError("No se pudo actualizar.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Cancelar turno de ${clientName} ${time}`}
        disabled={busy}
        onClick={() => void change("CANCELADO")}
        className="underline disabled:opacity-50"
      >
        Cancelar
      </button>
      <button
        type="button"
        aria-label={`Completar turno de ${clientName} ${time}`}
        disabled={busy}
        onClick={() => void change("COMPLETADO")}
        className="underline disabled:opacity-50"
      >
        Completar
      </button>
      {error !== "" && <span role="alert">{error}</span>}
    </span>
  );
}
