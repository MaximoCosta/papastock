# Graph Report - papastock  (2026-08-23)

## Corpus Check
- 174 files · ~130,865 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1152 nodes · 2851 edges · 78 communities (68 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `49b6fb5a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- groqMovementIntent.ts
- domain.ts
- documentService.test.ts
- planillaImport.ts
- documentService.ts
- apiClient.ts
- Structured Outputs
- aiService.ts
- compilerOptions
- App.tsx
- groqTraceabilityIntent.ts
- WarehouseModelPanel.tsx
- devDependencies
- pool.ts
- DemoSessionContext.tsx
- ExportForm
- Button.tsx
- dependencies
- render-deploys.md
- Sidebar.tsx
- app.ts
- export.ts
- Antes de presentar
- formatKg
- MissingDataPanel.tsx
- DocumentsPage.tsx
- NewExportPage.tsx
- scripts
- public.discrepancies
- package.json
- validate-render.mjs
- 001_initial_schema.sql
- vite-env.d.ts
- validateExport.ts
- MovementsPanel.tsx
- dataRepository.ts
- discrepancyHeuristic.ts
- public.movements
- public.traceability_events
- PapaStock — Project Context
- auth.ts
- public.movements
- GPT OSS 20B
- supabase-data-api-exposure.md
- PapaStock
- 3. N01 — Movimiento de stock por lenguaje natural
- Installing Tailwind CSS as a Vite plugin
- Despliegue en Render
- PapaStock
- stockService.ts
- 14. Datos de demo
- 5. N03 — Compliance y exportación
- 11. Heurísticas y fallback
- 8. PostgreSQL
- public.stock_records
- 13. Reglas determinísticas
- 16. Persistencia — qué vive dónde
- 4. N02 — Discrepancias de stock
- 9. Infraestructura Render
- NewExportPage
- @types/express
- vite
- papaStockRepository.postgres.test.ts
- @types/pg
- groqExportRequirements.ts
- StockView
- StockPage.tsx
- yaml
- public.movements

## God Nodes (most connected - your core abstractions)
1. `formatKg()` - 49 edges
2. `Lot` - 34 edges
3. `useAppData()` - 31 edges
4. `Movement` - 29 edges
5. `TraceabilityEvent` - 27 edges
6. `StockView` - 27 edges
7. `Button()` - 26 edges
8. `formatDate()` - 24 edges
9. `Location` - 22 edges
10. `parseWorkbook()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `rebuildStockFromLedger()` --calls--> `movementItemsOf()`  [EXTRACTED]
  server/services/stockLedgerAuthority.test.ts → src/lib/movements.ts
- `createApp()` --calls--> `buildStockVerificationPreview()`  [EXTRACTED]
  server/app.ts → src/lib/stockVerification.ts
- `createApp()` --calls--> `toStockVerificationConfirmation()`  [EXTRACTED]
  server/app.ts → src/lib/stockVerification.ts
- `createApp()` --calls--> `getStockViews()`  [EXTRACTED]
  server/app.ts → src/services/stockService.ts
- `DiscrepancyInput` --references--> `Movement`  [EXTRACTED]
  server/services/discrepancyHeuristic.ts → src/types/domain.ts

## Import Cycles
- None detected.

## Communities (78 total, 10 thin omitted)

### Community 0 - "groqMovementIntent.ts"
Cohesion: 0.14
Nodes (20): AppDependencies, collectItems(), createMovementIntentParser(), jsonSchema, locationIndex(), matchLocations(), MovementContext, movementItemSchema (+12 more)

### Community 1 - "domain.ts"
Cohesion: 0.06
Nodes (87): mapDiscrepancy(), mapLocation(), mapLot(), mapMovement(), mapMovementItem(), mapStockCount(), mapStockRecord(), mapTraceabilityEvent() (+79 more)

### Community 2 - "documentService.test.ts"
Cohesion: 0.15
Nodes (12): lots, baseFields, exportRequirements, initialTraceabilityEvents, transporters, lot, mockDocumentService, a310 (+4 more)

### Community 3 - "planillaImport.ts"
Cohesion: 0.08
Nodes (50): createApp(), readWorkbookUpload(), buildPlanillaImportFromFile(), buildPlanillaImportPlan(), buildStockIntakePlan(), cellAt(), cellText(), columnIndex() (+42 more)

### Community 4 - "documentService.ts"
Cohesion: 0.14
Nodes (21): DEFAULT_COMMERCIAL, DEFAULT_PACKING, DESTINATION_DEFAULTS, DestinationCommercialDefaults, PAPASUD_EXPORTER, addUtcDays(), DerivedPacking, derivePacking() (+13 more)

### Community 5 - "apiClient.ts"
Cohesion: 0.05
Nodes (59): submit(), PlanillaImportPanel(), confirm(), onFile(), CALIBERS, CATEGORIES, emptyForm, optionalNumber() (+51 more)

### Community 6 - "Structured Outputs"
Cohesion: 0.06
Nodes (31): [API Integration](https://console.groq.com/docs/structured-outputs\#api-integration), [API Response Validation](https://console.groq.com/docs/structured-outputs\#api-response-validation), [Best-effort Mode (`strict: false`)](https://console.groq.com/docs/structured-outputs\#besteffort-mode-strict-false), [Best Practices](https://console.groq.com/docs/structured-outputs\#best-practices), [Choosing Between Strict and Best-effort Mode](https://console.groq.com/docs/structured-outputs\#choosing-between-strict-and-besteffort-mode), [Email Classification](https://console.groq.com/docs/structured-outputs\#email-classification), [Error Handling](https://console.groq.com/docs/structured-outputs\#error-handling), [Examples](https://console.groq.com/docs/structured-outputs\#examples) (+23 more)

### Community 7 - "aiService.ts"
Cohesion: 0.13
Nodes (10): hardcodedDiscrepancyAnalysis(), kg(), aiService, httpAIService, localTraceabilityFallback(), monthNumbers, parseDate(), parseProduct() (+2 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, node, server, src, vite/client, vite.config.ts (+19 more)

### Community 9 - "App.tsx"
Cohesion: 0.19
Nodes (10): AppLayout(), DashboardPage(), LocationsPage(), MovementsPage(), NewMovementPage(), StockControlPage(), StockPage(), TransportersPage() (+2 more)

### Community 10 - "groqTraceabilityIntent.ts"
Cohesion: 0.22
Nodes (11): createTraceabilityIntentParser(), extractDate(), extractProduct(), intentSchema, isRealCalendarDate(), jsonSchema, monthNumbers, parseTraceabilityWithHeuristic() (+3 more)

### Community 11 - "WarehouseModelPanel.tsx"
Cohesion: 0.33
Nodes (3): occupiedKg(), WarehouseModelPanel(), AddShelfUnitInput

### Community 12 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, supertest, tailwindcss, @tailwindcss/vite, tsup, @types/react, @types/react-dom, @types/supertest (+13 more)

### Community 13 - "pool.ts"
Cohesion: 0.18
Nodes (11): config, checkDatabaseReadiness(), pool, requirePool(), verifyDatabaseConnection(), verifyDatabaseReadiness(), database, repositoryRoot (+3 more)

### Community 14 - "DemoSessionContext.tsx"
Cohesion: 0.24
Nodes (8): App(), LoginPage(), DemoSession, isDemoSession(), DemoSessionContext, DemoSessionContextValue, DemoSessionProvider(), useDemoSession()

### Community 15 - "ExportForm"
Cohesion: 0.67
Nodes (3): ExportForm(), changeLot(), updateLine()

### Community 16 - "Button.tsx"
Cohesion: 0.37
Nodes (5): Button(), ButtonVariant, variants, PageHeader(), QuickAccessItem

### Community 17 - "dependencies"
Cohesion: 0.11
Nodes (19): express, lucide-react, dependencies, express, lucide-react, pg, react, react-dom (+11 more)

### Community 18 - "render-deploys.md"
Cohesion: 0.07
Nodes (27): Automatic deploys, Build command, Canceling a deploy, Configuring auto-deploys, Deploy steps, Deploying a specific commit, [Deploying on Render](https://render.com/docs/deploys), Deployment concepts (+19 more)

### Community 19 - "Sidebar.tsx"
Cohesion: 0.22
Nodes (7): inventory, NavItem, operations, overview, Sidebar(), sectionTitles, Topbar()

### Community 20 - "app.ts"
Cohesion: 0.12
Nodes (15): correctionSchema, discrepancyInputSchema, exportRequirementsInputSchema, idempotencyKeySchema, identifier, loginSchema, movementIntentSchema, movementItemInputSchema (+7 more)

### Community 21 - "export.ts"
Cohesion: 0.11
Nodes (21): DocumentService, CreateGeneratedDocumentRequest, DocumentCommercialFields, DocumentSnapshotRequirement, DocumentSnapshotTraceability, DocumentType, ExportOperationResponse, ExportStatus (+13 more)

### Community 22 - "Antes de presentar"
Cohesion: 0.08
Nodes (25): 1. Despertar el servicio, 2. Comprobar `/health`, 3. Comprobar la base de datos, 4. Comprobar que la UI no está en mock, 5. Comprobar Groq, 6. Comprobar los datos de A-204, 7. Comprobar el estado de A-310, Antes de presentar (+17 more)

### Community 23 - "formatKg"
Cohesion: 0.09
Nodes (42): StatCard(), useCountUp(), tick(), DocumentArticle(), DocumentFooter(), DocumentLetterhead(), DocumentProvenance(), CommercialTerms() (+34 more)

### Community 24 - "MissingDataPanel.tsx"
Cohesion: 0.31
Nodes (6): ConfirmDialog(), engineLabel(), LoadingLabel(), MissingDataPanel(), ConfirmedTraceabilityEvent, ParsedTraceabilityEvent

### Community 25 - "DocumentsPage.tsx"
Cohesion: 0.31
Nodes (6): EmptyState(), DocumentsPage(), filters, summarize(), typeMeta, NotFoundPage()

### Community 28 - "NewExportPage.tsx"
Cohesion: 0.13
Nodes (24): ExportCommercialValues, groupByLot(), originLabel(), RequirementChecklist(), ExportDocumentContext, analyzeExportReadiness(), DocumentSnapshotInput, ExportLogistics (+16 more)

### Community 32 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, auth:hash, build, check, db:migrate, db:seed, dev, render:validate (+2 more)

### Community 33 - "public.discrepancies"
Cohesion: 0.46
Nodes (7): public.discrepancies, public.movement_items, public.stock_counts, public.movements, public.stock_records, public.locations, public.lots

### Community 34 - "package.json"
Cohesion: 0.25
Nodes (7): name, overrides, tsup, private, esbuild, type, version

### Community 36 - "validate-render.mjs"
Cohesion: 0.40
Nodes (3): blueprint, database, web

### Community 37 - "001_initial_schema.sql"
Cohesion: 0.50
Nodes (3): public.locations, public.lots, public

### Community 39 - "validateExport.ts"
Cohesion: 0.37
Nodes (13): eventData(), eventLotId(), eventType(), formatEventDate(), getFieldSource(), getFieldValue(), latestTreatment(), readTreatmentProduct() (+5 more)

### Community 40 - "MovementsPanel.tsx"
Cohesion: 0.24
Nodes (8): icons, StatusBadge(), StatusTone, toneClasses, MovementsPanel(), statusMeta(), TransporterProfileCard(), emptyForm

### Community 41 - "dataRepository.ts"
Cohesion: 0.15
Nodes (18): isExplicitMockMode(), shelfUnits, shelves, DataSource, emptySnapshot(), errorMessage(), isSnapshot(), loadPapaStockSnapshot() (+10 more)

### Community 42 - "discrepancyHeuristic.ts"
Cohesion: 0.15
Nodes (16): analyzeWithHeuristic(), byRecent(), DiscrepancyInput, hypothesis(), movementEvidence(), analysisSchema, AnalyzerOptions, createDiscrepancyAnalyzer() (+8 more)

### Community 49 - "PapaStock — Project Context"
Cohesion: 0.12
Nodes (15): 10. Groq, 12. Fuente de datos, 15. Funcionalidades actuales, 17. Seguridad, 18. UI, 19. Testing, 1. Hackathon, 20. Pendientes (+7 more)

### Community 51 - "auth.ts"
Cohesion: 0.08
Nodes (22): analyze, app, auth, parseExportRequirements, parseMovementIntent, parseTraceabilityIntent, repository, snapshot (+14 more)

### Community 54 - "GPT OSS 20B"
Cohesion: 0.17
Nodes (11): Best Practices, [Get Started with GPT-OSS 20B](https://console.groq.com/docs/model/openai/gpt-oss-20b\#get-started-with-gptoss-20b), GPT OSS 20B, [Key Technical Specifications](https://console.groq.com/docs/model/openai/gpt-oss-20b\#key-technical-specifications), LIMITS, Model Architecture, Performance Metrics, PRICING (+3 more)

### Community 55 - "supabase-data-api-exposure.md"
Cohesion: 0.17
Nodes (11): Before → After [\#](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically\#before--after), Build in a weekend, scale to millions, Communications timeline [\#](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically\#communications-timeline), FAQ [\#](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically\#faq), Opting in on existing projects [\#](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically\#opting-in-on-existing-projects), Rollout timeline [\#](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically\#rollout-timeline), What's changing [\#](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically\#whats-changing), What to do [\#](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically\#what-to-do) (+3 more)

### Community 56 - "PapaStock"
Cohesion: 0.18
Nodes (10): Arquitectura, Compatibilidad, Contexto detallado, Flujos que nunca deben romperse, graphify, Infraestructura, Migraciones, PapaStock (+2 more)

### Community 57 - "3. N01 — Movimiento de stock por lenguaje natural"
Cohesion: 0.20
Nodes (10): 3. N01 — Movimiento de stock por lenguaje natural, Archivos reales, Flujo real, Migración desde planilla Excel, Modelo de movimiento, Recepción y corrección, Restricciones vigentes de N01, Transacción de `executeStockTransfer` (+2 more)

### Community 58 - "Installing Tailwind CSS as a Vite plugin"
Cohesion: 0.20
Nodes (9): Configure the Vite plugin, Create your project, Get started with Tailwind CSS, Import Tailwind CSS, Install Tailwind CSS, Installation, Installing Tailwind CSS as a Vite plugin, Start using Tailwind in your HTML (+1 more)

### Community 59 - "Despliegue en Render"
Cohesion: 0.25
Nodes (7): Acceso operativo, Alta, Despliegue en Render, Limitaciones deliberadas, Operación, Recursos y costo, Verificación

### Community 60 - "PapaStock"
Cohesion: 0.25
Nodes (7): Arquitectura, Comandos, Desarrollo, Estructura, Movimiento por texto (N01), PapaStock, Persistencia actual

### Community 61 - "stockService.ts"
Cohesion: 0.16
Nodes (12): rebuildStockFromLedger(), locations, movements, stockRecords, GAPS, isDiscrepancy(), lotCodeById(), presentStockForOralDemo() (+4 more)

### Community 62 - "14. Datos de demo"
Cohesion: 0.33
Nodes (6): 14. Datos de demo, El movimiento N01 de prueba ya modificó la base real, Estado verificado de la base de producción — 2026-08-22, Lotes sensibles — no romper, Movimientos, Trazabilidad

### Community 63 - "5. N03 — Compliance y exportación"
Cohesion: 0.33
Nodes (6): 5. N03 — Compliance y exportación, Estado real de A-310 en la base de producción, Falta una forma segura de resetear el escenario, Flujo demo original, Flujo implementado, Limitaciones de N03

### Community 64 - "11. Heurísticas y fallback"
Cohesion: 0.40
Nodes (5): 11. Heurísticas y fallback, 1. Heurística canónica de discrepancias (N02), 2. Parser local de intención N01, Contrato de fallback, Parsers locales de N03 (no son Groq)

### Community 65 - "8. PostgreSQL"
Cohesion: 0.40
Nodes (5): 8. PostgreSQL, Mapeo a dominio, Migraciones, Relaciones y constraints importantes, Tablas reales

### Community 67 - "13. Reglas determinísticas"
Cohesion: 0.50
Nodes (4): 13. Reglas determinísticas, `server/services/stockTransfer.ts` — `buildStockTransferPreview`, `src/lib/validateDispatch.ts` — `validateDispatch`, `src/lib/validateExport.ts` — `validateExport`

### Community 68 - "16. Persistencia — qué vive dónde"
Cohesion: 0.50
Nodes (4): 16. Persistencia — qué vive dónde, En ningún lado, PostgreSQL, sessionStorage del navegador

### Community 69 - "4. N02 — Discrepancias de stock"
Cohesion: 0.50
Nodes (4): 4. N02 — Discrepancias de stock, Análisis asistido, Caso A-204 (canónico), Modelo de datos

### Community 70 - "9. Infraestructura Render"
Cohesion: 0.50
Nodes (4): 9. Infraestructura Render, Configuración del Blueprint (`render.yaml`), ⚠️ Discrepancia de planes — pendiente, no aplicar el Blueprint a ciegas, Recursos

### Community 71 - "NewExportPage"
Cohesion: 0.31
Nodes (10): NewExportPage(), analyze(), applyDestination(), buildContext(), confirmTraceability(), emit(), evaluate(), logistics() (+2 more)

### Community 78 - "papaStockRepository.postgres.test.ts"
Cohesion: 0.24
Nodes (3): database, repositoryRoot, runMigrations()

### Community 82 - "groqExportRequirements.ts"
Cohesion: 0.14
Nodes (17): canonicalLabels, createExportRequirementsParser(), ExportRequirementsInput, jsonSchema, keywords, parseRequirementsWithHeuristic(), requirementsSchema, hangingFetch (+9 more)

### Community 84 - "StockView"
Cohesion: 0.28
Nodes (12): ShelfGrid(), WizardStep, PapaStockSnapshot, NormalizedSnapshot, AppDataContextValue, Location, Shelf, ShelfUnit (+4 more)

### Community 87 - "StockPage.tsx"
Cohesion: 0.18
Nodes (12): PaginationBar(), LotHeader(), labels, StockStatusBadge(), LIST_PAGE_SIZE, PageWindow, paginate(), visiblePages() (+4 more)

## Knowledge Gaps
- **343 isolated node(s):** `public.locations`, `name`, `private`, `version`, `type` (+338 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Lot` connect `NewExportPage.tsx` to `groqMovementIntent.ts`, `domain.ts`, `documentService.test.ts`, `planillaImport.ts`, `documentService.ts`, `apiClient.ts`, `validateExport.ts`, `MovementsPanel.tsx`, `dataRepository.ts`, `StockView`, `export.ts`, `StockPage.tsx`, `stockService.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `formatKg()` connect `formatKg` to `domain.ts`, `apiClient.ts`, `validateExport.ts`, `MovementsPanel.tsx`, `App.tsx`, `WarehouseModelPanel.tsx`, `ExportForm`, `Button.tsx`, `StockView`, `DocumentsPage.tsx`, `NewExportPage.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `AuthService` connect `auth.ts` to `groqMovementIntent.ts`, `app.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `public.locations`, `name`, `private` to the rest of the system?**
  _343 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `groqMovementIntent.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1422924901185771 - nodes in this community are weakly interconnected._
- **Should `domain.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05504464880714381 - nodes in this community are weakly interconnected._
- **Should `planillaImport.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08145363408521303 - nodes in this community are weakly interconnected._