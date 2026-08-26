# Graph Report - papastock  (2026-08-26)

## Corpus Check
- 220 files · ~168,527 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1480 nodes · 3613 edges · 107 communities (90 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2a528096`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- papaStockRepository.ts
- TraceabilityEvent
- Lot
- planillaImport.ts
- PapaStockRepository
- apiClient.ts
- Structured Outputs
- aiService.ts
- compilerOptions
- public.transporters
- public.stock_records
- LotDetailPage.tsx
- devDependencies
- config.ts
- NewExportPage.tsx
- dataRepository.ts
- discrepancyHeuristic.ts
- dependencies
- render-deploys.md
- derivedOperationalFacts.ts
- app.ts
- approvedOpeningBalances.postgres.test.ts
- Antes de presentar
- export.ts
- App.tsx
- StockPage.tsx
- createApp
- domain.ts
- validateExport.ts
- documentService.ts
- @types/express
- aiOperationsAssistant.ts
- scripts
- public.discrepancies
- package.json
- groqMovementIntent.ts
- validate-render.mjs
- 001_initial_schema.sql
- vite-env.d.ts
- ledgerVerifier.ts
- NewExportPage
- aiOperationsContext.ts
- ExportForm.tsx
- public.movements
- public.traceability_events
- DocumentsPage.tsx
- PapaStock — Project Context
- aiOperationsFacts.ts
- public.movements
- GPT OSS 20B
- supabase-data-api-exposure.md
- PapaStock
- 3. N01 — Movimiento de stock por lenguaje natural
- Installing Tailwind CSS as a Vite plugin
- Despliegue en Render
- PapaStock
- useAppData
- 14. Datos de demo
- 5. N03 — Compliance y exportación
- 11. Heurísticas y fallback
- 8. PostgreSQL
- public.stock_records
- 13. Reglas determinísticas
- 16. Persistencia — qué vive dónde
- 4. N02 — Discrepancias de stock
- 9. Infraestructura Render
- exportService.ts
- planillaImport.test.ts
- vite
- formatQuantity
- StockVerificationForm.tsx
- 007_opening_balance.sql
- movementReception.ts
- app.test.ts
- @types/react-dom
- Dataset Showcase
- groqStructured.ts
- @types/react
- migrationRunner.ts
- AuthService
- 008_approved_opening_balances.sql
- legacyMovementItems.ts
- migrationCommand.ts
- public.movements
- pool.ts
- showcaseCommand.ts
- showcaseDataset.ts
- stockTransfer.ts
- openingBalance.postgres.test.ts
- documentPacking.ts
- MissingDataPanel.tsx
- Sidebar.tsx
- demoStockPresentation.ts
- documentService.test.ts
- migrationRunner.test.ts
- WarehouseModelPanel
- ExportForm
- TransportersPage

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
- `LegacyMovementMaterialization` --references--> `QuantityUnit`  [EXTRACTED]
  server/db/legacyMovementItems.ts → src/types/domain.ts
- `LotStockFact` --references--> `QuantityUnit`  [EXTRACTED]
  server/services/aiOperationsFacts.ts → src/types/domain.ts
- `DerivedLotStockFact` --references--> `QuantityUnit`  [EXTRACTED]
  server/services/derivedOperationalFacts.ts → src/types/domain.ts
- `DerivedMovementFact` --references--> `QuantityUnit`  [EXTRACTED]
  server/services/derivedOperationalFacts.ts → src/types/domain.ts
- `DerivedTraceabilityFact` --references--> `QuantityUnit`  [EXTRACTED]
  server/services/derivedOperationalFacts.ts → src/types/domain.ts

## Import Cycles
- None detected.

## Communities (107 total, 17 thin omitted)

### Community 0 - "papaStockRepository.ts"
Cohesion: 0.20
Nodes (22): mapTraceabilityEvent(), getStockStatus(), getStockViews(), DiscrepancyRow, Json, LocationRow, LotRow, MovementItemRow (+14 more)

### Community 1 - "TraceabilityEvent"
Cohesion: 0.16
Nodes (9): initialTraceabilityEvents, lot, ExportDocumentContext, DocumentSnapshotInput, ExportReadinessInput, TraceabilityEvent, ExportOperation, ExportValidationInput (+1 more)

### Community 2 - "Lot"
Cohesion: 0.32
Nodes (9): MovementContext, StockCountPlan, snapshot, PapaStockSnapshot, NormalizedSnapshot, Location, Lot, StockCount (+1 more)

### Community 3 - "planillaImport.ts"
Cohesion: 0.09
Nodes (50): readWorkbookUpload(), buildPlanillaImportFromFile(), buildPlanillaImportPlan(), buildStockIntakePlan(), cellAt(), cellText(), columnIndex(), defaultDestination() (+42 more)

### Community 4 - "PapaStockRepository"
Cohesion: 0.13
Nodes (14): mapDiscrepancy(), mapLocation(), mapLot(), mapMovement(), mapMovementItem(), mapShelf(), mapShelfUnit(), mapStockCount() (+6 more)

### Community 5 - "apiClient.ts"
Cohesion: 0.05
Nodes (64): PlanillaImportPanel(), confirm(), onFile(), CALIBERS, CATEGORIES, emptyForm, optionalNumber(), PLANILLA_DESTINATIONS (+56 more)

### Community 6 - "Structured Outputs"
Cohesion: 0.06
Nodes (31): [API Integration](https://console.groq.com/docs/structured-outputs\#api-integration), [API Response Validation](https://console.groq.com/docs/structured-outputs\#api-response-validation), [Best-effort Mode (`strict: false`)](https://console.groq.com/docs/structured-outputs\#besteffort-mode-strict-false), [Best Practices](https://console.groq.com/docs/structured-outputs\#best-practices), [Choosing Between Strict and Best-effort Mode](https://console.groq.com/docs/structured-outputs\#choosing-between-strict-and-besteffort-mode), [Email Classification](https://console.groq.com/docs/structured-outputs\#email-classification), [Error Handling](https://console.groq.com/docs/structured-outputs\#error-handling), [Examples](https://console.groq.com/docs/structured-outputs\#examples) (+23 more)

### Community 7 - "aiService.ts"
Cohesion: 0.13
Nodes (12): DiscrepancyInput, hardcodedDiscrepancyAnalysis(), kg(), aiService, httpAIService, localTraceabilityFallback(), monthNumbers, parseDate() (+4 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, node, server, src, vite/client, vite.config.ts (+19 more)

### Community 11 - "LotDetailPage.tsx"
Cohesion: 0.10
Nodes (26): MovementList(), eventLabels, getDetail(), TraceabilityTimeline(), MovementReceptionForm(), submit(), formatCompactDate(), buildLotHistory() (+18 more)

### Community 12 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, supertest, tailwindcss, @tailwindcss/vite, tsup, @types/pg, @types/supertest, typescript (+13 more)

### Community 13 - "config.ts"
Cohesion: 0.19
Nodes (10): assertProductionServerConfig(), config, DEFAULT_ALLOWED_ORIGINS, groqRuntimeStatus(), PapaStockConfig, parseAllowedOrigins(), pool, app (+2 more)

### Community 14 - "NewExportPage.tsx"
Cohesion: 0.20
Nodes (10): MissingDataPanel(), groupByLot(), originLabel(), RequirementChecklist(), DEFAULT_COMMERCIAL, DEFAULT_PACKING, DESTINATION_DEFAULTS, DestinationCommercialDefaults (+2 more)

### Community 15 - "dataRepository.ts"
Cohesion: 0.18
Nodes (12): isExplicitMockMode(), shelfUnits, shelves, transporters, emptySnapshot(), errorMessage(), isSnapshot(), loadPapaStockSnapshot() (+4 more)

### Community 16 - "discrepancyHeuristic.ts"
Cohesion: 0.16
Nodes (15): AppDependencies, analyzeWithHeuristic(), byRecent(), hypothesis(), movementEvidence(), analysisSchema, AnalyzerOptions, createDiscrepancyAnalyzer() (+7 more)

### Community 17 - "dependencies"
Cohesion: 0.11
Nodes (19): express, lucide-react, dependencies, express, lucide-react, pg, react, react-dom (+11 more)

### Community 18 - "render-deploys.md"
Cohesion: 0.07
Nodes (27): Automatic deploys, Build command, Canceling a deploy, Configuring auto-deploys, Deploy steps, Deploying a specific commit, [Deploying on Render](https://render.com/docs/deploys), Deployment concepts (+19 more)

### Community 19 - "derivedOperationalFacts.ts"
Cohesion: 0.08
Nodes (29): buildDerivedOperationalFacts(), buildLedgerFacts(), buildMovementFacts(), buildStockFacts(), buildTemporalFacts(), buildTraceabilityFacts(), DerivedFactsMovementInput, DerivedFactsMovementItemInput (+21 more)

### Community 20 - "app.ts"
Cohesion: 0.09
Nodes (20): correctionSchema, discrepancyInputSchema, exportRequirementsInputSchema, idempotencyKeySchema, identifier, loginSchema, movementIntentSchema, movementItemInputSchema (+12 more)

### Community 21 - "approvedOpeningBalances.postgres.test.ts"
Cohesion: 0.19
Nodes (9): loadLedgerVerifierInput(), QueryClient, verifyLedgerReadOnly(), verifyLedgerWithClient(), audit(), manifestPath, migrationsDirectory, root (+1 more)

### Community 22 - "Antes de presentar"
Cohesion: 0.08
Nodes (25): 1. Despertar el servicio, 2. Comprobar `/health`, 3. Comprobar la base de datos, 4. Comprobar que la UI no está en mock, 5. Comprobar Groq, 6. Comprobar los datos de A-204, 7. Comprobar el estado de A-310, Antes de presentar (+17 more)

### Community 23 - "export.ts"
Cohesion: 0.06
Nodes (58): StatCard(), useCountUp(), tick(), DocumentArticle(), DocumentFooter(), DocumentLetterhead(), DocumentProvenance(), CommercialTerms() (+50 more)

### Community 24 - "App.tsx"
Cohesion: 0.20
Nodes (11): App(), AppLayout(), sectionTitles, Topbar(), LoginPage(), DemoSession, isDemoSession(), DemoSessionContext (+3 more)

### Community 25 - "StockPage.tsx"
Cohesion: 0.17
Nodes (12): PaginationBar(), LotHeader(), labels, StockStatusBadge(), LIST_PAGE_SIZE, PageWindow, paginate(), visiblePages() (+4 more)

### Community 26 - "createApp"
Cohesion: 0.16
Nodes (13): createApp(), AuthIdentity, AuthOptions, cookieValue(), createSameOriginGuard(), hashPassword(), isTrustedMutationOrigin(), Permission (+5 more)

### Community 27 - "domain.ts"
Cohesion: 0.20
Nodes (16): ShelfGrid(), WizardStep, DataSource, stock, AddShelfUnitInput, AppDataContext, AppDataContextValue, PlanillaSheetSummary (+8 more)

### Community 28 - "validateExport.ts"
Cohesion: 0.33
Nodes (14): eventData(), eventLotId(), eventType(), formatEventDate(), getFieldSource(), getFieldValue(), latestTreatment(), readTreatmentProduct() (+6 more)

### Community 29 - "documentService.ts"
Cohesion: 0.18
Nodes (14): PAPASUD_EXPORTER, generateRemito(), buildExportDocumentItems(), buildExportItems(), commercialFrom(), latestEvent(), loadStoredDocuments(), lotById() (+6 more)

### Community 31 - "aiOperationsAssistant.ts"
Cohesion: 0.10
Nodes (25): AiOperationsOptions, attachEvidenceLabels(), canonicalEntities(), controlledRateLimitError(), controlledRequestTooLargeError(), createAiOperationsAssistant(), GLOBAL_AUTHORITY_CLAIMS, heuristicFallbackReason() (+17 more)

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
Nodes (49): apiKey(), captureN01Schema(), clonePayload(), main(), minimalStrictSchema(), postGroq(), SafeGroqResult, syntheticLotHistoryUser() (+41 more)

### Community 36 - "validate-render.mjs"
Cohesion: 0.40
Nodes (3): blueprint, database, web

### Community 37 - "001_initial_schema.sql"
Cohesion: 0.50
Nodes (3): public.locations, public.lots, public

### Community 39 - "ledgerVerifier.ts"
Cohesion: 0.13
Nodes (15): coordinateKey(), LedgerBlockingCode, LedgerBlockingIssue, LedgerMovementInput, LedgerMovementItemInput, LedgerRecommendedAction, LedgerStockInput, LedgerUnit (+7 more)

### Community 40 - "NewExportPage"
Cohesion: 0.31
Nodes (10): NewExportPage(), analyze(), applyDestination(), buildContext(), confirmTraceability(), emit(), evaluate(), logistics() (+2 more)

### Community 41 - "aiOperationsContext.ts"
Cohesion: 0.13
Nodes (21): showcaseManifest, operationsAnswerSchema, AiOperationsIntent, assertWithinLimit(), buildAiOperationsContext(), byId(), classifyIntent(), containsEntity() (+13 more)

### Community 42 - "ExportForm.tsx"
Cohesion: 0.17
Nodes (11): LoadingLabel(), icons, StatusBadge(), StatusTone, toneClasses, ExportCommercialValues, DiscrepancyPanel(), MovementsPanel() (+3 more)

### Community 48 - "DocumentsPage.tsx"
Cohesion: 0.31
Nodes (6): EmptyState(), DocumentsPage(), filters, summarize(), typeMeta, NotFoundPage()

### Community 49 - "PapaStock — Project Context"
Cohesion: 0.12
Nodes (16): 10. Groq, 12. Fuente de datos, 15. Funcionalidades actuales, 17. Seguridad, 18. UI, 19. Testing, 1. Hackathon, 20. Pendientes (+8 more)

### Community 51 - "aiOperationsFacts.ts"
Cohesion: 0.17
Nodes (14): AiOperationsContext, buildCanonicalLotStockAnswer(), buildLotStockFacts(), CanonicalLotStockSource, factSentence(), LotStockFact, LotStockFactSource, LotStockLocationFact (+6 more)

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

### Community 61 - "useAppData"
Cohesion: 0.20
Nodes (14): Button(), ButtonVariant, variants, PageHeader(), DashboardPage(), QuickAccessItem, LocationsPage(), MovementsPage() (+6 more)

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

### Community 71 - "exportService.ts"
Cohesion: 0.15
Nodes (12): baseFields, exportRequirements, analyzeExportReadiness(), ExportLogistics, toExportRequirements(), VALIDATABLE_FIELDS, AiExportRequirement, CreateExportOperationRequest (+4 more)

### Community 72 - "planillaImport.test.ts"
Cohesion: 0.27
Nodes (5): locations, lots, movements, stockRecords, records

### Community 74 - "formatQuantity"
Cohesion: 0.25
Nodes (12): StockTable(), VarietyStockPanel(), formatQuantity(), QUANTITY_UNITS, stockUnit(), unitLabel(), aggregateStockByVarietyLocationUnit(), VarietyLocationTotal (+4 more)

### Community 78 - "StockVerificationForm.tsx"
Cohesion: 0.19
Nodes (10): StockVerificationForm(), confirm(), todayIso(), buildStockVerificationPreview(), issue(), toStockVerificationConfirmation(), confirmStockVerification(), StockVerificationConfirmation (+2 more)

### Community 79 - "007_opening_balance.sql"
Cohesion: 0.25
Nodes (8): movement_items_keep_opening_balance_nonempty, movements_opening_balance_has_items, public.assert_opening_balance_has_items(), public.assert_opening_balance_movement_has_items(), public.movements, public.assert_opening_balance_has_items, public.assert_opening_balance_movement_has_items, public.movement_items

### Community 80 - "movementReception.ts"
Cohesion: 0.25
Nodes (11): buildLotCorrectionPlan(), LotCorrectionPlan, buildReceptionPlan(), receptionPayloadFingerprint(), ReceptionPlan, movement, Discrepancy, LotReallocationInput (+3 more)

### Community 81 - "app.test.ts"
Cohesion: 0.17
Nodes (9): analyze, answerOperationsQuestion, app, auth, parseExportRequirements, parseMovementIntent, parseTraceabilityIntent, repository (+1 more)

### Community 83 - "Dataset Showcase"
Cohesion: 0.33
Nodes (5): Balance final reconstruible, Dataset Showcase, Ejecución segura, Secuencia, Visibilidad

### Community 84 - "groqStructured.ts"
Cohesion: 0.06
Nodes (41): requestWithSingleRateLimitRetry(), canonicalLabels, createExportRequirementsParser(), ExportRequirementsInput, jsonSchema, keywords, parseRequirementsWithHeuristic(), requirementsSchema (+33 more)

### Community 87 - "AuthService"
Cohesion: 0.24
Nodes (4): AuthService, passwordParts(), tokenFingerprint(), verifyPassword()

### Community 89 - "legacyMovementItems.ts"
Cohesion: 0.24
Nodes (8): inferUnit(), jsonObject(), LegacyMovementMaterialization, LegacyMovementPlan, materializeLegacyMovementItemsInTestDatabase(), planLegacyMovementItems(), UnsupportedLegacyMovement, validUnit()

### Community 90 - "migrationCommand.ts"
Cohesion: 0.27
Nodes (8): repositoryRoot, MigrationCommandOptions, MigrationDatabase, ParsedMigrationCommand, parseMigrationCommandArgs(), runMigrationCommand(), MigrationSelection, parseMigrationArgs()

### Community 93 - "pool.ts"
Cohesion: 0.31
Nodes (7): loadConfiguredDatabase(), checkDatabaseReadiness(), requirePool(), verifyDatabaseConnection(), verifyDatabaseReadiness(), database, repositoryRoot

### Community 94 - "showcaseCommand.ts"
Cohesion: 0.31
Nodes (6): loadConfiguredDatabase(), parseShowcaseCommandArgs(), runShowcaseCommand(), ShowcaseCommandOptions, ShowcaseDatabase, ShowcaseDatasetResult

### Community 95 - "showcaseDataset.ts"
Cohesion: 0.36
Nodes (9): applyShowcaseDataset(), assertDomainPlans(), assertExact(), assertLocations(), canonical(), insertManifest(), QueryClient, readCurrent() (+1 more)

### Community 96 - "stockTransfer.ts"
Cohesion: 0.39
Nodes (8): buildStockCountPlan(), buildStockTransferPreview(), cloneStock(), emptyStock(), normalize(), recordMatchesUnit(), stockKey(), StockTransferLinePreview

### Community 97 - "openingBalance.postgres.test.ts"
Cohesion: 0.32
Nodes (5): insertOpeningHeader(), insertOpeningItem(), insertValidOpeningBalance(), migrationsDirectory, OpeningHeaderOptions

### Community 98 - "documentPacking.ts"
Cohesion: 0.39
Nodes (6): addUtcDays(), DerivedPacking, derivePacking(), shippingMarks(), buildDocumentSnapshot(), summarizeEvent()

### Community 99 - "MissingDataPanel.tsx"
Cohesion: 0.48
Nodes (4): ConfirmDialog(), engineLabel(), ConfirmedTraceabilityEvent, ParsedTraceabilityEvent

### Community 100 - "Sidebar.tsx"
Cohesion: 0.29
Nodes (5): inventory, NavItem, operations, overview, Sidebar()

### Community 101 - "demoStockPresentation.ts"
Cohesion: 0.47
Nodes (5): GAPS, isDiscrepancy(), lotCodeById(), presentStockForOralDemo(), PRESERVED_DISCREPANCIES

### Community 102 - "documentService.test.ts"
Cohesion: 0.40
Nodes (5): mockDocumentService, a310, h118, operationFor(), buildExportOperation()

### Community 105 - "ExportForm"
Cohesion: 0.67
Nodes (3): ExportForm(), changeLot(), updateLine()

## Knowledge Gaps
- **427 isolated node(s):** `public.locations`, `h4b_expected_movements`, `h4b_expected_items`, `name`, `private` (+422 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Lot` connect `Lot` to `papaStockRepository.ts`, `TraceabilityEvent`, `planillaImport.ts`, `apiClient.ts`, `LotDetailPage.tsx`, `NewExportPage.tsx`, `dataRepository.ts`, `export.ts`, `StockPage.tsx`, `domain.ts`, `validateExport.ts`, `documentService.ts`, `groqMovementIntent.ts`, `ExportForm.tsx`, `exportService.ts`, `planillaImport.test.ts`, `movementReception.ts`, `showcaseDataset.ts`, `demoStockPresentation.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `buildAiOperationsContext()` connect `aiOperationsContext.ts` to `TraceabilityEvent`, `groqMovementIntent.ts`, `ledgerVerifier.ts`, `formatQuantity`, `derivedOperationalFacts.ts`, `app.ts`, `aiOperationsFacts.ts`, `migrationRunner.ts`, `createApp`, `aiOperationsAssistant.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `formatKg()` connect `export.ts` to `apiClient.ts`, `WarehouseModelPanel`, `ExportForm`, `ExportForm.tsx`, `LotDetailPage.tsx`, `TransportersPage`, `StockVerificationForm.tsx`, `DocumentsPage.tsx`, `domain.ts`, `validateExport.ts`, `useAppData`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `public.locations`, `h4b_expected_movements`, `h4b_expected_items` to the rest of the system?**
  _427 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `planillaImport.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0889894419306184 - nodes in this community are weakly interconnected._
- **Should `PapaStockRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.13230769230769232 - nodes in this community are weakly interconnected._
- **Should `apiClient.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052160493827160495 - nodes in this community are weakly interconnected._