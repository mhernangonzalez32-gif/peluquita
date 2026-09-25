# apps/api

Servicio HTTP (Hono) para integraciones y webhooks. Hoy expone solo `GET /health`;
los endpoints de producto (Mercado Pago, WhatsApp) llegan en changes posteriores.

## Desarrollo

```bash
pnpm --filter @peluquita/api dev   # tsx watch en http://localhost:3001
```

El puerto se configura con `PORT` (default `3001`).

## Build y deploy

El build empaqueta el servicio con `tsup` en un solo archivo (`dist/index.js`,
dependencias incluidas), por eso la imagen final no necesita `node_modules`:

```bash
pnpm --filter @peluquita/api build
docker build -f apps/api/Dockerfile -t peluquita-api .
docker run --rm -p 3001:3001 -e PORT=3001 peluquita-api
```

La plataforma de deploy (Railway) inyecta `PORT`; el servicio la respeta
automáticamente. Health check: `GET /health` → `{"status":"ok"}`.
La config de Railway vive en `railway.toml` (builder Dockerfile + healthcheck).
