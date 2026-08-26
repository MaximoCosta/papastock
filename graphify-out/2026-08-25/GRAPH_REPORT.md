# Graph Report - papastock  (2026-08-25)

## Corpus Check
- 211 files · ~154,140 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1369 nodes · 3328 edges · 94 communities (81 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3eaa9649`
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
- MissingDataPanel.tsx
- compilerOptions
- LotsPage.tsx
- DemoSessionContext.tsx
- LotDetailPage.tsx
- devDependencies
- index.ts
- RequirementChecklist.tsx
- dataRepository.ts
- discrepancyHeuristic.ts
- dependencies
- render-deploys.md
- ledgerVerifier.ts
- app.ts
- approvedOpeningBalances.postgres.test.ts
- Antes de presentar
- formatKg
- App.tsx
- formatters.ts
- auth.ts
- export.ts
- validateExport.ts
- documentService.ts
- @types/express
- aiOperationsAssistant.ts
- scripts
- public.discrepancies
- package.json
- aiOperationsLotHistory.harness.ts
- validate-render.mjs
- 001_initial_schema.sql
- vite-env.d.ts
- groqStructured.ts
- NewExportPage
- aiOperationsContext.ts
- planillaImport.test.ts
- public.movements
- public.traceability_events
- showcaseCommand.ts
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
- AuthService
- openingBalance.postgres.test.ts
- vite
- pool.ts
- StockVerificationForm.tsx
- 007_opening_balance.sql
- createApp
- app.test.ts
- @types/react-dom
- Dataset Showcase
- migrationRunner.test.ts
- @types/react
- formatNumber
- showcaseDataset.ts
- 008_approved_opening_balances.sql
- ExportForm
- TransportersPage
- public.movements
- aiOperationsFacts.ts

## God Nodes (most connected - your core abstractions)
1. `formatKg()` - 49 edges
2. `Lot` - 35 edges
3. `useAppData()` - 31 edges
4. `Movement` - 31 edges
5. `StockView` - 29 edges
6. `TraceabilityEvent` - 28 edges
7. `Button()` - 27 edges
8. `formatDate()` - 24 edges
9. `buildAiOperationsContext()` - 23 edges
10. `PapaStockSnapshot` - 23 edges

## Surprising Connections (you probably didn't know these)
- `LotStockFact` --references--> `QuantityUnit`  [EXTRACTED]
  server/services/aiOperationsFacts.ts → src/types/domain.ts
- `parsedIntentSchema` --calls--> `expandLegacyIntent()`  [EXTRACTED]
  server/services/groqMovementIntent.ts → src/lib/movements.ts
- `LocationSpec` --references--> `LocationType`  [EXTRACTED]
  server/services/planillaImport.ts → src/types/domain.ts
- `createApp()` --calls--> `buildStockVerificationPreview()`  [EXTRACTED]
  server/app.ts → src/lib/stockVerification.ts
- `createApp()` --calls--> `toStockVerificationConfirmation()`  [EXTRACTED]
  server/app.ts → src/lib/stockVerification.ts

## Import Cycles
- None detected.

## Communities (94 total, 13 thin omitted)

### Community 0 - "migrationCommand.ts"
Cohesion: 0.20
Nodes (10): repositoryRoot, loadConfiguredDatabase(), MigrationCommandOptions, MigrationDatabase, ParsedMigrationCommand, parseMigrationCommandArgs(), runMigrationCommand(), MigrationSelection (+2 more)

### Community 1 - "exportService.ts"
Cohesion: 0.11
Nodes (18): baseFields, exportRequirements, initialTraceabilityEvents, transporters, lot, a310, h118, operationFor() (+10 more)

### Community 2 - "groqMovementIntent.ts"
Cohesion: 0.06
Nodes (41): AppDependencies, canonicalLabels, createExportRequirementsParser(), ExportRequirementsInput, jsonSchema, keywords, parseRequirementsWithHeuristic(), requirementsSchema (+33 more)

### Community 3 - "planillaImport.ts"
Cohesion: 0.14
Nodes (27): cellAt(), cellText(), columnIndex(), defaultDestination(), defaultOrigin(), excelSerialToDate(), findHeaderRow(), identifySheet() (+19 more)

### Community 4 - "domain.ts"
Cohesion: 0.05
Nodes (91): inferUnit(), jsonObject(), LegacyMovementMaterialization, LegacyMovementPlan, materializeLegacyMovementItemsInTestDatabase(), planLegacyMovementItems(), UnsupportedLegacyMovement, validUnit() (+83 more)

### Community 5 - "apiClient.ts"
Cohesion: 0.07
Nodes (51): submit(), PlanillaImportPanel(), confirm(), onFile(), CALIBERS, CATEGORIES, emptyForm, optionalNumber() (+43 more)

### Community 6 - "Structured Outputs"
Cohesion: 0.06
Nodes (31): [API Integration](https://console.groq.com/docs/structured-outputs\#api-integration), [API Response Validation](https://console.groq.com/docs/structured-outputs\#api-response-validation), [Best-effort Mode (`strict: false`)](https://console.groq.com/docs/structured-outputs\#besteffort-mode-strict-false), [Best Practices](https://console.groq.com/docs/structured-outputs\#best-practices), [Choosing Between Strict and Best-effort Mode](https://console.groq.com/docs/structured-outputs\#choosing-between-strict-and-besteffort-mode), [Email Classification](https://console.groq.com/docs/structured-outputs\#email-classification), [Error Handling](https://console.groq.com/docs/structured-outputs\#error-handling), [Examples](https://console.groq.com/docs/structured-outputs\#examples) (+23 more)

### Community 7 - "MissingDataPanel.tsx"
Cohesion: 0.33
Nodes (5): ConfirmDialog(), engineLabel(), MissingDataPanel(), ConfirmedTraceabilityEvent, ParsedTraceabilityEvent

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, node, server, src, vite/client, vite.config.ts (+19 more)

### Community 9 - "LotsPage.tsx"
Cohesion: 0.20
Nodes (10): PaginationBar(), LotHeader(), labels, StockStatusBadge(), LIST_PAGE_SIZE, PageWindow, paginate(), visiblePages() (+2 more)

### Community 10 - "DemoSessionContext.tsx"
Cohesion: 0.43
Nodes (5): DemoSession, isDemoSession(), DemoSessionContext, DemoSessionContextValue, DemoSessionProvider()

### Community 11 - "LotDetailPage.tsx"
Cohesion: 0.12
Nodes (17): MovementList(), eventLabels, getDetail(), TraceabilityTimeline(), formatCompactDate(), movementPrimaryUnit(), DispatchValidationInput, validateDispatch() (+9 more)

### Community 12 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, supertest, tailwindcss, @tailwindcss/vite, tsup, @types/pg, @types/supertest, typescript (+13 more)

### Community 13 - "index.ts"
Cohesion: 0.23
Nodes (7): assertProductionServerConfig(), config, PapaStockConfig, pool, app, repositoryRoot, server

### Community 14 - "RequirementChecklist.tsx"
Cohesion: 0.38
Nodes (5): groupByLot(), originLabel(), RequirementChecklist(), AnalysisEngine, RequirementResult

### Community 15 - "dataRepository.ts"
Cohesion: 0.05
Nodes (61): DiscrepancyInput, MovementContext, StockCountPlan, ShelfGrid(), WizardStep, occupiedKg(), WarehouseModelPanel(), isExplicitMockMode() (+53 more)

### Community 16 - "discrepancyHeuristic.ts"
Cohesion: 0.18
Nodes (14): analyzeWithHeuristic(), byRecent(), hypothesis(), movementEvidence(), analysisSchema, AnalyzerOptions, createDiscrepancyAnalyzer(), jsonSchema (+6 more)

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
Cohesion: 0.11
Nodes (16): correctionSchema, discrepancyInputSchema, exportRequirementsInputSchema, idempotencyKeySchema, identifier, loginSchema, movementIntentSchema, movementItemInputSchema (+8 more)

### Community 21 - "approvedOpeningBalances.postgres.test.ts"
Cohesion: 0.17
Nodes (9): loadLedgerVerifierInput(), QueryClient, verifyLedgerReadOnly(), verifyLedgerWithClient(), audit(), manifestPath, migrationsDirectory, root (+1 more)

### Community 22 - "Antes de presentar"
Cohesion: 0.08
Nodes (25): 1. Despertar el servicio, 2. Comprobar `/health`, 3. Comprobar la base de datos, 4. Comprobar que la UI no está en mock, 5. Comprobar Groq, 6. Comprobar los datos de A-204, 7. Comprobar el estado de A-310, Antes de presentar (+17 more)

### Community 23 - "formatKg"
Cohesion: 0.18
Nodes (27): DocumentArticle(), DocumentFooter(), DocumentLetterhead(), DocumentProvenance(), CommercialTerms(), DocumentItemsTable(), DocumentNotice(), fallbackItems() (+19 more)

### Community 24 - "App.tsx"
Cohesion: 0.09
Nodes (33): App(), Button(), ButtonVariant, variants, EmptyState(), PageHeader(), AppLayout(), inventory (+25 more)

### Community 25 - "formatters.ts"
Cohesion: 0.13
Nodes (14): LoadingLabel(), icons, StatusBadge(), StatusTone, toneClasses, DiscrepancyPanel(), MovementsPanel(), statusMeta() (+6 more)

### Community 26 - "auth.ts"
Cohesion: 0.17
Nodes (10): AuthIdentity, AuthOptions, hashPassword(), passwordParts(), Permission, requirePermission(), requireSameOrigin(), StoredSession (+2 more)

### Community 27 - "export.ts"
Cohesion: 0.11
Nodes (21): DocumentService, CreateGeneratedDocumentRequest, DocumentCommercialFields, DocumentSnapshotRequirement, DocumentSnapshotTraceability, ExportLotLine, ExportOperationResponse, ExportStatus (+13 more)

### Community 28 - "validateExport.ts"
Cohesion: 0.37
Nodes (13): eventData(), eventLotId(), eventType(), formatEventDate(), getFieldSource(), getFieldValue(), latestTreatment(), readTreatmentProduct() (+5 more)

### Community 29 - "documentService.ts"
Cohesion: 0.15
Nodes (22): ExportCommercialValues, DEFAULT_COMMERCIAL, DEFAULT_PACKING, DESTINATION_DEFAULTS, DestinationCommercialDefaults, PAPASUD_EXPORTER, addUtcDays(), DerivedPacking (+14 more)

### Community 31 - "aiOperationsAssistant.ts"
Cohesion: 0.19
Nodes (11): AiOperationsOptions, canonicalEntities(), controlledRateLimitError(), controlledRequestTooLargeError(), createAiOperationsAssistant(), GLOBAL_AUTHORITY_CLAIMS, jsonSchema, logControlledUpstreamError() (+3 more)

### Community 32 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, auth:hash, build, check, db:migrate, db:seed, db:showcase, dev (+3 more)

### Community 33 - "public.discrepancies"
Cohesion: 0.46
Nodes (7): public.discrepancies, public.movement_items, public.stock_counts, public.movements, public.stock_records, public.locations, public.lots

### Community 34 - "package.json"
Cohesion: 0.25
Nodes (7): name, overrides, tsup, private, esbuild, type, version

### Community 35 - "aiOperationsLotHistory.harness.ts"
Cohesion: 0.20
Nodes (16): apiKey(), extraKeys(), main(), postGroq(), requireFlag(), safeError(), SafeGroqResult, operationsAnswerSchema (+8 more)

### Community 36 - "validate-render.mjs"
Cohesion: 0.40
Nodes (3): blueprint, database, web

### Community 37 - "001_initial_schema.sql"
Cohesion: 0.50
Nodes (3): public.locations, public.lots, public

### Community 39 - "groqStructured.ts"
Cohesion: 0.16
Nodes (15): requestWithSingleRateLimitRetry(), GroqHttpError, GroqOptions, GroqRequestBodyLimitError, parseRetryAfter(), parseSafeError(), RATE_LIMIT_HEADERS, requestStructuredOutput() (+7 more)

### Community 40 - "NewExportPage"
Cohesion: 0.31
Nodes (10): NewExportPage(), analyze(), applyDestination(), buildContext(), confirmTraceability(), emit(), evaluate(), logistics() (+2 more)

### Community 41 - "aiOperationsContext.ts"
Cohesion: 0.21
Nodes (15): AiOperationsIntent, assertWithinLimit(), buildAiOperationsContext(), byId(), classifyIntent(), containsEntity(), CONTEXT_LIMITS, GENERAL_SELECTION_LIMITS (+7 more)

### Community 42 - "planillaImport.test.ts"
Cohesion: 0.25
Nodes (6): PLANILLA_LIMITS, locations, lots, movements, stockRecords, records

### Community 48 - "showcaseCommand.ts"
Cohesion: 0.31
Nodes (6): loadConfiguredDatabase(), parseShowcaseCommandArgs(), runShowcaseCommand(), ShowcaseCommandOptions, ShowcaseDatabase, ShowcaseDatasetResult

### Community 49 - "PapaStock — Project Context"
Cohesion: 0.12
Nodes (16): 10. Groq, 12. Fuente de datos, 15. Funcionalidades actuales, 17. Seguridad, 18. UI, 19. Testing, 1. Hackathon, 20. Pendientes (+8 more)

### Community 51 - "fold"
Cohesion: 0.27
Nodes (13): buildPlanillaImportPlan(), buildStockIntakePlan(), fold(), inferLocationType(), matchLocation(), matchLot(), materializePlanillaImport(), movementData() (+5 more)

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

### Community 71 - "AuthService"
Cohesion: 0.27
Nodes (4): AuthService, cookieValue(), requireAuthentication(), tokenFingerprint()

### Community 72 - "openingBalance.postgres.test.ts"
Cohesion: 0.32
Nodes (5): insertOpeningHeader(), insertOpeningItem(), insertValidOpeningBalance(), migrationsDirectory, OpeningHeaderOptions

### Community 74 - "pool.ts"
Cohesion: 0.21
Nodes (6): checkDatabaseReadiness(), requirePool(), verifyDatabaseConnection(), verifyDatabaseReadiness(), database, repositoryRoot

### Community 78 - "StockVerificationForm.tsx"
Cohesion: 0.14
Nodes (6): PlanillaStockTemplate(), StockControlWizard(), StockVerificationForm(), confirm(), todayIso(), formatSignedKg()

### Community 79 - "007_opening_balance.sql"
Cohesion: 0.25
Nodes (8): movement_items_keep_opening_balance_nonempty, movements_opening_balance_has_items, public.assert_opening_balance_has_items(), public.assert_opening_balance_movement_has_items(), public.movements, public.assert_opening_balance_has_items, public.assert_opening_balance_movement_has_items, public.movement_items

### Community 80 - "createApp"
Cohesion: 0.25
Nodes (8): createApp(), readWorkbookUpload(), buildPlanillaImportFromFile(), fileExtension(), hasPrefix(), importError(), parsePlanillaBuffer(), validatePlanillaUpload()

### Community 81 - "app.test.ts"
Cohesion: 0.17
Nodes (9): analyze, answerOperationsQuestion, app, auth, parseExportRequirements, parseMovementIntent, parseTraceabilityIntent, repository (+1 more)

### Community 83 - "Dataset Showcase"
Cohesion: 0.33
Nodes (5): Balance final reconstruible, Dataset Showcase, Ejecución segura, Secuencia, Visibilidad

### Community 86 - "formatNumber"
Cohesion: 0.53
Nodes (5): StatCard(), useCountUp(), tick(), LocationsPanel(), formatNumber()

### Community 87 - "showcaseDataset.ts"
Cohesion: 0.23
Nodes (12): applyShowcaseDataset(), assertDomainPlans(), assertExact(), assertLocations(), canonical(), insertManifest(), QueryClient, readCurrent() (+4 more)

### Community 89 - "ExportForm"
Cohesion: 0.67
Nodes (3): ExportForm(), changeLot(), updateLine()

### Community 94 - "aiOperationsFacts.ts"
Cohesion: 0.31
Nodes (7): AiOperationsContext, buildCanonicalLotStockAnswer(), buildLotStockFacts(), factSentence(), LotStockFact, LotStockLocationFact, snapshot

## Knowledge Gaps
- **400 isolated node(s):** `public.locations`, `h4b_expected_movements`, `h4b_expected_items`, `name`, `private` (+395 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Lot` connect `dataRepository.ts` to `exportService.ts`, `groqMovementIntent.ts`, `planillaImport.ts`, `domain.ts`, `apiClient.ts`, `LotsPage.tsx`, `planillaImport.test.ts`, `LotDetailPage.tsx`, `RequirementChecklist.tsx`, `formatKg`, `showcaseDataset.ts`, `formatters.ts`, `export.ts`, `validateExport.ts`, `documentService.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `runMigrations()` connect `migrationCommand.ts` to `openingBalance.postgres.test.ts`, `pool.ts`, `migrationRunner.test.ts`, `approvedOpeningBalances.postgres.test.ts`, `showcaseDataset.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `formatKg()` connect `formatKg` to `apiClient.ts`, `LotDetailPage.tsx`, `StockVerificationForm.tsx`, `dataRepository.ts`, `formatNumber`, `App.tsx`, `ExportForm`, `TransportersPage`, `validateExport.ts`, `formatters.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `public.locations`, `h4b_expected_movements`, `h4b_expected_items` to the rest of the system?**
  _400 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `exportService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1076923076923077 - nodes in this community are weakly interconnected._
- **Should `groqMovementIntent.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06285714285714286 - nodes in this community are weakly interconnected._
- **Should `planillaImport.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._