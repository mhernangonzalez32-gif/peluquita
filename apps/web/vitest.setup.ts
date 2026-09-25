// Carga el .env de la raíz del repo para los tests (Vitest no levanta
// variables de entorno por sí solo). No pisa variables ya definidas.
import { config } from "dotenv";

config({ path: new URL("../../.env", import.meta.url) });
