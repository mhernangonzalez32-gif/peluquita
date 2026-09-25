import { serve } from "@hono/node-server";
import { healthPayload } from "@peluquita/shared";
import { Hono } from "hono";

export const app = new Hono();

app.get("/health", (c) => {
  return c.json(healthPayload());
});

const port = Number(process.env.PORT ?? 3001);

// No arrancar el servidor al importar el módulo desde los tests (Vitest
// define VITEST=true). En dev/prod el módulo es el entrypoint y sirve.
if (!process.env.VITEST) {
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`api escuchando en http://localhost:${info.port}`);
  });
}
