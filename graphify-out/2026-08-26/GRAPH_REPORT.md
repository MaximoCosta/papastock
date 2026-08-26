# Graph Report - papastock  (2026-08-26)

## Corpus Check
- 220 files · ~166,513 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1472 nodes · 3586 edges · 87 communities (74 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c12d86a1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- aiOperationsLotHistory.diagnostic.test.ts
- TraceabilityEvent
- groqMovementIntent.ts
- planillaImport.ts
- domain.ts
- apiClient.ts
- Structured Outputs
- aiService.ts
- compilerOptions
- public.transporters
- public.stock_records
- formatQuantity
- devDependencies
- pool.ts
- RequirementChecklist.tsx
- dataRepository.ts
- discrepancyHeuristic.ts
- dependencies
- render-deploys.md
- derivedOperationalFacts.ts
- app.ts
- showcaseDataset.ts
- Antes de presentar
- formatKg
- App.tsx
- StockPage.tsx
- auth.ts
- export.ts
- validateExport.ts
- documentService.ts
- @types/express
- aiOperationsAssistant.ts
- scripts
- public.discrepancies
- package.json
- diagnose-lot-history-groq.ts
- validate-render.mjs
- 001_initial_schema.sql
- vite-env.d.ts
- groqStrictSchemaAudit.ts
- documentService.test.ts
- aiOperationsContext.ts
- LotDetailPage.tsx
- public.movements
- public.traceability_events
- DocumentsPage.tsx
- PapaStock — Project Context
- fold
- public.movements
- GPT OSS 20B
- supabase-data-api-exposure.md
- PapaStock
- 3. N01 — Movimiento de stock por lenguaje natural
- Installing Tailwind CSS as a Vite plugin
- Despliegue en Render
- PapaStock
- Button.tsx
- 14. Datos de demo
- 5. N03 — Compliance y exportación
- 11. Heurísticas y fallback
- 8. PostgreSQL
- public.stock_records
- 13. Reglas determinísticas
- 16. Persistencia — qué vive dónde
- 4. N02 — Discrepancias de stock
- 9. Infraestructura Render
- NewExportPage.tsx
- validateDispatch.ts
- vite
- StockVerificationForm.tsx
- 007_opening_balance.sql
- app.test.ts
- @types/react-dom
- Dataset Showcase
- groqStructured.ts
- @types/react
- 008_approved_opening_balances.sql
- public.movements

## God Nodes (most connected - your core abstractions)
1. `formatKg()` - 49 edges
2. `Lot` - 35 edges
3. `Movement` - 33 edges
4. `useAppData()` - 31 edges
5. `TraceabilityEvent` - 30 edges
6. `StockView` - 29 edges
7. `buildAiOperationsContext()` - 28 edges
8. `Button()` - 27 edges
9. `QuantityUnit` - 27 edges
10. `PapaStockSnapshot` - 26 edges

## Surprising Connections (you probably didn't know these)
- `LotStockFact` --references--> `QuantityUnit`  [EXTRACTED]
  server/services/aiOperationsFacts.ts → src/types/domain.ts
- `DerivedLotStockFact` --references--> `QuantityUnit`  [EXTRACTED]
  server/services/derivedOperationalFacts.ts → src/types/domain.ts
- `DerivedMovementFact` --references--> `QuantityUnit`  [EXTRACTED]
  server/services/derivedOperationalFacts.ts → src/types/domain.ts
- `DerivedTraceabilityFact` --references--> `QuantityUnit`  [EXTRACTED]
  server/services/derivedOperationalFacts.ts → src/types/domain.ts
- `parsedIntentSchema` --calls--> `expandLegacyIntent()`  [EXTRACTED]
  server/services/groqMovementIntent.ts → src/lib/movements.ts

## Import Cycles
- None detected.

## Communities (87 total, 13 thin omitted)

### Community 0 - "aiOperationsLotHistory.diagnostic.test.ts"
Cohesion: 0.18
Nodes (8): operationsAnswerSchema, snapshot, measureAiOperationsContext(), captureLotHistoryStructuredRequest(), PRODUCTION_LOT_HISTORY_TELEMETRY, showcaseOperationsSnapshot(), validAnswer, CapturedLotHistoryRequest

### Community 1 - "TraceabilityEvent"
Cohesion: 0.24
Nodes (7): baseFields, exportRequirements, initialTraceabilityEvents, lot, TraceabilityEvent, ExportRequirement, ExportValidationInput

### Community 2 - "groqMovementIntent.ts"
Cohesion: 0.18
Nodes (15): collectItems(), jsonSchema, locationIndex(), matchLocations(), MovementContext, movementItemSchema, normalize(), parsedIntentSchema (+7 more)

### Community 3 - "planillaImport.ts"
Cohesion: 0.12
Nodes (33): readWorkbookUpload(), cellAt(), cellText(), columnIndex(), defaultDestination(), defaultOrigin(), excelSerialToDate(), fileExtension() (+25 more)

### Community 4 - "domain.ts"
Cohesion: 0.05
Nodes (85): inferUnit(), jsonObject(), LegacyMovementMaterialization, LegacyMovementPlan, materializeLegacyMovementItemsInTestDatabase(), planLegacyMovementItems(), UnsupportedLegacyMovement, validUnit() (+77 more)

### Community 5 - "apiClient.ts"
Cohesion: 0.06
Nodes (51): submit(), PlanillaImportPanel(), confirm(), onFile(), CALIBERS, CATEGORIES, emptyForm, optionalNumber() (+43 more)

### Community 6 - "Structured Outputs"
Cohesion: 0.06
Nodes (31): [API Integration](https://console.groq.com/docs/structured-outputs\#api-integration), [API Response Validation](https://console.groq.com/docs/structured-outputs\#api-response-validation), [Best-effort Mode (`strict: false`)](https://console.groq.com/docs/structured-outputs\#besteffort-mode-strict-false), [Best Practices](https://console.groq.com/docs/structured-outputs\#best-practices), [Choosing Between Strict and Best-effort Mode](https://console.groq.com/docs/structured-outputs\#choosing-between-strict-and-besteffort-mode), [Email Classification](https://console.groq.com/docs/structured-outputs\#email-classification), [Error Handling](https://console.groq.com/docs/structured-outputs\#error-handling), [Examples](https://console.groq.com/docs/structured-outputs\#examples) (+23 more)

### Community 7 - "aiService.ts"
Cohesion: 0.10
Nodes (17): ConfirmDialog(), engineLabel(), LoadingLabel(), MissingDataPanel(), hardcodedDiscrepancyAnalysis(), kg(), aiService, httpAIService (+9 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, node, server, src, vite/client, vite.config.ts (+19 more)

### Community 11 - "formatQuantity"
Cohesion: 0.23
Nodes (14): MovementList(), MovementReceptionForm(), buildLotHistory(), eventLabels, locationName(), LotHistoryEntry, movementItemsOf(), movementPrimaryUnit() (+6 more)

### Community 12 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, supertest, tailwindcss, @tailwindcss/vite, tsup, @types/pg, @types/supertest, typescript (+13 more)

### Community 13 - "pool.ts"
Cohesion: 0.11
Nodes (15): assertProductionServerConfig(), config, DEFAULT_ALLOWED_ORIGINS, PapaStockConfig, parseAllowedOrigins(), checkDatabaseReadiness(), pool, requirePool() (+7 more)

### Community 14 - "RequirementChecklist.tsx"
Cohesion: 0.38
Nodes (5): groupByLot(), originLabel(), RequirementChecklist(), AnalysisEngine, RequirementResult

### Community 15 - "dataRepository.ts"
Cohesion: 0.05
Nodes (57): ShelfGrid(), occupiedKg(), WarehouseModelPanel(), isExplicitMockMode(), locations, lots, movements, shelfUnits (+49 more)

### Community 16 - "discrepancyHeuristic.ts"
Cohesion: 0.18
Nodes (14): analyzeWithHeuristic(), byRecent(), hypothesis(), movementEvidence(), analysisSchema, AnalyzerOptions, createDiscrepancyAnalyzer(), jsonSchema (+6 more)

### Community 17 - "dependencies"
Cohesion: 0.11
Nodes (19): express, lucide-react, dependencies, express, lucide-react, pg, react, react-dom (+11 more)

### Community 18 - "render-deploys.md"
Cohesion: 0.07
Nodes (27): Automatic deploys, Build command, Canceling a deploy, Configuring auto-deploys, Deploy steps, Deploying a specific commit, [Deploying on Render](https://render.com/docs/deploys), Deployment concepts (+19 more)

### Community 19 - "derivedOperationalFacts.ts"
Cohesion: 0.05
Nodes (45): CanonicalLotStockSource, LotStockFactSource, buildDerivedOperationalFacts(), buildLedgerFacts(), buildMovementFacts(), buildStockFacts(), buildTemporalFacts(), buildTraceabilityFacts() (+37 more)

### Community 20 - "app.ts"
Cohesion: 0.08
Nodes (23): correctionSchema, createApp(), discrepancyInputSchema, exportRequirementsInputSchema, idempotencyKeySchema, identifier, loginSchema, movementIntentSchema (+15 more)

### Community 21 - "showcaseDataset.ts"
Cohesion: 0.05
Nodes (41): loadLedgerVerifierInput(), QueryClient, verifyLedgerReadOnly(), verifyLedgerWithClient(), repositoryRoot, loadConfiguredDatabase(), MigrationCommandOptions, MigrationDatabase (+33 more)

### Community 22 - "Antes de presentar"
Cohesion: 0.08
Nodes (25): 1. Despertar el servicio, 2. Comprobar `/health`, 3. Comprobar la base de datos, 4. Comprobar que la UI no está en mock, 5. Comprobar Groq, 6. Comprobar los datos de A-204, 7. Comprobar el estado de A-310, Antes de presentar (+17 more)

### Community 23 - "formatKg"
Cohesion: 0.07
Nodes (51): StatCard(), useCountUp(), tick(), DocumentArticle(), DocumentFooter(), DocumentLetterhead(), DocumentProvenance(), CommercialTerms() (+43 more)

### Community 24 - "App.tsx"
Cohesion: 0.11
Nodes (19): App(), AppLayout(), inventory, NavItem, operations, overview, Sidebar(), sectionTitles (+11 more)

### Community 25 - "StockPage.tsx"
Cohesion: 0.26
Nodes (8): PaginationBar(), LIST_PAGE_SIZE, PageWindow, paginate(), visiblePages(), LotsPage(), StockPage(), tabRedirects

### Community 26 - "auth.ts"
Cohesion: 0.12
Nodes (16): AppDependencies, AuthIdentity, AuthOptions, AuthService, cookieValue(), createSameOriginGuard(), hashPassword(), isTrustedMutationOrigin() (+8 more)

### Community 27 - "export.ts"
Cohesion: 0.10
Nodes (23): DocumentService, CreateExportOperationRequest, CreateGeneratedDocumentRequest, DocumentCommercialFields, DocumentSnapshotRequirement, DocumentSnapshotTraceability, DocumentType, ExportField (+15 more)

### Community 28 - "validateExport.ts"
Cohesion: 0.37
Nodes (13): eventData(), eventLotId(), eventType(), formatEventDate(), getFieldSource(), getFieldValue(), latestTreatment(), readTreatmentProduct() (+5 more)

### Community 29 - "documentService.ts"
Cohesion: 0.17
Nodes (17): addUtcDays(), DerivedPacking, derivePacking(), shippingMarks(), buildExportDocumentItems(), commercialFrom(), ExportDocumentContext, latestEvent() (+9 more)

### Community 31 - "aiOperationsAssistant.ts"
Cohesion: 0.11
Nodes (29): AiOperationsOptions, attachEvidenceLabels(), canonicalEntities(), controlledRateLimitError(), controlledRequestTooLargeError(), createAiOperationsAssistant(), GLOBAL_AUTHORITY_CLAIMS, jsonSchema (+21 more)

### Community 32 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, auth:hash, build, check, db:migrate, db:seed, db:showcase, dev (+3 more)

### Community 33 - "public.discrepancies"
Cohesion: 0.46
Nodes (7): public.discrepancies, public.movement_items, public.stock_counts, public.movements, public.stock_records, public.locations, public.lots

### Community 34 - "package.json"
Cohesion: 0.25
Nodes (7): name, overrides, tsup, private, esbuild, type, version

### Community 35 - "diagnose-lot-history-groq.ts"
Cohesion: 0.17
Nodes (21): apiKey(), captureN01Schema(), clonePayload(), main(), minimalStrictSchema(), postGroq(), SafeGroqResult, syntheticLotHistoryUser() (+13 more)

### Community 36 - "validate-render.mjs"
Cohesion: 0.40
Nodes (3): blueprint, database, web

### Community 37 - "001_initial_schema.sql"
Cohesion: 0.50
Nodes (3): public.locations, public.lots, public

### Community 39 - "groqStrictSchemaAudit.ts"
Cohesion: 0.19
Nodes (12): CONSTRAINT_KEYWORDS, DISALLOWED_STRICT_KEYWORDS, DOCUMENTED_STRICT_KEYWORDS, GroqErrorDiagnostic, GroqStrictObjectFinding, GroqStrictSchemaAudit, isRecord(), looksLikeSchemaNode() (+4 more)

### Community 40 - "documentService.test.ts"
Cohesion: 0.16
Nodes (17): generateRemito(), NewExportPage(), analyze(), applyDestination(), buildContext(), confirmTraceability(), emit(), evaluate() (+9 more)

### Community 41 - "aiOperationsContext.ts"
Cohesion: 0.16
Nodes (17): AiOperationsContext, AiOperationsIntent, assertWithinLimit(), buildAiOperationsContext(), byId(), classifyIntent(), containsEntity(), CONTEXT_LIMITS (+9 more)

### Community 42 - "LotDetailPage.tsx"
Cohesion: 0.17
Nodes (14): icons, StatusBadge(), StatusTone, toneClasses, LotHeader(), DiscrepancyPanel(), labels, StockStatusBadge() (+6 more)

### Community 48 - "DocumentsPage.tsx"
Cohesion: 0.31
Nodes (6): EmptyState(), DocumentsPage(), filters, summarize(), typeMeta, NotFoundPage()

### Community 49 - "PapaStock — Project Context"
Cohesion: 0.12
Nodes (16): 10. Groq, 12. Fuente de datos, 15. Funcionalidades actuales, 17. Seguridad, 18. UI, 19. Testing, 1. Hackathon, 20. Pendientes (+8 more)

### Community 51 - "fold"
Cohesion: 0.30
Nodes (12): buildPlanillaImportPlan(), buildStockIntakePlan(), fold(), inferLocationType(), matchLocation(), matchLot(), materializePlanillaImport(), movementData() (+4 more)

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

### Community 61 - "Button.tsx"
Cohesion: 0.20
Nodes (11): Button(), ButtonVariant, variants, PageHeader(), WizardStep, QuickAccessItem, evidenceSourceLabel, examples (+3 more)

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

### Community 71 - "NewExportPage.tsx"
Cohesion: 0.18
Nodes (17): DEFAULT_COMMERCIAL, DEFAULT_PACKING, DESTINATION_DEFAULTS, DestinationCommercialDefaults, PAPASUD_EXPORTER, analyzeExportReadiness(), DocumentSnapshotInput, ExportLogistics (+9 more)

### Community 72 - "validateDispatch.ts"
Cohesion: 0.50
Nodes (3): DispatchValidationInput, validateDispatch(), attemptDispatch()

### Community 78 - "StockVerificationForm.tsx"
Cohesion: 0.19
Nodes (10): StockVerificationForm(), confirm(), todayIso(), buildStockVerificationPreview(), issue(), toStockVerificationConfirmation(), confirmStockVerification(), StockVerificationConfirmation (+2 more)

### Community 79 - "007_opening_balance.sql"
Cohesion: 0.25
Nodes (8): movement_items_keep_opening_balance_nonempty, movements_opening_balance_has_items, public.assert_opening_balance_has_items(), public.assert_opening_balance_movement_has_items(), public.movements, public.assert_opening_balance_has_items, public.assert_opening_balance_movement_has_items, public.movement_items

### Community 81 - "app.test.ts"
Cohesion: 0.17
Nodes (9): analyze, answerOperationsQuestion, app, auth, parseExportRequirements, parseMovementIntent, parseTraceabilityIntent, repository (+1 more)

### Community 83 - "Dataset Showcase"
Cohesion: 0.33
Nodes (5): Balance final reconstruible, Dataset Showcase, Ejecución segura, Secuencia, Visibilidad

### Community 84 - "groqStructured.ts"
Cohesion: 0.07
Nodes (40): requestWithSingleRateLimitRetry(), canonicalLabels, createExportRequirementsParser(), ExportRequirementsInput, jsonSchema, keywords, parseRequirementsWithHeuristic(), requirementsSchema (+32 more)

## Knowledge Gaps
- **426 isolated node(s):** `public.locations`, `h4b_expected_movements`, `h4b_expected_items`, `name`, `private` (+421 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Lot` connect `NewExportPage.tsx` to `TraceabilityEvent`, `groqMovementIntent.ts`, `planillaImport.ts`, `domain.ts`, `apiClient.ts`, `LotDetailPage.tsx`, `formatQuantity`, `RequirementChecklist.tsx`, `dataRepository.ts`, `showcaseDataset.ts`, `formatKg`, `export.ts`, `validateExport.ts`, `documentService.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `WarehouseModelPanel()` connect `dataRepository.ts` to `Button.tsx`, `formatKg`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `buildAiOperationsContext()` connect `aiOperationsContext.ts` to `aiOperationsLotHistory.diagnostic.test.ts`, `diagnose-lot-history-groq.ts`, `domain.ts`, `derivedOperationalFacts.ts`, `app.ts`, `showcaseDataset.ts`, `aiOperationsAssistant.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `public.locations`, `h4b_expected_movements`, `h4b_expected_items` to the rest of the system?**
  _426 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `planillaImport.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `domain.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05032258064516129 - nodes in this community are weakly interconnected._
- **Should `apiClient.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06101190476190476 - nodes in this community are weakly interconnected._