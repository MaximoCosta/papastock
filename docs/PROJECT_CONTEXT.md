# PapaStock — Project Context

Documento maestro del proyecto. Escrito a partir del **estado real del
repositorio** y de la **base de datos de demo en producción**, verificados el
2026-08-22 (commit `ad6e7e1`, rama `main`).

Cuando este documento y una conversación previa se contradigan, gana el código.
Cuando el código y este documento se contradigan, actualizá este documento.

---

## 1. Hackathon

Papasud es una empresa de producción y comercialización de papa/semilla de papa
en Balcarce, Buenos Aires, Argentina, con exportación a mercados como Brasil.

Problema operativo:

- aproximadamente **150 lotes** activos por campaña;
- **3 frigoríficos + 1 galpón** como ubicaciones físicas;
- stock históricamente manejado en **planillas** dispersas;
- las **discrepancias se descubren tarde**, muchas veces recién al preparar un
  despacho o la documentación de exportación;
- la trazabilidad y la documentación se reconstruyen a mano.

El dataset de demo del repositorio es una reducción deliberada: **4 ubicaciones
reales del dominio** (Frigorífico Norte, Frigorífico Sur, Frigorífico Central,
Galpón Principal) y **10 lotes**, no 150. La escala real es contexto de negocio,
no el contenido del seed.

## 2. Objetivo

Una **única fuente de verdad** para:

- stock (declarado vs verificado);
- trazabilidad del lote (siembra, cosecha, tratamiento, control de calidad,
  verificación de stock);
- movimientos entre ubicaciones;
- discrepancias y su explicación;
- despachos y su bloqueo cuando no son seguros;
- compliance/exportación y preparación documental.

La aplicación se organiza en tres niveles de valor:

| Nivel | Nombre corto | Qué resuelve |
| --- | --- | --- |
| **N01** | Operación asistida | Registrar movimientos de stock con lenguaje natural |
| **N02** | Control de stock | Detectar, explicar y bloquear discrepancias |
| **N03** | Compliance | Completar y emitir documentación de exportación |

---

## 3. N01 — Movimiento de stock por lenguaje natural

**Estado: implementado (texto). Voz: no implementada.**

### Flujo real

```text
texto libre
  → POST /api/ai/movement-intent   (Groq o parser local → intención estructurada)
  → POST /api/movements/preview    (validación determinística, sin escritura)
  → confirmación humana en la UI
  → POST /api/movements            (revalida con filas bloqueadas + BEGIN/COMMIT)
```

La IA **solo extrae datos**. No autoriza, no confirma y no escribe. La escritura
ocurre en una única transacción PostgreSQL disparada por un click humano.

### Archivos reales

| Archivo | Rol |
| --- | --- |
| `server/services/planillaImport.ts` | Parser determinístico de la planilla 2026 (Excel → preview) |
| `src/pages/NewMovementPage.tsx` | UI del flujo completo (ruta `/movements/new`) |
| `src/services/movementService.ts` | Cliente HTTP: `interpretMovement`, `previewMovement`, `confirmMovement` |
| `server/app.ts` | Los tres endpoints + schemas Zod (`movementTextSchema`, `movementIntentSchema`) |
| `server/services/groqMovementIntent.ts` | Adaptador Groq + `parseWithHeuristic` (fallback local) |
| `server/services/stockTransfer.ts` | `buildStockTransferPreview` — validación determinística canónica de N01 |
| `server/repositories/papaStockRepository.ts` | `previewStockTransfer` y `executeStockTransfer` (transacción) |

### Transacción de `executeStockTransfer`

1. `begin`
2. `select … from public.lots … for share` + `select … from public.stock_records … for update`
3. `buildStockTransferPreview` se vuelve a ejecutar sobre las filas bloqueadas.
   Si falla → `rollback` + HTTP 409 con los códigos de error.
4. `update stock_records` en origen: resta `quantityKg` a declarado **y** verificado.
5. `insert … on conflict (lot_id, location_id) do update` en destino: suma la cantidad.
6. `insert into movements` con `status = 'completed'`, `movement_date = current_date`
   y `reference = MV-N01-<8 hex mayúsculas>`.
7. `commit`

### Restricciones vigentes de N01

- La UI deshabilita el botón si `dataSource !== 'database'`: **no se puede mover
  stock en fallback mock**.
- El preview bloquea el movimiento si el lote tiene discrepancia o verificación
  pendiente (`UNRESOLVED_DISCREPANCY`), lo que hace que **A-204, C-102 y F-301
  estén bloqueados para N01** por diseño.
- El texto debe tener entre 8 y 500 caracteres.

### Voz

No implementada. No hay `SpeechRecognition`, ni MediaRecorder, ni endpoint de
transcripción en el repositorio. Cuando se implemente, debe **reutilizar** el
mismo pipeline (`/api/ai/movement-intent` → preview → confirmación), no crear un
camino paralelo de escritura.

### Migración desde planilla Excel

Flujo separado de N01, para cargar el historial operativo de Papasud:

```text
Stock → Movimientos → seleccionar .xls/.xlsx
  → POST /api/imports/planilla/preview   (parser determinístico, sin escritura)
  → confirmación humana en la UI
  → POST /api/imports/planilla           (reparsea + transacción PostgreSQL)
```

Hojas importables: `De campo a Frío`, `Ingreso Tolvas Santa Ana`, `Env a Frio`,
`Ret Frio`, `P.Chica`, `Ingreso Trevelin`, `Entregas a clientes 2026`. Hojas de
resumen vacías (`Stocks`, `DJ Panc`, `SP`, `Transportes`, `Frigoríficos`) se
omiten. El stock se reconstruye sólo para los lotes de la planilla. **A-204,
A-310, C-102 y F-301 no se modifican.**

---

## 4. N02 — Discrepancias de stock

**Estado: implementado.**

### Modelo de datos

Cada `stock_record` guarda `declared_quantity` y `verified_quantity`.
`src/services/stockService.ts` deriva:

- `difference = verifiedQuantity - declaredQuantity`
- `status`: `pending` si `verification_pending`, `verified` si declarado ==
  verificado, `discrepancy` en cualquier otro caso.

### Análisis asistido

`POST /api/ai/discrepancy` → `server/services/groqDiscrepancy.ts`:

- Groq con **Structured Outputs** (`response_format: json_schema`, `strict: true`),
  `temperature: 0`.
- La respuesta se valida con **Zod** (`analysisSchema`).
- Validaciones antialucinación, cualquiera de ellas fuerza fallback:
  - toda `movementReference` citada debe existir en el input;
  - toda `evidence.reference` debe existir en el conjunto permitido según su tipo;
  - `explainedQuantity + unexplainedQuantity` debe igualar la diferencia absoluta
    (tolerancia 0.001).
- Sin `GROQ_API_KEY`, o con diferencia 0, no se llama a la red.
- Cualquier error, timeout, HTTP no-2xx o JSON inválido → `analyzeWithHeuristic`.

`engine` en la respuesta identifica el motor: `'llm'` o `'heuristic'`. La UI lo
muestra como “Analizado con IA” vs “Análisis local de respaldo”
(`src/components/stock/DiscrepancyPanel.tsx`).

### Caso A-204 (canónico)

- Stock en Frigorífico Sur: **25.000 declarado / 24.000 verificado → −1.000 kg**.
- Movimiento **`MV-1032`**: 1.000 kg, Frigorífico Norte → Frigorífico Sur,
  `2026-08-20`, `status = 'pending'`.
- Groq (o la heurística) debe identificar `MV-1032` como **hipótesis con
  evidencia**, con 1.000 kg explicados y 0 sin explicar.
- La acción recomendada siempre requiere revisión humana.

**Importante:** la hipótesis no resuelve nada. `validateDispatch` sigue
bloqueando el despacho mientras `status === 'discrepancy'`. Explicar ≠ conciliar.
No existe todavía un mecanismo de resolución humana de la discrepancia (ver §20).

---

## 5. N03 — Compliance y exportación

**Estado: parcial. Funciona de punta a punta en la demo, pero la persistencia es
incompleta y el escenario de demo está consumido.**

### Flujo implementado

```text
/exports/new
  → uno o más lotes (default A-310), país (default Brasil), kilos, empaque y
    condiciones comerciales
  → validateExport determinístico contra src/data/requirements.ts (por lote)
  → si falta el tratamiento: MissingDataPanel (texto libre → parser → confirmar)
  → POST /api/traceability  (persiste el evento treatment en PostgreSQL)
  → revalidación → requisitos completos
  → emitir paquete (proforma, factura, lista de empaque, remito) o cada uno
    por separado → sessionStorage → /documents/:id
```

### Estado real de A-310 en la base de producción

La base de demo **ya tiene un tratamiento persistido** para A-310, insertado por
una corrida previa de la demo:

```text
id:    trace-d65ac952-7088-41bd-b7c1-33c1de86cd33
lot:   lot-a310
type:  treatment
date:  2026-08-18
data:  { "product": "Mancozeb", "sourceText": "Tratamiento con Mancozeb el 18 de
         agosto de 2026", "origin": "operator_confirmation" }
```

Consecuencia: **A-310 → Brasil arranca directamente en 5/5**. El
`MissingDataPanel` no aparece y la parte más demostrativa del flujo (el dato
faltante que se completa con lenguaje natural) no se ve.

### Flujo demo original

```text
A-310 → Brasil → 4/5 requisitos
  → agregar tratamiento con texto libre
  → 5/5
  → proforma
```

`migrations/seed.sql` y `src/data/traceability.ts` **omiten el tratamiento de
A-310 a propósito** para producir ese 4/5. El estado 5/5 actual es un efecto de
la demo ejecutada, no del seed.

### Falta una forma segura de resetear el escenario

`npm run db:seed` **no revierte esto**: el seed es un conjunto de `insert … on
conflict (id) do update`, sólo hace upsert de las filas conocidas y nunca borra
filas nuevas. Volver A-310 a 4/5 requiere eliminar ese evento puntual por `id`,
y hoy no existe ni endpoint ni script para hacerlo de forma controlada. Es un
pendiente (§20). Ver `docs/DEMO.md` para la alternativa no destructiva.

### Limitaciones de N03

- Los requisitos (`src/data/requirements.ts`) son **mock**, sólo para Brasil, y no
  representan asesoramiento regulatorio.
- `aiService.parseTraceabilityInput` y `aiService.analyzeRequirements` son
  **parsers/resúmenes locales con `setTimeout` artificial**, no llaman a Groq.
  Groq sólo se usa en N01 (intent) y N02 (discrepancias).
- `POST /api/traceability` acepta **únicamente** `type: 'treatment'`
  (`z.literal('treatment')`). Cualquier otro tipo devuelve 400.
- La proforma, factura, lista de empaque y remito viven en `sessionStorage`, no
  en PostgreSQL.
- La `ExportOperation` se construye en memoria en `NewExportPage` y no se guarda
  en ningún lado.
- Los documentos de exportación incluyen empaque, precios, comprador fiscal y
  trazabilidad del lote, pero siguen siendo de demostración (no fiscales).

---

## 6. Arquitectura

```text
                Browser (SPA React 19 + Vite)
                          │
                          │  /api/*  +  assets estáticos
                          ▼
        ┌─────────────────────────────────────────┐
        │      Render Web Service «papastock»     │
        │                                         │
        │   Express 5 / TypeScript                │
        │     ├── sirve dist/ (React/Vite build)  │
        │     ├── API /api/*                      │
        │     ├── pg.Pool ──► Render PostgreSQL   │
        │     └── HTTPS   ──► Groq                │
        └─────────────────────────────────────────┘
```

**Un solo Web Service sirve la SPA y la API.** No hay servicios separados, no hay
BFF adicional, no hay Supabase, no hay funciones serverless.

- En producción (`server/index.ts`): verifica la conexión a PostgreSQL, sirve
  `dist/` como estático y hace fallback SPA a `index.html` para GET que aceptan
  HTML.
- En desarrollo: monta Vite en `middlewareMode` sobre el mismo Express, por lo
  que `npm run dev` levanta todo en `http://localhost:3000`.
- El navegador nunca recibe `DATABASE_URL` ni `GROQ_API_KEY`.
- En desarrollo, el frontend puede apuntar a un backend Spring Boot externo
  (`VITE_DATA_SOURCE=api`, `VITE_API_BASE_URL=https://papasudbackend.onrender.com`
  o `http://localhost:8080`). Vite proxifica `/api` hacia esa URL. Snapshot,
  N01, N02 y `POST /api/traceability` usan esa base; importar planilla y cargar
  stock siguen en Express. Si `VITE_API_BASE_URL` está vacío, `/api` queda en
  Express como hasta ahora.

### Rutas de la SPA (`src/App.tsx`)

`/` · `/stock` · `/stock/control` · `/locations` · `/warehouse` · `/lots` ·
`/lots/:id` · `/movements` · `/movements/new` · `/exports` (redirige a
`/exports/new`) · `/exports/new` · `/documents` · `/documents/:id` · `*`

Las pestañas internas de stock se reemplazaron por páginas. Las URLs viejas
`/stock?tab=ubicaciones|modelo|movimientos|control` redirigen a la página
correspondiente.

---

## 7. Backend — endpoints reales

Definidos íntegramente en `server/app.ts`. Estos son **todos** los endpoints que
existen hoy.

| Método | Ruta | Nivel | Efecto | Notas |
| --- | --- | --- | --- | --- |
| GET | `/health` | — | ninguno | Devuelve exactamente `{ "status": "ok" }`. Usado como `healthCheckPath` de Render. No consulta la base. |
| GET | `/api/snapshot` | — | lectura | Snapshot completo: locations, lots, stockRecords, movements, traceabilityEvents. Responde `{ data, source: 'database' }`. 503 si no hay `DATABASE_URL`. |
| GET | `/api/lots/:id` | — | lectura | Acepta id o code (case-insensitive). Filtra el snapshot al lote. 404 si no existe. |
| POST | `/api/traceability` | N03 | **escribe** | Sólo `type: 'treatment'`. Inserta en `traceability_events`. 201. Violación de unicidad → 409. |
| POST | `/api/ai/discrepancy` | N02 | ninguno | Groq con Structured Outputs, fallback heurístico. Devuelve `{ data: { engine, … } }`. No requiere base. |
| POST | `/api/ai/movement-intent` | N01 | ninguno | Texto (8–500 chars) → intención estructurada + `engine`. Carga el snapshot para dar contexto de lotes/ubicaciones al modelo. |
| POST | `/api/movements/preview` | N01 | ninguno | Valida la intención contra el snapshot. Devuelve `StockTransferPreview` con `valid`, `errors`, `originStock`. **Nunca escribe.** |
| POST | `/api/movements` | N01 | **escribe** | Revalida con filas bloqueadas y ejecuta la transferencia en una transacción. 201 o 409 con los errores de validación. |
| POST | `/api/imports/planilla/preview` | migración | ninguno | Recibe el Excel (`.xls`/`.xlsx`, body binario ≤ 4 MB). Parser determinístico en `server/services/planillaImport.ts`. Devuelve conteos, lotes/ubicaciones a crear, sample y filas omitidas. **Nunca escribe.** |
| POST | `/api/imports/planilla` | migración | **escribe** | Reparsea el mismo archivo, pide confirmación humana en la UI y persiste lotes, ubicaciones, movimientos y stock de esos lotes en una transacción. No toca A-204 / A-310 / C-102 / F-301. Idempotente por `movements.reference`. |
| POST | `/api/stock/intake/preview` | operación | ninguno | Formulario de ingreso (lote, variedad, kilos, destino, remito, bolsas, calibre, DTV, etc.). Valida sin escribir. |
| POST | `/api/stock/intake` | operación | **escribe** | Confirma la carga: crea lote/ubicación si hace falta, acredita stock y registra el movimiento. No toca A-204 / A-310 / C-102 / F-301. |
| * | `/api/*` (catch-all) | — | ninguno | 404 `{ error: 'Endpoint no encontrado.' }` |

### Convenciones transversales

- Respuestas exitosas: `{ data: … }`, con `source: 'database'` en las lecturas.
- Errores: `{ error: string, details?: unknown }`.
- Validación de entrada con **Zod** en todos los `POST`.
- `express.json({ limit: '64kb' })` para JSON; los endpoints de planilla usan `express.raw({ limit: '4mb' })`.
- `x-powered-by` deshabilitado.
- Manejador de errores central: `ZodError` → 400 con `z.treeifyError`;
  código PostgreSQL `23505` → 409; `error.status` respetado; ≥500 se loguea con
  prefijo `[api]` y se responde con un mensaje genérico.
- No hay autenticación, autorización ni rate limiting. Es una limitación
  deliberada de la demo, documentada en `docs/render-deploy.md`.

---

## 8. PostgreSQL

Schema en `migrations/001_initial_schema.sql` más `migrations/002_movement_import_metadata.sql`. Todo en el esquema `public`.

### Tablas reales

| Tabla | Claves y campos relevantes |
| --- | --- |
| `locations` | `id` (text PK), `name`, `type` ∈ {`cold_storage`, `warehouse`}, `created_at` |
| `lots` | `id` (text PK), `code` (unique), `variety`, `campaign`, `producer`, `origin`, `harvest_date`, `created_at` |
| `stock_records` | `id` (text PK), `lot_id` → `lots`, `location_id` → `locations`, `declared_quantity` / `verified_quantity` `numeric(14,3)` no negativos, `verification_pending` bool, `updated_at`. **Unique `(lot_id, location_id)`** |
| `movements` | `id` (text PK), `reference` (unique), `lot_id` → `lots`, `origin_location_id` / `destination_location_id` → `locations` (nullable), `quantity > 0`, `movement_date`, `status` ∈ {`completed`, `pending`, `cancelled`}, `data` jsonb objeto (remito, hoja, transporte, bolsas, calibre, DTV; default `{}`), `created_at` |
| `traceability_events` | `id` (text PK), `lot_id` → `lots`, `event_type` ∈ {`planting`, `harvest`, `treatment`, `quality_control`, `stock_verification`}, `event_date`, `location_id` (nullable), `data` jsonb (debe ser objeto), `created_at`. **Unique `(lot_id, event_type, event_date)`** |
| `schema_migrations` | `name` (PK), `checksum`, `applied_at`. Creada y mantenida por el runner de migraciones. |

### Relaciones y constraints importantes

- Todas las FK son `on update cascade on delete restrict`: no se puede borrar un
  lote o una ubicación con datos asociados.
- `stock_records` unique `(lot_id, location_id)` es lo que permite el
  `on conflict … do update` del destino en N01: acredita sobre el registro
  existente o crea uno nuevo.
- `movements_has_endpoint`: al menos uno de origen/destino debe existir.
- `movements_distinct_endpoints`: origen ≠ destino.
- `traceability_events` unique `(lot_id, event_type, event_date)` hace idempotente
  la confirmación de tratamiento de N03 en la misma fecha.
- Índices en `stock_records(lot_id)`, `stock_records(location_id)`,
  `movements(lot_id, movement_date desc)`, endpoints de movimiento (parciales) y
  `traceability_events(lot_id, event_date desc)`.

### Mapeo a dominio

`server/repositories/mappers.ts` convierte `snake_case` → `camelCase` y castea
`numeric` (que `pg` devuelve como string) a `number`. Los tipos de fila viven en
`src/types/database.ts` y el dominio en `src/types/domain.ts`. **La UI nunca ve
nombres de columnas de base.**

### Migraciones

`server/db/migrationRunner.ts`:

- toma de `migrations/` sólo los archivos que matchean `^\d+_.+\.sql$`
  (por eso `seed.sql` **no** es una migración);
- toma un `pg_advisory_lock` para evitar corridas concurrentes;
- calcula SHA-256 de cada archivo y lo compara con `schema_migrations.checksum`;
- **si una migración ya aplicada cambió de contenido, lanza error y el deploy
  falla**;
- aplica las pendientes, cada una en su propia transacción.

Reglas:

- **Nunca** modificar destructivamente (ni cosméticamente) una migración ya
  aplicada.
- Para cambios de schema: crear `migrations/002_*.sql`, `003_*.sql`, etc.
- Rollback de schema: nueva migración correctiva, nunca revertir a mano.

Comandos: `npm run db:migrate` (idempotente, corre en `preDeployCommand`) y
`npm run db:seed` (manual, deliberadamente **no** automático).

---

## 9. Infraestructura Render

### Recursos

| Recurso | Nombre | Región |
| --- | --- | --- |
| Web Service | `papastock` | Virginia |
| PostgreSQL gestionado | `papastock-db` | Virginia (PostgreSQL 18) |

URL de la demo: `https://papastock.onrender.com`

### ⚠️ Discrepancia de planes — pendiente, no aplicar el Blueprint a ciegas

| Plan | `render.yaml` | Estado real reportado |
| --- | --- | --- |
| Web Service | `starter` | **Free** |
| PostgreSQL | `basic-256mb` | **Free** |

`render.yaml` declara **planes pagos**. Los recursos vivos están reportados en
**Free**. Un agente que aplique el Blueprint de Render sin revisar esto puede
**hacer upgrade de los recursos y generar costos reales**.

Antes de tocar `render.yaml` o aplicar el Blueprint hay que resolver tres cosas
que están enredadas entre sí:

1. Render **restringe `preDeployCommand` a servicios pagos**. El Blueprint usa
   `preDeployCommand: npm run db:migrate`. En plan Free, las migraciones deben
   correr de otra forma (por ejemplo, manualmente desde el Shell de Render).
2. `scripts/validate-render.mjs` **afirma explícitamente `web.plan !== 'free'`**.
   Cambiar el plan a `free` en `render.yaml` hace fallar `npm run render:validate`.
   Ese script también deberá actualizarse en la misma tanda.
3. El plan Free suspende el servicio por inactividad, lo que produce un arranque
   frío de decenas de segundos en la primera request (ver `docs/DEMO.md`).

Este documento **no** decide cuál es la configuración correcta. Documenta la
discrepancia para que una persona la resuelva conscientemente.

### Configuración del Blueprint (`render.yaml`)

- `runtime: node`, `numInstances: 1`, `autoDeployTrigger: commit`
- `buildCommand: npm ci && npm run build`
- `preDeployCommand: npm run db:migrate`
- `startCommand: npm start`
- `healthCheckPath: /health`
- Variables: `NODE_ENV=production`, `DATABASE_URL` (desde `papastock-db`,
  `property: connectionString`), `GROQ_API_KEY` (`sync: false`, se ingresa a mano),
  `AI_MODEL=openai/gpt-oss-20b`
- `ipAllowList: []` en la base: sin acceso externo, tareas administrativas por
  Render Shell.

Detalles operativos en `docs/render-deploy.md`.

---

## 10. Groq

| Aspecto | Valor real |
| --- | --- |
| Endpoint | `https://api.groq.com/openai/v1/chat/completions` |
| Modelo (`AI_MODEL`) | `openai/gpt-oss-20b` — default en `server/config.ts` y valor en `render.yaml` |
| Temperature | `0` |
| Formato | Structured Outputs: `response_format: { type: 'json_schema', json_schema: { strict: true, schema } }` |
| Timeout | `GROQ_TIMEOUT_MS`, default **8000 ms**, vía `AbortController` |
| Validación | Zod sobre el JSON devuelto, más chequeos antialucinación |
| Autenticación | Header `authorization: Bearer <GROQ_API_KEY>`, sólo server-side |

Dos schemas registrados:

- `papastock_movement_intent` (N01) — `server/services/groqMovementIntent.ts`
- `papastock_discrepancy` (N02) — `server/services/groqDiscrepancy.ts`

Los prompts de sistema le prohíben explícitamente al modelo inventar datos,
autorizar operaciones o escribir. Si falta `GROQ_API_KEY`, **no se hace ninguna
llamada de red**: se usa directamente el fallback local.

`GROQ_API_KEY` no está en este repositorio y no debe escribirse en ningún
archivo versionado. Se configura en Render (`sync: false`) y localmente en `.env`
(ignorado por Git).

---

## 11. Heurísticas y fallback

Todas las heurísticas viven **server-side**. No hay heurística duplicada en el
cliente. Hay exactamente dos, con propósitos distintos:

### 1. Heurística canónica de discrepancias (N02)

`server/services/discrepancyHeuristic.ts` → `analyzeWithHeuristic`.
**Es la única implementación permitida del razonamiento de discrepancias.** No la
copies, no la reimplementes en el frontend, no la dupliques en otro servicio.

Cascada de estrategias:

1. diferencia 0 → sin discrepancia, confianza `1`;
2. un movimiento `pending` ligado a la ubicación cuya cantidad **coincide exacto**
   → confianza `0.95`;
3. dos movimientos `pending` que **suman exacto** → confianza `0.88`;
4. hasta 4 movimientos `pending` menores → **explicación parcial**, confianza `0.62`;
5. sin evidencia → 100 % sin explicar, confianza `0.25`, hipótesis sin referencias.

Nunca inventa referencias: si no hay evidencia, `movementReferences` queda vacío.

### 2. Parser local de intención N01

`parseWithHeuristic` dentro de `server/services/groqMovementIntent.ts`.
Extrae lote, cantidad (`kg`/`kilos`/`kilogramos`) y las dos primeras ubicaciones
mencionadas, normalizando acentos. Si no encuentra los cuatro datos, **falla con
422 en lugar de adivinar**.

### Contrato de fallback

```text
LLM responde y valida  → engine = 'llm'
LLM falla / timeout / inventa / falta la clave → engine = 'heuristic'
```

El campo `engine` viaja hasta la UI y se muestra siempre. El usuario nunca ve un
análisis heurístico disfrazado de IA.

### Parsers locales de N03 (no son Groq)

`src/services/aiService.ts` contiene `parseTraceabilityInput` (regex de fecha y
producto, con `setTimeout(480)`) y `analyzeRequirements` (resumen sintético con
`setTimeout(320)`). Son **client-side y mock**. No confundirlos con Groq ni con
las heurísticas del servidor.

---

## 12. Fuente de datos

**PostgreSQL es la fuente principal.** Existe un fallback mock para resiliencia
de la demo.

`src/repositories/dataRepository.ts` → `loadPapaStockSnapshot`:

1. si `VITE_DATA_SOURCE=mock`, devuelve el mock con `source: 'mock'` y warning;
2. si no, hace `GET {VITE_API_BASE_URL}/api/snapshot` (o `/api/snapshot` si la
   base está vacía), valida la forma del payload y que haya locations, lots y
   stockRecords, y normaliza nulos/`confirmed` del contrato Spring Boot;
3. ante cualquier fallo, devuelve el mock **completo** con `source: 'mock'` y un
   warning que explica el error.

El mock vive en `src/data/` (`locations.ts`, `lots.ts`, `stock.ts`,
`movements.ts`, `traceability.ts`) y **replica el seed de PostgreSQL**.

Reglas:

- El fallback es **atómico**: o todo viene de la base, o todo viene del mock.
  **Nunca mezclar registros de base con registros mock silenciosamente.**
- `dataSource` se expone en el contexto de la app y se muestra en la UI.
- Las mutaciones se comportan según la fuente:
  `AppDataContext.addTraceabilityEvent` sólo llama a la API si
  `dataSource === 'database'`; `NewMovementPage` deshabilita el flujo N01 completo
  cuando la fuente es mock.

---

## 13. Reglas determinísticas

Estas funciones son la autoridad. **El LLM no las reemplaza, no las precede y no
puede saltearlas.**

### `src/lib/validateDispatch.ts` — `validateDispatch`

Bloquea el despacho cuando:

- `INVALID_QUANTITY` — cantidad no finita o ≤ 0;
- `INSUFFICIENT_VERIFIED_STOCK` — solicitado > verificado;
- `UNRESOLVED_DISCREPANCY` — el lote tiene una discrepancia sin resolver.

Se invoca desde `src/pages/LotDetailPage.tsx` con
`hasUnresolvedDiscrepancy: stock.status === 'discrepancy'`. Es la razón por la que
A-204 no puede despachar aunque la IA ya explicó la diferencia.

### `src/lib/validateExport.ts` — `validateExport`

Recorre los requisitos aplicables (`country` coincidente y `required: true`) y
resuelve cada campo desde datos reales: `lotCode`, `variety` y `origin` del lote,
`quantity` de la operación, `treatment` del evento de trazabilidad `treatment`
más reciente. `valid` sólo si hay requisitos y no falta ninguno.

### `server/services/stockTransfer.ts` — `buildStockTransferPreview`

Validación determinística canónica de N01. Códigos de error:
`INVALID_QUANTITY`, `LOT_NOT_FOUND`, `ORIGIN_NOT_FOUND`, `DESTINATION_NOT_FOUND`,
`SAME_LOCATION`, `ORIGIN_STOCK_NOT_FOUND`, `INSUFFICIENT_VERIFIED_STOCK`,
`INSUFFICIENT_DECLARED_STOCK`, `UNRESOLVED_DISCREPANCY`.

Se ejecuta **dos veces**: en el preview (sin escritura) y otra vez dentro de la
transacción sobre filas bloqueadas con `for update`. Un preview aprobado **no**
autoriza la escritura por sí solo.

---

## 14. Datos de demo

### Estado verificado de la base de producción — 2026-08-22

Ubicaciones: `loc-north` Frigorífico Norte, `loc-south` Frigorífico Sur,
`loc-central` Frigorífico Central, `loc-warehouse` Galpón Principal.

| Lote | Ubicación | Declarado | Verificado | Estado |
| --- | --- | --- | --- | --- |
| **A-204** | Frigorífico Sur | 25.000 | 24.000 | 🔴 discrepancia −1.000 |
| **A-310** | Frigorífico Central | 22.000 | 22.000 | ✅ verificado |
| **B-118** | Frigorífico Norte | **14.400** | **14.400** | ✅ verificado (era 14.500) |
| **B-118** | **Galpón Principal** | **100** | **100** | ✅ registro nuevo, creado por N01 |
| B-221 | Frigorífico Sur | 16.000 | 16.000 | ✅ verificado |
| C-102 | Galpón Principal | 18.500 | 18.000 | 🔴 discrepancia −500 |
| D-405 | Frigorífico Central | 19.500 | 19.500 | ✅ verificado |
| E-090 | Frigorífico Norte | 12.500 | 12.500 | ✅ verificado |
| F-301 | Galpón Principal | 17.000 | 0 | 🟡 verificación pendiente |
| G-512 | Frigorífico Sur | 21.000 | 21.000 | ✅ verificado |
| H-118 | Frigorífico Central | 13.500 | 13.500 | ✅ verificado |

Hay **dos** lotes con discrepancia (A-204 y C-102) y **uno** con verificación
pendiente (F-301). Los tres están bloqueados para N01 y para despacho.

### Movimientos

| Referencia | Lote | Ruta | Cantidad | Fecha | Estado |
| --- | --- | --- | --- | --- | --- |
| **`MV-N01-DA6EA5DC`** | B-118 | Norte → Galpón Principal | 100 kg | 2026-08-22 | completed |
| `MV-1037` | C-102 | Galpón → Central | 500 kg | 2026-08-21 | cancelled |
| **`MV-1032`** | A-204 | Norte → Sur | 1.000 kg | 2026-08-20 | **pending** |
| `MV-1028` | A-204 | Galpón → Sur | 8.000 kg | 2026-08-18 | completed |
| `MV-1016` | A-310 | Galpón → Central | 22.000 kg | 2026-08-10 | completed |

### El movimiento N01 de prueba ya modificó la base real

La prueba de N01 —**100 kg del lote B-118, Frigorífico Norte → Galpón
Principal**— se ejecutó contra la base de demo en producción y **es persistente**:

- creó el movimiento `MV-N01-DA6EA5DC` (`status: completed`, `2026-08-22`);
- bajó B-118 en Frigorífico Norte de 14.500 a **14.400** (declarado y verificado);
- creó un registro de stock nuevo, `stock-c593873b-4378-4aac-89a1-768b7677ea30`,
  con **100 kg de B-118 en Galpón Principal**.

**No asumas los valores previos a esa operación.** El seed dice 14.500 en una
sola ubicación; la base dice 14.400 + 100. Si necesitás el estado exacto,
consultá `/api/snapshot`, no el seed.

### Trazabilidad

- **A-204** — 4 eventos: `planting` (SEM-882), `treatment` (Mancozeb, 2026-06-18),
  `harvest` (25.000), `stock_verification` (24.000 en Sur).
- **A-310** — 5 eventos: `planting` (SEM-901), `quality_control` (21.4 % materia
  seca, aprobado), `harvest` (22.000), `stock_verification` (22.000 en Central) y
  **`treatment` Mancozeb 2026-08-18, insertado por la demo N03** (id
  `trace-d65ac952-…`, `origin: operator_confirmation`).
- **C-102** — 2 eventos: `planting` (SEM-791), `harvest` (18.500).
- El resto de los lotes (B-118, B-221, D-405, E-090, F-301, G-512, H-118) **no
  tiene ningún evento de trazabilidad**.

### Lotes sensibles — no romper

| Lote | Para qué se usa | Qué lo rompe |
| --- | --- | --- |
| **A-204** | Demo N02 completa | Cambiar declarado/verificado, tocar `MV-1032`, o “resolver” la discrepancia |
| **A-310** | Demo N03 | Ya está en 5/5; borrar sus eventos base o su stock |
| **MV-1032** | Evidencia que la IA debe encontrar | Cambiar cantidad, estado o ubicaciones |
| **B-118** | Lote seguro de N01, ya usado una vez | Nada crítico, pero cada corrida lo modifica |
| **C-102 / F-301** | Segundo caso de discrepancia y caso pendiente | Alimentan las métricas del dashboard y el test de `getOperationalMetrics` |

---

## 15. Funcionalidades actuales

Leyenda: ✅ implementado · 🟡 parcial · 🧪 demo/mock · 🔴 falta

| Funcionalidad | Estado | Notas |
| --- | --- | --- |
| N01 movimiento por texto | ✅ | Flujo completo texto → preview → confirmación → PostgreSQL |
| N01 movimiento por voz | 🔴 | Nada implementado. Debe reutilizar el pipeline de texto |
| N01 parser de intención | ✅ | Groq Structured Outputs + `parseWithHeuristic` server-side |
| N01 preview | ✅ | `POST /api/movements/preview`, sin escritura |
| N01 validación determinística | ✅ | `buildStockTransferPreview`, ejecutada dos veces (preview + transacción) |
| N01 persistencia | ✅ | `BEGIN/COMMIT`, `for update` en origen, `on conflict` en destino |
| N02 stock declarado vs verificado | ✅ | `stock_records` + proyección `difference`/`status` |
| N02 detección de discrepancias | ✅ | Determinística; alimenta dashboard, tabla de stock y ficha de lote |
| N02 análisis con Groq | ✅ | Structured Outputs + Zod + chequeos antialucinación |
| N02 heurística de respaldo | ✅ | Cascada canónica en `discrepancyHeuristic.ts` |
| N02 bloqueo de despacho | ✅ | `validateDispatch`; la IA no lo puede levantar |
| N02 resolución humana de la discrepancia | 🔴 | No hay forma de conciliar `MV-1032` ni de cerrar la discrepancia |
| Emisión de despacho | 🟡 | Sólo valida y muestra el resultado; **no persiste nada** |
| N03 checklist de requisitos | ✅ | `validateExport` determinístico |
| N03 catálogo de requisitos | 🧪 | `src/data/requirements.ts`, mock, sólo Brasil |
| N03 dato faltante por texto libre | 🟡 | Funciona, pero el parser es local (regex + delay), no Groq |
| N03 persistencia del tratamiento | ✅ | `POST /api/traceability` → `traceability_events` |
| N03 proforma / factura / remito / lista de empaque | 🧪 | `mockDocumentService`; paquete documental no fiscal, con empaque y precios |
| Documentos generados | 🟡 | Sólo `sessionStorage` (`papastock.documents.v1`); se pierden al cerrar la pestaña |
| `ExportOperation` | 🔴 | Se construye en memoria y nunca se guarda |
| Snapshot con fallback mock | ✅ | Atómico, identificado en la UI |
| Trazabilidad (lectura) | ✅ | Timeline en la ficha de lote desde PostgreSQL |
| Dashboard / stock / lotes | ✅ | Métricas derivadas del snapshot |
| Escenario de reset de demo | 🔴 | No existe forma segura de volver A-310 a 4/5 |
| Autenticación / autorización | 🔴 | Ausente por diseño de la demo |
| Rate limiting | 🔴 | Ausente; relevante para los endpoints de IA y las mutaciones |

---

## 16. Persistencia — qué vive dónde

### PostgreSQL

- `locations`, `lots` — catálogo, del seed.
- `stock_records` — incluido el registro creado por N01 en Galpón Principal.
- `movements` — del seed **y** los generados por N01 (`MV-N01-*`).
- `traceability_events` — del seed **y** los tratamientos confirmados en N03
  (incluido el de A-310).
- `schema_migrations` — control de migraciones.

### sessionStorage del navegador

- `papastock.documents.v1` — array de `GeneratedDocument` (las proformas).
  Escrito por `AppDataContext`. Se pierde al cerrar la pestaña, y por eso
  `/documents/:id` redirige a `/documents` en una pestaña nueva.

### En ningún lado

- **Despachos.** `validateDispatch` es una función cliente que devuelve un
  `ValidationResult` renderizado en pantalla. No hay tabla, ni endpoint, ni
  registro de auditoría de intentos de despacho.
- **`ExportOperation`.** Se arma en `NewExportPage` (`id: EXP-<timestamp>`)
  sólo para alimentar el paquete documental.
- **Análisis de discrepancia.** Los resultados de Groq/heurística viven en el
  estado del componente. No se guardan ni se auditan.

Verificado contra el schema actual: no existen tablas `dispatches`,
`export_operations` ni `documents`.

---

## 17. Seguridad

- `DATABASE_URL` es server-side. `server/config.ts` la valida (protocolo
  `postgres:`/`postgresql:`, host y nombre de base) y la exige en producción.
- `GROQ_API_KEY` es server-side, `sync: false` en Render, nunca versionada.
- **Todas** las queries son parametrizadas. No hay concatenación de SQL en el
  repositorio; los únicos valores dinámicos van por `$n`.
- **Ningún secreto en variables `VITE_*`**: todo lo que empieza con `VITE_` se
  inlinea en el bundle del navegador. Las únicas `VITE_*` son `VITE_DATA_SOURCE`
  (mock vs API) y `VITE_API_BASE_URL` (origen público del backend Spring Boot,
  no un secreto).
- `.env` está cubierto por `.gitignore` (`*.local` y ausencia de `.env`
  versionado); el repositorio sólo tiene `.env.example` con placeholders.
- `ipAllowList: []` en la base: sin acceso público, administración por Render
  Shell.
- Cuerpo de request limitado a 64 kb; `x-powered-by` deshabilitado; los errores
  ≥500 no filtran detalles internos al cliente.
- **Faltante conocido:** no hay autenticación, autorización ni rate limiting.
  Cualquier persona con la URL puede llamar a las mutaciones y a los endpoints de
  IA. Aceptable para una demo de hackathon, inaceptable en producción.

---

## 18. UI

Conservar el diseño existente. Es **industrial, premium y operativo**: paleta
sobria verde/piedra en hexadecimales explícitos, bordes rectos (sin esquinas
redondeadas), tipografía tabular para cantidades, densidad alta, badges de estado.

- Tailwind CSS 4 vía `@tailwindcss/vite`, con clases utilitarias en JSX y algunas
  clases propias (`label`, `field`, `tabular`, `operational-table`,
  `print-document`, `no-print`) definidas en `src/index.css`.
- Iconos: `lucide-react`.
- Componentes compartidos en `src/components/common/`.

**No es un chatbot.** El lenguaje natural es un campo de entrada dentro de un
flujo operativo con preview y confirmación, no una conversación. No introduzcas
una interfaz de chat.

**No rediseñar sin pedido explícito.** Cualquier feature nueva debe adoptar los
patrones visuales existentes.

---

## 19. Testing

Runner: **Vitest** (`npm test` → `vitest run`). Sin configuración propia de
Vitest: usa `vite.config.ts`.

**Resultado real al 2026-08-22: 15 archivos, 80 tests pasando, 1 skipped.**

| Archivo | Tests | Qué cubre |
| --- | --- | --- |
| `server/app.test.ts` | 5 | Contrato HTTP con repositorio y servicios mockeados: `/health` exacto, snapshot con `source: 'database'`, rechazo 400 de trazabilidad fuera de contrato, análisis estructurado, y que interpretar/previsualizar **no** ejecute la transferencia |
| `server/repositories/papaStockRepository.test.ts` | 3 | Proyección del snapshot desde 5 queries, transferencia dentro de `BEGIN/COMMIT` actualizando ambos extremos, y `rollback` cuando la validación cambió |
| `server/services/discrepancyHeuristic.test.ts` | 5 | Los cinco caminos de la heurística canónica, incluido “no inventar evidencia” |
| `server/services/groqDiscrepancy.test.ts` | 6 | Respuesta válida → `engine: 'llm'`; fallback ante JSON inválido, referencia inventada, HTTP 429 y timeout; sin clave no hay llamada de red |
| `server/services/groqMovementIntent.test.ts` | 3 | Intención estructurada de Groq, parser local ante HTTP 429, y rechazo de texto incompleto sin inventar ubicaciones |
| `server/services/stockTransfer.test.ts` | 4 | Aprobación sin escritura, bloqueo de A-204 por discrepancia, stock insuficiente y ubicaciones iguales, tolerancia a nombres sin acentos |
| `src/lib/validateDispatch.test.ts` | 3 | Bloqueo por discrepancia, bloqueo por stock verificado insuficiente, despacho seguro |
| `src/lib/validateExport.test.ts` | 5 | A-310 en 4/5 con `treatment` faltante, 5/5 tras confirmar, y procedencia de cada dato |
| `src/lib/documentPacking.test.ts` | 3 | Bultos homogéneos, remanente en el último bulto, marcas de embarque y vigencia UTC |
| `src/services/documentService.test.ts` | 2 | Proforma completa (precio, empaque, trazabilidad) y paquete multi-lote |
| `src/repositories/mappers.test.ts` | 4 | Mapeo de filas `snake_case`, mapeo de `data` jsonb, discrepancia de A-204 y métricas agregadas, determinismo de `getStockStatus` |

Notas:

- Los tests de export/validación usan los **datos mock** de `src/data/`, no la
  base. Por eso `validateExport.test.ts` sigue viendo A-310 en 4/5 aunque la base
  de producción esté en 5/5. **Esto es correcto y no hay que “arreglarlo”**: el
  mock representa el escenario de demo deseado.
- `mappers.test.ts` vive en `src/repositories/` pero importa desde
  `server/repositories/mappers.ts`. Es intencional: verifica que la base no filtre
  nombres de columnas al dominio de la UI.
- No hay tests de componentes React ni end-to-end.
- `npm run build` corre `npm run check` (`tsc --noEmit`) antes de compilar, así
  que un error de tipos rompe el build.
- `npm run render:validate` es un chequeo aparte del Blueprint y **no** forma
  parte de `check`, `test` ni `build`.

---

## 20. Pendientes

Orden sugerido. Reevaluar contra el código antes de empezar cualquiera.

1. **Resolver la discrepancia de planes en `render.yaml`** (§9). Es lo primero
   porque bloquea cualquier deploy limpio y puede costar dinero. Incluye decidir
   qué pasa con `preDeployCommand` en plan Free y actualizar
   `scripts/validate-render.mjs`, que hoy exige plan pago.
2. **Reset seguro del escenario A-310** (§5). Hoy no hay forma controlada de
   volver a 4/5. Debería ser un script explícito, acotado por `id`, revisado por
   una persona y nunca ejecutado automáticamente en deploy.
3. **Resolución humana de discrepancias** (§4). Cerrar el ciclo de N02: permitir
   que un operador confirme o cancele `MV-1032` y conciliar el stock, con
   auditoría. Hoy la IA explica pero nadie puede resolver.
4. **Persistencia de despachos** (§16). Tabla + endpoint + validación server-side.
   Hoy `validateDispatch` es sólo cliente y no deja rastro.
5. **Persistencia de `export_operation` y documentos generados** (§16). Sacar las
   proformas de `sessionStorage`.
6. **Voz para N01** (§3). Reutilizando `/api/ai/movement-intent` → preview →
   confirmación. No crear un camino de escritura paralelo.

Fuera de alcance de la hackathon, pero necesario antes de cualquier exposición
real: autenticación, autorización y rate limiting.

### Higiene del repositorio

`node_modules/` está **versionado**: hay ~8.900 archivos de dependencias
trackeados en Git. `.gitignore` incluye `node_modules/`, pero `.gitignore` no
afecta a archivos ya trackeados, así que la regla no tiene efecto.

Consecuencias prácticas para un agente:

- `git status` y los diffs se contaminan con archivos de dependencias y de caché
  (por ejemplo `node_modules/.vite/vitest/**/results.json` cambia cada vez que
  corrés `npm test`).
- Al preparar un commit, **agregá archivos explícitamente**; no uses `git add -A`
  ni `git add .`, porque vas a arrastrar ruido de `node_modules`.

Limpiarlo (`git rm -r --cached node_modules`) reescribe un volumen grande del
árbol y no debería hacerse en medio de la hackathon sin acordarlo con el equipo.
Queda registrado como deuda conocida.
