import Wizard from "./wizard";

export default function ReservarPage() {
  return (
    <main className="flex min-h-screen flex-col bg-neutral-950 px-6 py-10 text-neutral-50">
      <h1 className="mx-auto mb-6 w-full max-w-xl text-2xl font-bold">Reservar Turno</h1>
      <Wizard />
    </main>
  );
}
