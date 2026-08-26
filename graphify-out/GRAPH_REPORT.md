# Graph Report - papastock  (2026-08-26)

## Corpus Check
- 220 files · ~170,144 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1489 nodes · 3656 edges · 97 communities (85 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0153767a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- papaStockRepository.ts
- export.ts
- dataRepository.ts
- planillaImport.ts
- ledgerVerifier.ts
- StockIntakeForm.tsx
- Structured Outputs
- aiService.ts
- compilerOptions
- public.transporters
- public.stock_records
- LotDetailPage.tsx
- devDependencies
- demoStockPresentation.ts
- DocumentService
- AppDataContext.tsx
- discrepancyHeuristic.ts
- dependencies
- render-deploys.md
- derivedOperationalFacts.ts
- app.ts
- showcaseDataset.ts
- Antes de presentar
- DocumentPage.tsx
- DemoSessionContext.tsx
- StockPage.tsx
- createApp
- formatKg
- validateExport.ts
- documentService.ts
- apiClient.ts
- aiOperationsAssistant.ts
- scripts
- public.discrepancies
- package.json
- groqMovementIntent.ts
- validate-render.mjs
- 001_initial_schema.sql
- vite-env.d.ts
- NewMovementPage.tsx
- NewExportPage
- aiOperationsContext.ts
- Button.tsx
- public.movements
- public.traceability_events
- StockView
- PapaStock — Project Context
- formatQuantity
- public.movements
- GPT OSS 20B
- supabase-data-api-exposure.md
- PapaStock
- 3. N01 — Movimiento de stock por lenguaje natural
- Installing Tailwind CSS as a Vite plugin
- Despliegue en Render
- PapaStock
- App.tsx
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
- stockService.ts
- formatters.ts
- StockControlWizard.tsx
- MovementReceptionForm.tsx
- 007_opening_balance.sql
- domain.ts
- app.test.ts
- operationsAssistantService.ts
- Dataset Showcase
- groqStructured.ts
- loadPapaStockSnapshot
- @vitejs/plugin-react
- tsup
- 008_approved_opening_balances.sql
- quantity.ts
- vitest
- public.movements
- pool.ts
- stockTransfer.ts
- ExportForm
- Sidebar.tsx

## God Nodes (most connected - your core abstractions)
1. `formatKg()` - 49 edges
2. `Lot` - 35 edges
3. `Movement` - 35 edges
4. `TraceabilityEvent` - 32 edges
5. `useAppData()` - 31 edges
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
- `LocationSpec` --references--> `LocationType`  [EXTRACTED]
  server/services/planillaImport.ts → src/types/domain.ts

## Import Cycles
- None detected.

## Communities (97 total, 12 thin omitted)

### Community 0 - "papaStockRepository.ts"
Cohesion: 0.07
Nodes (53): inferUnit(), jsonObject(), LegacyMovementMaterialization, LegacyMovementPlan, materializeLegacyMovementItemsInTestDatabase(), planLegacyMovementItems(), UnsupportedLegacyMovement, validUnit() (+45 more)

### Community 1 - "export.ts"
Cohesion: 0.12
Nodes (18): groupByLot(), originLabel(), RequirementChecklist(), AnalysisEngine, CreateGeneratedDocumentRequest, DocumentSnapshotRequirement, DocumentSnapshotTraceability, ExportLotLine (+10 more)

### Community 2 - "dataRepository.ts"
Cohesion: 0.18
Nodes (24): MovementContext, StockCountPlan, shelfUnits, shelves, DataSource, mockSnapshot(), PapaStockSnapshot, SnapshotResult (+16 more)

### Community 3 - "planillaImport.ts"
Cohesion: 0.10
Nodes (46): readWorkbookUpload(), buildPlanillaImportFromFile(), buildPlanillaImportPlan(), buildStockIntakePlan(), cellAt(), cellText(), columnIndex(), defaultDestination() (+38 more)

### Community 4 - "ledgerVerifier.ts"
Cohesion: 0.11
Nodes (17): LOCATIONS, LOTS, SHOW_001_STOCK, coordinateKey(), LedgerBlockingCode, LedgerBlockingIssue, LedgerMovementInput, LedgerMovementItemInput (+9 more)

### Community 5 - "StockIntakeForm.tsx"
Cohesion: 0.14
Nodes (16): CALIBERS, CATEGORIES, emptyForm, optionalNumber(), PLANILLA_DESTINATIONS, PLANILLA_ORIGINS, StockIntakeForm(), confirm() (+8 more)

### Community 6 - "Structured Outputs"
Cohesion: 0.06
Nodes (31): [API Integration](https://console.groq.com/docs/structured-outputs\#api-integration), [API Response Validation](https://console.groq.com/docs/structured-outputs\#api-response-validation), [Best-effort Mode (`strict: false`)](https://console.groq.com/docs/structured-outputs\#besteffort-mode-strict-false), [Best Practices](https://console.groq.com/docs/structured-outputs\#best-practices), [Choosing Between Strict and Best-effort Mode](https://console.groq.com/docs/structured-outputs\#choosing-between-strict-and-besteffort-mode), [Email Classification](https://console.groq.com/docs/structured-outputs\#email-classification), [Error Handling](https://console.groq.com/docs/structured-outputs\#error-handling), [Examples](https://console.groq.com/docs/structured-outputs\#examples) (+23 more)

### Community 7 - "aiService.ts"
Cohesion: 0.13
Nodes (14): ConfirmDialog(), engineLabel(), MissingDataPanel(), aiService, httpAIService, localTraceabilityFallback(), monthNumbers, parseDate() (+6 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, node, server, src, vite/client, vite.config.ts (+19 more)

### Community 11 - "LotDetailPage.tsx"
Cohesion: 0.14
Nodes (16): icons, StatusBadge(), StatusTone, toneClasses, LotHeader(), MovementList(), DiscrepancyPanel(), labels (+8 more)

### Community 12 - "devDependencies"
Cohesion: 0.09
Nodes (23): devDependencies, supertest, tailwindcss, @tailwindcss/vite, @types/express, @types/pg, @types/react, @types/react-dom (+15 more)

### Community 13 - "demoStockPresentation.ts"
Cohesion: 0.16
Nodes (13): initialTraceabilityEvents, transporters, DEMO_TRACE_IDS, GAPS, isDiscrepancy(), lotCodeById(), ORAL_DEMO_DISCREPANCIES, presentStockForOralDemo() (+5 more)

### Community 14 - "DocumentService"
Cohesion: 0.23
Nodes (8): DocumentService, DocumentCommercialFields, FacturaDocument, GeneratedDocumentBase, ListaEmpaqueDocument, PlanillaStockDocument, ProformaDocument, RemitoDocument

### Community 15 - "AppDataContext.tsx"
Cohesion: 0.16
Nodes (21): isExplicitMockMode(), insertTraceabilityEvent(), apiRequest(), apiRequestVoid(), assignStockToShelfRemote(), createShelfUnit(), createTransporter(), deleteShelfUnitRemote() (+13 more)

### Community 16 - "discrepancyHeuristic.ts"
Cohesion: 0.17
Nodes (16): analyzeWithHeuristic(), byRecent(), DiscrepancyInput, hypothesis(), movementEvidence(), analysisSchema, AnalyzerOptions, createDiscrepancyAnalyzer() (+8 more)

### Community 17 - "dependencies"
Cohesion: 0.10
Nodes (21): express, http-proxy-middleware, lucide-react, dependencies, express, http-proxy-middleware, lucide-react, pg (+13 more)

### Community 18 - "render-deploys.md"
Cohesion: 0.07
Nodes (27): Automatic deploys, Build command, Canceling a deploy, Configuring auto-deploys, Deploy steps, Deploying a specific commit, [Deploying on Render](https://render.com/docs/deploys), Deployment concepts (+19 more)

### Community 19 - "derivedOperationalFacts.ts"
Cohesion: 0.09
Nodes (28): CanonicalLotStockSource, LotStockFactSource, buildDerivedOperationalFacts(), buildLedgerFacts(), buildMovementFacts(), buildStockFacts(), buildTemporalFacts(), buildTraceabilityFacts() (+20 more)

### Community 20 - "app.ts"
Cohesion: 0.09
Nodes (20): correctionSchema, discrepancyInputSchema, exportRequirementsInputSchema, idempotencyKeySchema, identifier, loginSchema, movementIntentSchema, movementItemInputSchema (+12 more)

### Community 21 - "showcaseDataset.ts"
Cohesion: 0.05
Nodes (40): loadLedgerVerifierInput(), QueryClient, verifyLedgerReadOnly(), verifyLedgerWithClient(), loadConfiguredDatabase(), MigrationCommandOptions, MigrationDatabase, ParsedMigrationCommand (+32 more)

### Community 22 - "Antes de presentar"
Cohesion: 0.07
Nodes (26): 1. Despertar el servicio, 2. Comprobar `/health`, 3. Comprobar la base de datos, 4. Comprobar que la UI no está en mock, 5. Comprobar Groq, 6. Comprobar los datos de A-204, 7. Comprobar el estado de A-310, Antes de presentar (+18 more)

### Community 23 - "DocumentPage.tsx"
Cohesion: 0.18
Nodes (25): DocumentArticle(), DocumentFooter(), DocumentLetterhead(), DocumentProvenance(), CommercialTerms(), DocumentItemsTable(), DocumentNotice(), fallbackItems() (+17 more)

### Community 24 - "DemoSessionContext.tsx"
Cohesion: 0.39
Nodes (6): apiFetch(), DemoSession, isDemoSession(), DemoSessionContext, DemoSessionContextValue, DemoSessionProvider()

### Community 25 - "StockPage.tsx"
Cohesion: 0.26
Nodes (8): PaginationBar(), LIST_PAGE_SIZE, PageWindow, paginate(), visiblePages(), LotsPage(), StockPage(), tabRedirects

### Community 26 - "createApp"
Cohesion: 0.11
Nodes (17): createApp(), AuthIdentity, AuthOptions, AuthService, cookieValue(), createSameOriginGuard(), hashPassword(), isTrustedMutationOrigin() (+9 more)

### Community 27 - "formatKg"
Cohesion: 0.16
Nodes (14): StatCard(), useCountUp(), tick(), PlanillaConteoTemplate(), ExportSummary(), LocationsPanel(), PlanillaImportPanel(), confirm() (+6 more)

### Community 28 - "validateExport.ts"
Cohesion: 0.41
Nodes (12): eventData(), eventLotId(), eventType(), formatEventDate(), getFieldSource(), getFieldValue(), latestTreatment(), readTreatmentProduct() (+4 more)

### Community 29 - "documentService.ts"
Cohesion: 0.17
Nodes (17): addUtcDays(), DerivedPacking, derivePacking(), shippingMarks(), generateRemito(), buildExportDocumentItems(), buildExportItems(), commercialFrom() (+9 more)

### Community 30 - "apiClient.ts"
Cohesion: 0.21
Nodes (14): remoteSnapshot, ApiRequestOptions, apiUrl(), asId(), asNumber(), asRecord(), asText(), normalizeDiscrepancyAnalysis() (+6 more)

### Community 31 - "aiOperationsAssistant.ts"
Cohesion: 0.12
Nodes (21): AiOperationsOptions, attachEvidenceLabels(), canonicalEntities(), controlledRateLimitError(), controlledRequestTooLargeError(), createAiOperationsAssistant(), GLOBAL_AUTHORITY_CLAIMS, heuristicFallbackReason() (+13 more)

### Community 32 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, auth:hash, build, check, db:migrate, db:seed, db:showcase, dev (+3 more)

### Community 33 - "public.discrepancies"
Cohesion: 0.46
Nodes (7): public.discrepancies, public.movement_items, public.stock_counts, public.movements, public.stock_records, public.locations, public.lots

### Community 34 - "package.json"
Cohesion: 0.25
Nodes (7): name, overrides, tsup, private, esbuild, type, version

### Community 35 - "groqMovementIntent.ts"
Cohesion: 0.07
Nodes (48): apiKey(), captureN01Schema(), clonePayload(), main(), minimalStrictSchema(), postGroq(), SafeGroqResult, syntheticLotHistoryUser() (+40 more)

### Community 36 - "validate-render.mjs"
Cohesion: 0.40
Nodes (3): blueprint, database, web

### Community 37 - "001_initial_schema.sql"
Cohesion: 0.50
Nodes (3): public.locations, public.lots, public

### Community 39 - "NewMovementPage.tsx"
Cohesion: 0.23
Nodes (13): NewMovementPage(), analyzeOrder(), persistMovement(), asValidationErrors(), movementIntentBody(), normalizeMovementInterpretation(), normalizeTransferPreview(), confirmMovement() (+5 more)

### Community 40 - "NewExportPage"
Cohesion: 0.31
Nodes (10): NewExportPage(), analyze(), applyDestination(), buildContext(), confirmTraceability(), emit(), evaluate(), logistics() (+2 more)

### Community 41 - "aiOperationsContext.ts"
Cohesion: 0.20
Nodes (16): assertWithinLimit(), buildAiOperationsContext(), byId(), classifyIntent(), containsEntity(), CONTEXT_LIMITS, GENERAL_SELECTION_LIMITS, measureAiOperationsContext() (+8 more)

### Community 42 - "Button.tsx"
Cohesion: 0.20
Nodes (8): Button(), ButtonVariant, variants, LoadingLabel(), MovementsPanel(), statusMeta(), TransporterProfileCard(), emptyForm

### Community 48 - "StockView"
Cohesion: 0.17
Nodes (6): hardcodedDiscrepancyAnalysis(), kg(), stock, lot, StockControlCorrection, StockView

### Community 49 - "PapaStock — Project Context"
Cohesion: 0.12
Nodes (16): 10. Groq, 12. Fuente de datos, 15. Funcionalidades actuales, 17. Seguridad, 18. UI, 19. Testing, 1. Hackathon, 20. Pendientes (+8 more)

### Community 51 - "formatQuantity"
Cohesion: 0.14
Nodes (19): buildCanonicalLotStockAnswer(), buildLotStockFacts(), factSentence(), LotStockFact, LotStockLocationFact, snapshot, buildHeuristicOperationsAnswer(), entitiesFrom() (+11 more)

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

### Community 61 - "App.tsx"
Cohesion: 0.11
Nodes (23): EmptyState(), PageHeader(), AppLayout(), DashboardPage(), QuickAccessItem, DocumentsPage(), filters, summarize() (+15 more)

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
Cohesion: 0.12
Nodes (19): ExportCommercialValues, DEFAULT_COMMERCIAL, DEFAULT_PACKING, DESTINATION_DEFAULTS, DestinationCommercialDefaults, PAPASUD_EXPORTER, baseFields, exportRequirements (+11 more)

### Community 72 - "stockService.ts"
Cohesion: 0.19
Nodes (8): locations, lots, movements, stockRecords, records, getStockStatus(), getStockViews(), StockStatus

### Community 73 - "formatters.ts"
Cohesion: 0.21
Nodes (8): eventLabels, getDetail(), TraceabilityTimeline(), compactDateFormatter, currencyFormatter, formatCompactDate(), numberFormatter, shortDateFormatter

### Community 74 - "StockControlWizard.tsx"
Cohesion: 0.12
Nodes (9): StockControlWizard(), WizardStep, StockVerificationForm(), confirm(), todayIso(), formatSignedKg(), mockDocumentService, confirmStockVerification() (+1 more)

### Community 78 - "MovementReceptionForm.tsx"
Cohesion: 0.60
Nodes (4): MovementReceptionForm(), submit(), movementPrimaryUnit(), receiveMovement()

### Community 79 - "007_opening_balance.sql"
Cohesion: 0.25
Nodes (8): movement_items_keep_opening_balance_nonempty, movements_opening_balance_has_items, public.assert_opening_balance_has_items(), public.assert_opening_balance_movement_has_items(), public.movements, public.assert_opening_balance_has_items, public.assert_opening_balance_movement_has_items, public.movement_items

### Community 80 - "domain.ts"
Cohesion: 0.14
Nodes (21): showcaseManifest, PRODUCTION_LOT_HISTORY_TELEMETRY, validAnswer, LotCorrectionPlan, buildReceptionPlan(), ReceptionPlan, movement, fixtureAudit() (+13 more)

### Community 81 - "app.test.ts"
Cohesion: 0.17
Nodes (9): analyze, answerOperationsQuestion, app, auth, parseExportRequirements, parseMovementIntent, parseTraceabilityIntent, repository (+1 more)

### Community 82 - "operationsAssistantService.ts"
Cohesion: 0.39
Nodes (7): evidenceLabel(), OperationsAssistantPage(), submit(), askOperationsAssistant(), asText(), loadOperationsAssistantStatus(), normalizeOperationsAnswer()

### Community 83 - "Dataset Showcase"
Cohesion: 0.33
Nodes (5): Balance final reconstruible, Dataset Showcase, Ejecución segura, Secuencia, Visibilidad

### Community 84 - "groqStructured.ts"
Cohesion: 0.06
Nodes (42): AppDependencies, requestWithSingleRateLimitRetry(), canonicalLabels, createExportRequirementsParser(), ExportRequirementsInput, jsonSchema, keywords, parseRequirementsWithHeuristic() (+34 more)

### Community 85 - "loadPapaStockSnapshot"
Cohesion: 0.50
Nodes (4): emptySnapshot(), errorMessage(), isSnapshot(), loadPapaStockSnapshot()

### Community 89 - "quantity.ts"
Cohesion: 0.23
Nodes (11): StockTable(), VarietyStockPanel(), QUANTITY_UNITS, stockUnit(), unitLabel(), aggregateStockByVarietyLocationUnit(), VarietyLocationTotal, getStockAlert() (+3 more)

### Community 93 - "pool.ts"
Cohesion: 0.10
Nodes (17): assertProductionServerConfig(), config, DEFAULT_ALLOWED_ORIGINS, groqRuntimeStatus(), PapaStockConfig, parseAllowedOrigins(), repositoryRoot, checkDatabaseReadiness() (+9 more)

### Community 96 - "stockTransfer.ts"
Cohesion: 0.28
Nodes (9): buildStockCountPlan(), buildStockTransferPreview(), cloneStock(), emptyStock(), normalize(), snapshot, recordMatchesUnit(), stockKey() (+1 more)

### Community 98 - "ExportForm"
Cohesion: 0.67
Nodes (3): ExportForm(), changeLot(), updateLine()

### Community 100 - "Sidebar.tsx"
Cohesion: 0.16
Nodes (10): App(), inventory, NavItem, operations, overview, Sidebar(), sectionTitles, Topbar() (+2 more)

## Knowledge Gaps
- **429 isolated node(s):** `public.locations`, `h4b_expected_movements`, `h4b_expected_items`, `name`, `private` (+424 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `runMigrations()` connect `showcaseDataset.ts` to `pool.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `Lot` connect `dataRepository.ts` to `papaStockRepository.ts`, `stockTransfer.ts`, `export.ts`, `groqMovementIntent.ts`, `planillaImport.ts`, `NewExportPage.tsx`, `stockService.ts`, `Button.tsx`, `LotDetailPage.tsx`, `demoStockPresentation.ts`, `AppDataContext.tsx`, `domain.ts`, `showcaseDataset.ts`, `validateExport.ts`, `documentService.ts`, `apiClient.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `buildAiOperationsContext()` connect `aiOperationsContext.ts` to `groqMovementIntent.ts`, `ledgerVerifier.ts`, `domain.ts`, `derivedOperationalFacts.ts`, `app.ts`, `showcaseDataset.ts`, `formatQuantity`, `quantity.ts`, `createApp`, `aiOperationsAssistant.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `public.locations`, `h4b_expected_movements`, `h4b_expected_items` to the rest of the system?**
  _429 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `papaStockRepository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06523855890944498 - nodes in this community are weakly interconnected._
- **Should `export.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._
- **Should `planillaImport.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09898242368177614 - nodes in this community are weakly interconnected._