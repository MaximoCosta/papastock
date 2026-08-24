# PapaStock

PapaStock es una aplicación full-stack para stock, trazabilidad, discrepancias y
preparación documental de exportación de papa/semilla de papa para **Papasud**.

## Arquitectura

```text
React/Vite  →  Express/TypeScript  →  Render PostgreSQL
                      └────────────→  Groq (IA)
```

Un único Web Service en Render sirve la SPA y la API. **No hay Supabase.** No lo
agregues ni lo documentes como arquitectura actual.

## Principios

- La IA interpreta y analiza. El código determinístico valida y modifica.
- La IA nunca autoriza un despacho.
- La IA nunca modifica stock directamente.
- Toda operación de stock requiere validación determinística server-side.
- Las operaciones destructivas requieren confirmación humana explícita.
- Queries PostgreSQL siempre parametrizadas (`$1`, `$2`, …).
- `DATABASE_URL` y `GROQ_API_KEY` son server-side.
- No exponer secretos al frontend (nunca en variables `VITE_*`, nunca en Git).

## Compatibilidad

Antes de modificar una funcionalidad:

- revisar los contratos existentes (`src/types/`, schemas Zod en `server/app.ts`);
- revisar los tests que la cubren;
- reutilizar los servicios existentes;
- no duplicar lógica (especialmente heurísticas y validaciones).

## Verificación

Después de cambios importantes:

```bash
npm run check
npm test
npm run build
```

## Flujos que nunca deben romperse

- **A-204 / N02**: 25.000 declarado vs 24.000 verificado, `MV-1032` pendiente de
  1.000 kg, despacho bloqueado por discrepancia sin resolver.
- **A-310 / N03**: exportación a Brasil, checklist determinístico de requisitos,
  confirmación humana del tratamiento, proforma.
- **N01 movimiento por texto**: texto libre → interpretación → preview →
  validación → confirmación humana → transacción PostgreSQL.

## Contexto detallado

Antes de cualquier cambio importante, leer:

- **`docs/PROJECT_CONTEXT.md`** — documento maestro del proyecto (arquitectura,
  endpoints reales, schema, reglas de negocio, estado real de N01/N02/N03,
  pendientes).
- **`docs/DEMO.md`** — para cualquier cambio que afecte la demo o los datos de
  demostración.
- **`docs/render-deploy.md`** — despliegue y operación en Render.

## Infraestructura

`render.yaml` declara planes pagos (`starter` / `basic-256mb`) mientras que los
recursos reales están reportados en plan Free. **No apliques el Blueprint de
Render sin revisar esa discrepancia**: podría generar costos. Detalle en
`docs/PROJECT_CONTEXT.md` §9.

## Migraciones

Nunca edites una migración ya aplicada (`migrations/001_initial_schema.sql`): el
runner valida checksum SHA-256 y el deploy falla. Para cambios de schema, agregar
una **nueva** migración numerada.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
