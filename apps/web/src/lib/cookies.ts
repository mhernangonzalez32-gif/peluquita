// Constantes de cookies SIN dependencias: seguro para importar desde el
// middleware (Edge Runtime). NO agregar acá imports con crypto (jose) ni
// de Node: rompería el build de Vercel ("A Node.js API is used").
export const ADMIN_COOKIE = "peluquita_admin";
