"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError("Email o contraseña incorrectos.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 px-6 text-neutral-50">
      <h1 className="text-2xl font-bold">Acceso administrador</h1>
      <form onSubmit={(e) => void submit(e)} className="flex w-full max-w-xs flex-col gap-3">
        <label className="flex flex-col gap-1">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
          />
        </label>
        {error !== "" && <p role="alert">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-emerald-500 px-6 py-2 font-semibold text-neutral-950 disabled:opacity-50"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
