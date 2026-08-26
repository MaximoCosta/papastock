# Graph Report - papastock  (2026-08-24)

## Corpus Check
- 207 files · ~152,317 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1350 nodes · 3271 edges · 99 communities (84 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a1db8e10`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- migrationCommand.ts
- exportService.ts
- groqMovementIntent.ts
- planillaImport.ts
- domain.ts
- apiClient.ts
- Structured Outputs
- aiService.ts
- compilerOptions
- StockPage.tsx
- AppDataContext.tsx
- LotDetailPage.tsx
- devDependencies
- pool.ts
- RequirementChecklist.tsx
- dataRepository.ts
- discrepancyHeuristic.ts
- dependencies
- render-deploys.md
- ledgerVerifier.ts
- app.ts
- approvedOpeningBalances.postgres.test.ts
- Antes de presentar
- formatDate
- useAppData
- MovementsPanel.tsx
- auth.ts
- export.ts
- validateExport.ts
- documentService.ts
- @types/express
- aiOperationsAssistant.ts
- scripts
- public.discrepancies
- package.json
- Button.tsx
- validate-render.mjs
- 001_initial_schema.sql
- vite-env.d.ts
- groqStructured.ts
- NewExportPage
- aiOperationsContext.ts
- groqTraceabilityIntent.ts
- public.movements
- public.traceability_events
- showcaseCommand.ts
- PapaStock — Project Context
- groqExportRequirements.ts
- public.movements
- GPT OSS 20B
- supabase-data-api-exposure.md
- PapaStock
- 3. N01 — Movimiento de stock por lenguaje natural
- Installing Tailwind CSS as a Vite plugin
- Despliegue en Render
- PapaStock
- OperationsAssistantPage.tsx
- 14. Datos de demo
- 5. N03 — Compliance y exportación
- 11. Heurísticas y fallback
- 8. PostgreSQL
- public.stock_records
- 13. Reglas determinísticas
- 16. Persistencia — qué vive dónde
- 4. N02 — Discrepancias de stock
- 9. Infraestructura Render
- StockView
- openingBalance.postgres.test.ts
- vite
- migrationRunner.ts
- StockVerificationForm.tsx
- 007_opening_balance.sql
- aiOperationsAssistant.test.ts
- app.test.ts
- @types/react-dom
- Dataset Showcase
- Lot
- @types/react
- formatKg
- showcaseDataset.ts
- 008_approved_opening_balances.sql
- App.tsx
- formatters.ts
- public.movements
- DocumentPage.tsx
- aiOperationsFacts.ts
- documentService.test.ts
- StockStatusBadge.tsx
- StockControlWizard
- TransportersPage

## God Nodes (most connected - your core abstractions)
1. `formatKg()` - 49 edges
2. `Lot` - 35 edges
3. `useAppData()` - 31 edges
4. `Movement` - 30 edges
5. `StockView` - 29 edges
6. `Button()` - 27 edges
7. `TraceabilityEvent` - 27 edges
8. `formatDate()` - 24 edges
9. `apiUrl()` - 23 edges
10. `PapaStockSnapshot` - 22 edges

## Surprising Connections (you probably didn't know these)
- `LotStockFact` --references--> `QuantityUnit`  [EXTRACTED]
  server/services/aiOperationsFacts.ts → src/types/domain.ts
- `LocationSpec` --references--> `LocationType`  [EXTRACTED]
  server/services/planillaImport.ts → src/types/domain.ts
- `createApp()` --calls--> `getStockViews()`  [EXTRACTED]
  server/app.ts → src/services/stockService.ts
- `LegacyMovementMaterialization` --references--> `QuantityUnit`  [EXTRACTED]
  server/db/legacyMovementItems.ts → src/types/domain.ts
- `assertDomainPlans()` --calls--> `buildStockVerificationPreview()`  [EXTRACTED]
  server/db/showcaseDataset.ts → src/lib/stockVerification.ts

## Import Cycles
- None detected.

## Communities (99 total, 15 thin omitted)

### Community 0 - "migrationCommand.ts"
Cohesion: 0.24
Nodes (9): repositoryRoot, loadConfiguredDatabase(), MigrationCommandOptions, MigrationDatabase, ParsedMigrationCommand, parseMigrationCommandArgs(), runMigrationCommand(), MigrationSelection (+1 more)

### Community 1 - "exportService.ts"
Cohesion: 0.15
Nodes (13): baseFields, exportRequirements, analyzeExportReadiness(), buildDocumentSnapshot(), ExportLogistics, ExportReadinessInput, summarizeEvent(), toExportRequirements() (+5 more)

### Community 2 - "groqMovementIntent.ts"
Cohesion: 0.17
Nodes (17): collectItems(), createMovementIntentParser(), jsonSchema, locationIndex(), matchLocations(), MovementContext, movementItemSchema, normalize() (+9 more)

### Community 3 - "planillaImport.ts"
Cohesion: 0.09
Nodes (46): buildPlanillaImportFromFile(), buildPlanillaImportPlan(), buildStockIntakePlan(), cellAt(), cellText(), columnIndex(), defaultDestination(), defaultOrigin() (+38 more)

### Community 4 - "domain.ts"
Cohesion: 0.05
Nodes (93): inferUnit(), jsonObject(), LegacyMovementMaterialization, LegacyMovementPlan, materializeLegacyMovementItemsInTestDatabase(), planLegacyMovementItems(), UnsupportedLegacyMovement, validUnit() (+85 more)

### Community 5 - "apiClient.ts"
Cohesion: 0.07
Nodes (53): submit(), PlanillaImportPanel(), confirm(), onFile(), CALIBERS, CATEGORIES, emptyForm, optionalNumber() (+45 more)

### Community 6 - "Structured Outputs"
Cohesion: 0.06
Nodes (31): [API Integration](https://console.groq.com/docs/structured-outputs\#api-integration), [API Response Validation](https://console.groq.com/docs/structured-outputs\#api-response-validation), [Best-effort Mode (`strict: false`)](https://console.groq.com/docs/structured-outputs\#besteffort-mode-strict-false), [Best Practices](https://console.groq.com/docs/structured-outputs\#best-practices), [Choosing Between Strict and Best-effort Mode](https://console.groq.com/docs/structured-outputs\#choosing-between-strict-and-besteffort-mode), [Email Classification](https://console.groq.com/docs/structured-outputs\#email-classification), [Error Handling](https://console.groq.com/docs/structured-outputs\#error-handling), [Examples](https://console.groq.com/docs/structured-outputs\#examples) (+23 more)

### Community 7 - "aiService.ts"
Cohesion: 0.14
Nodes (13): ConfirmDialog(), engineLabel(), MissingDataPanel(), isExplicitMockMode(), hardcodedDiscrepancyAnalysis(), kg(), httpAIService, localTraceabilityFallback() (+5 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, node, server, src, vite/client, vite.config.ts (+19 more)

### Community 9 - "StockPage.tsx"
Cohesion: 0.24
Nodes (9): PageHeader(), PaginationBar(), LIST_PAGE_SIZE, PageWindow, paginate(), visiblePages(), LotsPage(), StockPage() (+1 more)

### Community 10 - "AppDataContext.tsx"
Cohesion: 0.23
Nodes (10): loadStoredDocuments(), persistDocuments(), AppDataContext, AppDataProvider(), TransporterInput, DemoSession, isDemoSession(), DemoSessionContext (+2 more)

### Community 11 - "LotDetailPage.tsx"
Cohesion: 0.16
Nodes (12): LoadingLabel(), DiscrepancyPanel(), DispatchValidationInput, validateDispatch(), LotDetailPage(), attemptDispatch(), generateRemito(), buildExportItems() (+4 more)

### Community 12 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, supertest, tailwindcss, @tailwindcss/vite, tsup, @types/pg, @types/supertest, typescript (+13 more)

### Community 13 - "pool.ts"
Cohesion: 0.16
Nodes (13): assertProductionServerConfig(), config, PapaStockConfig, checkDatabaseReadiness(), pool, requirePool(), verifyDatabaseConnection(), verifyDatabaseReadiness() (+5 more)

### Community 14 - "RequirementChecklist.tsx"
Cohesion: 0.38
Nodes (5): groupByLot(), originLabel(), RequirementChecklist(), AnalysisEngine, RequirementResult

### Community 15 - "dataRepository.ts"
Cohesion: 0.11
Nodes (25): locations, lots, movements, shelfUnits, shelves, stockRecords, GAPS, isDiscrepancy() (+17 more)

### Community 16 - "discrepancyHeuristic.ts"
Cohesion: 0.17
Nodes (15): analyzeWithHeuristic(), byRecent(), hypothesis(), movementEvidence(), analysisSchema, AnalyzerOptions, createDiscrepancyAnalyzer(), jsonSchema (+7 more)

### Community 17 - "dependencies"
Cohesion: 0.11
Nodes (19): express, lucide-react, dependencies, express, lucide-react, pg, react, react-dom (+11 more)

### Community 18 - "render-deploys.md"
Cohesion: 0.07
Nodes (27): Automatic deploys, Build command, Canceling a deploy, Configuring auto-deploys, Deploy steps, Deploying a specific commit, [Deploying on Render](https://render.com/docs/deploys), Deployment concepts (+19 more)

### Community 19 - "ledgerVerifier.ts"
Cohesion: 0.12
Nodes (17): coordinateKey(), LedgerBlockingCode, LedgerBlockingIssue, LedgerClassification, LedgerCoordinateResult, LedgerMovementInput, LedgerMovementItemInput, LedgerRecommendedAction (+9 more)

### Community 20 - "app.ts"
Cohesion: 0.09
Nodes (24): correctionSchema, createApp(), readWorkbookUpload(), discrepancyInputSchema, exportRequirementsInputSchema, idempotencyKeySchema, identifier, loginSchema (+16 more)

### Community 21 - "approvedOpeningBalances.postgres.test.ts"
Cohesion: 0.17
Nodes (9): loadLedgerVerifierInput(), QueryClient, verifyLedgerReadOnly(), verifyLedgerWithClient(), audit(), manifestPath, migrationsDirectory, root (+1 more)

### Community 22 - "Antes de presentar"
Cohesion: 0.08
Nodes (25): 1. Despertar el servicio, 2. Comprobar `/health`, 3. Comprobar la base de datos, 4. Comprobar que la UI no está en mock, 5. Comprobar Groq, 6. Comprobar los datos de A-204, 7. Comprobar el estado de A-310, Antes de presentar (+17 more)

### Community 23 - "formatDate"
Cohesion: 0.32
Nodes (15): DocumentArticle(), DocumentFooter(), DocumentLetterhead(), CommercialTerms(), DocumentItemsTable(), DocumentNotice(), fallbackItems(), PackingFacts() (+7 more)

### Community 24 - "useAppData"
Cohesion: 0.19
Nodes (9): AppLayout(), inventory, NavItem, operations, overview, Sidebar(), NewMovementPage(), StockControlPage() (+1 more)

### Community 25 - "MovementsPanel.tsx"
Cohesion: 0.22
Nodes (9): icons, StatusBadge(), StatusTone, toneClasses, MovementsPanel(), statusMeta(), TransporterProfileCard(), MovementsPage() (+1 more)

### Community 26 - "auth.ts"
Cohesion: 0.14
Nodes (12): AuthIdentity, AuthOptions, AuthService, cookieValue(), hashPassword(), passwordParts(), Permission, requireAuthentication() (+4 more)

### Community 27 - "export.ts"
Cohesion: 0.11
Nodes (20): DocumentService, CreateGeneratedDocumentRequest, DocumentCommercialFields, DocumentSnapshotRequirement, DocumentSnapshotTraceability, DocumentType, ExportOperationResponse, ExportStatus (+12 more)

### Community 28 - "validateExport.ts"
Cohesion: 0.37
Nodes (13): eventData(), eventLotId(), eventType(), formatEventDate(), getFieldSource(), getFieldValue(), latestTreatment(), readTreatmentProduct() (+5 more)

### Community 29 - "documentService.ts"
Cohesion: 0.14
Nodes (22): ExportCommercialValues, ExportForm(), changeLot(), updateLine(), DEFAULT_COMMERCIAL, DEFAULT_PACKING, DESTINATION_DEFAULTS, DestinationCommercialDefaults (+14 more)

### Community 31 - "aiOperationsAssistant.ts"
Cohesion: 0.22
Nodes (12): AiOperationsOptions, canonicalEntities(), controlledRateLimitError(), controlledRequestTooLargeError(), createAiOperationsAssistant(), GLOBAL_AUTHORITY_CLAIMS, jsonSchema, logControlledUpstreamError() (+4 more)

### Community 32 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, auth:hash, build, check, db:migrate, db:seed, db:showcase, dev (+3 more)

### Community 33 - "public.discrepancies"
Cohesion: 0.46
Nodes (7): public.discrepancies, public.movement_items, public.stock_counts, public.movements, public.stock_records, public.locations, public.lots

### Community 34 - "package.json"
Cohesion: 0.25
Nodes (7): name, overrides, tsup, private, esbuild, type, version

### Community 35 - "Button.tsx"
Cohesion: 0.18
Nodes (11): Button(), ButtonVariant, variants, EmptyState(), DashboardPage(), QuickAccessItem, DocumentsPage(), filters (+3 more)

### Community 36 - "validate-render.mjs"
Cohesion: 0.40
Nodes (3): blueprint, database, web

### Community 37 - "001_initial_schema.sql"
Cohesion: 0.50
Nodes (3): public.locations, public.lots, public

### Community 39 - "groqStructured.ts"
Cohesion: 0.17
Nodes (14): requestWithSingleRateLimitRetry(), GroqHttpError, GroqRequestBodyLimitError, parseRetryAfter(), parseSafeError(), RATE_LIMIT_HEADERS, requestStructuredOutput(), SAFE_ERROR_HEADERS (+6 more)

### Community 40 - "NewExportPage"
Cohesion: 0.31
Nodes (10): NewExportPage(), analyze(), applyDestination(), buildContext(), confirmTraceability(), emit(), evaluate(), logistics() (+2 more)

### Community 41 - "aiOperationsContext.ts"
Cohesion: 0.24
Nodes (13): assertWithinLimit(), buildAiOperationsContext(), byId(), classifyIntent(), containsEntity(), CONTEXT_LIMITS, GENERAL_SELECTION_LIMITS, measureAiOperationsContext() (+5 more)

### Community 42 - "groqTraceabilityIntent.ts"
Cohesion: 0.18
Nodes (13): AppDependencies, GroqOptions, createTraceabilityIntentParser(), extractDate(), extractProduct(), intentSchema, isRealCalendarDate(), jsonSchema (+5 more)

### Community 48 - "showcaseCommand.ts"
Cohesion: 0.31
Nodes (6): loadConfiguredDatabase(), parseShowcaseCommandArgs(), runShowcaseCommand(), ShowcaseCommandOptions, ShowcaseDatabase, ShowcaseDatasetResult

### Community 49 - "PapaStock — Project Context"
Cohesion: 0.12
Nodes (16): 10. Groq, 12. Fuente de datos, 15. Funcionalidades actuales, 17. Seguridad, 18. UI, 19. Testing, 1. Hackathon, 20. Pendientes (+8 more)

### Community 51 - "groqExportRequirements.ts"
Cohesion: 0.13
Nodes (15): canonicalLabels, createExportRequirementsParser(), ExportRequirementsInput, jsonSchema, keywords, parseRequirementsWithHeuristic(), requirementsSchema, hangingFetch (+7 more)

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

### Community 61 - "OperationsAssistantPage.tsx"
Cohesion: 0.17
Nodes (12): examples, OperationsAssistantPage(), submit(), qualityLabel, askOperationsAssistant(), OperationsAssistantAnswer, OperationsAssistantEntity, OperationsAssistantEvidence (+4 more)

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

### Community 71 - "StockView"
Cohesion: 0.14
Nodes (11): WizardStep, occupiedKg(), WarehouseModelPanel(), aiService, stock, AddShelfUnitInput, AppDataContextValue, Shelf (+3 more)

### Community 72 - "openingBalance.postgres.test.ts"
Cohesion: 0.32
Nodes (5): insertOpeningHeader(), insertOpeningItem(), insertValidOpeningBalance(), migrationsDirectory, OpeningHeaderOptions

### Community 78 - "StockVerificationForm.tsx"
Cohesion: 0.24
Nodes (5): PlanillaStockTemplate(), StockVerificationForm(), confirm(), todayIso(), formatSignedKg()

### Community 79 - "007_opening_balance.sql"
Cohesion: 0.25
Nodes (8): movement_items_keep_opening_balance_nonempty, movements_opening_balance_has_items, public.assert_opening_balance_has_items(), public.assert_opening_balance_movement_has_items(), public.movements, public.assert_opening_balance_has_items, public.assert_opening_balance_movement_has_items, public.movement_items

### Community 81 - "app.test.ts"
Cohesion: 0.17
Nodes (9): analyze, answerOperationsQuestion, app, auth, parseExportRequirements, parseMovementIntent, parseTraceabilityIntent, repository (+1 more)

### Community 83 - "Dataset Showcase"
Cohesion: 0.33
Nodes (5): Balance final reconstruible, Dataset Showcase, Ejecución segura, Secuencia, Visibilidad

### Community 84 - "Lot"
Cohesion: 0.16
Nodes (16): initialTraceabilityEvents, DerivedPacking, lot, NormalizedSnapshot, ExportDocumentContext, RemitoInput, DocumentSnapshotInput, Lot (+8 more)

### Community 86 - "formatKg"
Cohesion: 0.30
Nodes (10): StatCard(), useCountUp(), tick(), PlanillaConteoTemplate(), ExportSummary(), LocationsPanel(), ShelfGrid(), formatKg() (+2 more)

### Community 87 - "showcaseDataset.ts"
Cohesion: 0.27
Nodes (10): applyShowcaseDataset(), assertDomainPlans(), assertExact(), assertLocations(), canonical(), insertManifest(), QueryClient, readCurrent() (+2 more)

### Community 89 - "App.tsx"
Cohesion: 0.24
Nodes (7): App(), sectionTitles, Topbar(), LocationsPage(), LoginPage(), WarehousePage(), useDemoSession()

### Community 90 - "formatters.ts"
Cohesion: 0.21
Nodes (8): eventLabels, getDetail(), TraceabilityTimeline(), compactDateFormatter, currencyFormatter, formatCompactDate(), numberFormatter, shortDateFormatter

### Community 93 - "DocumentPage.tsx"
Cohesion: 0.27
Nodes (8): DocumentProvenance(), ListaEmpaqueTemplate(), RemitoTemplate(), DocumentPage(), packLabel, packOrder, snapshotOf(), documentOperationId()

### Community 94 - "aiOperationsFacts.ts"
Cohesion: 0.31
Nodes (7): AiOperationsContext, buildCanonicalLotStockAnswer(), buildLotStockFacts(), factSentence(), LotStockFact, LotStockLocationFact, snapshot

### Community 95 - "documentService.test.ts"
Cohesion: 0.38
Nodes (5): transporters, a310, h118, operationFor(), buildExportOperation()

### Community 96 - "StockStatusBadge.tsx"
Cohesion: 0.40
Nodes (4): LotHeader(), labels, StockStatusBadge(), StockStatus

## Knowledge Gaps
- **398 isolated node(s):** `public.locations`, `h4b_expected_movements`, `h4b_expected_items`, `name`, `private` (+393 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatKg()` connect `formatKg` to `StockControlWizard`, `TransportersPage`, `Button.tsx`, `apiClient.ts`, `StockView`, `LotDetailPage.tsx`, `StockVerificationForm.tsx`, `Lot`, `DocumentPage.tsx`, `formatDate`, `MovementsPanel.tsx`, `formatters.ts`, `validateExport.ts`, `documentService.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `Lot` connect `Lot` to `StockStatusBadge.tsx`, `exportService.ts`, `groqMovementIntent.ts`, `planillaImport.ts`, `domain.ts`, `apiClient.ts`, `StockView`, `AppDataContext.tsx`, `RequirementChecklist.tsx`, `dataRepository.ts`, `showcaseDataset.ts`, `MovementsPanel.tsx`, `export.ts`, `validateExport.ts`, `documentService.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `runMigrations()` connect `migrationRunner.ts` to `migrationCommand.ts`, `openingBalance.postgres.test.ts`, `approvedOpeningBalances.postgres.test.ts`, `showcaseDataset.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `public.locations`, `h4b_expected_movements`, `h4b_expected_items` to the rest of the system?**
  _398 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `planillaImport.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09176470588235294 - nodes in this community are weakly interconnected._
- **Should `domain.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05054360397871848 - nodes in this community are weakly interconnected._
- **Should `apiClient.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06586538461538462 - nodes in this community are weakly interconnected._