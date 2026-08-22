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
import { z as z5 } from "zod";

// server/repositories/papaStockRepository.ts
import { randomUUID } from "crypto";

// src/data/shelves.ts
var shelves = [
  { id: "shelf-n-a1", locationId: "loc-north", shelfUnitId: "unit-n-a", code: "N-A1", label: "Pasillo A \xB7 Nivel 1", level: 1, capacityKg: 18e3 },
  { id: "shelf-n-a2", locationId: "loc-north", shelfUnitId: "unit-n-a", code: "N-A2", label: "Pasillo A \xB7 Nivel 2", level: 2, capacityKg: 18e3 },
  { id: "shelf-n-b1", locationId: "loc-north", shelfUnitId: "unit-n-b", code: "N-B1", label: "Pasillo B \xB7 Nivel 1", level: 1, capacityKg: 15e3 },
  { id: "shelf-s-a1", locationId: "loc-south", shelfUnitId: "unit-s-a", code: "S-A1", label: "C\xE1mara 1 \xB7 Rack A \xB7 N1", level: 1, capacityKg: 22e3 },
  { id: "shelf-s-a2", locationId: "loc-south", shelfUnitId: "unit-s-b", code: "S-A2", label: "C\xE1mara 1 \xB7 Rack B \xB7 N1", level: 1, capacityKg: 22e3 },
  { id: "shelf-s-b1", locationId: "loc-south", shelfUnitId: "unit-s-c", code: "S-B1", label: "C\xE1mara 2 \xB7 Rack A \xB7 N1", level: 1, capacityKg: 2e4 },
  { id: "shelf-c-a1", locationId: "loc-central", shelfUnitId: "unit-c-a", code: "C-A1", label: "Bloque A \xB7 Nivel 1", level: 1, capacityKg: 25e3 },
  { id: "shelf-c-a2", locationId: "loc-central", shelfUnitId: "unit-c-b", code: "C-A2", label: "Bloque B \xB7 Nivel 1", level: 1, capacityKg: 25e3 },
  { id: "shelf-c-b1", locationId: "loc-central", shelfUnitId: "unit-c-c", code: "C-B1", label: "Bloque C \xB7 Nivel 1", level: 1, capacityKg: 2e4 },
  { id: "shelf-w-a1", locationId: "loc-warehouse", shelfUnitId: "unit-w-a", code: "G-A1", label: "Fila A \xB7 Nivel 1", level: 1, capacityKg: 3e4 },
  { id: "shelf-w-b1", locationId: "loc-warehouse", shelfUnitId: "unit-w-b", code: "G-B1", label: "Fila B \xB7 Nivel 1", level: 1, capacityKg: 28e3 },
  { id: "shelf-w-c1", locationId: "loc-warehouse", shelfUnitId: "unit-w-c", code: "G-C1", label: "Fila C \xB7 Nivel 1", level: 1, capacityKg: 25e3 }
];

// src/data/shelfUnits.ts
var shelfUnits = [
  { id: "unit-n-a", locationId: "loc-north", code: "N-A", label: "Pasillo A", gridRow: 0, gridCol: 0 },
  { id: "unit-n-b", locationId: "loc-north", code: "N-B", label: "Pasillo B", gridRow: 0, gridCol: 2 },
  { id: "unit-s-a", locationId: "loc-south", code: "S-A", label: "C\xE1mara 1 \xB7 Rack A", gridRow: 0, gridCol: 0 },
  { id: "unit-s-b", locationId: "loc-south", code: "S-B", label: "C\xE1mara 1 \xB7 Rack B", gridRow: 0, gridCol: 1 },
  { id: "unit-s-c", locationId: "loc-south", code: "S-C", label: "C\xE1mara 2 \xB7 Rack A", gridRow: 1, gridCol: 0 },
  { id: "unit-c-a", locationId: "loc-central", code: "C-A", label: "Zona fr\xEDa \xB7 Bloque A", gridRow: 0, gridCol: 0 },
  { id: "unit-c-b", locationId: "loc-central", code: "C-B", label: "Zona fr\xEDa \xB7 Bloque B", gridRow: 0, gridCol: 1 },
  { id: "unit-c-c", locationId: "loc-central", code: "C-C", label: "Zona fr\xEDa \xB7 Bloque C", gridRow: 1, gridCol: 0 },
  { id: "unit-w-a", locationId: "loc-warehouse", code: "G-A", label: "Galp\xF3n \xB7 Fila A", gridRow: 0, gridCol: 0 },
  { id: "unit-w-b", locationId: "loc-warehouse", code: "G-B", label: "Galp\xF3n \xB7 Fila B", gridRow: 0, gridCol: 1 },
  { id: "unit-w-c", locationId: "loc-warehouse", code: "G-C", label: "Galp\xF3n \xB7 Fila C", gridRow: 0, gridCol: 2 }
];

// src/data/transporters.ts
var transporters = [
  {
    id: "tr-andina",
    companyName: "Transportes Andina S.A.",
    tradeName: "Andina Log\xEDstica",
    cuit: "30-71234567-8",
    contactName: "Marcos Rivas",
    phone: "+54 2266 45-8901",
    email: "despachos@andinalog.com.ar",
    address: "Ruta 226 Km 48.2",
    city: "Balcarce",
    province: "Buenos Aires",
    licensePlate: "AB 834 CD",
    vehicleType: "Semirremolque refrigerado",
    capacityKg: 28e3,
    insurancePolicy: "La Caja \xB7 P\xF3liza 884221",
    notes: "Preferido para exportaciones a Brasil. Habilitado SENASA.",
    active: true
  },
  {
    id: "tr-pampa",
    companyName: "Pampa Frio SRL",
    tradeName: "Pampa Fr\xEDo",
    cuit: "30-69881234-2",
    contactName: "Luc\xEDa M\xE9ndez",
    phone: "+54 11 4876-2200",
    email: "operaciones@pampafrio.com",
    address: "Av. Circunvalaci\xF3n 1250",
    city: "Mar del Plata",
    province: "Buenos Aires",
    licensePlate: "AC 102 EF",
    vehicleType: "Cami\xF3n 6\xD72 con equipo fr\xEDo",
    capacityKg: 18e3,
    insurancePolicy: "Sancor \xB7 P\xF3liza 551209",
    notes: "Movimientos internos entre frigor\xEDficos.",
    active: true
  },
  {
    id: "tr-sur",
    companyName: "Sur Cargo Express",
    cuit: "30-70551220-9",
    contactName: "Diego Alcorta",
    phone: "+54 291 455-7788",
    email: "flota@surcargo.com.ar",
    address: "Parque Industrial Oeste Lote 14",
    city: "Bah\xEDa Blanca",
    province: "Buenos Aires",
    licensePlate: "AD 441 GH",
    vehicleType: "Bitren refrigerado",
    capacityKg: 32e3,
    insurancePolicy: "Federaci\xF3n Patronal \xB7 220981",
    active: true
  }
];

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

// server/services/stockTransfer.ts
var EPSILON = 1e-3;
function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}
function buildStockTransferPreview(intent, snapshot) {
  const errors = [];
  const lot = snapshot.lots.find((item) => normalize(item.code) === normalize(intent.lotCode));
  const origin = snapshot.locations.find((item) => normalize(item.id) === normalize(intent.origin) || normalize(item.name) === normalize(intent.origin));
  const destination = snapshot.locations.find((item) => normalize(item.id) === normalize(intent.destination) || normalize(item.name) === normalize(intent.destination));
  if (!Number.isFinite(intent.quantityKg) || intent.quantityKg <= 0) {
    errors.push({ code: "INVALID_QUANTITY", message: "La cantidad debe ser mayor a cero." });
  }
  if (!lot) errors.push({ code: "LOT_NOT_FOUND", message: `No existe el lote ${intent.lotCode}.` });
  if (!origin) errors.push({ code: "ORIGIN_NOT_FOUND", message: `No existe la ubicaci\xF3n de origen \u201C${intent.origin}\u201D.` });
  if (!destination) errors.push({ code: "DESTINATION_NOT_FOUND", message: `No existe la ubicaci\xF3n de destino \u201C${intent.destination}\u201D.` });
  if (origin && destination && origin.id === destination.id) {
    errors.push({ code: "SAME_LOCATION", message: "El origen y el destino deben ser distintos." });
  }
  const lotStock = lot ? snapshot.stockRecords.filter((item) => item.lotId === lot.id) : [];
  const originRecord = origin ? lotStock.find((item) => item.locationId === origin.id) : void 0;
  if (lot && origin && !originRecord) {
    errors.push({ code: "ORIGIN_STOCK_NOT_FOUND", message: `El lote ${lot.code} no tiene stock registrado en ${origin.name}.` });
  }
  if (originRecord && intent.quantityKg > originRecord.verifiedQuantity + EPSILON) {
    errors.push({ code: "INSUFFICIENT_VERIFIED_STOCK", message: "La cantidad supera el stock verificado disponible en origen." });
  }
  if (originRecord && intent.quantityKg > originRecord.declaredQuantity + EPSILON) {
    errors.push({ code: "INSUFFICIENT_DECLARED_STOCK", message: "La cantidad supera el stock declarado disponible en origen." });
  }
  if (lotStock.some((item) => item.verificationPending || Math.abs(item.verifiedQuantity - item.declaredQuantity) > EPSILON)) {
    errors.push({ code: "UNRESOLVED_DISCREPANCY", message: "El lote presenta una discrepancia o verificaci\xF3n pendiente." });
  }
  return {
    valid: errors.length === 0,
    errors,
    intent,
    lot,
    origin,
    destination,
    originStock: originRecord && {
      declaredQuantity: originRecord.declaredQuantity,
      verifiedQuantity: originRecord.verifiedQuantity
    }
  };
}

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
      shelfUnits: shelfUnits.map((item) => ({ ...item })),
      shelves: shelves.map((item) => ({ ...item })),
      lots: lots.rows.map(mapLot),
      stockRecords: stock.rows.map(mapStockRecord),
      movements: movements.rows.map(mapMovement),
      transporters: transporters.map((item) => ({ ...item })),
      traceabilityEvents: traceability.rows.map(mapTraceabilityEvent)
    };
  }
  async loadLot(idOrCode) {
    const snapshot = await this.loadSnapshot();
    const lot = snapshot.lots.find((item) => item.id === idOrCode || item.code.toLowerCase() === idOrCode.toLowerCase());
    if (!lot) throw Object.assign(new Error("Lote no encontrado."), { status: 404 });
    const lotLocationIds = new Set(
      snapshot.stockRecords.filter((item) => item.lotId === lot.id).map((item) => item.locationId)
    );
    return {
      locations: snapshot.locations,
      shelfUnits: snapshot.shelfUnits.filter((unit) => lotLocationIds.has(unit.locationId)),
      shelves: snapshot.shelves.filter((shelf) => lotLocationIds.has(shelf.locationId)),
      lots: [lot],
      stockRecords: snapshot.stockRecords.filter((item) => item.lotId === lot.id),
      movements: snapshot.movements.filter((item) => item.lotId === lot.id),
      transporters: snapshot.transporters,
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
  async previewStockTransfer(intent) {
    return buildStockTransferPreview(intent, await this.loadSnapshot());
  }
  async executeStockTransfer(intent) {
    const client = await this.database.connect();
    try {
      await client.query("begin");
      const [locationsResult, lotResult] = await Promise.all([
        client.query("select * from public.locations order by id"),
        client.query("select * from public.lots where lower(code) = lower($1) for share", [intent.lotCode])
      ]);
      const lot = lotResult.rows[0];
      const stockResult = lot ? await client.query("select * from public.stock_records where lot_id = $1 order by id for update", [lot.id]) : { rows: [] };
      const snapshot = {
        locations: locationsResult.rows.map(mapLocation),
        shelfUnits: shelfUnits.map((item) => ({ ...item })),
        shelves: shelves.map((item) => ({ ...item })),
        lots: lot ? [mapLot(lot)] : [],
        stockRecords: stockResult.rows.map(mapStockRecord),
        movements: [],
        transporters: transporters.map((item) => ({ ...item })),
        traceabilityEvents: []
      };
      const preview = buildStockTransferPreview(intent, snapshot);
      if (!preview.valid || !preview.lot || !preview.origin || !preview.destination) {
        throw Object.assign(new Error("El movimiento no supera la validaci\xF3n operativa."), {
          status: 409,
          details: preview.errors
        });
      }
      const originRecord = stockResult.rows.find((item) => item.location_id === preview.origin.id);
      if (!originRecord) throw new Error("El stock de origen desapareci\xF3 durante la transacci\xF3n.");
      await client.query(
        `update public.stock_records
         set declared_quantity = declared_quantity - $1,
             verified_quantity = verified_quantity - $1,
             updated_at = now()
         where id = $2`,
        [intent.quantityKg, originRecord.id]
      );
      await client.query(
        `insert into public.stock_records
          (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, updated_at)
         values ($1, $2, $3, $4, $4, false, now())
         on conflict (lot_id, location_id) do update set
           declared_quantity = public.stock_records.declared_quantity + excluded.declared_quantity,
           verified_quantity = public.stock_records.verified_quantity + excluded.verified_quantity,
           verification_pending = false,
           updated_at = now()`,
        [`stock-${randomUUID()}`, preview.lot.id, preview.destination.id, intent.quantityKg]
      );
      const token = randomUUID();
      const movementResult = await client.query(
        `insert into public.movements
          (id, reference, lot_id, origin_location_id, destination_location_id, quantity, movement_date, status)
         values ($1, $2, $3, $4, $5, $6, current_date, 'completed')
         returning *`,
        [
          `movement-${token}`,
          `MV-N01-${token.slice(0, 8).toUpperCase()}`,
          preview.lot.id,
          preview.origin.id,
          preview.destination.id,
          intent.quantityKg
        ]
      );
      await client.query("commit");
      return mapMovement(movementResult.rows[0]);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
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

// server/services/groqExportRequirements.ts
import { z as z2 } from "zod";

// src/types/export.ts
var EXPORT_FIELD_KEYS = [
  "lotCode",
  "variety",
  "campaign",
  "producer",
  "origin",
  "harvestDate",
  "quantity",
  "treatment",
  "destination",
  "customer",
  "incoterm",
  "departurePort",
  "destinationPort",
  "transport"
];

// server/services/groqStructured.ts
var GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
async function requestStructuredOutput(options, request) {
  if (!options.apiKey) throw new Error("GROQ_API_KEY ausente.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await (options.fetchImpl ?? fetch)(GROQ_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { authorization: `Bearer ${options.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: options.model,
        temperature: 0,
        messages: [
          { role: "system", content: request.system.join(" ") },
          { role: "user", content: JSON.stringify(request.user) }
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: request.schemaName, strict: true, schema: request.jsonSchema }
        }
      })
    });
    if (!response.ok) throw new Error(`Groq respondi\xF3 HTTP ${response.status}`);
    const envelope = await response.json();
    const content = envelope.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq no devolvi\xF3 contenido.");
    return JSON.parse(content);
  } finally {
    clearTimeout(timeout);
  }
}
function normalizeForMatch(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

// server/services/groqExportRequirements.ts
var canonicalLabels = {
  lotCode: "N\xFAmero de lote",
  variety: "Variedad",
  campaign: "Campa\xF1a",
  producer: "Productor",
  origin: "Origen",
  harvestDate: "Fecha de cosecha",
  quantity: "Peso neto",
  treatment: "Tratamiento fitosanitario",
  destination: "Pa\xEDs de destino",
  customer: "Comprador / consignatario",
  incoterm: "Incoterm",
  departurePort: "Puerto de salida",
  destinationPort: "Puerto de destino",
  transport: "Transporte"
};
var keywords = {
  lotCode: ["numero de lote", "n\xFAmero de lote", "nro de lote", "lote", "partida"],
  variety: ["variedad", "cultivar"],
  campaign: ["campana", "campa\xF1a", "cosecha 20", "temporada"],
  producer: ["productor", "establecimiento", "finca"],
  origin: ["origen", "procedencia", "localidad de origen"],
  harvestDate: ["fecha de cosecha", "cosechado"],
  quantity: ["peso neto", "peso", "cantidad", "kilos", "kg"],
  treatment: ["tratamiento", "fitosanitario", "fumigacion", "fumigaci\xF3n", "principio activo"],
  destination: ["pais de destino", "pa\xEDs de destino", "destino"],
  customer: ["comprador", "consignatario", "importador", "cliente"],
  incoterm: ["incoterm", "fob", "cif", "exw", "dap"],
  departurePort: ["puerto de salida", "puerto de embarque", "punto de salida"],
  destinationPort: ["puerto de destino", "puerto de llegada", "puerto de arribo"],
  transport: ["transporte", "transportista", "camion", "cami\xF3n", "medio de transporte"]
};
var requirementsSchema = z2.object({
  requirements: z2.array(z2.object({
    key: z2.enum(EXPORT_FIELD_KEYS),
    label: z2.string().trim().min(1).max(120),
    required: z2.boolean()
  })).max(EXPORT_FIELD_KEYS.length)
});
var jsonSchema2 = {
  type: "object",
  additionalProperties: false,
  required: ["requirements"],
  properties: {
    requirements: {
      type: "array",
      maxItems: EXPORT_FIELD_KEYS.length,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "label", "required"],
        properties: {
          key: { type: "string", enum: [...EXPORT_FIELD_KEYS] },
          label: { type: "string" },
          required: { type: "boolean" }
        }
      }
    }
  }
};
function parseRequirementsWithHeuristic(input) {
  const text = normalizeForMatch(input.sourceText);
  const requirements = EXPORT_FIELD_KEYS.filter((key) => keywords[key].some((term) => text.includes(normalizeForMatch(term)))).map((key) => ({ key, label: canonicalLabels[key], required: true }));
  return { engine: "heuristic", requirements };
}
function createExportRequirementsParser(options) {
  return async function parseExportRequirements(input) {
    const fallback = () => parseRequirementsWithHeuristic(input);
    if (!options.apiKey) return fallback();
    try {
      const raw = await requestStructuredOutput(options, {
        schemaName: "papastock_export_requirements",
        jsonSchema: jsonSchema2,
        system: [
          "Convert\xEDs un texto documental de exportaci\xF3n en una lista estructurada de requisitos.",
          "Solo pod\xE9s usar las claves del cat\xE1logo cerrado provisto; no inventes claves nuevas.",
          "Inclu\xED \xFAnicamente los campos que el texto menciona expl\xEDcitamente.",
          "No decidas si la exportaci\xF3n est\xE1 aprobada: eso lo resuelve el sistema de forma determin\xEDstica.",
          "No repitas la misma clave dos veces.",
          "Respond\xE9 exclusivamente con el JSON Schema solicitado."
        ],
        user: {
          country: input.country,
          documentType: input.documentType,
          sourceText: input.sourceText,
          allowedKeys: EXPORT_FIELD_KEYS
        }
      });
      const parsed = requirementsSchema.parse(raw);
      const seen = /* @__PURE__ */ new Set();
      for (const requirement of parsed.requirements) {
        if (seen.has(requirement.key)) throw new Error(`Groq repiti\xF3 la clave ${requirement.key}.`);
        seen.add(requirement.key);
      }
      if (parsed.requirements.length === 0) return fallback();
      return {
        engine: "llm",
        // La etiqueta canónica gana: el modelo no define cómo se llama un campo en la UI.
        requirements: parsed.requirements.map((requirement) => ({
          key: requirement.key,
          label: canonicalLabels[requirement.key],
          required: requirement.required
        }))
      };
    } catch (error) {
      console.warn("[ai] requisitos \u2192 parser local:", error instanceof Error ? error.message : error);
      return fallback();
    }
  };
}

// server/services/groqMovementIntent.ts
import { z as z3 } from "zod";
var parsedIntentSchema = z3.object({
  action: z3.literal("transfer"),
  lotCode: z3.string().trim().min(1).max(40),
  quantityKg: z3.number().positive(),
  origin: z3.string().trim().min(1).max(120),
  destination: z3.string().trim().min(1).max(120)
});
var jsonSchema3 = {
  type: "object",
  additionalProperties: false,
  required: ["action", "lotCode", "quantityKg", "origin", "destination"],
  properties: {
    action: { type: "string", enum: ["transfer"] },
    lotCode: { type: "string" },
    quantityKg: { type: "number", exclusiveMinimum: 0 },
    origin: { type: "string" },
    destination: { type: "string" }
  }
};
function normalize2(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function parseWithHeuristic(text, context) {
  const normalizedText = normalize2(text);
  const lot = context.lots.find((item) => normalizedText.includes(normalize2(item.code)));
  const quantityMatch = normalizedText.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilos?|kilogramos?)\b/);
  const locations = context.locations.map((item) => ({ item, index: normalizedText.indexOf(normalize2(item.name)) })).filter((candidate) => candidate.index >= 0).sort((left, right) => left.index - right.index);
  if (!lot || !quantityMatch || locations.length < 2) {
    throw Object.assign(new Error("No pude identificar lote, cantidad, origen y destino. Escrib\xED las ubicaciones completas."), { status: 422 });
  }
  const quantityKg = Number(quantityMatch[1].replace(",", "."));
  return parsedIntentSchema.parse({
    action: "transfer",
    lotCode: lot.code,
    quantityKg,
    origin: locations[0].item.name,
    destination: locations[1].item.name
  });
}
function createMovementIntentParser(options) {
  return async function parseMovementIntent(text, context) {
    const fallback = () => ({ ...parseWithHeuristic(text, context), engine: "heuristic" });
    if (!options.apiKey) return fallback();
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
                "Interpret\xE1 una orden de transferencia de stock agr\xEDcola.",
                "Solo extra\xE9 datos: nunca autorices, confirmes ni ejecutes la operaci\xF3n.",
                "Us\xE1 exactamente un lote y dos ubicaciones del contexto proporcionado.",
                "La primera ubicaci\xF3n mencionada es el origen y la segunda el destino.",
                "Respond\xE9 en el JSON Schema solicitado."
              ].join(" ")
            },
            { role: "user", content: JSON.stringify({ order: text, available: context }) }
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: "papastock_movement_intent", strict: true, schema: jsonSchema3 }
          }
        })
      });
      if (!response.ok) throw new Error(`Groq respondi\xF3 HTTP ${response.status}`);
      const envelope = await response.json();
      const content = envelope.choices?.[0]?.message?.content;
      if (!content) throw new Error("Groq no devolvi\xF3 contenido.");
      return { ...parsedIntentSchema.parse(JSON.parse(content)), engine: "llm" };
    } catch {
      return fallback();
    } finally {
      clearTimeout(timeout);
    }
  };
}

// server/services/groqTraceabilityIntent.ts
import { z as z4 } from "zod";
var intentSchema = z4.object({
  type: z4.literal("treatment"),
  product: z4.string().trim().min(1).max(120).nullable(),
  date: z4.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  confidence: z4.number().min(0).max(1)
});
var jsonSchema4 = {
  type: "object",
  additionalProperties: false,
  required: ["type", "product", "date", "confidence"],
  properties: {
    type: { type: "string", enum: ["treatment"] },
    product: { type: ["string", "null"] },
    date: { type: ["string", "null"] },
    confidence: { type: "number", minimum: 0, maximum: 1 }
  }
};
var monthNumbers = {
  enero: "01",
  febrero: "02",
  marzo: "03",
  abril: "04",
  mayo: "05",
  junio: "06",
  julio: "07",
  agosto: "08",
  septiembre: "09",
  setiembre: "09",
  octubre: "10",
  noviembre: "11",
  diciembre: "12"
};
function isRealCalendarDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  if (year < 2e3 || year > 2100) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}
function extractDate(text, today = /* @__PURE__ */ new Date()) {
  const isoMatch = text.match(/(20\d{2})[-/]([01]?\d)[-/]([0-3]?\d)/);
  if (isoMatch) {
    const candidate = `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
    return isRealCalendarDate(candidate) ? candidate : null;
  }
  const spanishMatch = normalizeForMatch(text).match(/([0-3]?\d)\s+de\s+([a-z]+)(?:\s+(?:de|del)\s+(20\d{2}))?/);
  if (spanishMatch) {
    const month = monthNumbers[spanishMatch[2]];
    if (month) {
      const year = spanishMatch[3] ?? String(today.getUTCFullYear());
      const candidate = `${year}-${month}-${spanishMatch[1].padStart(2, "0")}`;
      return isRealCalendarDate(candidate) ? candidate : null;
    }
  }
  return null;
}
function extractProduct(text) {
  const match = text.match(
    /(?:tratad[oa]s?\s+con|tratamiento\s+(?:con|de)|aplic\w*\s+(?:de\s+)?|producto:?)\s+([\p{L}\d][\p{L}\d .+-]*?)(?:\s+el\s|\s+en\s|\s+durante\s|[,.;]|$)/iu
  );
  const candidate = match?.[1]?.trim();
  if (!candidate) return null;
  return candidate.length >= 2 && candidate.length <= 120 ? candidate : null;
}
function parseTraceabilityWithHeuristic(text, today = /* @__PURE__ */ new Date()) {
  const product = extractProduct(text);
  const date = extractDate(text, today);
  const found = Number(Boolean(product)) + Number(Boolean(date));
  return {
    engine: "heuristic",
    type: "treatment",
    product,
    date,
    confidence: found === 2 ? 0.6 : found === 1 ? 0.4 : 0.15
  };
}
function createTraceabilityIntentParser(options) {
  return async function parseTraceabilityIntent(text) {
    const today = /* @__PURE__ */ new Date();
    const fallback = () => parseTraceabilityWithHeuristic(text, today);
    if (!options.apiKey) return fallback();
    try {
      const raw = await requestStructuredOutput(options, {
        schemaName: "papastock_traceability_intent",
        jsonSchema: jsonSchema4,
        system: [
          "Extra\xE9s un evento de trazabilidad fitosanitaria desde texto libre de un operador agr\xEDcola.",
          "Solo extra\xE9s datos: nunca autoriz\xE1s, confirm\xE1s ni ejecut\xE1s nada.",
          "Si el texto no menciona el producto, devolv\xE9 product = null. Si no menciona la fecha, devolv\xE9 date = null.",
          "Nunca inventes un producto ni una fecha que no est\xE9n en el texto.",
          "El producto debe aparecer literalmente en el texto del operador.",
          "Las fechas van en formato YYYY-MM-DD. Si el texto da d\xEDa y mes sin a\xF1o, us\xE1 el a\xF1o de referencia provisto.",
          "confidence refleja qu\xE9 tan expl\xEDcito es el texto, entre 0 y 1.",
          "Respond\xE9 exclusivamente con el JSON Schema solicitado."
        ],
        user: { text, referenceYear: today.getUTCFullYear(), today: today.toISOString().slice(0, 10) }
      });
      const parsed = intentSchema.parse(raw);
      if (parsed.product && !normalizeForMatch(text).includes(normalizeForMatch(parsed.product))) {
        throw new Error(`Groq devolvi\xF3 un producto ausente del texto: ${parsed.product}`);
      }
      if (parsed.date && !isRealCalendarDate(parsed.date)) {
        throw new Error(`Groq devolvi\xF3 una fecha inv\xE1lida: ${parsed.date}`);
      }
      if (!parsed.product && !parsed.date) return fallback();
      return { engine: "llm", ...parsed };
    } catch (error) {
      console.warn("[ai] trazabilidad \u2192 parser local:", error instanceof Error ? error.message : error);
      return fallback();
    }
  };
}

// server/app.ts
var identifier = z5.string().min(1).max(120);
var discrepancyInputSchema = z5.object({
  lot: z5.object({ id: identifier, code: identifier }),
  stock: z5.object({
    id: identifier,
    lotId: identifier,
    locationId: identifier,
    declaredQuantity: z5.number().nonnegative(),
    verifiedQuantity: z5.number().nonnegative(),
    updatedAt: z5.string(),
    verificationPending: z5.boolean().optional()
  }),
  movements: z5.array(z5.object({
    id: identifier,
    lotId: identifier,
    originLocationId: identifier.optional(),
    destinationLocationId: identifier.optional(),
    quantity: z5.number().positive(),
    date: z5.string(),
    status: z5.enum(["completed", "pending", "cancelled"]),
    reference: identifier
  })).max(100),
  traceability: z5.array(z5.object({
    id: identifier,
    lotId: identifier,
    type: z5.enum(["planting", "harvest", "treatment", "quality_control", "stock_verification"]),
    date: z5.string(),
    locationId: identifier.optional(),
    data: z5.record(z5.string(), z5.unknown())
  })).max(100)
});
var traceabilityInputSchema = z5.object({
  lotId: identifier,
  type: z5.literal("treatment"),
  date: z5.iso.date(),
  locationId: identifier.optional(),
  data: z5.object({
    product: z5.string().trim().min(1).max(120),
    sourceText: z5.string().trim().max(500).optional(),
    origin: z5.literal("operator_confirmation").optional()
  })
});
var movementTextSchema = z5.object({
  text: z5.string().trim().min(8).max(500)
});
var movementIntentSchema = z5.object({
  action: z5.literal("transfer"),
  lotCode: identifier.max(40),
  quantityKg: z5.number().positive().max(1e6),
  origin: identifier,
  destination: identifier
});
var traceabilityIntentInputSchema = z5.object({
  text: z5.string().trim().min(8).max(1e3),
  lotId: identifier
});
var exportRequirementsInputSchema = z5.object({
  country: z5.string().trim().min(2).max(80),
  documentType: z5.string().trim().min(2).max(40),
  sourceText: z5.string().trim().min(8).max(2e3)
});
function createApp(dependencies = {}) {
  const app2 = express();
  const repository = dependencies.repository ?? (pool ? new PapaStockRepository(pool) : void 0);
  const analyze = dependencies.analyze ?? createDiscrepancyAnalyzer({
    apiKey: config.groqApiKey,
    model: config.aiModel,
    timeoutMs: config.groqTimeoutMs
  });
  const parseMovementIntent = dependencies.parseMovementIntent ?? createMovementIntentParser({
    apiKey: config.groqApiKey,
    model: config.aiModel,
    timeoutMs: config.groqTimeoutMs
  });
  const groqOptions = {
    apiKey: config.groqApiKey,
    model: config.aiModel,
    timeoutMs: config.groqTimeoutMs
  };
  const parseTraceabilityIntent = dependencies.parseTraceabilityIntent ?? createTraceabilityIntentParser(groqOptions);
  const parseExportRequirements = dependencies.parseExportRequirements ?? createExportRequirementsParser(groqOptions);
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
  app2.post("/api/ai/movement-intent", async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error("Base de datos no configurada."), { status: 503 });
      const { text } = movementTextSchema.parse(request.body);
      const snapshot = await repository.loadSnapshot();
      const data = await parseMovementIntent(text, {
        lots: snapshot.lots.map(({ code }) => ({ code })),
        locations: snapshot.locations.map(({ name }) => ({ name }))
      });
      response.json({ data });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/ai/traceability-intent", async (request, response, next) => {
    try {
      const { text } = traceabilityIntentInputSchema.parse(request.body);
      response.json({ data: await parseTraceabilityIntent(text) });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/ai/export-requirements", async (request, response, next) => {
    try {
      const input = exportRequirementsInputSchema.parse(request.body);
      response.json({ data: await parseExportRequirements(input) });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/movements/preview", async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error("Base de datos no configurada."), { status: 503 });
      response.json({ data: await repository.previewStockTransfer(movementIntentSchema.parse(request.body)) });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/movements", async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error("Base de datos no configurada."), { status: 503 });
      const movement = await repository.executeStockTransfer(movementIntentSchema.parse(request.body));
      response.status(201).json({ data: movement });
    } catch (error) {
      next(error);
    }
  });
  app2.use("/api", (_request, response) => response.status(404).json({ error: "Endpoint no encontrado." }));
  app2.use((error, _request, response, _next) => {
    if (error instanceof z5.ZodError) return response.status(400).json({ error: "Solicitud inv\xE1lida.", details: z5.treeifyError(error) });
    const candidate = error;
    const status = candidate.status ?? (candidate.code === "23505" ? 409 : 500);
    if (status >= 500) console.error("[api]", error);
    return response.status(status).json({
      error: status >= 500 ? "No se pudo completar la operaci\xF3n." : candidate.message,
      ...candidate.details ? { details: candidate.details } : {}
    });
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
