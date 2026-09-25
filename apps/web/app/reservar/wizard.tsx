"use client";

import { useEffect, useState } from "react";

interface Service {
  id: string;
  name: string;
  price: number;
  durationMin: number;
}

function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatSlot(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function Wizard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState(todayLocalISO());
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((body: Service[]) => setServices(body))
      .catch(() => setError("No se pudieron cargar los servicios"));
    fetch("/api/config")
      .then((r) => r.json())
      .then((body: Record<string, string>) => setWhatsapp(body["SALON_WHATSAPP"] ?? ""))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (step !== 2 || service === null) return;
    setSlots([]);
    setSlot(null);
    fetch(`/api/availability?date=${date}`)
      .then((r) => r.json())
      .then((body: { slots: string[] }) => setSlots(body.slots))
      .catch(() => setError("No se pudo cargar la disponibilidad"));
  }, [step, service, date]);

  async function confirm(): Promise<void> {
    if (service === null || slot === null) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, startAt: slot, name, phone }),
      });
      if (res.status === 409) {
        setError("Ese hueco se acaba de ocupar. Elegí otro horario.");
        setStep(2);
        return;
      }
      if (!res.ok) {
        setError("Revisá los datos e intentá de nuevo.");
        return;
      }
      setStep(4);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const waHref =
    service !== null && slot !== null && whatsapp !== ""
      ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
          `Hola, acabo de reservar un turno para ${service.name} el ${formatDate(date)} a las ${formatSlot(slot)} hs`,
        )}`
      : null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      {step === 1 && (
        <section aria-label="Paso 1: servicio">
          <h2 className="mb-3 text-xl font-semibold">1. Elegí el servicio</h2>
          <ul className="flex flex-col gap-2">
            {services.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setService(s);
                    setStep(2);
                  }}
                  className="w-full rounded-lg border border-neutral-700 px-4 py-3 text-left hover:border-emerald-400"
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-3 text-neutral-400">
                    ${s.price} · {s.durationMin} min
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {error !== "" && <p role="alert">{error}</p>}
        </section>
      )}

      {step === 2 && service !== null && (
        <section aria-label="Paso 2: fecha y hora">
          <h2 className="mb-3 text-xl font-semibold">2. Elegí fecha y hora para {service.name}</h2>
          <label className="mb-3 block">
            Fecha
            <input
              type="date"
              value={date}
              min={todayLocalISO()}
              onChange={(e) => setDate(e.target.value)}
              className="ml-2 rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
            />
          </label>
          {slots.length === 0 ? (
            <p>Sin turnos ese día (el local atiende de martes a sábado).</p>
          ) : (
            <ul className="grid grid-cols-4 gap-2">
              {slots.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => {
                      setSlot(s);
                      setStep(3);
                    }}
                    className="w-full rounded-lg border border-neutral-700 px-2 py-2 hover:border-emerald-400"
                  >
                    {formatSlot(s)}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => setStep(1)} className="mt-4 underline">
            Volver
          </button>
        </section>
      )}

      {step === 3 && service !== null && slot !== null && (
        <section aria-label="Paso 3: datos">
          <h2 className="mb-3 text-xl font-semibold">3. Tus datos</h2>
          <p className="mb-3 text-neutral-300">
            {service.name} · {formatDate(date)} · {formatSlot(slot)} hs
          </p>
          <label className="mb-2 block">
            Nombre
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="ml-2 rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
            />
          </label>
          <label className="mb-3 block">
            Teléfono / WhatsApp
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              className="ml-2 rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
            />
          </label>
          {error !== "" && <p role="alert">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="underline">
              Volver
            </button>
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={loading}
              className="rounded-full bg-emerald-500 px-6 py-2 font-semibold text-neutral-950 disabled:opacity-50"
            >
              Confirmar turno
            </button>
          </div>
        </section>
      )}

      {step === 4 && service !== null && slot !== null && (
        <section aria-label="Reserva confirmada">
          <h2 className="mb-3 text-xl font-semibold">¡Turno confirmado!</h2>
          <p className="mb-4 text-neutral-300">
            {service.name} · {formatDate(date)} · {formatSlot(slot)} hs · {name}
          </p>
          {waHref !== null && (
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-emerald-500 px-6 py-2 font-semibold text-neutral-950"
            >
              Confirmar por WhatsApp
            </a>
          )}
        </section>
      )}
    </div>
  );
}
