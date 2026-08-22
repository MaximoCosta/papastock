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

// src/lib/quantity.ts
function normalizeUnit(value) {
  const normalized = value?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  if (!normalized) return void 0;
  if (["kg", "kilo", "kilos", "kilogramo", "kilogramos"].includes(normalized)) return "kg";
  if (["bag", "bags", "bolsa", "bolsas"].includes(normalized)) return "bags";
  return void 0;
}
function stockUnit(record) {
  return record?.unit === "bags" ? "bags" : "kg";
}

// src/lib/movements.ts
function movementItemsOf(movement) {
  if (movement.items && movement.items.length > 0) return movement.items;
  if (movement.lotId && movement.quantity && movement.quantity > 0) {
    return [{
      id: `${movement.id}-legacy`,
      movementId: movement.id,
      lotId: movement.lotId,
      dispatchedQuantity: movement.quantity,
      unit: "kg",
      sortOrder: 0
    }];
  }
  return [];
}
function movementTouchesLot(movement, lotId) {
  if (movement.lotId === lotId) return true;
  return movementItemsOf(movement).some((item2) => item2.lotId === lotId);
}
function movementQuantityForLot(movement, lotId) {
  const items = movementItemsOf(movement);
  if (!lotId) {
    if (items.length === 0) return Number(movement.quantity ?? 0);
    const units = new Set(items.map((item2) => item2.unit));
    if (units.size !== 1) return Number(movement.quantity ?? items[0]?.dispatchedQuantity ?? 0);
    return items.reduce((total, item2) => total + item2.dispatchedQuantity, 0);
  }
  return items.filter((item2) => item2.lotId === lotId).reduce((total, item2) => total + item2.dispatchedQuantity, 0);
}
function movementPrimaryLotId(movement) {
  return movement.lotId ?? movementItemsOf(movement)[0]?.lotId ?? "";
}
function expandLegacyIntent(intent) {
  if (intent.items?.length) {
    return {
      ...intent,
      action: "transfer",
      items: intent.items.map((item2) => ({
        lotCode: item2.lotCode.trim(),
        quantity: item2.quantity,
        unit: item2.unit
      })),
      lotCode: intent.items[0]?.lotCode,
      quantityKg: intent.items.length === 1 && intent.items[0]?.unit === "kg" ? intent.items[0].quantity : void 0
    };
  }
  if (intent.lotCode && intent.quantityKg && intent.quantityKg > 0) {
    const items = [{
      lotCode: intent.lotCode,
      quantity: intent.quantityKg,
      unit: "kg"
    }];
    return { ...intent, action: "transfer", items };
  }
  return { ...intent, action: "transfer", items: intent.items ?? [] };
}
function stockKey(lotId, locationId, unit) {
  return `${lotId}:${locationId}:${unit}`;
}
function recordMatchesUnit(record, unit) {
  return stockUnit(record) === unit;
}

// src/lib/stockVerification.ts
var PROTECTED_DEMO_LOT_CODES = /* @__PURE__ */ new Set(["A-204", "A-310", "C-102", "F-301"]);
function issue(code, message) {
  return { sheet: "verificaci\xF3n", rowNumber: 0, code, message };
}
function buildStockVerificationPreview(input, records) {
  const record = records.find((item2) => item2.id === input.stockRecordId);
  const countedQuantity = Number(input.countedQuantity);
  const issues = [];
  if (!record) {
    issues.push(issue("RECORD_NOT_FOUND", "Seleccion\xE1 un lote y una ubicaci\xF3n existentes."));
  }
  if (record && PROTECTED_DEMO_LOT_CODES.has(record.lot.code)) {
    issues.push(issue("PROTECTED_DEMO_LOT", `El lote ${record.lot.code} es de demo y no se verifica por este formulario.`));
  }
  if (!Number.isFinite(countedQuantity) || countedQuantity < 0) {
    issues.push(issue("INVALID_QUANTITY", "Ingres\xE1 los kilos contados (0 o m\xE1s)."));
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    issues.push(issue("INVALID_DATE", "Ingres\xE1 la fecha del conteo."));
  }
  const declaredQuantity = record?.declaredQuantity ?? 0;
  const previousVerified = record?.verifiedQuantity ?? 0;
  return {
    valid: issues.length === 0,
    issues,
    stockRecordId: input.stockRecordId,
    lotId: record?.lotId ?? "",
    lotCode: record?.lot.code ?? "",
    variety: record?.lot.variety ?? "",
    locationId: record?.locationId ?? "",
    locationName: record?.location.name ?? "",
    declaredQuantity,
    previousVerified,
    countedQuantity: Number.isFinite(countedQuantity) ? countedQuantity : 0,
    difference: Number.isFinite(countedQuantity) ? countedQuantity - declaredQuantity : 0,
    verificationPending: Boolean(record?.verificationPending),
    date: input.date,
    bags: input.bags,
    notes: input.notes
  };
}
function toStockVerificationConfirmation(preview, persisted, eventId) {
  return {
    persisted,
    correction: {
      stockRecordId: preview.stockRecordId,
      lotCode: preview.lotCode,
      countedQuantity: preview.countedQuantity,
      previousVerified: preview.previousVerified,
      notes: preview.notes
    },
    event: {
      id: eventId ?? `verify-${preview.stockRecordId}`,
      lotId: preview.lotId,
      type: "stock_verification",
      date: preview.date,
      locationId: preview.locationId || void 0,
      data: {
        verifiedQuantity: preview.countedQuantity,
        ...preview.bags ? { bags: preview.bags } : {},
        ...preview.notes ? { notes: preview.notes } : {},
        origin: "operator_confirmation"
      }
    }
  };
}

// src/services/stockService.ts
function getStockStatus(declared, verified, pending = false) {
  if (pending) return "pending";
  return declared === verified ? "verified" : "discrepancy";
}
function getStockViews(stockRecords2, lots2, locations2) {
  return stockRecords2.flatMap((record) => {
    const lot = lots2.find((item2) => item2.id === record.lotId);
    const location = locations2.find((item2) => item2.id === record.locationId);
    if (!lot || !location) return [];
    const declaredQuantity = Number(record.declaredQuantity) || 0;
    const verifiedQuantity = Number(record.verifiedQuantity) || 0;
    return [{
      ...record,
      lot,
      location,
      declaredQuantity,
      verifiedQuantity,
      difference: verifiedQuantity - declaredQuantity,
      status: getStockStatus(
        declaredQuantity,
        verifiedQuantity,
        record.verificationPending
      )
    }];
  });
}

// server/services/lotCorrection.ts
var EPSILON = 1e-3;
function buildLotCorrectionPlan(input, original, lots2, stockRecords2) {
  const errors = [];
  const fromLot = lots2.find((lot) => lot.code.toLowerCase() === input.fromLotCode.toLowerCase());
  const toLot = lots2.find((lot) => lot.code.toLowerCase() === input.toLotCode.toLowerCase());
  if (!fromLot) errors.push({ code: "LOT_NOT_FOUND", message: `No existe el lote ${input.fromLotCode}.` });
  if (!toLot) errors.push({ code: "LOT_NOT_FOUND", message: `No existe el lote ${input.toLotCode}.` });
  if (fromLot && toLot && fromLot.id === toLot.id) {
    errors.push({ code: "SAME_LOT", message: "La correcci\xF3n tiene que reasignar entre dos lotes distintos." });
  }
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    errors.push({ code: "INVALID_QUANTITY", message: "La cantidad a reasignar debe ser mayor a cero." });
  }
  if (original.kind === "correction") {
    errors.push({ code: "ALREADY_CORRECTION", message: "No se corrige una correcci\xF3n. Referenci\xE1 el movimiento original." });
  }
  const originalItems = movementItemsOf(original);
  if (fromLot && !originalItems.some((item2) => item2.lotId === fromLot.id)) {
    errors.push({ code: "LOT_NOT_IN_MOVEMENT", message: `El lote ${fromLot.code} no participa del movimiento original.` });
  }
  const toStock = toLot ? stockRecords2.find((record) => record.lotId === toLot.id && record.locationId === input.locationId && recordMatchesUnit(record, input.unit)) : void 0;
  if (toLot && !toStock) {
    errors.push({
      code: "ORIGIN_STOCK_NOT_FOUND",
      message: `El lote ${toLot.code} no tiene stock ${input.unit} en la ubicaci\xF3n de la correcci\xF3n.`
    });
  }
  if (toStock && input.quantity > toStock.verifiedQuantity + EPSILON) {
    errors.push({ code: "INSUFFICIENT_VERIFIED_STOCK", message: "No hay stock verificado suficiente para reasignar." });
  }
  if (toStock && input.quantity > toStock.declaredQuantity + EPSILON) {
    errors.push({ code: "INSUFFICIENT_DECLARED_STOCK", message: "No hay stock declarado suficiente para reasignar." });
  }
  return {
    valid: errors.length === 0,
    errors,
    fromLot,
    toLot,
    locationId: input.locationId,
    quantity: input.quantity,
    unit: input.unit
  };
}

// server/services/movementReception.ts
var EPSILON2 = 1e-3;
function buildReceptionPlan(movement, input) {
  const errors = [];
  const items = movementItemsOf(movement);
  if (items.length === 0) {
    errors.push({ code: "NO_ITEMS", message: "El movimiento no tiene l\xEDneas para recepcionar." });
  }
  if (movement.kind === "correction") {
    errors.push({ code: "NOT_RECEIVABLE", message: "Una correcci\xF3n no se recepciona." });
  }
  const itemUpdates = [];
  const stockAdjustments = [];
  const discrepancies = [];
  if (input.items?.length) {
    for (const line of input.items) {
      const item2 = items.find((candidate) => candidate.id === line.movementItemId);
      if (!item2) {
        errors.push({ code: "ITEM_NOT_FOUND", message: `No existe la l\xEDnea ${line.movementItemId}.` });
        continue;
      }
      if (!Number.isFinite(line.receivedQuantity) || line.receivedQuantity < 0) {
        errors.push({ code: "INVALID_QUANTITY", message: "La cantidad recibida no puede ser negativa." });
        continue;
      }
      const difference2 = line.receivedQuantity - item2.dispatchedQuantity;
      itemUpdates.push({ item: item2, receivedQuantity: line.receivedQuantity, difference: difference2 });
      if (Math.abs(difference2) > EPSILON2) {
        stockAdjustments.push({ lotId: item2.lotId, unit: item2.unit, deltaVerified: difference2 });
        discrepancies.push({
          movementId: movement.id,
          movementItemId: item2.id,
          lotId: item2.lotId,
          locationId: movement.destinationLocationId,
          type: "reception_shortfall",
          expectedQuantity: item2.dispatchedQuantity,
          observedQuantity: line.receivedQuantity,
          unit: item2.unit,
          difference: difference2,
          status: "open"
        });
      }
    }
    const missing = items.filter((item2) => !input.items?.some((line) => line.movementItemId === item2.id));
    if (missing.length) {
      errors.push({ code: "INCOMPLETE_LINES", message: "Si inform\xE1s recepci\xF3n por l\xEDnea, ten\xE9s que cubrir todas las l\xEDneas." });
    }
    return {
      valid: errors.length === 0,
      errors,
      receptionStatus: discrepancies.length ? "received" : "received",
      itemUpdates,
      stockAdjustments,
      discrepancies
    };
  }
  if (input.receivedTotal === void 0) {
    errors.push({ code: "MISSING_RECEPTION", message: "Inform\xE1 el total recibido o las cantidades por l\xEDnea." });
    return { valid: false, errors, receptionStatus: "pending", itemUpdates, stockAdjustments, discrepancies };
  }
  const units = new Set(items.map((item2) => item2.unit));
  const unit = input.unit ?? (units.size === 1 ? items[0]?.unit : void 0);
  if (!unit || units.size === 1 && unit !== items[0]?.unit) {
    errors.push({ code: "UNIT_REQUIRED", message: "La recepci\xF3n total necesita la misma unidad que el despacho." });
  }
  if (units.size > 1) {
    errors.push({ code: "MIXED_UNITS", message: "Hay unidades distintas: no se puede recepcionar solo un total." });
  }
  const dispatchedTotal = items.reduce((total, item2) => total + item2.dispatchedQuantity, 0);
  const difference = input.receivedTotal - dispatchedTotal;
  if (Math.abs(difference) > EPSILON2) {
    discrepancies.push({
      movementId: movement.id,
      locationId: movement.destinationLocationId,
      type: "reception_unallocated",
      expectedQuantity: dispatchedTotal,
      observedQuantity: input.receivedTotal,
      unit: unit ?? "bags",
      difference,
      status: "open",
      cause: "Se conoce el total recibido pero no c\xF3mo se reparte entre lotes. No se inventa la distribuci\xF3n."
    });
  }
  return {
    valid: errors.length === 0,
    errors,
    receptionStatus: Math.abs(difference) > EPSILON2 ? "needs_reconciliation" : "received",
    receivedTotal: input.receivedTotal,
    receivedUnit: unit,
    itemUpdates,
    stockAdjustments,
    discrepancies
  };
}

// server/services/planillaImport.ts
import { createHash } from "crypto";
import * as XLSX from "xlsx";

// src/data/locations.ts
var locations = [
  { id: "loc-north", name: "Frigor\xEDfico Norte", type: "cold_storage", capacityKg: 51e3, temperatureC: 4 },
  { id: "loc-south", name: "Frigor\xEDfico Sur", type: "cold_storage", capacityKg: 64e3, temperatureC: 3.5 },
  { id: "loc-central", name: "Frigor\xEDfico Central", type: "cold_storage", capacityKg: 7e4, temperatureC: 4.2 },
  { id: "loc-warehouse", name: "Galp\xF3n Principal", type: "warehouse", capacityKg: 83e3 },
  { id: "loc-oriente", name: "Campo Oriente", type: "warehouse", capacityKg: 4e4 },
  { id: "loc-frig-a", name: "Frigor\xEDfico A", type: "cold_storage", capacityKg: 5e4, temperatureC: 4 }
];

// src/data/lots.ts
var lots = [
  {
    id: "lot-a204",
    code: "A-204",
    variety: "Innovator",
    campaign: "2025/26",
    producer: "Establecimiento El Omb\xFA",
    origin: "Balcarce, Buenos Aires, Argentina",
    harvestDate: "2026-07-20"
  },
  {
    id: "lot-a310",
    code: "A-310",
    variety: "Innovator",
    campaign: "2025/26",
    producer: "La Esperanza Agro",
    origin: "Balcarce, Buenos Aires, Argentina",
    harvestDate: "2026-07-28"
  },
  {
    id: "lot-b118",
    code: "B-118",
    variety: "Spunta",
    campaign: "2025/26",
    producer: "Campo San Jos\xE9",
    origin: "Otamendi, Buenos Aires, Argentina",
    harvestDate: "2026-08-04"
  },
  {
    id: "lot-c102",
    code: "C-102",
    variety: "Atlantic",
    campaign: "2025/26",
    producer: "Pampa F\xE9rtil",
    origin: "Tandil, Buenos Aires, Argentina",
    harvestDate: "2026-07-15"
  },
  {
    id: "lot-b221",
    code: "B-221",
    variety: "Russet",
    campaign: "2025/26",
    producer: "Los Aromos",
    origin: "Balcarce, Buenos Aires, Argentina",
    harvestDate: "2026-07-31"
  },
  {
    id: "lot-d405",
    code: "D-405",
    variety: "Spunta",
    campaign: "2025/26",
    producer: "Campo San Jos\xE9",
    origin: "Otamendi, Buenos Aires, Argentina",
    harvestDate: "2026-08-02"
  },
  {
    id: "lot-e090",
    code: "E-090",
    variety: "Atlantic",
    campaign: "2025/26",
    producer: "Pampa F\xE9rtil",
    origin: "Tandil, Buenos Aires, Argentina",
    harvestDate: "2026-07-12"
  },
  {
    id: "lot-f301",
    code: "F-301",
    variety: "Innovator",
    campaign: "2025/26",
    producer: "La Esperanza Agro",
    origin: "Balcarce, Buenos Aires, Argentina",
    harvestDate: "2026-08-06"
  },
  {
    id: "lot-g512",
    code: "G-512",
    variety: "Russet",
    campaign: "2025/26",
    producer: "Establecimiento El Omb\xFA",
    origin: "Balcarce, Buenos Aires, Argentina",
    harvestDate: "2026-07-23"
  },
  {
    id: "lot-h118",
    code: "H-118",
    variety: "Spunta",
    campaign: "2025/26",
    producer: "Los Aromos",
    origin: "Mar del Plata, Buenos Aires, Argentina",
    harvestDate: "2026-08-10"
  },
  {
    id: "lot-300",
    code: "300",
    variety: "Spunta",
    campaign: "2025/26",
    producer: "Papasud",
    origin: "Balcarce, Buenos Aires, Argentina",
    harvestDate: "2026-07-30"
  },
  {
    id: "lot-301",
    code: "301",
    variety: "Spunta",
    campaign: "2025/26",
    producer: "Papasud",
    origin: "Balcarce, Buenos Aires, Argentina",
    harvestDate: "2026-07-30"
  }
];

// src/data/movements.ts
function item(movementId, lotId, quantity) {
  return [{ id: `${movementId}-item`, movementId, lotId, dispatchedQuantity: quantity, unit: "kg", sortOrder: 0 }];
}
var movements = [
  {
    id: "movement-1032",
    reference: "MV-1032",
    lotId: "lot-a204",
    originLocationId: "loc-north",
    destinationLocationId: "loc-south",
    quantity: 1e3,
    date: "2026-08-20",
    status: "pending",
    receptionStatus: "pending",
    transporterId: "tr-pampa",
    items: item("movement-1032", "lot-a204", 1e3)
  },
  {
    id: "movement-1028",
    reference: "MV-1028",
    lotId: "lot-a204",
    originLocationId: "loc-warehouse",
    destinationLocationId: "loc-south",
    quantity: 8e3,
    date: "2026-08-18",
    status: "completed",
    transporterId: "tr-andina"
  },
  {
    id: "movement-1016",
    reference: "MV-1016",
    lotId: "lot-a310",
    originLocationId: "loc-warehouse",
    destinationLocationId: "loc-central",
    quantity: 22e3,
    date: "2026-08-10",
    status: "completed",
    transporterId: "tr-andina"
  },
  {
    id: "movement-1037",
    reference: "MV-1037",
    lotId: "lot-c102",
    originLocationId: "loc-warehouse",
    destinationLocationId: "loc-central",
    quantity: 500,
    date: "2026-08-21",
    status: "cancelled"
  },
  {
    id: "movement-1041",
    reference: "MV-1041",
    lotId: "lot-b118",
    originLocationId: "loc-warehouse",
    destinationLocationId: "loc-north",
    quantity: 4500,
    date: "2026-08-19",
    status: "completed",
    transporterId: "tr-pampa"
  },
  {
    id: "movement-1044",
    reference: "MV-1044",
    lotId: "lot-g512",
    originLocationId: "loc-central",
    destinationLocationId: "loc-south",
    quantity: 21e3,
    date: "2026-08-17",
    status: "completed",
    transporterId: "tr-sur"
  },
  {
    id: "movement-1048",
    reference: "MV-1048",
    lotId: "lot-f301",
    originLocationId: "loc-south",
    destinationLocationId: "loc-warehouse",
    quantity: 17e3,
    date: "2026-08-21",
    status: "pending",
    transporterId: "tr-pampa"
  }
];

// src/data/stock.ts
var stockRecords = [
  { id: "stock-a204", lotId: "lot-a204", locationId: "loc-south", shelfId: "shelf-s-a1", declaredQuantity: 25e3, verifiedQuantity: 24e3, updatedAt: "2026-08-21T10:30:00-03:00" },
  { id: "stock-a310", lotId: "lot-a310", locationId: "loc-central", shelfId: "shelf-c-a1", declaredQuantity: 22e3, verifiedQuantity: 22e3, updatedAt: "2026-08-21T09:15:00-03:00" },
  { id: "stock-b118", lotId: "lot-b118", locationId: "loc-north", shelfId: "shelf-n-a1", declaredQuantity: 14500, verifiedQuantity: 14500, updatedAt: "2026-08-20T17:20:00-03:00" },
  { id: "stock-c102", lotId: "lot-c102", locationId: "loc-warehouse", shelfId: "shelf-w-a1", declaredQuantity: 18500, verifiedQuantity: 18e3, updatedAt: "2026-08-21T08:40:00-03:00" },
  { id: "stock-b221", lotId: "lot-b221", locationId: "loc-south", shelfId: "shelf-s-a2", declaredQuantity: 16e3, verifiedQuantity: 16e3, updatedAt: "2026-08-20T14:05:00-03:00" },
  { id: "stock-d405", lotId: "lot-d405", locationId: "loc-central", shelfId: "shelf-c-a2", declaredQuantity: 19500, verifiedQuantity: 19500, updatedAt: "2026-08-20T12:10:00-03:00" },
  { id: "stock-e090", lotId: "lot-e090", locationId: "loc-north", shelfId: "shelf-n-a2", declaredQuantity: 12500, verifiedQuantity: 12500, updatedAt: "2026-08-19T16:55:00-03:00" },
  { id: "stock-f301", lotId: "lot-f301", locationId: "loc-warehouse", shelfId: "shelf-w-b1", declaredQuantity: 17e3, verifiedQuantity: 0, updatedAt: "2026-08-21T11:45:00-03:00", verificationPending: true },
  { id: "stock-g512", lotId: "lot-g512", locationId: "loc-south", shelfId: "shelf-s-b1", declaredQuantity: 21e3, verifiedQuantity: 21e3, updatedAt: "2026-08-20T18:00:00-03:00" },
  { id: "stock-h118", lotId: "lot-h118", locationId: "loc-central", shelfId: "shelf-c-b1", declaredQuantity: 13500, verifiedQuantity: 13500, updatedAt: "2026-08-21T07:50:00-03:00" },
  { id: "stock-300-oriente", lotId: "lot-300", locationId: "loc-oriente", declaredQuantity: 500, verifiedQuantity: 500, updatedAt: "2026-08-22T12:00:00-03:00", unit: "bags" },
  { id: "stock-301-oriente", lotId: "lot-301", locationId: "loc-oriente", declaredQuantity: 300, verifiedQuantity: 300, updatedAt: "2026-08-22T12:00:00-03:00", unit: "bags" }
];

// server/services/planillaImport.ts
var PROTECTED_DEMO_LOT_CODES2 = /* @__PURE__ */ new Set(["A-204", "A-310", "C-102", "F-301"]);
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
  if (kind === "generic") return "Galp\xF3n Principal";
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
  if (row.bagColor) data.bagColor = row.bagColor;
  if (row.threadColor) data.threadColor = row.threadColor;
  if (row.averageKg != null) data.averageKg = row.averageKg;
  return data;
}
function parseWorkbook(buffer, fileName) {
  const isCsv = /\.csv$/i.test(fileName);
  const workbook = isCsv ? XLSX.read(buffer.toString("utf8").replace(/^\uFEFF/, ""), { type: "string", raw: true, cellDates: true }) : XLSX.read(buffer, { type: "buffer", cellDates: true, raw: true });
  const issues = [];
  const rows = [];
  const sheets = [];
  const skippedSheets = [];
  for (const sheetName of workbook.SheetNames) {
    const identified = identifySheet(sheetName);
    if (identified === "skip") {
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
    const kind = identified ?? (headerRow >= 0 ? "generic" : void 0);
    if (!kind) {
      skippedSheets.push(sheetName);
      continue;
    }
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
      if (PROTECTED_DEMO_LOT_CODES2.has(lotCode)) {
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
function matchLocation(name, locations2) {
  const key = fold(name);
  return locations2.find((item2) => fold(item2.name) === key || fold(item2.id) === key);
}
function matchLot(code, lots2) {
  const key = fold(code);
  return lots2.find((item2) => fold(item2.code) === key);
}
function parsePlanillaBuffer(buffer, fileName) {
  if (!buffer.length) {
    throw Object.assign(new Error("El archivo est\xE1 vac\xEDo."), { status: 400 });
  }
  if (!/\.(xlsx|xls|csv)$/i.test(fileName)) {
    throw Object.assign(new Error("El archivo debe ser .csv, .xls o .xlsx."), { status: 400 });
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
function demoSnapshot() {
  return {
    locations: locations.map((item2) => ({ ...item2 })),
    shelfUnits: [],
    shelves: [],
    lots: lots.map((item2) => ({ ...item2 })),
    stockRecords: stockRecords.map((item2) => ({ ...item2 })),
    movements: movements.map((item2) => ({ ...item2 })),
    transporters: [],
    traceabilityEvents: []
  };
}
function materializePlanillaImport(plan, snapshot) {
  const locations2 = snapshot.locations.map((item2) => ({ ...item2 }));
  let createdLocations = 0;
  for (const location of plan.locationsToCreate) {
    if (locations2.some((item2) => fold(item2.name) === fold(location.name))) continue;
    locations2.push({ id: location.id, name: location.name, type: location.type });
    createdLocations += 1;
  }
  const lots2 = snapshot.lots.map((item2) => ({ ...item2 }));
  let createdLots = 0;
  for (const lot of plan.lotsToCreate) {
    if (PROTECTED_DEMO_LOT_CODES2.has(lot.code)) continue;
    if (lots2.some((item2) => fold(item2.code) === fold(lot.code))) continue;
    lots2.push({
      id: lot.id,
      code: lot.code,
      variety: lot.variety,
      campaign: lot.campaign,
      producer: lot.producer,
      origin: lot.origin,
      harvestDate: lot.harvestDate
    });
    createdLots += 1;
  }
  const locationIdByName = new Map(locations2.map((item2) => [fold(item2.name), item2.id]));
  const lotByCode = new Map(lots2.map((item2) => [item2.code.toLowerCase(), item2]));
  const movements2 = snapshot.movements.map((item2) => ({ ...item2 }));
  const existingRefs = new Set(movements2.map((item2) => item2.reference));
  let createdMovements = 0;
  let skippedMovements = 0;
  for (const movement of plan.movementsToInsert) {
    const lot = lotByCode.get(movement.lotCode.toLowerCase());
    const originId = locationIdByName.get(fold(movement.originName));
    const destinationId = locationIdByName.get(fold(movement.destinationName));
    if (!lot || PROTECTED_DEMO_LOT_CODES2.has(lot.code) || !originId || !destinationId || originId === destinationId) {
      skippedMovements += 1;
      continue;
    }
    if (existingRefs.has(movement.reference)) {
      skippedMovements += 1;
      continue;
    }
    const next = {
      id: movement.id,
      reference: movement.reference,
      lotId: lot.id,
      originLocationId: originId,
      destinationLocationId: destinationId,
      quantity: movement.quantityKg,
      date: movement.date,
      status: "completed",
      data: movement.data
    };
    movements2.unshift(next);
    existingRefs.add(movement.reference);
    createdMovements += 1;
  }
  const importedLotIds = /* @__PURE__ */ new Set();
  for (const code of plan.stockLotCodes) {
    const lot = lotByCode.get(code.toLowerCase());
    if (lot && !PROTECTED_DEMO_LOT_CODES2.has(lot.code)) importedLotIds.add(lot.id);
  }
  const stockRecords2 = snapshot.stockRecords.filter((record) => !importedLotIds.has(record.lotId)).map((item2) => ({ ...item2 }));
  let upsertedStockRecords = 0;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  for (const lotId of importedLotIds) {
    const net = /* @__PURE__ */ new Map();
    for (const movement of movements2) {
      if (movement.lotId !== lotId || movement.status === "cancelled") continue;
      const quantity = movement.quantity ?? 0;
      if (movement.originLocationId) {
        net.set(movement.originLocationId, (net.get(movement.originLocationId) ?? 0) - quantity);
      }
      if (movement.destinationLocationId) {
        net.set(movement.destinationLocationId, (net.get(movement.destinationLocationId) ?? 0) + quantity);
      }
    }
    for (const [locationId, raw] of net) {
      const quantity = Math.max(0, Math.round(raw * 1e3) / 1e3);
      if (quantity <= 0) continue;
      stockRecords2.push({
        id: stableId("stock-imp", `${lotId}|${locationId}`),
        lotId,
        locationId,
        declaredQuantity: quantity,
        verifiedQuantity: quantity,
        verificationPending: false,
        updatedAt: now
      });
      upsertedStockRecords += 1;
    }
  }
  return {
    result: {
      createdLocations,
      createdLots,
      createdMovements,
      skippedMovements,
      upsertedStockRecords,
      persisted: false
    },
    applied: {
      ...snapshot,
      locations: locations2,
      lots: lots2,
      stockRecords: stockRecords2,
      movements: movements2
    }
  };
}
function buildStockIntakePlan(input, snapshot) {
  const lotCode = input.lotCode.trim().toUpperCase();
  const variety = input.variety.trim();
  const destinationRaw = input.destination.trim();
  const originRaw = input.origin?.trim() || "Campo";
  const issues = [];
  if (!lotCode) issues.push({ sheet: "Carga de stock", rowNumber: 1, code: "MISSING_LOT", message: "Falta el lote." });
  if (!variety) issues.push({ sheet: "Carga de stock", rowNumber: 1, code: "MISSING_VARIETY", message: "Falta la variedad." });
  if (!Number.isFinite(input.quantityKg) || input.quantityKg <= 0) {
    issues.push({ sheet: "Carga de stock", rowNumber: 1, code: "MISSING_QUANTITY", message: "Los kilos deben ser mayores a cero." });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    issues.push({ sheet: "Carga de stock", rowNumber: 1, code: "MISSING_DATE", message: "La fecha debe ser AAAA-MM-DD." });
  }
  if (!destinationRaw) issues.push({ sheet: "Carga de stock", rowNumber: 1, code: "MISSING_LOCATION", message: "Falta el destino." });
  if (PROTECTED_DEMO_LOT_CODES2.has(lotCode)) {
    issues.push({
      sheet: "Carga de stock",
      rowNumber: 1,
      code: "PROTECTED_DEMO_LOT",
      message: `El lote ${lotCode} es de demo (N02/N03) y no se puede cargar por este formulario.`
    });
  }
  const originName = resolveLocationSpec(originRaw)?.name;
  const destinationName = resolveLocationSpec(destinationRaw)?.name;
  if (originName && destinationName && fold(originName) === fold(destinationName)) {
    issues.push({
      sheet: "Carga de stock",
      rowNumber: 1,
      code: "SAME_LOCATION",
      message: "El origen y el destino deben ser distintos."
    });
  }
  if (issues.length > 0 || !originName || !destinationName) {
    return buildPlanillaImportPlan({
      fileName: "carga-stock",
      rows: [],
      issues,
      sheets: [{ name: "Carga de stock", imported: 0, skipped: 1 }],
      skippedSheets: []
    }, snapshot);
  }
  const remito = input.remito?.trim().toUpperCase();
  const row = {
    sheet: "Carga de stock",
    rowNumber: 1,
    remito: remito || void 0,
    date: input.date,
    lotCode,
    variety,
    quantityKg: input.quantityKg,
    originName,
    destinationName,
    transporter: input.transporter?.trim() || void 0,
    bags: input.bags,
    caliber: input.caliber?.trim() || void 0,
    category: input.category?.trim() || void 0,
    notes: input.notes?.trim() || void 0,
    dtv: input.dtv?.trim() || void 0,
    client: input.client?.trim() || void 0,
    bagColor: input.bagColor?.trim() || void 0,
    threadColor: input.threadColor?.trim() || void 0,
    averageKg: input.averageKg,
    kind: "inbound",
    reference: `IMP-${createHash("sha256").update(["intake", input.date, remito ?? "sremito", lotCode, input.quantityKg, originName, destinationName].join("|")).digest("hex").slice(0, 16).toUpperCase()}`
  };
  const plan = buildPlanillaImportPlan({
    fileName: "carga-stock",
    rows: [row],
    issues: [],
    sheets: [{ name: "Carga de stock", imported: 1, skipped: 0 }],
    skippedSheets: []
  }, snapshot);
  const campaign = input.campaign?.trim() || "2026";
  const producer = input.producer?.trim() || "Papasud";
  for (const lot of plan.lotsToCreate) {
    lot.campaign = campaign;
    lot.producer = producer;
  }
  return plan;
}

// server/services/stockTransfer.ts
var EPSILON3 = 1e-3;
function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}
function cloneStock(record) {
  return { declaredQuantity: record.declaredQuantity, verifiedQuantity: record.verifiedQuantity };
}
function emptyStock() {
  return { declaredQuantity: 0, verifiedQuantity: 0 };
}
function buildStockTransferPreview(rawIntent, snapshot) {
  const intent = expandLegacyIntent(rawIntent);
  const errors = [];
  const origin = snapshot.locations.find((item2) => normalize(item2.id) === normalize(intent.origin) || normalize(item2.name) === normalize(intent.origin));
  const destination = snapshot.locations.find((item2) => normalize(item2.id) === normalize(intent.destination) || normalize(item2.name) === normalize(intent.destination));
  if (!intent.items.length) {
    errors.push({ code: "EMPTY_ITEMS", message: "El movimiento debe tener al menos una l\xEDnea de lote." });
  }
  if (!origin) errors.push({ code: "ORIGIN_NOT_FOUND", message: `No existe la ubicaci\xF3n de origen \u201C${intent.origin}\u201D.` });
  if (!destination) errors.push({ code: "DESTINATION_NOT_FOUND", message: `No existe la ubicaci\xF3n de destino \u201C${intent.destination}\u201D.` });
  if (origin && destination && origin.id === destination.id) {
    errors.push({ code: "SAME_LOCATION", message: "El origen y el destino deben ser distintos." });
  }
  const simulated = /* @__PURE__ */ new Map();
  for (const record of snapshot.stockRecords) {
    simulated.set(
      stockKey(record.lotId, record.locationId, stockUnit(record)),
      cloneStock(record)
    );
  }
  const lines = [];
  for (const item2 of intent.items) {
    const lot = snapshot.lots.find((candidate) => normalize(candidate.code) === normalize(item2.lotCode));
    const unit = item2.unit;
    if (!Number.isFinite(item2.quantity) || item2.quantity <= 0) {
      errors.push({ code: "INVALID_QUANTITY", message: `La cantidad del lote ${item2.lotCode} debe ser mayor a cero.` });
    }
    if (!lot) errors.push({ code: "LOT_NOT_FOUND", message: `No existe el lote ${item2.lotCode}.` });
    if (unit !== "kg" && unit !== "bags") {
      errors.push({ code: "INVALID_UNIT", message: `Unidad no soportada para el lote ${item2.lotCode}.` });
    }
    const lotStock = lot ? snapshot.stockRecords.filter((record) => record.lotId === lot.id) : [];
    if (lotStock.some((record) => record.verificationPending || Math.abs(record.verifiedQuantity - record.declaredQuantity) > EPSILON3)) {
      errors.push({
        code: "UNRESOLVED_DISCREPANCY",
        message: `El lote ${lot?.code ?? item2.lotCode} presenta una discrepancia o verificaci\xF3n pendiente.`
      });
    }
    const originRecord = lot && origin ? lotStock.find((record) => record.locationId === origin.id && recordMatchesUnit(record, unit)) : void 0;
    const destRecord = lot && destination ? lotStock.find((record) => record.locationId === destination.id && recordMatchesUnit(record, unit)) : void 0;
    const otherUnitAtOrigin = lot && origin ? lotStock.find((record) => record.locationId === origin.id && !recordMatchesUnit(record, unit)) : void 0;
    if (lot && origin && !originRecord && otherUnitAtOrigin) {
      errors.push({
        code: "UNIT_MISMATCH",
        message: `El lote ${lot.code} en ${origin.name} est\xE1 en ${stockUnit(otherUnitAtOrigin)}; no se convierte ${unit}.`
      });
    } else if (lot && origin && !originRecord) {
      errors.push({
        code: "ORIGIN_STOCK_NOT_FOUND",
        message: `El lote ${lot.code} no tiene stock registrado en ${origin.name} (${unit}).`
      });
    }
    const originKey = lot && origin ? stockKey(lot.id, origin.id, unit) : "";
    const destKey = lot && destination ? stockKey(lot.id, destination.id, unit) : "";
    const originSim = originKey ? simulated.get(originKey) ?? emptyStock() : emptyStock();
    const destSim = destKey ? simulated.get(destKey) ?? emptyStock() : emptyStock();
    if (originRecord && item2.quantity > originSim.verifiedQuantity + EPSILON3) {
      errors.push({
        code: "INSUFFICIENT_VERIFIED_STOCK",
        message: `El lote ${lot?.code ?? item2.lotCode} no tiene stock verificado suficiente en origen.`
      });
    }
    if (originRecord && item2.quantity > originSim.declaredQuantity + EPSILON3) {
      errors.push({
        code: "INSUFFICIENT_DECLARED_STOCK",
        message: `El lote ${lot?.code ?? item2.lotCode} no tiene stock declarado suficiente en origen.`
      });
    }
    const originAfter = {
      declaredQuantity: originSim.declaredQuantity - item2.quantity,
      verifiedQuantity: originSim.verifiedQuantity - item2.quantity
    };
    const destinationAfter = {
      declaredQuantity: destSim.declaredQuantity + item2.quantity,
      verifiedQuantity: destSim.verifiedQuantity + item2.quantity
    };
    if (originKey) simulated.set(originKey, originAfter);
    if (destKey) simulated.set(destKey, destinationAfter);
    lines.push({
      lotCode: item2.lotCode,
      quantity: item2.quantity,
      unit,
      lot,
      originStock: originRecord && cloneStock(originSim),
      destinationStock: destRecord ? cloneStock(destSim) : emptyStock(),
      originAfter,
      destinationAfter
    });
  }
  const uniqueCodes = new Set(errors.map((error) => `${error.code}:${error.message}`));
  const deduped = errors.filter((error, index) => {
    const key = `${error.code}:${error.message}`;
    return [...uniqueCodes].indexOf(key) === index;
  });
  return {
    valid: deduped.length === 0,
    errors: deduped,
    intent,
    remitoNumber: intent.remitoNumber,
    origin,
    destination,
    lines,
    lot: lines[0]?.lot,
    originStock: lines[0]?.originStock
  };
}

// server/services/stockCount.ts
function buildStockCountPlan(input, lots2, locations2, stockRecords2) {
  const errors = [];
  const lot = lots2.find((item2) => input.lotId && item2.id === input.lotId || input.lotCode && item2.code.toLowerCase() === input.lotCode.toLowerCase());
  const location = locations2.find((item2) => input.locationId && item2.id === input.locationId || input.location && (normalize(item2.id) === normalize(input.location) || normalize(item2.name) === normalize(input.location)));
  if (!lot) errors.push({ code: "LOT_NOT_FOUND", message: "No existe el lote a contar." });
  if (!location) errors.push({ code: "LOCATION_NOT_FOUND", message: "No existe la ubicaci\xF3n del conteo." });
  if (!Number.isFinite(input.observedQuantity) || input.observedQuantity < 0) {
    errors.push({ code: "INVALID_QUANTITY", message: "La cantidad observada no puede ser negativa." });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.push({ code: "INVALID_DATE", message: "Ingres\xE1 la fecha del conteo." });
  }
  const record = lot && location ? stockRecords2.find((item2) => item2.lotId === lot.id && item2.locationId === location.id && recordMatchesUnit(item2, input.unit)) : void 0;
  if (lot && location && !record) {
    errors.push({ code: "STOCK_NOT_FOUND", message: `No hay stock ${input.unit} de ${lot.code} en ${location.name}.` });
  }
  const expectedQuantity = record?.verifiedQuantity ?? 0;
  const difference = input.observedQuantity - expectedQuantity;
  return {
    valid: errors.length === 0,
    errors,
    lot,
    location,
    record,
    expectedQuantity,
    observedQuantity: input.observedQuantity,
    difference,
    count: {
      locationId: location?.id ?? "",
      lotId: lot?.id ?? "",
      expectedQuantity,
      observedQuantity: input.observedQuantity,
      unit: input.unit,
      difference,
      countedAt: input.date,
      notes: input.notes
    }
  };
}

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
  updatedAt: row.updated_at,
  unit: stockUnit(row)
});
var mapMovementItem = (row) => ({
  id: row.id,
  movementId: row.movement_id,
  lotId: row.lot_id,
  dispatchedQuantity: Number(row.dispatched_quantity),
  receivedQuantity: row.received_quantity == null ? void 0 : Number(row.received_quantity),
  receivedAt: row.received_at ?? void 0,
  unit: row.unit,
  sortOrder: row.sort_order
});
var mapMovement = (row, items = []) => {
  const data = row.data && typeof row.data === "object" && !Array.isArray(row.data) ? row.data : void 0;
  const entries = data ? Object.entries(data).filter(([, value]) => value !== void 0) : [];
  const mapped = {
    id: row.id,
    reference: row.reference,
    lotId: row.lot_id ?? void 0,
    originLocationId: row.origin_location_id ?? void 0,
    destinationLocationId: row.destination_location_id ?? void 0,
    quantity: row.quantity == null ? void 0 : Number(row.quantity),
    date: row.movement_date,
    status: row.status,
    remitoNumber: row.remito_number ?? void 0,
    kind: row.kind ?? "transfer",
    correctsMovementId: row.corrects_movement_id ?? void 0,
    receptionStatus: row.reception_status ?? "not_applicable",
    receivedTotal: row.received_total == null ? void 0 : Number(row.received_total),
    receivedUnit: row.received_unit ?? void 0,
    receivedAt: row.received_at ?? void 0,
    data: entries.length > 0 ? Object.fromEntries(entries) : void 0,
    items
  };
  if (!mapped.lotId) mapped.lotId = movementPrimaryLotId(mapped) || void 0;
  if (mapped.quantity == null && items.length === 1) mapped.quantity = items[0].dispatchedQuantity;
  return mapped;
};
var mapTraceabilityEvent = (row) => ({
  id: row.id,
  lotId: row.lot_id,
  type: row.event_type,
  date: row.event_date,
  locationId: row.location_id ?? void 0,
  data: typeof row.data === "object" && row.data !== null && !Array.isArray(row.data) ? row.data : {}
});
var mapDiscrepancy = (row) => ({
  id: row.id,
  movementId: row.movement_id ?? void 0,
  movementItemId: row.movement_item_id ?? void 0,
  stockRecordId: row.stock_record_id ?? void 0,
  lotId: row.lot_id ?? void 0,
  locationId: row.location_id ?? void 0,
  type: row.type,
  expectedQuantity: Number(row.expected_quantity),
  observedQuantity: Number(row.observed_quantity),
  unit: row.unit,
  difference: Number(row.difference),
  status: row.status,
  cause: row.cause ?? void 0,
  resolution: row.resolution ?? void 0,
  createdAt: row.created_at,
  resolvedAt: row.resolved_at ?? void 0
});
var mapStockCount = (row) => ({
  id: row.id,
  locationId: row.location_id,
  lotId: row.lot_id,
  expectedQuantity: Number(row.expected_quantity),
  observedQuantity: Number(row.observed_quantity),
  unit: row.unit,
  difference: Number(row.observed_quantity) - Number(row.expected_quantity),
  countedAt: row.counted_at,
  notes: row.notes ?? void 0,
  discrepancyId: row.discrepancy_id ?? void 0
});

// server/repositories/papaStockRepository.ts
function attachMovements(rows, itemRows) {
  const itemsByMovement = /* @__PURE__ */ new Map();
  for (const row of itemRows) {
    const current = itemsByMovement.get(row.movement_id) ?? [];
    current.push(mapMovementItem(row));
    itemsByMovement.set(row.movement_id, current);
  }
  return rows.map((row) => mapMovement(
    row,
    (itemsByMovement.get(row.id) ?? []).sort((left, right) => left.sortOrder - right.sortOrder)
  ));
}
var PapaStockRepository = class {
  constructor(database) {
    this.database = database;
  }
  database;
  async loadSnapshot() {
    const [locations2, lots2, stock, movements2, items, traceability, discrepancies, counts] = await Promise.all([
      this.database.query("select * from public.locations order by id"),
      this.database.query("select * from public.lots order by code"),
      this.database.query("select * from public.stock_records order by id"),
      this.database.query("select * from public.movements order by movement_date desc, id"),
      this.database.query("select * from public.movement_items order by movement_id, sort_order, id"),
      this.database.query("select * from public.traceability_events order by event_date, id"),
      this.database.query("select * from public.discrepancies order by created_at desc, id"),
      this.database.query("select * from public.stock_counts order by counted_at desc, id")
    ]);
    if (!locations2.rowCount || !lots2.rowCount || !stock.rowCount) {
      throw new Error("La base existe pero el seed operativo est\xE1 incompleto.");
    }
    return {
      locations: locations2.rows.map(mapLocation),
      shelfUnits: shelfUnits.map((item2) => ({ ...item2 })),
      shelves: shelves.map((item2) => ({ ...item2 })),
      lots: lots2.rows.map(mapLot),
      stockRecords: stock.rows.map(mapStockRecord),
      movements: attachMovements(movements2.rows, items.rows),
      transporters: transporters.map((item2) => ({ ...item2 })),
      traceabilityEvents: traceability.rows.map(mapTraceabilityEvent),
      discrepancies: discrepancies.rows.map(mapDiscrepancy),
      stockCounts: counts.rows.map(mapStockCount)
    };
  }
  async loadLot(idOrCode) {
    const snapshot = await this.loadSnapshot();
    const lot = snapshot.lots.find((item2) => item2.id === idOrCode || item2.code.toLowerCase() === idOrCode.toLowerCase());
    if (!lot) throw Object.assign(new Error("Lote no encontrado."), { status: 404 });
    const lotLocationIds = new Set(
      snapshot.stockRecords.filter((item2) => item2.lotId === lot.id).map((item2) => item2.locationId)
    );
    return {
      locations: snapshot.locations,
      shelfUnits: snapshot.shelfUnits.filter((unit) => lotLocationIds.has(unit.locationId)),
      shelves: snapshot.shelves.filter((shelf) => lotLocationIds.has(shelf.locationId)),
      lots: [lot],
      stockRecords: snapshot.stockRecords.filter((item2) => item2.lotId === lot.id),
      movements: snapshot.movements.filter((item2) => movementTouchesLot(item2, lot.id)),
      transporters: snapshot.transporters,
      traceabilityEvents: snapshot.traceabilityEvents.filter((item2) => item2.lotId === lot.id),
      discrepancies: (snapshot.discrepancies ?? []).filter((item2) => item2.lotId === lot.id),
      stockCounts: (snapshot.stockCounts ?? []).filter((item2) => item2.lotId === lot.id)
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
    const expanded = expandLegacyIntent(intent);
    const client = await this.database.connect();
    try {
      await client.query("begin");
      const lotCodes = [...new Set(expanded.items.map((item2) => item2.lotCode.toLowerCase()))].sort();
      const [locationsResult, lotResult] = await Promise.all([
        client.query("select * from public.locations order by id"),
        client.query("select * from public.lots where lower(code) = any($1::text[]) order by id for share", [lotCodes])
      ]);
      const lotIds = lotResult.rows.map((row) => row.id);
      const stockResult = lotIds.length ? await client.query("select * from public.stock_records where lot_id = any($1::text[]) order by id for update", [lotIds]) : { rows: [] };
      const snapshot = {
        locations: locationsResult.rows.map(mapLocation),
        shelfUnits: shelfUnits.map((item2) => ({ ...item2 })),
        shelves: shelves.map((item2) => ({ ...item2 })),
        lots: lotResult.rows.map(mapLot),
        stockRecords: stockResult.rows.map(mapStockRecord),
        movements: [],
        transporters: transporters.map((item2) => ({ ...item2 })),
        traceabilityEvents: []
      };
      const preview = buildStockTransferPreview(expanded, snapshot);
      if (!preview.valid || !preview.origin || !preview.destination) {
        throw Object.assign(new Error("El movimiento no supera la validaci\xF3n operativa."), {
          status: 409,
          details: preview.errors
        });
      }
      for (const line of preview.lines) {
        if (!line.lot) throw new Error("La validaci\xF3n perdi\xF3 un lote durante la transacci\xF3n.");
        const originRecord = stockResult.rows.find((item2) => item2.lot_id === line.lot.id && item2.location_id === preview.origin.id && stockUnit(item2) === line.unit);
        if (!originRecord) throw new Error("El stock de origen desapareci\xF3 durante la transacci\xF3n.");
        await client.query(
          `update public.stock_records
           set declared_quantity = declared_quantity - $1,
               verified_quantity = verified_quantity - $1,
               updated_at = now()
           where id = $2`,
          [line.quantity, originRecord.id]
        );
        await client.query(
          `insert into public.stock_records
            (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, updated_at, unit)
           values ($1, $2, $3, $4, $4, false, now(), $5)
           on conflict (lot_id, location_id, unit) do update set
             declared_quantity = public.stock_records.declared_quantity + excluded.declared_quantity,
             verified_quantity = public.stock_records.verified_quantity + excluded.verified_quantity,
             verification_pending = false,
             updated_at = now()`,
          [`stock-${randomUUID()}`, line.lot.id, preview.destination.id, line.quantity, line.unit]
        );
      }
      const token = randomUUID();
      const units = new Set(preview.lines.map((line) => line.unit));
      const headerQuantity = units.size === 1 ? preview.lines.reduce((total, line) => total + line.quantity, 0) : null;
      const headerLotId = preview.lines.length === 1 ? preview.lines[0]?.lot?.id ?? null : null;
      const movementResult = await client.query(
        `insert into public.movements
          (id, reference, lot_id, origin_location_id, destination_location_id, quantity, movement_date, status, remito_number, kind, reception_status, data)
         values ($1, $2, $3, $4, $5, $6, current_date, 'completed', $7, 'transfer', 'pending', $8::jsonb)
         returning *`,
        [
          `movement-${token}`,
          `MV-N01-${token.slice(0, 8).toUpperCase()}`,
          headerLotId,
          preview.origin.id,
          preview.destination.id,
          headerQuantity,
          expanded.remitoNumber ?? null,
          JSON.stringify({ source: "n01" })
        ]
      );
      const movementId = movementResult.rows[0].id;
      const itemRows = [];
      for (const [index, line] of preview.lines.entries()) {
        const inserted = await client.query(
          `insert into public.movement_items
            (id, movement_id, lot_id, dispatched_quantity, unit, sort_order)
           values ($1, $2, $3, $4, $5, $6)
           returning *`,
          [`mitem-${token}-${index}`, movementId, line.lot.id, line.quantity, line.unit, index]
        );
        itemRows.push(inserted.rows[0]);
      }
      await client.query("commit");
      return mapMovement(movementResult.rows[0], itemRows.map(mapMovementItem));
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
        if (PROTECTED_DEMO_LOT_CODES2.has(lot.code)) continue;
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
        if (!lot || PROTECTED_DEMO_LOT_CODES2.has(lot.code) || !originId || !destinationId || originId === destinationId) {
          skippedMovements += 1;
          continue;
        }
        const inserted = await client.query(
          `insert into public.movements
            (id, reference, lot_id, origin_location_id, destination_location_id, quantity, movement_date, status, data, remito_number, kind, reception_status)
           values ($1, $2, $3, $4, $5, $6, $7, 'completed', $8::jsonb, $9, 'import', 'not_applicable')
           on conflict (reference) do nothing`,
          [
            movement.id,
            movement.reference,
            lot.id,
            originId,
            destinationId,
            movement.quantityKg,
            movement.date,
            JSON.stringify(movement.data),
            typeof movement.data.remito === "string" ? movement.data.remito : null
          ]
        );
        if (inserted.rowCount) {
          createdMovements += 1;
          importedLotIds.add(lot.id);
          await client.query(
            `insert into public.movement_items (id, movement_id, lot_id, dispatched_quantity, unit, sort_order)
             values ($1, $2, $3, $4, 'kg', 0)
             on conflict (id) do nothing`,
            [`mitem-${movement.id}`, movement.id, lot.id, movement.quantityKg]
          );
        } else {
          skippedMovements += 1;
        }
      }
      for (const code of plan.stockLotCodes) {
        const lot = lotIdByCode.get(code.toLowerCase());
        if (lot && !PROTECTED_DEMO_LOT_CODES2.has(lot.code)) importedLotIds.add(lot.id);
      }
      let upsertedStockRecords = 0;
      for (const lotId of importedLotIds) {
        const lot = refreshedLots.rows.find((row) => row.id === lotId);
        if (!lot || PROTECTED_DEMO_LOT_CODES2.has(lot.code)) continue;
        const history = await client.query(
          `select items.*, movements.origin_location_id, movements.destination_location_id, movements.status
           from public.movement_items items
           join public.movements on movements.id = items.movement_id
           where items.lot_id = $1`,
          [lotId]
        );
        const net = /* @__PURE__ */ new Map();
        for (const row of history.rows) {
          if (row.status === "cancelled") continue;
          const quantity = Number(row.dispatched_quantity);
          const unit = row.unit;
          if (row.origin_location_id) {
            const key = `${row.origin_location_id}:${unit}`;
            net.set(key, (net.get(key) ?? 0) - quantity);
          }
          if (row.destination_location_id) {
            const key = `${row.destination_location_id}:${unit}`;
            net.set(key, (net.get(key) ?? 0) + quantity);
          }
        }
        for (const [composite, rawQuantity] of net) {
          const [locationId, unit] = composite.split(":");
          const quantity = Math.max(0, Math.round(rawQuantity * 1e3) / 1e3);
          if (quantity <= 0) continue;
          await client.query(
            `insert into public.stock_records
              (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, updated_at, unit)
             values ($1, $2, $3, $4, $4, false, now(), $5)
             on conflict (lot_id, location_id, unit) do update set
               declared_quantity = excluded.declared_quantity,
               verified_quantity = excluded.verified_quantity,
               verification_pending = false,
               updated_at = now()`,
            [`stock-imp-${randomUUID()}`, lotId, locationId, quantity, unit]
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
  async executeStockVerification(input) {
    const snapshot = await this.loadSnapshot();
    const preview = buildStockVerificationPreview(
      input,
      getStockViews(snapshot.stockRecords, snapshot.lots, snapshot.locations)
    );
    if (!preview.valid) {
      throw Object.assign(new Error(preview.issues[0]?.message ?? "La verificaci\xF3n no es v\xE1lida."), { status: 400, details: preview.issues });
    }
    const client = await this.database.connect();
    try {
      await client.query("begin");
      const updated = await client.query(
        `update public.stock_records
            set verified_quantity = $1,
                verification_pending = false,
                updated_at = now()
          where id = $2
          returning id`,
        [input.countedQuantity, input.stockRecordId]
      );
      if (!updated.rowCount) {
        throw Object.assign(new Error("Registro de stock no encontrado."), { status: 404 });
      }
      const inserted = await client.query(
        `insert into public.traceability_events
          (id, lot_id, event_type, event_date, location_id, data)
         values ($1, $2, $3, $4, $5, $6::jsonb)
         returning *`,
        [
          `trace-${randomUUID()}`,
          preview.lotId,
          "stock_verification",
          input.date,
          preview.locationId || null,
          JSON.stringify({
            verifiedQuantity: input.countedQuantity,
            ...input.bags ? { bags: input.bags } : {},
            ...input.notes ? { notes: input.notes } : {},
            origin: "operator_confirmation"
          })
        ]
      );
      await client.query("commit");
      return toStockVerificationConfirmation(preview, true, inserted.rows[0]?.id);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
  async executeReception(input) {
    const client = await this.database.connect();
    try {
      await client.query("begin");
      const movementResult = await client.query("select * from public.movements where id = $1 for update", [input.movementId]);
      const movementRow = movementResult.rows[0];
      if (!movementRow) throw Object.assign(new Error("Movimiento no encontrado."), { status: 404 });
      const itemResult = await client.query(
        "select * from public.movement_items where movement_id = $1 order by sort_order for update",
        [input.movementId]
      );
      const movement = mapMovement(movementRow, itemResult.rows.map(mapMovementItem));
      const plan = buildReceptionPlan(movement, input);
      if (!plan.valid) {
        throw Object.assign(new Error(plan.errors[0]?.message ?? "La recepci\xF3n no es v\xE1lida."), { status: 409, details: plan.errors });
      }
      if (movement.destinationLocationId) {
        const lotIds = [...new Set(plan.stockAdjustments.map((item2) => item2.lotId))].sort();
        if (lotIds.length) {
          await client.query(
            "select id from public.stock_records where lot_id = any($1::text[]) and location_id = $2 order by id for update",
            [lotIds, movement.destinationLocationId]
          );
        }
      }
      for (const update of plan.itemUpdates) {
        await client.query(
          `update public.movement_items
              set received_quantity = $1, received_at = $2
            where id = $3`,
          [update.receivedQuantity, `${input.date}T12:00:00Z`, update.item.id]
        );
      }
      for (const adjustment of plan.stockAdjustments) {
        await client.query(
          `update public.stock_records
              set verified_quantity = verified_quantity + $1, updated_at = now()
            where lot_id = $2 and location_id = $3 and unit = $4`,
          [adjustment.deltaVerified, adjustment.lotId, movement.destinationLocationId, adjustment.unit]
        );
      }
      const created = [];
      for (const discrepancy of plan.discrepancies) {
        const inserted = await client.query(
          `insert into public.discrepancies
            (id, movement_id, movement_item_id, lot_id, location_id, type, expected_quantity, observed_quantity, unit, difference, status, cause)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open', $11)
           returning *`,
          [
            `disc-${randomUUID()}`,
            discrepancy.movementId ?? null,
            discrepancy.movementItemId ?? null,
            discrepancy.lotId ?? null,
            discrepancy.locationId ?? null,
            discrepancy.type,
            discrepancy.expectedQuantity,
            discrepancy.observedQuantity,
            discrepancy.unit,
            discrepancy.difference,
            discrepancy.cause ?? null
          ]
        );
        created.push(mapDiscrepancy(inserted.rows[0]));
        if (discrepancy.lotId) {
          await client.query(
            `insert into public.traceability_events
              (id, lot_id, event_type, event_date, location_id, data)
             values ($1, $2, 'reception', $3, $4, $5::jsonb)`,
            [
              `trace-${randomUUID()}`,
              discrepancy.lotId,
              input.date,
              movement.destinationLocationId ?? null,
              JSON.stringify({
                remitoNumber: movement.remitoNumber,
                reference: movement.reference,
                expectedQuantity: discrepancy.expectedQuantity,
                observedQuantity: discrepancy.observedQuantity,
                difference: discrepancy.difference,
                unit: discrepancy.unit
              })
            ]
          );
        }
      }
      await client.query(
        `update public.movements
            set reception_status = $1, received_total = $2, received_unit = $3, received_at = $4
          where id = $5`,
        [plan.receptionStatus, plan.receivedTotal ?? null, plan.receivedUnit ?? null, `${input.date}T12:00:00Z`, movement.id]
      );
      const refreshed = await client.query("select * from public.movements where id = $1", [movement.id]);
      const refreshedItems = await client.query("select * from public.movement_items where movement_id = $1 order by sort_order", [movement.id]);
      await client.query("commit");
      return { movement: mapMovement(refreshed.rows[0], refreshedItems.rows.map(mapMovementItem)), discrepancies: created };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
  async executeLotCorrection(input) {
    const client = await this.database.connect();
    try {
      await client.query("begin");
      const originalResult = await client.query("select * from public.movements where id = $1 for update", [input.originalMovementId]);
      if (!originalResult.rows[0]) throw Object.assign(new Error("Movimiento original no encontrado."), { status: 404 });
      const itemResult = await client.query("select * from public.movement_items where movement_id = $1", [input.originalMovementId]);
      const original = mapMovement(originalResult.rows[0], itemResult.rows.map(mapMovementItem));
      const [lots2, stock] = await Promise.all([
        client.query("select * from public.lots order by id for share"),
        client.query("select * from public.stock_records where location_id = $1 order by id for update", [input.locationId])
      ]);
      const plan = buildLotCorrectionPlan(input, original, lots2.rows.map(mapLot), stock.rows.map(mapStockRecord));
      if (!plan.valid || !plan.fromLot || !plan.toLot) {
        throw Object.assign(new Error(plan.errors[0]?.message ?? "La correcci\xF3n no es v\xE1lida."), { status: 409, details: plan.errors });
      }
      await client.query(
        `update public.stock_records
            set declared_quantity = declared_quantity + $1,
                verified_quantity = verified_quantity + $1,
                updated_at = now()
          where lot_id = $2 and location_id = $3 and unit = $4`,
        [plan.quantity, plan.fromLot.id, plan.locationId, plan.unit]
      );
      await client.query(
        `update public.stock_records
            set declared_quantity = declared_quantity - $1,
                verified_quantity = verified_quantity - $1,
                updated_at = now()
          where lot_id = $2 and location_id = $3 and unit = $4`,
        [plan.quantity, plan.toLot.id, plan.locationId, plan.unit]
      );
      const token = randomUUID();
      const movementResult = await client.query(
        `insert into public.movements
          (id, reference, lot_id, origin_location_id, destination_location_id, quantity, movement_date, status, remito_number, kind, corrects_movement_id, reception_status, data)
         values ($1, $2, null, $3, $3, $4, current_date, 'completed', $5, 'correction', $6, 'not_applicable', $7::jsonb)
         returning *`,
        [
          `movement-${token}`,
          `MV-COR-${token.slice(0, 8).toUpperCase()}`,
          plan.locationId,
          plan.quantity,
          original.remitoNumber ?? null,
          original.id,
          JSON.stringify({
            source: "correction",
            fromLotCode: plan.fromLot.code,
            toLotCode: plan.toLot.code
          })
        ]
      );
      const items = [
        await client.query(
          `insert into public.movement_items (id, movement_id, lot_id, dispatched_quantity, unit, sort_order, data)
           values ($1, $2, $3, $4, $5, 0, '{"effect":"restore"}'::jsonb) returning *`,
          [`mitem-${token}-0`, movementResult.rows[0].id, plan.fromLot.id, plan.quantity, plan.unit]
        ),
        await client.query(
          `insert into public.movement_items (id, movement_id, lot_id, dispatched_quantity, unit, sort_order, data)
           values ($1, $2, $3, $4, $5, 1, '{"effect":"deduct"}'::jsonb) returning *`,
          [`mitem-${token}-1`, movementResult.rows[0].id, plan.toLot.id, plan.quantity, plan.unit]
        )
      ];
      for (const lot of [plan.fromLot, plan.toLot]) {
        await client.query(
          `insert into public.traceability_events (id, lot_id, event_type, event_date, location_id, data)
           values ($1, $2, 'correction', current_date, $3, $4::jsonb)`,
          [
            `trace-${randomUUID()}`,
            lot.id,
            plan.locationId,
            JSON.stringify({
              reference: movementResult.rows[0].reference,
              corrects: original.reference,
              remitoNumber: original.remitoNumber,
              quantity: plan.quantity,
              unit: plan.unit,
              fromLotCode: plan.fromLot.code,
              toLotCode: plan.toLot.code
            })
          ]
        );
      }
      await client.query("commit");
      return mapMovement(movementResult.rows[0], items.flatMap((result) => result.rows.map(mapMovementItem)));
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
  async executeStockCount(input) {
    const client = await this.database.connect();
    try {
      await client.query("begin");
      const [locations2, lots2, stock] = await Promise.all([
        client.query("select * from public.locations order by id"),
        client.query("select * from public.lots order by id for share"),
        client.query("select * from public.stock_records order by id for update")
      ]);
      const plan = buildStockCountPlan(input, lots2.rows.map(mapLot), locations2.rows.map(mapLocation), stock.rows.map(mapStockRecord));
      if (!plan.valid || !plan.record || !plan.lot || !plan.location) {
        throw Object.assign(new Error(plan.errors[0]?.message ?? "El conteo no es v\xE1lido."), { status: 409, details: plan.errors });
      }
      await client.query(
        `update public.stock_records
            set verified_quantity = $1, verification_pending = false, updated_at = now()
          where id = $2`,
        [input.observedQuantity, plan.record.id]
      );
      let discrepancy;
      if (plan.difference !== 0) {
        const inserted = await client.query(
          `insert into public.discrepancies
            (id, stock_record_id, lot_id, location_id, type, expected_quantity, observed_quantity, unit, difference, status)
           values ($1, $2, $3, $4, 'physical_count', $5, $6, $7, $8, 'open')
           returning *`,
          [
            `disc-${randomUUID()}`,
            plan.record.id,
            plan.lot.id,
            plan.location.id,
            plan.expectedQuantity,
            plan.observedQuantity,
            input.unit,
            plan.difference
          ]
        );
        discrepancy = mapDiscrepancy(inserted.rows[0]);
      }
      const countResult = await client.query(
        `insert into public.stock_counts
          (id, location_id, lot_id, expected_quantity, observed_quantity, unit, counted_at, notes, discrepancy_id)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         returning *`,
        [
          `count-${randomUUID()}`,
          plan.location.id,
          plan.lot.id,
          plan.expectedQuantity,
          plan.observedQuantity,
          input.unit,
          input.date,
          input.notes ?? null,
          discrepancy?.id ?? null
        ]
      );
      await client.query(
        `insert into public.traceability_events
          (id, lot_id, event_type, event_date, location_id, data)
         values ($1, $2, 'physical_count', $3, $4, $5::jsonb)`,
        [
          `trace-${randomUUID()}`,
          plan.lot.id,
          input.date,
          plan.location.id,
          JSON.stringify({
            expectedQuantity: plan.expectedQuantity,
            observedQuantity: plan.observedQuantity,
            difference: plan.difference,
            unit: input.unit,
            notes: input.notes
          })
        ]
      );
      await client.query("commit");
      return { count: mapStockCount(countResult.rows[0]), discrepancy };
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
function movementEvidence(movements2) {
  return movements2.map((movement) => ({
    type: "movement",
    reference: movement.reference,
    description: `${movementQuantityForLot(movement).toLocaleString("es-AR")} kg \xB7 ${movement.status} \xB7 ${movement.date}`
  }));
}
function hypothesis(title, explanation, movements2) {
  return { title, explanation, movementReferences: movements2.map((item2) => item2.reference) };
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
  const exact = pending.find((movement) => movementQuantityForLot(movement, input.lot.id) === target);
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
      if (movementQuantityForLot(pending[left], input.lot.id) + movementQuantityForLot(pending[right], input.lot.id) === target) {
        const matches = [pending[left], pending[right]];
        return {
          engine: "heuristic",
          summary: `Dos movimientos pendientes (${matches.map((item2) => item2.reference).join(" + ")}) suman exactamente ${target.toLocaleString("es-AR")} kg.`,
          confidence: 0.88,
          explainedQuantity: target,
          unexplainedQuantity: 0,
          hypotheses: [hypothesis("Combinaci\xF3n de movimientos sin conciliar", "La suma de los movimientos coincide con la diferencia registrada.", matches)],
          evidence: movementEvidence(matches),
          recommendedAction: "Contrastar ambos remitos y pesajes antes de conciliar el stock.",
          relatedMovementId: matches[0].id,
          relatedMovementReference: matches.map((item2) => item2.reference).join(" + ")
        };
      }
    }
  }
  const partial = pending.filter((movement) => movementQuantityForLot(movement, input.lot.id) < target).slice(0, 4);
  const explained = Math.min(target, partial.reduce((sum, movement) => sum + movementQuantityForLot(movement, input.lot.id), 0));
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
      relatedMovementReference: partial.map((item2) => item2.reference).join(" + ")
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
      const movementReferences = new Set(input.movements.map((item2) => item2.reference));
      for (const item2 of parsed.hypotheses.flatMap((entry) => entry.movementReferences)) {
        if (!movementReferences.has(item2)) throw new Error(`Groq invent\xF3 la referencia ${item2}.`);
      }
      const allowedEvidence = {
        movement: new Set(input.movements.flatMap((item2) => [item2.id, item2.reference])),
        traceability: new Set(input.traceability.map((item2) => item2.id)),
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
      const firstReference = parsed.hypotheses.flatMap((item2) => item2.movementReferences)[0];
      const related = input.movements.find((item2) => item2.reference === firstReference);
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
var movementItemSchema = z3.object({
  lotCode: z3.string().trim().min(1).max(40),
  quantity: z3.number().positive(),
  unit: z3.enum(["bags", "kg"])
});
var parsedIntentSchema = z3.object({
  action: z3.literal("transfer"),
  remitoNumber: z3.string().trim().max(40).optional().or(z3.literal("")),
  origin: z3.string().trim().min(1).max(120),
  destination: z3.string().trim().min(1).max(120),
  items: z3.array(movementItemSchema).min(1).max(50)
}).transform((value) => expandLegacyIntent({
  ...value,
  remitoNumber: value.remitoNumber || void 0
}));
var jsonSchema3 = {
  type: "object",
  additionalProperties: false,
  required: ["action", "remitoNumber", "origin", "destination", "items"],
  properties: {
    action: { type: "string", enum: ["transfer"] },
    remitoNumber: { type: "string" },
    origin: { type: "string" },
    destination: { type: "string" },
    items: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["lotCode", "quantity", "unit"],
        properties: {
          lotCode: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string", enum: ["bags", "kg"] }
        }
      }
    }
  }
};
function normalize2(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function unitFromToken(token) {
  return normalizeUnit(token);
}
function locationIndex(text, name, allNames) {
  const normalizedText = normalize2(text);
  const normalizedName = normalize2(name);
  const exact = normalizedText.indexOf(normalizedName);
  if (exact >= 0) return exact;
  const tail = normalizedName.split(/\s+/).filter((part) => part.length >= 4).at(-1);
  if (!tail) return -1;
  const ambiguous = allNames.some((other) => other !== name && normalize2(other).includes(tail));
  if (ambiguous) return -1;
  return normalizedText.indexOf(tail);
}
function matchLocations(text, context) {
  const names = context.locations.map((item2) => item2.name);
  return context.locations.map((item2) => ({ item: item2, index: locationIndex(text, item2.name, names) })).filter((candidate) => candidate.index >= 0).sort((left, right) => left.index - right.index);
}
function collectItems(text) {
  const normalized = normalize2(text);
  if (/\b(toneladas?|tn|tns|pallets?)\b/.test(normalized)) {
    throw Object.assign(new Error("Solo se interpretan bolsas o kilos en este flujo. No convierto unidades."), { status: 422 });
  }
  const byQuantity = [...normalized.matchAll(
    /(\d+(?:[.,]\d+)?)\s*(bolsas?|bags?|kg|kilos?|kilogramos?)\b(?:(?!lote).){0,40}lote\s+([a-z0-9][a-z0-9-]{0,20})/g
  )];
  const byLot = [...normalized.matchAll(
    /lote\s+([a-z0-9][a-z0-9-]{0,20})\s+(\d+(?:[.,]\d+)?)\s*(bolsas?|bags?|kg|kilos?|kilogramos?)/g
  )];
  const fromQuantity = byQuantity.flatMap((match) => {
    const unit = unitFromToken(match[2]);
    if (!unit) return [];
    return [{ lotCode: match[3].toUpperCase() === match[3] ? match[3] : match[3], quantity: Number(match[1].replace(",", ".")), unit }];
  });
  const fromLot = byLot.flatMap((match) => {
    const unit = unitFromToken(match[3]);
    if (!unit) return [];
    return [{ lotCode: match[1], quantity: Number(match[2].replace(",", ".")), unit }];
  });
  if (fromLot.length > 0 && fromQuantity.length > 0) {
    const left = fromQuantity.map((item2) => `${item2.lotCode}:${item2.quantity}:${item2.unit}`).sort().join("|");
    const right = fromLot.map((item2) => `${item2.lotCode}:${item2.quantity}:${item2.unit}`).sort().join("|");
    if (left === right) return fromLot;
    return fromLot.length >= fromQuantity.length ? fromLot : fromQuantity;
  }
  return fromLot.length ? fromLot : fromQuantity;
}
function resolveLotCode(extracted, context) {
  const exact = context.lots.find((lot) => normalize2(lot.code) === normalize2(extracted));
  if (exact) return exact.code;
  const contained = context.lots.filter((lot) => normalize2(extracted).includes(normalize2(lot.code)) || normalize2(lot.code).includes(normalize2(extracted)));
  if (contained.length === 1) return contained[0].code;
  if (contained.length > 1) {
    throw Object.assign(new Error("Hay m\xE1s de un lote que coincide con el texto. Especific\xE1 el c\xF3digo exacto."), { status: 422 });
  }
  return extracted;
}
function parseWithHeuristic(text, context) {
  const remitoMatch = normalize2(text).match(/remito\s*(?:n(?:u|ú)mero\s*)?(?:n[°o.]?\s*)?(\d+)/i) ?? text.match(/remito\s+(\d+)/i);
  const locations2 = matchLocations(text, context);
  const items = collectItems(text).map((item2) => ({
    ...item2,
    lotCode: resolveLotCode(item2.lotCode, context)
  }));
  if (!items.length || locations2.length < 2) {
    throw Object.assign(new Error("No pude identificar lotes, cantidades, origen y destino. Escrib\xED las ubicaciones completas."), { status: 422 });
  }
  return parsedIntentSchema.parse({
    action: "transfer",
    remitoNumber: remitoMatch?.[1],
    origin: locations2[0].item.name,
    destination: locations2[1].item.name,
    items
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
                "Puede haber una o varias l\xEDneas de lote. Extra\xE9 TODAS las l\xEDneas; no sumes, no elijas solo la primera.",
                "No inventes lote, cantidad, unidad, origen, destino ni n\xFAmero de remito.",
                "No conviertas bolsas a kilos ni kilos a bolsas.",
                "Si una cantidad o unidad no est\xE1 dicha, no la completes.",
                "La primera ubicaci\xF3n mencionada es el origen y la segunda el destino.",
                "remitoNumber es el n\xFAmero de papel (vac\xEDo si no se mencion\xF3).",
                "unit es bags para bolsas y kg para kilos.",
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
    } catch (error) {
      if (error && typeof error === "object" && "status" in error && error.status === 422) {
        throw error;
      }
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
    lotId: identifier.optional(),
    originLocationId: identifier.optional(),
    destinationLocationId: identifier.optional(),
    quantity: z5.number().nonnegative().optional(),
    date: z5.string(),
    status: z5.enum(["completed", "pending", "cancelled"]),
    reference: identifier,
    remitoNumber: z5.string().optional(),
    items: z5.array(z5.object({
      id: identifier,
      movementId: identifier,
      lotId: identifier,
      dispatchedQuantity: z5.number().positive(),
      unit: z5.enum(["kg", "bags"]),
      sortOrder: z5.number().int().default(0)
    })).optional()
  })).max(100),
  traceability: z5.array(z5.object({
    id: identifier,
    lotId: identifier,
    type: z5.enum(["planting", "harvest", "treatment", "quality_control", "stock_verification", "reception", "correction", "physical_count", "discrepancy"]),
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
var optionalText = (max) => z5.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? void 0 : value,
  z5.string().trim().max(max).optional()
);
var movementTextSchema = z5.object({
  text: z5.string().trim().min(8).max(500)
});
var movementItemInputSchema = z5.object({
  lotCode: identifier.max(40),
  quantity: z5.number().positive().max(1e6),
  unit: z5.enum(["bags", "kg"])
});
var movementIntentSchema = z5.union([
  z5.object({
    action: z5.literal("transfer"),
    remitoNumber: z5.string().trim().max(40).optional(),
    origin: identifier,
    destination: identifier,
    items: z5.array(movementItemInputSchema).min(1).max(50)
  }),
  z5.object({
    action: z5.literal("transfer"),
    lotCode: identifier.max(40),
    quantityKg: z5.number().positive().max(1e6),
    origin: identifier,
    destination: identifier,
    remitoNumber: z5.string().trim().max(40).optional()
  }).transform((value) => ({
    action: "transfer",
    remitoNumber: value.remitoNumber,
    origin: value.origin,
    destination: value.destination,
    items: [{ lotCode: value.lotCode, quantity: value.quantityKg, unit: "kg" }],
    lotCode: value.lotCode,
    quantityKg: value.quantityKg
  }))
]);
var receptionSchema = z5.object({
  date: z5.iso.date(),
  items: z5.array(z5.object({
    movementItemId: identifier,
    receivedQuantity: z5.number().nonnegative().max(1e6)
  })).min(1).optional(),
  receivedTotal: z5.number().nonnegative().max(1e6).optional(),
  unit: z5.enum(["bags", "kg"]).optional()
});
var correctionSchema = z5.object({
  originalMovementId: identifier,
  locationId: identifier,
  fromLotCode: identifier.max(40),
  toLotCode: identifier.max(40),
  quantity: z5.number().positive().max(1e6),
  unit: z5.enum(["bags", "kg"])
});
var stockCountSchema = z5.object({
  locationId: identifier.optional(),
  location: z5.string().trim().min(1).max(120).optional(),
  lotId: identifier.optional(),
  lotCode: z5.string().trim().min(1).max(40).optional(),
  observedQuantity: z5.number().nonnegative().max(1e6),
  unit: z5.enum(["bags", "kg"]),
  date: z5.iso.date(),
  notes: optionalText(500)
});
var stockVerificationSchema = z5.object({
  stockRecordId: identifier,
  countedQuantity: z5.number().nonnegative().max(1e6),
  date: z5.iso.date(),
  bags: z5.number().positive().max(1e5).optional(),
  notes: optionalText(500)
});
var stockIntakeSchema = z5.object({
  lotCode: z5.string().trim().min(1).max(40),
  variety: z5.string().trim().min(1).max(80),
  quantityKg: z5.number().positive().max(1e6),
  date: z5.iso.date(),
  destination: z5.string().trim().min(1).max(120),
  origin: optionalText(120),
  remito: optionalText(40),
  bags: z5.number().positive().max(1e5).optional(),
  averageKg: z5.number().positive().max(200).optional(),
  caliber: optionalText(80),
  category: optionalText(80),
  bagColor: optionalText(40),
  threadColor: optionalText(40),
  transporter: optionalText(120),
  client: optionalText(120),
  dtv: optionalText(80),
  notes: optionalText(500),
  campaign: optionalText(20),
  producer: optionalText(120)
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
  app2.post("/api/movements/:id/reception", async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error("Base de datos no configurada."), { status: 503 });
      const body = receptionSchema.parse(request.body);
      response.status(201).json({
        data: await repository.executeReception({
          movementId: request.params.id,
          date: body.date,
          items: body.items,
          receivedTotal: body.receivedTotal,
          unit: body.unit
        })
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/movements/corrections", async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error("Base de datos no configurada."), { status: 503 });
      response.status(201).json({ data: await repository.executeLotCorrection(correctionSchema.parse(request.body)) });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/stock-counts", async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error("Base de datos no configurada."), { status: 503 });
      response.status(201).json({ data: await repository.executeStockCount(stockCountSchema.parse(request.body)) });
    } catch (error) {
      next(error);
    }
  });
  const excelBody = express.raw({ type: () => true, limit: "4mb" });
  function readWorkbookUpload(request) {
    const body = request.body;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      throw Object.assign(new Error("Adjunt\xE1 un archivo .csv, .xls o .xlsx."), { status: 400 });
    }
    const headerName = request.header("x-filename");
    const fileName = headerName ? decodeURIComponent(headerName) : "planilla.xls";
    return { buffer: body, fileName };
  }
  app2.post("/api/imports/planilla/preview", excelBody, async (request, response, next) => {
    try {
      const { buffer, fileName } = readWorkbookUpload(request);
      const snapshot = repository ? await repository.loadSnapshot() : demoSnapshot();
      const plan = buildPlanillaImportFromFile(buffer, fileName, snapshot);
      response.json({ data: plan.preview });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/imports/planilla", excelBody, async (request, response, next) => {
    try {
      const { buffer, fileName } = readWorkbookUpload(request);
      const snapshot = repository ? await repository.loadSnapshot() : demoSnapshot();
      const plan = buildPlanillaImportFromFile(buffer, fileName, snapshot);
      const materialized = materializePlanillaImport(plan, snapshot);
      const persisted = repository ? await repository.executePlanillaImport(plan) : materialized.result;
      response.status(201).json({
        data: {
          ...persisted,
          persisted: Boolean(repository),
          applied: {
            locations: materialized.applied.locations,
            lots: materialized.applied.lots,
            stockRecords: materialized.applied.stockRecords,
            movements: materialized.applied.movements
          }
        }
      });
    } catch (error) {
      next(error);
    }
  });
  async function snapshotForImport() {
    return repository ? repository.loadSnapshot() : demoSnapshot();
  }
  app2.post("/api/stock/intake/preview", async (request, response, next) => {
    try {
      const input = stockIntakeSchema.parse(request.body);
      const plan = buildStockIntakePlan(input, await snapshotForImport());
      response.json({ data: plan.preview });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/stock/intake", async (request, response, next) => {
    try {
      const input = stockIntakeSchema.parse(request.body);
      const snapshot = await snapshotForImport();
      const plan = buildStockIntakePlan(input, snapshot);
      if (!plan.preview.valid) {
        throw Object.assign(new Error(plan.preview.issues[0]?.message ?? "La carga de stock no es v\xE1lida."), { status: 400, details: plan.preview.issues });
      }
      const materialized = materializePlanillaImport(plan, snapshot);
      const persisted = repository ? await repository.executePlanillaImport(plan) : materialized.result;
      response.status(201).json({
        data: {
          ...persisted,
          persisted: Boolean(repository),
          applied: {
            locations: materialized.applied.locations,
            lots: materialized.applied.lots,
            stockRecords: materialized.applied.stockRecords,
            movements: materialized.applied.movements
          }
        }
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/stock/verify", async (request, response, next) => {
    try {
      const input = stockVerificationSchema.parse(request.body);
      const snapshot = await snapshotForImport();
      const preview = buildStockVerificationPreview(
        input,
        getStockViews(snapshot.stockRecords, snapshot.lots, snapshot.locations)
      );
      if (!preview.valid) {
        throw Object.assign(new Error(preview.issues[0]?.message ?? "La verificaci\xF3n no es v\xE1lida."), { status: 400, details: preview.issues });
      }
      if (repository?.executeStockVerification) {
        response.status(201).json({ data: await repository.executeStockVerification(input) });
        return;
      }
      response.status(201).json({ data: toStockVerificationConfirmation(preview, false) });
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
