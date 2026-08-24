# Graph Report - papastock  (2026-08-23)

## Corpus Check
- 181 files · ~135,956 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1199 nodes · 2942 edges · 81 communities (71 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `49b6fb5a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- groqMovementIntent.ts
- papaStockRepository.ts
- documentService.test.ts
- planillaImport.ts
- NewExportPage.tsx
- apiClient.ts
- Structured Outputs
- ExportValidationResult
- compilerOptions
- App.tsx
- domain.ts
- LotDetailPage.tsx
- devDependencies
- pool.ts
- stockTransfer.ts
- ledgerVerifier.ts
- quantity.ts
- dependencies
- render-deploys.md
- documentService.ts
- app.ts
- export.ts
- Antes de presentar
- formatKg
- MissingDataPanel.tsx
- fold
- app.test.ts
- ledgerAudit.ts
- RequirementChecklist.tsx
- movementReception.ts
- validatePlanillaUpload
- TraceabilityTimeline.tsx
- scripts
- public.discrepancies
- package.json
- validate-render.mjs
- 001_initial_schema.sql
- vite-env.d.ts
- validateExport.ts
- ExportForm.tsx
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
- StatusBadge.tsx
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
- `LocationSpec` --references--> `LocationType`  [EXTRACTED]
  server/services/planillaImport.ts → src/types/domain.ts
- `createApp()` --calls--> `buildStockVerificationPreview()`  [EXTRACTED]
  server/app.ts → src/lib/stockVerification.ts
- `createApp()` --calls--> `toStockVerificationConfirmation()`  [EXTRACTED]
  server/app.ts → src/lib/stockVerification.ts
- `createApp()` --calls--> `getStockViews()`  [EXTRACTED]
  server/app.ts → src/services/stockService.ts
- `LegacyMovementMaterialization` --references--> `QuantityUnit`  [EXTRACTED]
  server/db/legacyMovementItems.ts → src/types/domain.ts

## Import Cycles
- None detected.

## Communities (81 total, 10 thin omitted)

### Community 0 - "groqMovementIntent.ts"
Cohesion: 0.18
Nodes (16): collectItems(), createMovementIntentParser(), jsonSchema, locationIndex(), matchLocations(), movementItemSchema, normalize(), ParserOptions (+8 more)

### Community 1 - "papaStockRepository.ts"
Cohesion: 0.14
Nodes (20): mapDiscrepancy(), mapLocation(), mapLot(), mapMovement(), mapMovementItem(), mapStockCount(), mapStockRecord(), mapTraceabilityEvent() (+12 more)

### Community 2 - "documentService.test.ts"
Cohesion: 0.32
Nodes (6): transporters, mockDocumentService, a310, h118, operationFor(), buildExportOperation()

### Community 3 - "planillaImport.ts"
Cohesion: 0.15
Nodes (26): cellAt(), cellText(), columnIndex(), defaultDestination(), defaultOrigin(), excelSerialToDate(), findHeaderRow(), identifySheet() (+18 more)

### Community 4 - "NewExportPage.tsx"
Cohesion: 0.13
Nodes (23): DEFAULT_COMMERCIAL, DEFAULT_PACKING, DESTINATION_DEFAULTS, DestinationCommercialDefaults, PAPASUD_EXPORTER, addUtcDays(), DerivedPacking, derivePacking() (+15 more)

### Community 5 - "apiClient.ts"
Cohesion: 0.07
Nodes (52): submit(), PlanillaImportPanel(), confirm(), onFile(), CALIBERS, CATEGORIES, emptyForm, optionalNumber() (+44 more)

### Community 6 - "Structured Outputs"
Cohesion: 0.06
Nodes (31): [API Integration](https://console.groq.com/docs/structured-outputs\#api-integration), [API Response Validation](https://console.groq.com/docs/structured-outputs\#api-response-validation), [Best-effort Mode (`strict: false`)](https://console.groq.com/docs/structured-outputs\#besteffort-mode-strict-false), [Best Practices](https://console.groq.com/docs/structured-outputs\#best-practices), [Choosing Between Strict and Best-effort Mode](https://console.groq.com/docs/structured-outputs\#choosing-between-strict-and-besteffort-mode), [Email Classification](https://console.groq.com/docs/structured-outputs\#email-classification), [Error Handling](https://console.groq.com/docs/structured-outputs\#error-handling), [Examples](https://console.groq.com/docs/structured-outputs\#examples) (+23 more)

### Community 7 - "ExportValidationResult"
Cohesion: 0.50
Nodes (3): DocumentSnapshotInput, ExportOperation, ExportValidationResult

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, node, server, src, vite/client, vite.config.ts (+19 more)

### Community 9 - "App.tsx"
Cohesion: 0.05
Nodes (49): App(), Button(), ButtonVariant, variants, EmptyState(), PageHeader(), PaginationBar(), AppLayout() (+41 more)

### Community 10 - "domain.ts"
Cohesion: 0.14
Nodes (27): inferUnit(), jsonObject(), LegacyMovementMaterialization, LegacyMovementPlan, materializeLegacyMovementItemsInTestDatabase(), planLegacyMovementItems(), UnsupportedLegacyMovement, validUnit() (+19 more)

### Community 11 - "LotDetailPage.tsx"
Cohesion: 0.18
Nodes (18): MovementList(), MovementReceptionForm(), buildLotHistory(), eventLabels, locationName(), LotHistoryEntry, movementItemsOf(), movementPrimaryLotId() (+10 more)

### Community 12 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, supertest, tailwindcss, @tailwindcss/vite, tsup, @types/react, @types/react-dom, @types/supertest (+13 more)

### Community 13 - "pool.ts"
Cohesion: 0.18
Nodes (11): config, checkDatabaseReadiness(), pool, requirePool(), verifyDatabaseConnection(), verifyDatabaseReadiness(), database, repositoryRoot (+3 more)

### Community 14 - "stockTransfer.ts"
Cohesion: 0.17
Nodes (16): parsedIntentSchema, buildLotCorrectionPlan(), LotCorrectionPlan, movement, buildStockCountPlan(), buildStockTransferPreview(), cloneStock(), emptyStock() (+8 more)

### Community 15 - "ledgerVerifier.ts"
Cohesion: 0.12
Nodes (17): coordinateKey(), LedgerBlockingCode, LedgerBlockingIssue, LedgerClassification, LedgerCoordinateResult, LedgerMovementInput, LedgerMovementItemInput, LedgerRecommendedAction (+9 more)

### Community 16 - "quantity.ts"
Cohesion: 0.23
Nodes (11): StockTable(), VarietyStockPanel(), QUANTITY_UNITS, stockUnit(), unitLabel(), aggregateStockByVarietyLocationUnit(), VarietyLocationTotal, getStockAlert() (+3 more)

### Community 17 - "dependencies"
Cohesion: 0.11
Nodes (19): express, lucide-react, dependencies, express, lucide-react, pg, react, react-dom (+11 more)

### Community 18 - "render-deploys.md"
Cohesion: 0.07
Nodes (27): Automatic deploys, Build command, Canceling a deploy, Configuring auto-deploys, Deploy steps, Deploying a specific commit, [Deploying on Render](https://render.com/docs/deploys), Deployment concepts (+19 more)

### Community 19 - "documentService.ts"
Cohesion: 0.24
Nodes (11): generateRemito(), buildExportDocumentItems(), buildExportItems(), ExportDocumentContext, latestEvent(), latestTreatment(), lotById(), qualityLabel() (+3 more)

### Community 20 - "app.ts"
Cohesion: 0.10
Nodes (19): correctionSchema, createApp(), discrepancyInputSchema, exportRequirementsInputSchema, idempotencyKeySchema, identifier, loginSchema, movementIntentSchema (+11 more)

### Community 21 - "export.ts"
Cohesion: 0.10
Nodes (22): baseFields, exportRequirements, DocumentService, CreateGeneratedDocumentRequest, DocumentCommercialFields, DocumentSnapshotRequirement, DocumentSnapshotTraceability, ExportOperationResponse (+14 more)

### Community 22 - "Antes de presentar"
Cohesion: 0.08
Nodes (25): 1. Despertar el servicio, 2. Comprobar `/health`, 3. Comprobar la base de datos, 4. Comprobar que la UI no está en mock, 5. Comprobar Groq, 6. Comprobar los datos de A-204, 7. Comprobar el estado de A-310, Antes de presentar (+17 more)

### Community 23 - "formatKg"
Cohesion: 0.09
Nodes (41): StatCard(), useCountUp(), tick(), DocumentArticle(), DocumentFooter(), DocumentLetterhead(), DocumentProvenance(), CommercialTerms() (+33 more)

### Community 24 - "MissingDataPanel.tsx"
Cohesion: 0.33
Nodes (5): ConfirmDialog(), engineLabel(), MissingDataPanel(), ConfirmedTraceabilityEvent, ParsedTraceabilityEvent

### Community 25 - "fold"
Cohesion: 0.27
Nodes (13): buildPlanillaImportPlan(), buildStockIntakePlan(), fold(), inferLocationType(), matchLocation(), matchLot(), materializePlanillaImport(), movementData() (+5 more)

### Community 26 - "app.test.ts"
Cohesion: 0.18
Nodes (8): analyze, app, auth, parseExportRequirements, parseMovementIntent, parseTraceabilityIntent, repository, snapshot

### Community 27 - "ledgerAudit.ts"
Cohesion: 0.39
Nodes (5): loadLedgerVerifierInput(), QueryClient, verifyLedgerReadOnly(), verifyLedgerWithClient(), LedgerVerificationResult

### Community 28 - "RequirementChecklist.tsx"
Cohesion: 0.38
Nodes (5): groupByLot(), originLabel(), RequirementChecklist(), AnalysisEngine, RequirementResult

### Community 29 - "movementReception.ts"
Cohesion: 0.43
Nodes (6): buildReceptionPlan(), receptionPayloadFingerprint(), ReceptionPlan, Discrepancy, MovementItem, MovementReceptionInput

### Community 30 - "validatePlanillaUpload"
Cohesion: 0.29
Nodes (7): readWorkbookUpload(), buildPlanillaImportFromFile(), fileExtension(), hasPrefix(), importError(), parsePlanillaBuffer(), validatePlanillaUpload()

### Community 31 - "TraceabilityTimeline.tsx"
Cohesion: 0.60
Nodes (4): eventLabels, getDetail(), TraceabilityTimeline(), formatCompactDate()

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
Cohesion: 0.41
Nodes (12): eventData(), eventLotId(), eventType(), formatEventDate(), getFieldSource(), getFieldValue(), latestTreatment(), readTreatmentProduct() (+4 more)

### Community 40 - "ExportForm.tsx"
Cohesion: 0.20
Nodes (9): LoadingLabel(), StatusBadge(), ExportCommercialValues, ExportForm(), changeLot(), updateLine(), DiscrepancyPanel(), TransporterProfileCard() (+1 more)

### Community 41 - "dataRepository.ts"
Cohesion: 0.05
Nodes (66): DiscrepancyInput, MovementContext, StockCountPlan, ShelfGrid(), WizardStep, occupiedKg(), WarehouseModelPanel(), isExplicitMockMode() (+58 more)

### Community 42 - "discrepancyHeuristic.ts"
Cohesion: 0.15
Nodes (14): analyzeWithHeuristic(), byRecent(), hypothesis(), movementEvidence(), analysisSchema, AnalyzerOptions, createDiscrepancyAnalyzer(), jsonSchema (+6 more)

### Community 49 - "PapaStock — Project Context"
Cohesion: 0.12
Nodes (15): 10. Groq, 12. Fuente de datos, 15. Funcionalidades actuales, 17. Seguridad, 18. UI, 19. Testing, 1. Hackathon, 20. Pendientes (+7 more)

### Community 51 - "auth.ts"
Cohesion: 0.13
Nodes (13): AppDependencies, AuthIdentity, AuthOptions, AuthService, cookieValue(), hashPassword(), passwordParts(), Permission (+5 more)

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
Cohesion: 0.15
Nodes (6): database, repositoryRoot, MigrationSelection, parseMigrationArgs(), runMigrations(), directories

### Community 82 - "groqExportRequirements.ts"
Cohesion: 0.09
Nodes (28): canonicalLabels, createExportRequirementsParser(), ExportRequirementsInput, jsonSchema, keywords, parseRequirementsWithHeuristic(), requirementsSchema, hangingFetch (+20 more)

### Community 87 - "StatusBadge.tsx"
Cohesion: 0.22
Nodes (7): icons, StatusTone, toneClasses, LotHeader(), labels, StockStatusBadge(), StockStatus

## Knowledge Gaps
- **359 isolated node(s):** `public.locations`, `name`, `private`, `version`, `type` (+354 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatKg()` connect `formatKg` to `apiClient.ts`, `validateExport.ts`, `ExportForm.tsx`, `dataRepository.ts`, `App.tsx`, `LotDetailPage.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `Lot` connect `dataRepository.ts` to `groqMovementIntent.ts`, `planillaImport.ts`, `NewExportPage.tsx`, `apiClient.ts`, `validateExport.ts`, `ExportForm.tsx`, `ExportValidationResult`, `domain.ts`, `LotDetailPage.tsx`, `stockTransfer.ts`, `documentService.ts`, `export.ts`, `StatusBadge.tsx`, `formatKg`, `RequirementChecklist.tsx`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `AuthService` connect `auth.ts` to `app.test.ts`, `app.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `public.locations`, `name`, `private` to the rest of the system?**
  _359 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `papaStockRepository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14393939393939395 - nodes in this community are weakly interconnected._
- **Should `planillaImport.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14814814814814814 - nodes in this community are weakly interconnected._
- **Should `NewExportPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1330049261083744 - nodes in this community are weakly interconnected._