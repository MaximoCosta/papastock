# PapaStock

Aplicación full-stack de Papasud para movimientos de stock asistidos, trazabilidad, bloqueo de operaciones inseguras y preparación documental de exportación.

## Arquitectura

Un único servicio Node/TypeScript expone la API y sirve la SPA React/Vite. El navegador nunca recibe `DATABASE_URL` ni `GROQ_API_KEY`.

```text
Navegador React
      │ /api + assets
      ▼
Render Web Service (Express)
      ├── pg.Pool ──► Render PostgreSQL
      └── HTTPS ────► Groq Structured Outputs
```

Si `/api/snapshot` falla, el frontend carga un snapshot mock completo y lo identifica visualmente. Groq solo propone análisis: cualquier error, timeout o respuesta inválida activa la heurística server-side; nunca autoriza operaciones ni escribe datos.

## Desarrollo

Requiere Node 22+ y una base PostgreSQL accesible (no requiere Docker).

```bash
npm install
copy .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

`npm run dev` levanta Express y Vite en `http://localhost:3000`. Sin `DATABASE_URL`, la API de datos devuelve indisponibilidad y la UI usa el fallback mock. Para forzarlo, usar `VITE_DATA_SOURCE=mock`.

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
- `src/repositories/`: cliente HTTP con fallback atómico al mock.
- `src/lib/`: validaciones determinísticas de despacho/exportación.
- `src/services/aiService.ts`: adaptador browser a `/api/ai/discrepancy` y helpers locales N03.
- `src/services/movementService.ts`: interpretación, preview y confirmación separada del flujo N01.
- `render.yaml`: Web Service + Managed PostgreSQL.
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
