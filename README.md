# PapaStock

Aplicación full-stack de Papasud para movimientos de stock asistidos, trazabilidad, bloqueo de operaciones inseguras y preparación documental de exportación.

## Arquitectura

Un único servicio Node/TypeScript expone toda la API y sirve la SPA React/Vite. En producción, Express es siempre el backend same-origin autoritativo. `VITE_API_BASE_URL` permite probar un backend alternativo únicamente en desarrollo. El navegador nunca recibe secretos server-side.

```text
Navegador React
      │ /api + assets
      ▼
Render Web Service (Express)
      ├── pg.Pool ──► Render PostgreSQL
      └── HTTPS ────► Groq Structured Outputs
```

Si `/api/snapshot` falla, el frontend muestra la fuente como no disponible y no sustituye datos reales por mock. El dataset demo sólo se activa explícitamente con `VITE_DATA_SOURCE=mock`. Groq solo propone análisis: cualquier error, timeout o respuesta inválida activa la heurística server-side; nunca autoriza operaciones ni escribe datos.

## Desarrollo

Requiere Node 22+ y una base PostgreSQL accesible (no requiere Docker).

```bash
npm install
copy .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

`npm run dev` levanta Express y Vite en `http://localhost:3000`. Copiá `.env.example` a `.env`. Sin override, todo `/api` queda en Express. En desarrollo se puede definir `VITE_API_BASE_URL` como opt-in para probar otro backend; producción ignora esa variable. Para activar el dataset demo: `VITE_DATA_SOURCE=mock`.

En **Stock → Movimientos** está el botón para importar la planilla operativa de Papasud (`.xls`/`.xlsx`). El backend parsea, muestra un preview y recién escribe en PostgreSQL cuando el operador confirma. No modifica los lotes de demo A-204 / A-310 / C-102 / F-301.

## Comandos

```bash
npm run check
npm test
npm run build
npm start
npm run db:migrate
npm run db:seed
```

El seed es idempotente pero deliberadamente manual. Conserva A-204 con 25.000/24.000 kg, A-310 y el movimiento pendiente MV-1032.

## Estructura

- `server/`: Express, acceso PostgreSQL, Groq y heurística canónica.
- `migrations/`: esquema versionado y seed separado.
- `src/repositories/`: cliente HTTP con modos `database`, `mock` explícito y `unavailable`.
- `src/lib/`: validaciones determinísticas de despacho/exportación.
- `src/services/aiService.ts`: adaptador browser a `/api/ai/discrepancy` y helpers locales N03.
- `src/services/movementService.ts`: interpretación, preview y confirmación separada del flujo N01.
- `render.yaml`: Web Service + Managed PostgreSQL.
- `AGENTS.md`: reglas globales del proyecto para agentes y contribuciones.
- `docs/PROJECT_CONTEXT.md`: documento maestro (arquitectura, endpoints, schema, estado real de N01/N02/N03, pendientes).
- `docs/DEMO.md`: guía de presentación y plan B.
- `docs/render-deploy.md`: despliegue y operación.

## Persistencia actual

Los movimientos N01 y la trazabilidad confirmada por el operador se persisten en PostgreSQL. Un movimiento se interpreta primero, se valida sin escritura y solo después de una confirmación humana se ejecuta en una transacción que registra el movimiento y actualiza origen/destino.

Los documentos generados siguen en `sessionStorage`; el despacho continúa siendo una validación determinística sin escritura, por diseño de la demo.

## Movimiento por texto (N01)

En `/movements/new`, por ejemplo:

```text
Mové 500 kg del lote A-310 del Frigorífico Central al Galpón Principal.
```

Groq —o el parser local de respaldo— solo produce una intención estructurada. El backend vuelve a validar lote, ubicaciones, cantidad, stock verificado y discrepancias. `POST /api/movements` repite esa validación con las filas bloqueadas y ejecuta `UPDATE origen + UPSERT destino + INSERT movement` dentro de `BEGIN/COMMIT`.
