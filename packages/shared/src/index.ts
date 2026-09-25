/**
 * Convierte un texto en slug apto para URLs
 * (nombres de servicios, profesionales, negocios).
 */

// Rango de marcas diacríticas combinantes (Unicode U+0300–U+036F).
// Se construye por code points para no depender de escapes en el fuente.
const DIACRITICS = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  "g",
);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Payload canónico de las rutas de health (`/api/health` en web, `/health` en api).
 */
export function healthPayload(): { status: "ok" } {
  return { status: "ok" };
}
