# Graph Report - papastock  (2026-08-26)

## Corpus Check
- 220 files · ~169,885 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1486 nodes · 3650 edges · 98 communities (86 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b2a1968e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- papaStockRepository.ts
- export.ts
- Lot
- planillaImport.ts
- PapaStockRepository
- StockIntakeForm.tsx
- Structured Outputs
- aiService.ts
- compilerOptions
- public.transporters
- public.stock_records
- LotDetailPage.tsx
- devDependencies
- groqMovementIntent.ts
- RequirementChecklist.tsx
- AppDataContext.tsx
- discrepancyHeuristic.ts
- dependencies
- render-deploys.md
- derivedOperationalFacts.ts
- app.ts
- showcaseDataset.ts
- Antes de presentar
- formatKg
- DemoSessionContext.tsx
- LotsPage.tsx
- auth.ts
- formatters.ts
- validateExport.ts
- documentService.ts
- apiClient.ts
- aiOperationsAssistant.ts
- scripts
- public.discrepancies
- package.json
- diagnose-lot-history-groq.ts
- validate-render.mjs
- 001_initial_schema.sql
- vite-env.d.ts
- apiRequest
- NewExportPage
- aiOperationsContext.ts
- MovementsPanel.tsx
- public.movements
- public.traceability_events
- PlanillaImportPanel.tsx
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
- exportService.ts
- dataRepository.ts
- StockVerificationForm.tsx
- StockControlWizard.tsx
- domain.ts
- 007_opening_balance.sql
- Movement
- app.test.ts
- operationsAssistantService.ts
- Dataset Showcase
- groqStructured.ts
- validatePlanillaUpload
- tailwindcss
- tsup
- 008_approved_opening_balances.sql
- QuantityUnit
- vitest
- public.movements
- pool.ts
- stockTransfer.ts
- NewExportPage.tsx
- MissingDataPanel.tsx
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
- `parsedIntentSchema` --calls--> `expandLegacyIntent()`  [EXTRACTED]
  server/services/groqMovementIntent.ts → src/lib/movements.ts

## Import Cycles
- None detected.

## Communities (98 total, 12 thin omitted)

### Community 0 - "papaStockRepository.ts"
Cohesion: 0.12
Nodes (33): mapDiscrepancy(), mapLocation(), mapLot(), mapMovement(), mapMovementItem(), mapShelf(), mapShelfUnit(), mapStockCount() (+25 more)

### Community 1 - "export.ts"
Cohesion: 0.10
Nodes (23): DocumentService, CreateGeneratedDocumentRequest, DocumentCommercialFields, DocumentSnapshotRequirement, DocumentSnapshotTraceability, DocumentType, ExportLotLine, ExportOperationResponse (+15 more)

### Community 2 - "Lot"
Cohesion: 0.21
Nodes (17): DiscrepancyInput, MovementContext, LotCorrectionPlan, StockCountPlan, PapaStockSnapshot, NormalizedSnapshot, AppDataContextValue, Location (+9 more)

### Community 3 - "planillaImport.ts"
Cohesion: 0.11
Nodes (41): buildPlanillaImportPlan(), buildStockIntakePlan(), cellAt(), cellText(), columnIndex(), defaultDestination(), defaultOrigin(), excelSerialToDate() (+33 more)

### Community 4 - "PapaStockRepository"
Cohesion: 0.22
Nodes (3): PapaStockRepository, PlanillaImportResult, TransporterInput

### Community 5 - "StockIntakeForm.tsx"
Cohesion: 0.15
Nodes (14): CALIBERS, CATEGORIES, emptyForm, optionalNumber(), PLANILLA_DESTINATIONS, PLANILLA_ORIGINS, StockIntakeForm(), confirm() (+6 more)

### Community 6 - "Structured Outputs"
Cohesion: 0.06
Nodes (31): [API Integration](https://console.groq.com/docs/structured-outputs\#api-integration), [API Response Validation](https://console.groq.com/docs/structured-outputs\#api-response-validation), [Best-effort Mode (`strict: false`)](https://console.groq.com/docs/structured-outputs\#besteffort-mode-strict-false), [Best Practices](https://console.groq.com/docs/structured-outputs\#best-practices), [Choosing Between Strict and Best-effort Mode](https://console.groq.com/docs/structured-outputs\#choosing-between-strict-and-besteffort-mode), [Email Classification](https://console.groq.com/docs/structured-outputs\#email-classification), [Error Handling](https://console.groq.com/docs/structured-outputs\#error-handling), [Examples](https://console.groq.com/docs/structured-outputs\#examples) (+23 more)

### Community 7 - "aiService.ts"
Cohesion: 0.12
Nodes (14): hardcodedDiscrepancyAnalysis(), kg(), aiService, httpAIService, localTraceabilityFallback(), monthNumbers, parseDate(), parseProduct() (+6 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, node, server, src, vite/client, vite.config.ts (+19 more)

### Community 11 - "LotDetailPage.tsx"
Cohesion: 0.13
Nodes (16): eventLabels, getDetail(), TraceabilityTimeline(), DiscrepancyPanel(), formatCompactDate(), buildLotHistory(), locationName(), DispatchValidationInput (+8 more)

### Community 12 - "devDependencies"
Cohesion: 0.09
Nodes (23): devDependencies, supertest, @tailwindcss/vite, @types/express, @types/pg, @types/react, @types/react-dom, @types/supertest (+15 more)

### Community 13 - "groqMovementIntent.ts"
Cohesion: 0.18
Nodes (15): collectItems(), jsonSchema, locationIndex(), matchLocations(), movementItemSchema, normalize(), parsedIntentSchema, ParserOptions (+7 more)

### Community 14 - "RequirementChecklist.tsx"
Cohesion: 0.38
Nodes (5): groupByLot(), originLabel(), RequirementChecklist(), AnalysisEngine, RequirementResult

### Community 15 - "AppDataContext.tsx"
Cohesion: 0.28
Nodes (12): isExplicitMockMode(), insertTraceabilityEvent(), apiRequestVoid(), assignStockToShelfRemote(), createShelfUnit(), createTransporter(), deleteShelfUnitRemote(), updateTransporterRemote() (+4 more)

### Community 16 - "discrepancyHeuristic.ts"
Cohesion: 0.18
Nodes (14): analyzeWithHeuristic(), byRecent(), hypothesis(), movementEvidence(), analysisSchema, AnalyzerOptions, createDiscrepancyAnalyzer(), jsonSchema (+6 more)

### Community 17 - "dependencies"
Cohesion: 0.10
Nodes (21): express, http-proxy-middleware, lucide-react, dependencies, express, http-proxy-middleware, lucide-react, pg (+13 more)

### Community 18 - "render-deploys.md"
Cohesion: 0.07
Nodes (27): Automatic deploys, Build command, Canceling a deploy, Configuring auto-deploys, Deploy steps, Deploying a specific commit, [Deploying on Render](https://render.com/docs/deploys), Deployment concepts (+19 more)

### Community 19 - "derivedOperationalFacts.ts"
Cohesion: 0.05
Nodes (44): CanonicalLotStockSource, LotStockFactSource, buildDerivedOperationalFacts(), buildLedgerFacts(), buildMovementFacts(), buildStockFacts(), buildTemporalFacts(), buildTraceabilityFacts() (+36 more)

### Community 20 - "app.ts"
Cohesion: 0.08
Nodes (23): correctionSchema, createApp(), discrepancyInputSchema, exportRequirementsInputSchema, idempotencyKeySchema, identifier, loginSchema, movementIntentSchema (+15 more)

### Community 21 - "showcaseDataset.ts"
Cohesion: 0.05
Nodes (41): loadLedgerVerifierInput(), QueryClient, verifyLedgerReadOnly(), verifyLedgerWithClient(), repositoryRoot, loadConfiguredDatabase(), MigrationCommandOptions, MigrationDatabase (+33 more)

### Community 22 - "Antes de presentar"
Cohesion: 0.07
Nodes (26): 1. Despertar el servicio, 2. Comprobar `/health`, 3. Comprobar la base de datos, 4. Comprobar que la UI no está en mock, 5. Comprobar Groq, 6. Comprobar los datos de A-204, 7. Comprobar el estado de A-310, Antes de presentar (+18 more)

### Community 23 - "formatKg"
Cohesion: 0.17
Nodes (28): DocumentArticle(), DocumentFooter(), DocumentLetterhead(), DocumentProvenance(), CommercialTerms(), DocumentItemsTable(), DocumentNotice(), fallbackItems() (+20 more)

### Community 24 - "DemoSessionContext.tsx"
Cohesion: 0.20
Nodes (10): App(), sectionTitles, Topbar(), LoginPage(), DemoSession, isDemoSession(), DemoSessionContext, DemoSessionContextValue (+2 more)

### Community 25 - "LotsPage.tsx"
Cohesion: 0.35
Nodes (6): PaginationBar(), LIST_PAGE_SIZE, PageWindow, paginate(), visiblePages(), LotsPage()

### Community 26 - "auth.ts"
Cohesion: 0.12
Nodes (15): AuthIdentity, AuthOptions, AuthService, cookieValue(), createSameOriginGuard(), hashPassword(), isTrustedMutationOrigin(), passwordParts() (+7 more)

### Community 27 - "formatters.ts"
Cohesion: 0.19
Nodes (11): StatCard(), useCountUp(), tick(), LocationsPanel(), ShelfGrid(), compactDateFormatter, currencyFormatter, formatNumber() (+3 more)

### Community 28 - "validateExport.ts"
Cohesion: 0.37
Nodes (13): eventData(), eventLotId(), eventType(), formatEventDate(), getFieldSource(), getFieldValue(), latestTreatment(), readTreatmentProduct() (+5 more)

### Community 29 - "documentService.ts"
Cohesion: 0.18
Nodes (16): addUtcDays(), buildExportDocumentItems(), buildExportItems(), commercialFrom(), ExportDocumentContext, latestEvent(), lotById(), qualityLabel() (+8 more)

### Community 30 - "apiClient.ts"
Cohesion: 0.21
Nodes (15): apiFetch(), ApiRequestOptions, apiUrl(), asId(), asNumber(), asRecord(), asText(), normalizeDiscrepancyAnalysis() (+7 more)

### Community 31 - "aiOperationsAssistant.ts"
Cohesion: 0.11
Nodes (24): AiOperationsOptions, attachEvidenceLabels(), canonicalEntities(), controlledRateLimitError(), controlledRequestTooLargeError(), createAiOperationsAssistant(), GLOBAL_AUTHORITY_CLAIMS, heuristicFallbackReason() (+16 more)

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
Cohesion: 0.11
Nodes (33): apiKey(), captureN01Schema(), clonePayload(), main(), minimalStrictSchema(), postGroq(), SafeGroqResult, syntheticLotHistoryUser() (+25 more)

### Community 36 - "validate-render.mjs"
Cohesion: 0.40
Nodes (3): blueprint, database, web

### Community 37 - "001_initial_schema.sql"
Cohesion: 0.50
Nodes (3): public.locations, public.lots, public

### Community 39 - "apiRequest"
Cohesion: 0.22
Nodes (14): submit(), NewMovementPage(), analyzeOrder(), persistMovement(), apiRequest(), asValidationErrors(), movementIntentBody(), normalizeTransferPreview() (+6 more)

### Community 40 - "NewExportPage"
Cohesion: 0.31
Nodes (10): NewExportPage(), analyze(), applyDestination(), buildContext(), confirmTraceability(), emit(), evaluate(), logistics() (+2 more)

### Community 41 - "aiOperationsContext.ts"
Cohesion: 0.19
Nodes (15): AiOperationsContext, AiOperationsIntent, assertWithinLimit(), buildAiOperationsContext(), byId(), classifyIntent(), containsEntity(), CONTEXT_LIMITS (+7 more)

### Community 42 - "MovementsPanel.tsx"
Cohesion: 0.18
Nodes (9): icons, StatusBadge(), StatusTone, toneClasses, MovementsPanel(), statusMeta(), TransporterProfileCard(), emptyForm (+1 more)

### Community 48 - "PlanillaImportPanel.tsx"
Cohesion: 0.33
Nodes (8): PlanillaImportPanel(), confirm(), onFile(), confirmPlanillaImport(), previewPlanillaImport(), uploadHeaders(), PlanillaImportConfirmation, PlanillaImportPreview

### Community 49 - "PapaStock — Project Context"
Cohesion: 0.12
Nodes (16): 10. Groq, 12. Fuente de datos, 15. Funcionalidades actuales, 17. Seguridad, 18. UI, 19. Testing, 1. Hackathon, 20. Pendientes (+8 more)

### Community 51 - "formatQuantity"
Cohesion: 0.11
Nodes (23): buildCanonicalLotStockAnswer(), buildLotStockFacts(), factSentence(), LotStockFact, LotStockLocationFact, snapshot, buildHeuristicOperationsAnswer(), entitiesFrom() (+15 more)

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
Nodes (26): Button(), ButtonVariant, variants, EmptyState(), PageHeader(), AppLayout(), Sidebar(), occupiedKg() (+18 more)

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
Cohesion: 0.16
Nodes (12): baseFields, exportRequirements, analyzeExportReadiness(), ExportLogistics, ExportReadinessInput, summarizeEvent(), toExportRequirements(), VALIDATABLE_FIELDS (+4 more)

### Community 72 - "dataRepository.ts"
Cohesion: 0.08
Nodes (35): locations, lots, movements, shelfUnits, shelves, stockRecords, initialTraceabilityEvents, transporters (+27 more)

### Community 73 - "StockVerificationForm.tsx"
Cohesion: 0.28
Nodes (4): StockVerificationForm(), confirm(), todayIso(), confirmStockVerification()

### Community 74 - "StockControlWizard.tsx"
Cohesion: 0.14
Nodes (11): LotHeader(), StockControlWizard(), WizardStep, labels, StockStatusBadge(), StockTable(), formatSignedKg(), getStockAlert() (+3 more)

### Community 78 - "domain.ts"
Cohesion: 0.23
Nodes (11): buildStockVerificationPreview(), issue(), toStockVerificationConfirmation(), PlanillaSheetSummary, ShelfUnitInput, StockTransferLinePreview, StockTransferPreview, StockVerificationConfirmation (+3 more)

### Community 79 - "007_opening_balance.sql"
Cohesion: 0.25
Nodes (8): movement_items_keep_opening_balance_nonempty, movements_opening_balance_has_items, public.assert_opening_balance_has_items(), public.assert_opening_balance_movement_has_items(), public.movements, public.assert_opening_balance_has_items, public.assert_opening_balance_movement_has_items, public.movement_items

### Community 80 - "Movement"
Cohesion: 0.15
Nodes (18): buildLotCorrectionPlan(), buildReceptionPlan(), receptionPayloadFingerprint(), ReceptionPlan, movement, fixtureAudit(), MovementList(), MovementReceptionForm() (+10 more)

### Community 81 - "app.test.ts"
Cohesion: 0.12
Nodes (15): analyze, answerOperationsQuestion, app, auth, parseExportRequirements, parseMovementIntent, parseTraceabilityIntent, repository (+7 more)

### Community 82 - "operationsAssistantService.ts"
Cohesion: 0.53
Nodes (4): OperationsAssistantPage(), submit(), askOperationsAssistant(), loadOperationsAssistantStatus()

### Community 83 - "Dataset Showcase"
Cohesion: 0.33
Nodes (5): Balance final reconstruible, Dataset Showcase, Ejecución segura, Secuencia, Visibilidad

### Community 84 - "groqStructured.ts"
Cohesion: 0.06
Nodes (42): AppDependencies, requestWithSingleRateLimitRetry(), canonicalLabels, createExportRequirementsParser(), ExportRequirementsInput, jsonSchema, keywords, parseRequirementsWithHeuristic() (+34 more)

### Community 85 - "validatePlanillaUpload"
Cohesion: 0.50
Nodes (4): readWorkbookUpload(), fileExtension(), hasPrefix(), validatePlanillaUpload()

### Community 89 - "QuantityUnit"
Cohesion: 0.18
Nodes (13): inferUnit(), jsonObject(), LegacyMovementMaterialization, LegacyMovementPlan, materializeLegacyMovementItemsInTestDatabase(), planLegacyMovementItems(), UnsupportedLegacyMovement, validUnit() (+5 more)

### Community 93 - "pool.ts"
Cohesion: 0.14
Nodes (10): checkDatabaseReadiness(), pool, requirePool(), verifyDatabaseConnection(), verifyDatabaseReadiness(), database, repositoryRoot, app (+2 more)

### Community 96 - "stockTransfer.ts"
Cohesion: 0.23
Nodes (12): buildStockCountPlan(), buildStockTransferPreview(), cloneStock(), emptyStock(), normalize(), snapshot, expandLegacyIntent(), recordMatchesUnit() (+4 more)

### Community 98 - "NewExportPage.tsx"
Cohesion: 0.19
Nodes (13): ExportCommercialValues, ExportForm(), changeLot(), updateLine(), DEFAULT_COMMERCIAL, DEFAULT_PACKING, DESTINATION_DEFAULTS, DestinationCommercialDefaults (+5 more)

### Community 99 - "MissingDataPanel.tsx"
Cohesion: 0.31
Nodes (6): ConfirmDialog(), engineLabel(), LoadingLabel(), MissingDataPanel(), ConfirmedTraceabilityEvent, ParsedTraceabilityEvent

### Community 100 - "Sidebar.tsx"
Cohesion: 0.33
Nodes (4): inventory, NavItem, operations, overview

## Knowledge Gaps
- **429 isolated node(s):** `public.locations`, `h4b_expected_movements`, `h4b_expected_items`, `name`, `private` (+424 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Lot` connect `Lot` to `papaStockRepository.ts`, `export.ts`, `NewExportPage.tsx`, `planillaImport.ts`, `exportService.ts`, `dataRepository.ts`, `StockControlWizard.tsx`, `MovementsPanel.tsx`, `groqMovementIntent.ts`, `RequirementChecklist.tsx`, `AppDataContext.tsx`, `Movement`, `domain.ts`, `showcaseDataset.ts`, `formatKg`, `validateExport.ts`, `documentService.ts`, `apiClient.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `runMigrations()` connect `showcaseDataset.ts` to `pool.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `buildAiOperationsContext()` connect `aiOperationsContext.ts` to `stockTransfer.ts`, `diagnose-lot-history-groq.ts`, `Movement`, `derivedOperationalFacts.ts`, `app.ts`, `showcaseDataset.ts`, `formatQuantity`, `aiOperationsAssistant.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `public.locations`, `h4b_expected_movements`, `h4b_expected_items` to the rest of the system?**
  _429 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `papaStockRepository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11738648947951273 - nodes in this community are weakly interconnected._
- **Should `export.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10344827586206896 - nodes in this community are weakly interconnected._
- **Should `planillaImport.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11149825783972125 - nodes in this community are weakly interconnected._