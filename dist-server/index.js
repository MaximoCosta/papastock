import {
  config,
  pool,
  verifyDatabaseConnection
} from "./chunk-CXV6QWMR.js";

// server/index.ts
import express2 from "express";
import path from "path";
import { fileURLToPath } from "url";

// server/app.ts
import express from "express";
import { z as z2 } from "zod";

// server/repositories/papaStockRepository.ts
import { randomUUID } from "crypto";

// server/repositories/mappers.ts
var mapLocation = (row) => ({ id: row.id, name: row.name, type: row.type });
var mapLot = (row) => ({
  id: row.id,
  code: row.code,
  variety: row.variety,
  campaign: row.campaign,
  producer: row.producer,
  origin: row.origin,
  harvestDate: row.harvest_date ?? void 0
});
var mapStockRecord = (row) => ({
  id: row.id,
  lotId: row.lot_id,
  locationId: row.location_id,
  declaredQuantity: Number(row.declared_quantity),
  verifiedQuantity: Number(row.verified_quantity),
  verificationPending: row.verification_pending,
  updatedAt: row.updated_at
});
var mapMovement = (row) => ({
  id: row.id,
  reference: row.reference,
  lotId: row.lot_id,
  originLocationId: row.origin_location_id ?? void 0,
  destinationLocationId: row.destination_location_id ?? void 0,
  quantity: Number(row.quantity),
  date: row.movement_date,
  status: row.status
});
var mapTraceabilityEvent = (row) => ({
  id: row.id,
  lotId: row.lot_id,
  type: row.event_type,
  date: row.event_date,
  locationId: row.location_id ?? void 0,
  data: typeof row.data === "object" && row.data !== null && !Array.isArray(row.data) ? row.data : {}
});

// server/repositories/papaStockRepository.ts
var PapaStockRepository = class {
  constructor(database) {
    this.database = database;
  }
  database;
  async loadSnapshot() {
    const [locations, lots, stock, movements, traceability] = await Promise.all([
      this.database.query("select * from public.locations order by id"),
      this.database.query("select * from public.lots order by code"),
      this.database.query("select * from public.stock_records order by id"),
      this.database.query("select * from public.movements order by movement_date desc, id"),
      this.database.query("select * from public.traceability_events order by event_date, id")
    ]);
    if (!locations.rowCount || !lots.rowCount || !stock.rowCount) {
      throw new Error("La base existe pero el seed operativo est\xE1 incompleto.");
    }
    return {
      locations: locations.rows.map(mapLocation),
      lots: lots.rows.map(mapLot),
      stockRecords: stock.rows.map(mapStockRecord),
      movements: movements.rows.map(mapMovement),
      traceabilityEvents: traceability.rows.map(mapTraceabilityEvent)
    };
  }
  async loadLot(idOrCode) {
    const snapshot = await this.loadSnapshot();
    const lot = snapshot.lots.find((item) => item.id === idOrCode || item.code.toLowerCase() === idOrCode.toLowerCase());
    if (!lot) throw Object.assign(new Error("Lote no encontrado."), { status: 404 });
    return {
      locations: snapshot.locations,
      lots: [lot],
      stockRecords: snapshot.stockRecords.filter((item) => item.lotId === lot.id),
      movements: snapshot.movements.filter((item) => item.lotId === lot.id),
      traceabilityEvents: snapshot.traceabilityEvents.filter((item) => item.lotId === lot.id)
    };
  }
  async insertTraceabilityEvent(event) {
    const result = await this.database.query(
      `insert into public.traceability_events
        (id, lot_id, event_type, event_date, location_id, data)
       values ($1, $2, $3, $4, $5, $6::jsonb)
       returning *`,
      [`trace-${randomUUID()}`, event.lotId, event.type, event.date, event.locationId ?? null, JSON.stringify(event.data)]
    );
    return mapTraceabilityEvent(result.rows[0]);
  }
};

// server/services/groqDiscrepancy.ts
import { z } from "zod";

// server/services/discrepancyHeuristic.ts
var byRecent = (a, b) => b.date.localeCompare(a.date) || a.reference.localeCompare(b.reference);
function movementEvidence(movements) {
  return movements.map((movement) => ({
    type: "movement",
    reference: movement.reference,
    description: `${movement.quantity.toLocaleString("es-AR")} kg \xB7 ${movement.status} \xB7 ${movement.date}`
  }));
}
function hypothesis(title, explanation, movements) {
  return { title, explanation, movementReferences: movements.map((item) => item.reference) };
}
function analyzeWithHeuristic(input) {
  const difference = input.stock.verifiedQuantity - input.stock.declaredQuantity;
  const target = Math.abs(difference);
  if (target === 0) {
    return {
      engine: "heuristic",
      summary: "El stock declarado coincide con el verificado; no hay discrepancia que explicar.",
      confidence: 1,
      explainedQuantity: 0,
      unexplainedQuantity: 0,
      hypotheses: [],
      evidence: [{ type: "stock", reference: input.lot.code, description: "Diferencia verificada: 0 kg." }],
      recommendedAction: "Mantener el control operativo normal; no se requiere conciliaci\xF3n."
    };
  }
  const pending = input.movements.filter((movement) => movement.status === "pending").filter((movement) => movement.originLocationId === input.stock.locationId || movement.destinationLocationId === input.stock.locationId).sort(byRecent);
  const exact = pending.find((movement) => movement.quantity === target);
  if (exact) {
    return {
      engine: "heuristic",
      summary: `El movimiento pendiente ${exact.reference} coincide exactamente con la diferencia de ${target.toLocaleString("es-AR")} kg.`,
      confidence: 0.95,
      explainedQuantity: target,
      unexplainedQuantity: 0,
      hypotheses: [hypothesis("Movimiento pendiente no conciliado", "La cantidad y la ubicaci\xF3n coinciden exactamente con el desv\xEDo de stock.", [exact])],
      evidence: movementEvidence([exact]),
      recommendedAction: `Revisar el remito y confirmar o cancelar ${exact.reference}; la decisi\xF3n final corresponde al operador.`,
      relatedMovementId: exact.id,
      relatedMovementReference: exact.reference
    };
  }
  for (let left = 0; left < pending.length; left += 1) {
    for (let right = left + 1; right < pending.length; right += 1) {
      if (pending[left].quantity + pending[right].quantity === target) {
        const matches = [pending[left], pending[right]];
        return {
          engine: "heuristic",
          summary: `Dos movimientos pendientes (${matches.map((item) => item.reference).join(" + ")}) suman exactamente ${target.toLocaleString("es-AR")} kg.`,
          confidence: 0.88,
          explainedQuantity: target,
          unexplainedQuantity: 0,
          hypotheses: [hypothesis("Combinaci\xF3n de movimientos sin conciliar", "La suma de los movimientos coincide con la diferencia registrada.", matches)],
          evidence: movementEvidence(matches),
          recommendedAction: "Contrastar ambos remitos y pesajes antes de conciliar el stock.",
          relatedMovementId: matches[0].id,
          relatedMovementReference: matches.map((item) => item.reference).join(" + ")
        };
      }
    }
  }
  const partial = pending.filter((movement) => movement.quantity < target).slice(0, 4);
  const explained = Math.min(target, partial.reduce((sum, movement) => sum + movement.quantity, 0));
  if (partial.length && explained > 0) {
    return {
      engine: "heuristic",
      summary: `Movimientos pendientes recientes explican ${explained.toLocaleString("es-AR")} de ${target.toLocaleString("es-AR")} kg.`,
      confidence: 0.62,
      explainedQuantity: explained,
      unexplainedQuantity: target - explained,
      hypotheses: [hypothesis("Conciliaci\xF3n parcial pendiente", "Hay evidencia operativa relacionada, pero no alcanza para explicar todo el desv\xEDo.", partial)],
      evidence: movementEvidence(partial),
      recommendedAction: "Revisar estos movimientos y buscar pesajes o remitos adicionales para la cantidad restante.",
      relatedMovementId: partial[0].id,
      relatedMovementReference: partial.map((item) => item.reference).join(" + ")
    };
  }
  return {
    engine: "heuristic",
    summary: `No hay movimientos pendientes relacionados que expliquen la diferencia de ${target.toLocaleString("es-AR")} kg.`,
    confidence: 0.25,
    explainedQuantity: 0,
    unexplainedQuantity: target,
    hypotheses: [hypothesis("Evidencia operativa insuficiente", "El historial disponible no permite asociar la diferencia a un movimiento abierto.", [])],
    evidence: [{ type: "stock", reference: input.lot.code, description: `Diferencia sin explicar: ${target.toLocaleString("es-AR")} kg.` }],
    recommendedAction: "Revisar remitos, pesajes y verificaciones recientes; no conciliar autom\xE1ticamente."
  };
}

// server/services/groqDiscrepancy.ts
var analysisSchema = z.object({
  summary: z.string().min(1).max(700),
  confidence: z.number().min(0).max(1),
  explainedQuantity: z.number().min(0),
  unexplainedQuantity: z.number().min(0),
  hypotheses: z.array(z.object({
    title: z.string().min(1).max(160),
    explanation: z.string().min(1).max(700),
    movementReferences: z.array(z.string()).max(8)
  })).max(5),
  evidence: z.array(z.object({
    type: z.enum(["movement", "traceability", "stock"]),
    reference: z.string().min(1).max(160),
    description: z.string().min(1).max(500)
  })).max(10),
  recommendedAction: z.string().min(1).max(700)
});
var jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "confidence", "explainedQuantity", "unexplainedQuantity", "hypotheses", "evidence", "recommendedAction"],
  properties: {
    summary: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    explainedQuantity: { type: "number", minimum: 0 },
    unexplainedQuantity: { type: "number", minimum: 0 },
    hypotheses: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "explanation", "movementReferences"],
        properties: {
          title: { type: "string" },
          explanation: { type: "string" },
          movementReferences: { type: "array", items: { type: "string" }, maxItems: 8 }
        }
      }
    },
    evidence: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "reference", "description"],
        properties: {
          type: { type: "string", enum: ["movement", "traceability", "stock"] },
          reference: { type: "string" },
          description: { type: "string" }
        }
      }
    },
    recommendedAction: { type: "string" }
  }
};
function createDiscrepancyAnalyzer(options) {
  return async function analyze(input) {
    const target = Math.abs(input.stock.verifiedQuantity - input.stock.declaredQuantity);
    if (!options.apiKey || target === 0) return analyzeWithHeuristic(input);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const response = await (options.fetchImpl ?? fetch)("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: { authorization: `Bearer ${options.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: options.model,
          temperature: 0,
          messages: [
            {
              role: "system",
              content: [
                "Sos un analista de conciliaci\xF3n de stock agr\xEDcola.",
                "Analiz\xE1 \xFAnicamente la evidencia JSON entregada; nunca inventes movimientos, referencias ni cantidades.",
                "Una hip\xF3tesis es informativa: no autoriza despachos, conciliaciones ni escrituras.",
                "Prioriz\xE1 movimientos pendientes y recientes vinculados a la ubicaci\xF3n del stock.",
                "Las cantidades explicada y no explicada deben sumar exactamente la diferencia absoluta.",
                "La acci\xF3n recomendada siempre requiere revisi\xF3n humana.",
                "Respond\xE9 en espa\xF1ol y exclusivamente con el JSON Schema solicitado."
              ].join(" ")
            },
            { role: "user", content: JSON.stringify(input) }
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: "papastock_discrepancy", strict: true, schema: jsonSchema }
          }
        })
      });
      if (!response.ok) throw new Error(`Groq respondi\xF3 HTTP ${response.status}`);
      const envelope = await response.json();
      const content = envelope.choices?.[0]?.message?.content;
      if (!content) throw new Error("Groq no devolvi\xF3 contenido.");
      const parsed = analysisSchema.parse(JSON.parse(content));
      const movementReferences = new Set(input.movements.map((item) => item.reference));
      for (const item of parsed.hypotheses.flatMap((entry) => entry.movementReferences)) {
        if (!movementReferences.has(item)) throw new Error(`Groq invent\xF3 la referencia ${item}.`);
      }
      const allowedEvidence = {
        movement: new Set(input.movements.flatMap((item) => [item.id, item.reference])),
        traceability: new Set(input.traceability.map((item) => item.id)),
        stock: /* @__PURE__ */ new Set([input.stock.id, input.lot.id, input.lot.code])
      };
      for (const evidence of parsed.evidence) {
        if (!allowedEvidence[evidence.type].has(evidence.reference)) {
          throw new Error(`Groq invent\xF3 evidencia ${evidence.reference}.`);
        }
      }
      if (Math.abs(parsed.explainedQuantity + parsed.unexplainedQuantity - target) > 1e-3) {
        throw new Error("Groq devolvi\xF3 cantidades inconsistentes con la diferencia.");
      }
      const firstReference = parsed.hypotheses.flatMap((item) => item.movementReferences)[0];
      const related = input.movements.find((item) => item.reference === firstReference);
      return {
        engine: "llm",
        ...parsed,
        relatedMovementId: related?.id,
        relatedMovementReference: related?.reference
      };
    } catch (error) {
      console.warn("[ai] fallback heur\xEDstico:", error instanceof Error ? error.message : error);
      return analyzeWithHeuristic(input);
    } finally {
      clearTimeout(timeout);
    }
  };
}

// server/app.ts
var identifier = z2.string().min(1).max(120);
var discrepancyInputSchema = z2.object({
  lot: z2.object({ id: identifier, code: identifier }),
  stock: z2.object({
    id: identifier,
    lotId: identifier,
    locationId: identifier,
    declaredQuantity: z2.number().nonnegative(),
    verifiedQuantity: z2.number().nonnegative(),
    updatedAt: z2.string(),
    verificationPending: z2.boolean().optional()
  }),
  movements: z2.array(z2.object({
    id: identifier,
    lotId: identifier,
    originLocationId: identifier.optional(),
    destinationLocationId: identifier.optional(),
    quantity: z2.number().positive(),
    date: z2.string(),
    status: z2.enum(["completed", "pending", "cancelled"]),
    reference: identifier
  })).max(100),
  traceability: z2.array(z2.object({
    id: identifier,
    lotId: identifier,
    type: z2.enum(["planting", "harvest", "treatment", "quality_control", "stock_verification"]),
    date: z2.string(),
    locationId: identifier.optional(),
    data: z2.record(z2.string(), z2.unknown())
  })).max(100)
});
var traceabilityInputSchema = z2.object({
  lotId: identifier,
  type: z2.literal("treatment"),
  date: z2.iso.date(),
  locationId: identifier.optional(),
  data: z2.object({
    product: z2.string().trim().min(1).max(120),
    sourceText: z2.string().trim().max(500).optional(),
    origin: z2.literal("operator_confirmation").optional()
  })
});
function createApp(dependencies = {}) {
  const app2 = express();
  const repository = dependencies.repository ?? (pool ? new PapaStockRepository(pool) : void 0);
  const analyze = dependencies.analyze ?? createDiscrepancyAnalyzer({
    apiKey: config.groqApiKey,
    model: config.aiModel,
    timeoutMs: config.groqTimeoutMs
  });
  app2.disable("x-powered-by");
  app2.use(express.json({ limit: "64kb" }));
  app2.get("/health", (_request, response) => response.json({ status: "ok" }));
  app2.get("/api/snapshot", async (_request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error("Base de datos no configurada."), { status: 503 });
      response.json({ data: await repository.loadSnapshot(), source: "database" });
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/lots/:id", async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error("Base de datos no configurada."), { status: 503 });
      response.json({ data: await repository.loadLot(request.params.id), source: "database" });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/traceability", async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error("Base de datos no configurada."), { status: 503 });
      const event = traceabilityInputSchema.parse(request.body);
      response.status(201).json({ data: await repository.insertTraceabilityEvent(event) });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/ai/discrepancy", async (request, response, next) => {
    try {
      const input = discrepancyInputSchema.parse(request.body);
      response.json({ data: await analyze(input) });
    } catch (error) {
      next(error);
    }
  });
  app2.use("/api", (_request, response) => response.status(404).json({ error: "Endpoint no encontrado." }));
  app2.use((error, _request, response, _next) => {
    if (error instanceof z2.ZodError) return response.status(400).json({ error: "Solicitud inv\xE1lida.", details: z2.treeifyError(error) });
    const candidate = error;
    const status = candidate.status ?? (candidate.code === "23505" ? 409 : 500);
    if (status >= 500) console.error("[api]", error);
    return response.status(status).json({ error: status >= 500 ? "No se pudo completar la operaci\xF3n." : candidate.message });
  });
  return app2;
}

// server/index.ts
var app = createApp();
var repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (config.nodeEnv === "production") {
  await verifyDatabaseConnection();
  const clientDirectory = path.join(repositoryRoot, "dist");
  app.use(express2.static(clientDirectory, { index: false, maxAge: "1h" }));
  app.use((request, response, next) => {
    if (request.method !== "GET" || !request.accepts("html")) return next();
    return response.sendFile(path.join(clientDirectory, "index.html"));
  });
} else {
  if (pool) {
    try {
      await verifyDatabaseConnection();
    } catch (error) {
      console.warn("[database] se usar\xE1 fallback mock:", error);
    }
  } else {
    console.warn("[database] DATABASE_URL ausente; el frontend usar\xE1 el snapshot mock.");
  }
  const { createServer } = await import("vite");
  const vite = await createServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
}
var server = app.listen(config.port, "0.0.0.0", () => {
  console.log(`PapaStock escuchando en http://0.0.0.0:${config.port}`);
});
async function shutdown(signal) {
  console.log(`${signal}: cierre ordenado.`);
  server.close(async () => {
    await pool?.end();
    process.exit(0);
  });
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
