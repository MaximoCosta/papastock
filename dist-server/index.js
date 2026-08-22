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
import { z as z3 } from "zod";

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
var mapMovement = (row) => {
  const data = row.data && typeof row.data === "object" && !Array.isArray(row.data) ? row.data : void 0;
  const entries = data ? Object.entries(data).filter(([, value]) => value !== void 0) : [];
  return {
    id: row.id,
    reference: row.reference,
    lotId: row.lot_id,
    originLocationId: row.origin_location_id ?? void 0,
    destinationLocationId: row.destination_location_id ?? void 0,
    quantity: Number(row.quantity),
    date: row.movement_date,
    status: row.status,
    data: entries.length > 0 ? Object.fromEntries(entries) : void 0
  };
};
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

// server/services/planillaImport.ts
import { createHash } from "crypto";
import * as XLSX from "xlsx";
var PROTECTED_DEMO_LOT_CODES = /* @__PURE__ */ new Set(["A-204", "A-310", "C-102", "F-301"]);
var SAMPLE_SIZE = 25;
var MAX_ISSUES = 80;
var LOCATION_ALIASES = {
  dospanca: { name: "Dos Panca", type: "cold_storage" },
  "dos panca": { name: "Dos Panca", type: "cold_storage" },
  "dos pancas": { name: "Dos Panca", type: "cold_storage" },
  galpon: { name: "Galp\xF3n Principal", type: "warehouse" },
  "galpon principal": { name: "Galp\xF3n Principal", type: "warehouse" },
  "galpon galpon": { name: "Galp\xF3n Principal", type: "warehouse" },
  "galpon mar del plata": { name: "Galp\xF3n Principal", type: "warehouse" },
  "galpon mdp": { name: "Galp\xF3n Principal", type: "warehouse" },
  "santa ana": { name: "Planta Santa Ana", type: "warehouse" },
  "planta santa ana": { name: "Planta Santa Ana", type: "warehouse" },
  planta: { name: "Planta Santa Ana", type: "warehouse" },
  "en planta": { name: "Planta Santa Ana", type: "warehouse" },
  papasud: { name: "Planta Santa Ana", type: "warehouse" },
  campo: { name: "Campo", type: "warehouse" },
  chacra: { name: "Campo", type: "warehouse" },
  "chacra santa ana": { name: "Campo", type: "warehouse" },
  trevelin: { name: "Trevelin", type: "warehouse" },
  "campo trevelin": { name: "Campo Trevelin", type: "warehouse" },
  belmonte: { name: "Belmonte", type: "cold_storage" },
  cecive: { name: "Cecive", type: "cold_storage" },
  sasula: { name: "Sasula Balcarce", type: "cold_storage" },
  "sasula balcarce": { name: "Sasula Balcarce", type: "cold_storage" },
  frigopap: { name: "Frigopap", type: "cold_storage" },
  pancani: { name: "Pancani", type: "cold_storage" },
  teramal: { name: "Teramal", type: "cold_storage" }
};
var SKIP_SHEETS = /* @__PURE__ */ new Set([
  "stocks",
  "dj panc",
  "sp",
  "transportes",
  "frigorificos"
]);
function fold(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function slug(value) {
  const folded = fold(value).replace(/\s+/g, "-");
  return folded.slice(0, 48) || "x";
}
function titleCase(value) {
  return value.trim().replace(/\s+/g, " ").toLowerCase().replace(/(^|[\s(/-])\S/g, (chunk) => chunk.toUpperCase());
}
function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function cellText(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toIsoDate(value);
  }
  if (isPlainObject(value) && typeof value.text === "string") return value.text.trim();
  return String(value).trim();
}
function toIsoDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function excelSerialToDate(serial) {
  if (!Number.isFinite(serial) || serial < 2e4 || serial > 8e4) return void 0;
  const utc = Date.UTC(1899, 11, 30) + Math.round(serial) * 864e5;
  return new Date(utc);
}
function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return toIsoDate(value);
  if (typeof value === "number") {
    const fromSerial = excelSerialToDate(value);
    return fromSerial ? toIsoDate(fromSerial) : void 0;
  }
  const text = cellText(value);
  if (!text) return void 0;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${year}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }
  const asNumber = Number(text.replace(",", "."));
  if (Number.isFinite(asNumber)) {
    const fromSerial = excelSerialToDate(asNumber);
    return fromSerial ? toIsoDate(fromSerial) : void 0;
  }
  return void 0;
}
function parseQuantity(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.round(value * 1e3) / 1e3;
  const text = cellText(value).replace(/\s+/g, " ");
  if (!text) return void 0;
  const match = text.replace(/kg\.?/i, "").trim();
  const normalized = match.includes(",") && !match.includes(".") ? match.replace(",", ".") : match.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return void 0;
  return Math.round(parsed * 1e3) / 1e3;
}
function parseLotCode(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value).replace(".", "-");
  }
  const text = cellText(value).replace(/\s+/g, " ");
  if (!text) return void 0;
  if (/^(lote|n\/?a|-)$/i.test(text)) return void 0;
  return text.toUpperCase();
}
function parseRemito(value) {
  const text = cellText(value);
  if (!text) return void 0;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : text;
  }
  return text.toUpperCase();
}
function identifySheet(name) {
  const key = fold(name);
  if (SKIP_SHEETS.has(key) || key.startsWith("dj ")) return "skip";
  if (key === "de campo a frio") return "campo-frio";
  if (key === "ingreso tolvas santa ana") return "tolvas";
  if (key === "env a frio") return "env-frio";
  if (key === "ret frio") return "ret-frio";
  if (key === "p chica" || key === "pchica") return "pchica";
  if (key.startsWith("ingreso trevelin")) return "trevelin";
  if (key.startsWith("entregas a clientes")) return "entregas";
  return void 0;
}
function findHeaderRow(rows) {
  const limit = Math.min(rows.length, 12);
  for (let index = 0; index < limit; index += 1) {
    const folded = (rows[index] ?? []).map((cell) => fold(cellText(cell)));
    const hasLote = folded.some((cell) => cell === "lote");
    const hasFecha = folded.some((cell) => cell === "fecha");
    const hasQty = folded.some((cell) => cell === "kgs" || cell === "kg" || cell === "kilos");
    if (hasLote && (hasFecha || hasQty)) return index;
  }
  return -1;
}
function columnIndex(headers, aliases) {
  for (const alias of aliases) {
    const exact = headers.findIndex((header) => header === alias);
    if (exact >= 0) return exact;
  }
  for (const alias of aliases) {
    const partial = headers.findIndex((header) => header.startsWith(alias) || header.includes(alias));
    if (partial >= 0) return partial;
  }
  return -1;
}
function quantityColumn(headers) {
  const exact = headers.findIndex((header) => header === "kgs" || header === "kg" || header === "kilos");
  if (exact >= 0) return exact;
  return headers.findIndex((header) => (header === "kgs" || header.startsWith("kgs ") || header === "kg") && !header.includes("prom"));
}
function inferLocationType(name) {
  const key = fold(name);
  if (/(frigorifico|frio|frigopap|dospanca|belmonte|cecive|sasula|pancani|teramal)/.test(key)) {
    return "cold_storage";
  }
  return "warehouse";
}
function resolveLocationSpec(raw) {
  const key = fold(raw);
  if (!key) return void 0;
  if (LOCATION_ALIASES[key]) return LOCATION_ALIASES[key];
  for (const [alias, spec] of Object.entries(LOCATION_ALIASES)) {
    if (key.includes(alias) && alias.length >= 5) return spec;
  }
  return { name: titleCase(raw), type: inferLocationType(raw) };
}
function defaultOrigin(kind) {
  if (kind === "trevelin") return "Campo Trevelin";
  if (kind === "ret-frio") return "";
  if (kind === "entregas") return "Planta Santa Ana";
  if (kind === "env-frio") return "Planta Santa Ana";
  if (kind === "tolvas") return "Campo";
  if (kind === "campo-frio") return "Campo";
  if (kind === "pchica") return "Campo";
  return "Campo";
}
function defaultDestination(kind) {
  if (kind === "tolvas") return "Planta Santa Ana";
  if (kind === "trevelin") return "Trevelin";
  if (kind === "ret-frio") return "Planta Santa Ana";
  return "";
}
function movementKind(kind) {
  if (kind === "env-frio") return "transfer";
  if (kind === "ret-frio" || kind === "entregas") return "outbound";
  return "inbound";
}
function originFromNotes(notes, fallback) {
  const key = fold(notes);
  if (!key) return fallback;
  const hit = resolveLocationSpec(notes);
  if (hit && LOCATION_ALIASES[fold(hit.name)]) return hit.name;
  for (const [alias, spec] of Object.entries(LOCATION_ALIASES)) {
    if (key.includes(alias) && alias.length >= 5) return spec.name;
  }
  return fallback;
}
function parseClient(value) {
  const text = cellText(value);
  if (!text || /kg/i.test(text) || /^\d/.test(text)) return void 0;
  return text;
}
function cellAt(row, index) {
  return index >= 0 ? row[index] : void 0;
}
function stableId(prefix, value) {
  const digest = createHash("sha256").update(value).digest("hex").slice(0, 20);
  return `${prefix}-${digest}`.slice(0, 80);
}
function movementData(row) {
  const data = {
    source: "planilla",
    sheet: row.sheet,
    kind: row.kind
  };
  if (row.remito) data.remito = row.remito;
  if (row.transporter) data.transporter = row.transporter;
  if (row.bags != null) data.bags = row.bags;
  if (row.caliber) data.caliber = row.caliber;
  if (row.category) data.category = row.category;
  if (row.notes) data.notes = row.notes;
  if (row.dtv) data.dtv = row.dtv;
  if (row.client) data.client = row.client;
  if (row.variety) data.variety = row.variety;
  return data;
}
function parseWorkbook(buffer, fileName) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true, raw: true });
  const issues = [];
  const rows = [];
  const sheets = [];
  const skippedSheets = [];
  for (const sheetName of workbook.SheetNames) {
    const kind = identifySheet(sheetName);
    if (!kind) {
      skippedSheets.push(sheetName);
      continue;
    }
    if (kind === "skip") {
      skippedSheets.push(sheetName);
      continue;
    }
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: "",
      blankrows: false
    });
    const headerRow = findHeaderRow(matrix);
    if (headerRow < 0) {
      issues.push({
        sheet: sheetName,
        rowNumber: 1,
        code: "MISSING_HEADERS",
        message: `No se reconocieron columnas en \u201C${sheetName}\u201D.`
      });
      sheets.push({ name: sheetName, imported: 0, skipped: 0 });
      continue;
    }
    const headers = (matrix[headerRow] ?? []).map((cell) => fold(cellText(cell)));
    const cols = {
      remito: columnIndex(headers, ["remito", "rto", "nro"]),
      fecha: columnIndex(headers, ["fecha"]),
      variedad: columnIndex(headers, ["variedad"]),
      lote: columnIndex(headers, ["lote"]),
      kg: quantityColumn(headers),
      transporte: columnIndex(headers, ["transporte", "camion"]),
      destino: columnIndex(headers, ["destino"]),
      origen: columnIndex(headers, ["origen", "almacen"]),
      bolsas: columnIndex(headers, ["bolsas"]),
      observaciones: columnIndex(headers, ["observaciones", "observciones"]),
      calibre: columnIndex(headers, ["calibre"]),
      categoria: columnIndex(headers, ["categoria"]),
      cliente: columnIndex(headers, ["cliente"]),
      dtv: columnIndex(headers, ["numero dtvs", "dtv", "valor flete dtv"])
    };
    let imported = 0;
    let skipped = 0;
    for (let index = headerRow + 1; index < matrix.length; index += 1) {
      const row = matrix[index] ?? [];
      const rowNumber = index + 1;
      const lotCode = parseLotCode(cellAt(row, cols.lote));
      const quantityKg = parseQuantity(cellAt(row, cols.kg));
      const remito = parseRemito(cellAt(row, cols.remito));
      const varietyRaw = cellText(cellAt(row, cols.variedad));
      const notes = cellText(cellAt(row, cols.observaciones));
      const destRaw = cellText(cellAt(row, cols.destino));
      const originRaw = cellText(cellAt(row, cols.origen));
      if (!lotCode && quantityKg == null && !remito && !destRaw && !originRaw) {
        continue;
      }
      if (!lotCode && quantityKg == null) {
        skipped += 1;
        continue;
      }
      if (!lotCode) {
        skipped += 1;
        issues.push({ sheet: sheetName, rowNumber, code: "MISSING_LOT", message: "Falta el lote." });
        continue;
      }
      if (quantityKg == null) {
        skipped += 1;
        issues.push({ sheet: sheetName, rowNumber, code: "MISSING_QUANTITY", message: `El lote ${lotCode} no tiene kilos.` });
        continue;
      }
      const date = parseDate(cellAt(row, cols.fecha));
      if (!date) {
        skipped += 1;
        issues.push({ sheet: sheetName, rowNumber, code: "MISSING_DATE", message: `El lote ${lotCode} no tiene fecha.` });
        continue;
      }
      if (PROTECTED_DEMO_LOT_CODES.has(lotCode)) {
        skipped += 1;
        issues.push({
          sheet: sheetName,
          rowNumber,
          code: "PROTECTED_DEMO_LOT",
          message: `El lote ${lotCode} es de demo (N02/N03) y no se importa.`
        });
        continue;
      }
      const variety = varietyRaw ? titleCase(varietyRaw) : kind === "pchica" ? "Papa chica" : "Sin especificar";
      const originName = resolveLocationSpec(
        originRaw || originFromNotes(notes, defaultOrigin(kind)) || defaultOrigin(kind)
      )?.name;
      const destinationName = resolveLocationSpec(
        destRaw || defaultDestination(kind)
      )?.name;
      if (!originName || !destinationName) {
        skipped += 1;
        issues.push({
          sheet: sheetName,
          rowNumber,
          code: "MISSING_LOCATION",
          message: `El lote ${lotCode} no tiene origen o destino.`
        });
        continue;
      }
      if (fold(originName) === fold(destinationName)) {
        skipped += 1;
        issues.push({
          sheet: sheetName,
          rowNumber,
          code: "SAME_LOCATION",
          message: `Origen y destino coinciden (${originName}) en el lote ${lotCode}.`
        });
        continue;
      }
      const bags = parseQuantity(cellAt(row, cols.bolsas));
      const referenceSeed = [kind, date, remito ?? "sremito", lotCode, quantityKg, originName, destinationName, rowNumber].join("|");
      const parsed = {
        sheet: sheetName,
        rowNumber,
        remito,
        date,
        lotCode,
        variety,
        quantityKg,
        originName,
        destinationName,
        transporter: cellText(cellAt(row, cols.transporte)) || void 0,
        bags: bags && bags < 1e5 ? bags : void 0,
        caliber: cellText(cellAt(row, cols.calibre)) || void 0,
        category: cellText(cellAt(row, cols.categoria)) || void 0,
        notes: notes || void 0,
        dtv: cellText(cellAt(row, cols.dtv)) || void 0,
        client: kind === "entregas" ? destRaw || void 0 : parseClient(cellAt(row, cols.cliente)),
        kind: movementKind(kind),
        reference: `IMP-${createHash("sha256").update(referenceSeed).digest("hex").slice(0, 16).toUpperCase()}`
      };
      rows.push(parsed);
      imported += 1;
    }
    sheets.push({ name: sheetName, imported, skipped });
  }
  return { fileName, rows, issues: issues.slice(0, MAX_ISSUES), sheets, skippedSheets };
}
function matchLocation(name, locations) {
  const key = fold(name);
  return locations.find((item) => fold(item.name) === key || fold(item.id) === key);
}
function matchLot(code, lots) {
  const key = fold(code);
  return lots.find((item) => fold(item.code) === key);
}
function parsePlanillaBuffer(buffer, fileName) {
  if (!buffer.length) {
    throw Object.assign(new Error("El archivo est\xE1 vac\xEDo."), { status: 400 });
  }
  if (!/\.(xlsx|xls)$/i.test(fileName)) {
    throw Object.assign(new Error("La planilla debe ser .xls o .xlsx."), { status: 400 });
  }
  try {
    return parseWorkbook(buffer, fileName);
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) throw error;
    throw Object.assign(new Error("No se pudo leer la planilla de movimientos."), { status: 400 });
  }
}
function buildPlanillaImportPlan(parsed, snapshot) {
  const locationNames = /* @__PURE__ */ new Map();
  const lotsByCode = /* @__PURE__ */ new Map();
  for (const row of parsed.rows) {
    const origin = resolveLocationSpec(row.originName);
    const destination = resolveLocationSpec(row.destinationName);
    if (origin) locationNames.set(fold(origin.name), origin);
    if (destination) locationNames.set(fold(destination.name), destination);
    const current = lotsByCode.get(fold(row.lotCode));
    if (!current || row.date < current.harvestDate) {
      lotsByCode.set(fold(row.lotCode), {
        code: row.lotCode,
        variety: current?.variety && current.variety !== "Sin especificar" ? current.variety : row.variety,
        origin: /trevelin/i.test(row.sheet) ? "Trevelin, Chubut, Argentina" : "Balcarce, Buenos Aires, Argentina",
        harvestDate: row.date
      });
    }
  }
  const newLocations = [];
  const existingLocations = [];
  for (const spec of locationNames.values()) {
    const found = matchLocation(spec.name, snapshot.locations);
    if (found) {
      existingLocations.push(found.name);
    } else {
      newLocations.push({ id: `loc-imp-${slug(spec.name)}`.slice(0, 80), name: spec.name, type: spec.type });
    }
  }
  const newLots = [];
  const existingLots = [];
  for (const lot of lotsByCode.values()) {
    const found = matchLot(lot.code, snapshot.lots);
    if (found) {
      existingLots.push(found.code);
    } else {
      newLots.push({
        id: `lot-imp-${slug(lot.code)}`.slice(0, 80),
        code: lot.code,
        variety: lot.variety,
        campaign: "2026",
        producer: "Papasud",
        origin: lot.origin,
        harvestDate: lot.harvestDate
      });
    }
  }
  const movementsToInsert = parsed.rows.map((row) => ({
    id: stableId("mov-imp", row.reference),
    reference: row.reference,
    lotCode: row.lotCode,
    originName: row.originName,
    destinationName: row.destinationName,
    quantityKg: row.quantityKg,
    date: row.date,
    data: movementData(row)
  }));
  const preview = {
    fileName: parsed.fileName,
    movementCount: parsed.rows.length,
    totalKg: Math.round(parsed.rows.reduce((sum, row) => sum + row.quantityKg, 0) * 1e3) / 1e3,
    sample: parsed.rows.slice(0, SAMPLE_SIZE),
    sheets: parsed.sheets,
    skippedSheets: parsed.skippedSheets,
    issues: parsed.issues,
    newLocations: newLocations.map(({ name, type }) => ({ name, type })),
    newLots: newLots.map(({ code, variety }) => ({ code, variety })),
    existingLocations,
    existingLots,
    valid: parsed.rows.length > 0
  };
  return {
    preview,
    locationsToCreate: newLocations,
    lotsToCreate: newLots,
    movementsToInsert,
    stockLotCodes: [...new Set(parsed.rows.map((row) => row.lotCode))]
  };
}
function buildPlanillaImportFromFile(buffer, fileName, snapshot) {
  return buildPlanillaImportPlan(parsePlanillaBuffer(buffer, fileName), snapshot);
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
  async executePlanillaImport(plan) {
    if (!plan.preview.valid || plan.movementsToInsert.length === 0) {
      throw Object.assign(new Error("La planilla no tiene movimientos importables."), { status: 400 });
    }
    const client = await this.database.connect();
    try {
      await client.query("begin");
      const [locationRows, lotRows] = await Promise.all([
        client.query("select * from public.locations order by id for update"),
        client.query("select * from public.lots order by code for update")
      ]);
      let createdLocations = 0;
      for (const location of plan.locationsToCreate) {
        if (locationRows.rows.some((row) => fold(row.name) === fold(location.name))) continue;
        await client.query(
          "insert into public.locations (id, name, type) values ($1, $2, $3) on conflict (id) do nothing",
          [location.id, location.name, location.type]
        );
        createdLocations += 1;
      }
      const refreshedLocations = await client.query("select * from public.locations");
      const locationIdByName = new Map(refreshedLocations.rows.map((row) => [fold(row.name), row.id]));
      let createdLots = 0;
      for (const lot of plan.lotsToCreate) {
        if (PROTECTED_DEMO_LOT_CODES.has(lot.code)) continue;
        if (lotRows.rows.some((row) => row.code.toLowerCase() === lot.code.toLowerCase())) continue;
        await client.query(
          `insert into public.lots (id, code, variety, campaign, producer, origin, harvest_date)
           values ($1, $2, $3, $4, $5, $6, $7)
           on conflict (code) do nothing`,
          [lot.id, lot.code, lot.variety, lot.campaign, lot.producer, lot.origin, lot.harvestDate ?? null]
        );
        createdLots += 1;
      }
      const refreshedLots = await client.query("select * from public.lots");
      const lotIdByCode = new Map(refreshedLots.rows.map((row) => [row.code.toLowerCase(), row]));
      let createdMovements = 0;
      let skippedMovements = 0;
      const importedLotIds = /* @__PURE__ */ new Set();
      for (const movement of plan.movementsToInsert) {
        const lot = lotIdByCode.get(movement.lotCode.toLowerCase());
        const originId = locationIdByName.get(fold(movement.originName));
        const destinationId = locationIdByName.get(fold(movement.destinationName));
        if (!lot || PROTECTED_DEMO_LOT_CODES.has(lot.code) || !originId || !destinationId || originId === destinationId) {
          skippedMovements += 1;
          continue;
        }
        const inserted = await client.query(
          `insert into public.movements
            (id, reference, lot_id, origin_location_id, destination_location_id, quantity, movement_date, status, data)
           values ($1, $2, $3, $4, $5, $6, $7, 'completed', $8::jsonb)
           on conflict (reference) do nothing`,
          [
            movement.id,
            movement.reference,
            lot.id,
            originId,
            destinationId,
            movement.quantityKg,
            movement.date,
            JSON.stringify(movement.data)
          ]
        );
        if (inserted.rowCount) {
          createdMovements += 1;
          importedLotIds.add(lot.id);
        } else {
          skippedMovements += 1;
        }
      }
      for (const code of plan.stockLotCodes) {
        const lot = lotIdByCode.get(code.toLowerCase());
        if (lot && !PROTECTED_DEMO_LOT_CODES.has(lot.code)) importedLotIds.add(lot.id);
      }
      let upsertedStockRecords = 0;
      for (const lotId of importedLotIds) {
        const lot = refreshedLots.rows.find((row) => row.id === lotId);
        if (!lot || PROTECTED_DEMO_LOT_CODES.has(lot.code)) continue;
        const history = await client.query(
          "select * from public.movements where lot_id = $1",
          [lotId]
        );
        const net = /* @__PURE__ */ new Map();
        for (const row of history.rows) {
          if (row.status === "cancelled") continue;
          const quantity = Number(row.quantity);
          if (row.origin_location_id) {
            net.set(row.origin_location_id, (net.get(row.origin_location_id) ?? 0) - quantity);
          }
          if (row.destination_location_id) {
            net.set(row.destination_location_id, (net.get(row.destination_location_id) ?? 0) + quantity);
          }
        }
        for (const [locationId, rawQuantity] of net) {
          const quantity = Math.max(0, Math.round(rawQuantity * 1e3) / 1e3);
          if (quantity <= 0) continue;
          await client.query(
            `insert into public.stock_records
              (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, updated_at)
             values ($1, $2, $3, $4, $4, false, now())
             on conflict (lot_id, location_id) do update set
               declared_quantity = excluded.declared_quantity,
               verified_quantity = excluded.verified_quantity,
               verification_pending = false,
               updated_at = now()`,
            [`stock-imp-${randomUUID()}`, lotId, locationId, quantity]
          );
          upsertedStockRecords += 1;
        }
      }
      await client.query("commit");
      return { createdLocations, createdLots, createdMovements, skippedMovements, upsertedStockRecords };
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

// server/services/groqMovementIntent.ts
import { z as z2 } from "zod";
var parsedIntentSchema = z2.object({
  action: z2.literal("transfer"),
  lotCode: z2.string().trim().min(1).max(40),
  quantityKg: z2.number().positive(),
  origin: z2.string().trim().min(1).max(120),
  destination: z2.string().trim().min(1).max(120)
});
var jsonSchema2 = {
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
            json_schema: { name: "papastock_movement_intent", strict: true, schema: jsonSchema2 }
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

// server/app.ts
var identifier = z3.string().min(1).max(120);
var discrepancyInputSchema = z3.object({
  lot: z3.object({ id: identifier, code: identifier }),
  stock: z3.object({
    id: identifier,
    lotId: identifier,
    locationId: identifier,
    declaredQuantity: z3.number().nonnegative(),
    verifiedQuantity: z3.number().nonnegative(),
    updatedAt: z3.string(),
    verificationPending: z3.boolean().optional()
  }),
  movements: z3.array(z3.object({
    id: identifier,
    lotId: identifier,
    originLocationId: identifier.optional(),
    destinationLocationId: identifier.optional(),
    quantity: z3.number().positive(),
    date: z3.string(),
    status: z3.enum(["completed", "pending", "cancelled"]),
    reference: identifier
  })).max(100),
  traceability: z3.array(z3.object({
    id: identifier,
    lotId: identifier,
    type: z3.enum(["planting", "harvest", "treatment", "quality_control", "stock_verification"]),
    date: z3.string(),
    locationId: identifier.optional(),
    data: z3.record(z3.string(), z3.unknown())
  })).max(100)
});
var traceabilityInputSchema = z3.object({
  lotId: identifier,
  type: z3.literal("treatment"),
  date: z3.iso.date(),
  locationId: identifier.optional(),
  data: z3.object({
    product: z3.string().trim().min(1).max(120),
    sourceText: z3.string().trim().max(500).optional(),
    origin: z3.literal("operator_confirmation").optional()
  })
});
var movementTextSchema = z3.object({
  text: z3.string().trim().min(8).max(500)
});
var movementIntentSchema = z3.object({
  action: z3.literal("transfer"),
  lotCode: identifier.max(40),
  quantityKg: z3.number().positive().max(1e6),
  origin: identifier,
  destination: identifier
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
  const excelBody = express.raw({ type: () => true, limit: "4mb" });
  function readWorkbookUpload(request) {
    const body = request.body;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      throw Object.assign(new Error("Adjunt\xE1 un archivo .xls o .xlsx."), { status: 400 });
    }
    const headerName = request.header("x-filename");
    const fileName = headerName ? decodeURIComponent(headerName) : "planilla.xls";
    return { buffer: body, fileName };
  }
  app2.post("/api/imports/planilla/preview", excelBody, async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error("Base de datos no configurada."), { status: 503 });
      const { buffer, fileName } = readWorkbookUpload(request);
      const snapshot = await repository.loadSnapshot();
      const plan = buildPlanillaImportFromFile(buffer, fileName, snapshot);
      response.json({ data: plan.preview });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/imports/planilla", excelBody, async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error("Base de datos no configurada."), { status: 503 });
      const { buffer, fileName } = readWorkbookUpload(request);
      const snapshot = await repository.loadSnapshot();
      const plan = buildPlanillaImportFromFile(buffer, fileName, snapshot);
      response.status(201).json({ data: await repository.executePlanillaImport(plan) });
    } catch (error) {
      next(error);
    }
  });
  app2.use("/api", (_request, response) => response.status(404).json({ error: "Endpoint no encontrado." }));
  app2.use((error, _request, response, _next) => {
    if (error instanceof z3.ZodError) return response.status(400).json({ error: "Solicitud inv\xE1lida.", details: z3.treeifyError(error) });
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
