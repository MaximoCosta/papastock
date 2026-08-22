import { createHash } from 'node:crypto';
import * as XLSX from 'xlsx';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import { locations as seedLocations } from '../../src/data/locations';
import { lots as seedLots } from '../../src/data/lots';
import { movements as seedMovements } from '../../src/data/movements';
import { stockRecords as seedStockRecords } from '../../src/data/stock';
import type {
  Location,
  LocationType,
  Lot,
  Movement,
  PlanillaImportIssue,
  PlanillaImportPreview,
  PlanillaImportResult,
  PlanillaImportRow,
  PlanillaMovementKind,
  StockIntakeInput,
  StockRecord,
} from '../../src/types/domain';

export const PROTECTED_DEMO_LOT_CODES = new Set(['A-204', 'A-310', 'C-102', 'F-301']);

const SAMPLE_SIZE = 25;
const MAX_ISSUES = 80;

type SheetKind = 'campo-frio' | 'tolvas' | 'env-frio' | 'ret-frio' | 'pchica' | 'trevelin' | 'entregas' | 'generic';

interface LocationSpec {
  name: string;
  type: LocationType;
}

export interface PlanillaImportPlan {
  preview: PlanillaImportPreview;
  locationsToCreate: Array<{ id: string; name: string; type: LocationType }>;
  lotsToCreate: Array<{
    id: string;
    code: string;
    variety: string;
    campaign: string;
    producer: string;
    origin: string;
    harvestDate?: string;
  }>;
  movementsToInsert: Array<{
    id: string;
    reference: string;
    lotCode: string;
    originName: string;
    destinationName: string;
    quantityKg: number;
    date: string;
    data: Record<string, unknown>;
  }>;
  stockLotCodes: string[];
}

const LOCATION_ALIASES: Record<string, LocationSpec> = {
  dospanca: { name: 'Dos Panca', type: 'cold_storage' },
  'dos panca': { name: 'Dos Panca', type: 'cold_storage' },
  'dos pancas': { name: 'Dos Panca', type: 'cold_storage' },
  galpon: { name: 'Galpón Principal', type: 'warehouse' },
  'galpon principal': { name: 'Galpón Principal', type: 'warehouse' },
  'galpon galpon': { name: 'Galpón Principal', type: 'warehouse' },
  'galpon mar del plata': { name: 'Galpón Principal', type: 'warehouse' },
  'galpon mdp': { name: 'Galpón Principal', type: 'warehouse' },
  'santa ana': { name: 'Planta Santa Ana', type: 'warehouse' },
  'planta santa ana': { name: 'Planta Santa Ana', type: 'warehouse' },
  planta: { name: 'Planta Santa Ana', type: 'warehouse' },
  'en planta': { name: 'Planta Santa Ana', type: 'warehouse' },
  papasud: { name: 'Planta Santa Ana', type: 'warehouse' },
  campo: { name: 'Campo', type: 'warehouse' },
  chacra: { name: 'Campo', type: 'warehouse' },
  'chacra santa ana': { name: 'Campo', type: 'warehouse' },
  trevelin: { name: 'Trevelin', type: 'warehouse' },
  'campo trevelin': { name: 'Campo Trevelin', type: 'warehouse' },
  belmonte: { name: 'Belmonte', type: 'cold_storage' },
  cecive: { name: 'Cecive', type: 'cold_storage' },
  sasula: { name: 'Sasula Balcarce', type: 'cold_storage' },
  'sasula balcarce': { name: 'Sasula Balcarce', type: 'cold_storage' },
  frigopap: { name: 'Frigopap', type: 'cold_storage' },
  pancani: { name: 'Pancani', type: 'cold_storage' },
  teramal: { name: 'Teramal', type: 'cold_storage' },
};

const SKIP_SHEETS = new Set([
  'stocks',
  'dj panc',
  'sp',
  'transportes',
  'frigorificos',
]);

export function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function slug(value: string): string {
  const folded = fold(value).replace(/\s+/g, '-');
  return folded.slice(0, 48) || 'x';
}

function titleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|[\s(/-])\S/g, (chunk) => chunk.toUpperCase());
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cellText(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toIsoDate(value);
  }
  if (isPlainObject(value) && typeof value.text === 'string') return value.text.trim();
  return String(value).trim();
}

function toIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function excelSerialToDate(serial: number): Date | undefined {
  if (!Number.isFinite(serial) || serial < 20000 || serial > 80000) return undefined;
  const utc = Date.UTC(1899, 11, 30) + Math.round(serial) * 86_400_000;
  return new Date(utc);
}

function parseDate(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return toIsoDate(value);
  if (typeof value === 'number') {
    const fromSerial = excelSerialToDate(value);
    return fromSerial ? toIsoDate(fromSerial) : undefined;
  }
  const text = cellText(value);
  if (!text) return undefined;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${year}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  const asNumber = Number(text.replace(',', '.'));
  if (Number.isFinite(asNumber)) {
    const fromSerial = excelSerialToDate(asNumber);
    return fromSerial ? toIsoDate(fromSerial) : undefined;
  }
  return undefined;
}

function parseQuantity(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.round(value * 1000) / 1000;
  const text = cellText(value).replace(/\s+/g, ' ');
  if (!text) return undefined;
  const match = text.replace(/kg\.?/i, '').trim();
  const normalized = match.includes(',') && !match.includes('.')
    ? match.replace(',', '.')
    : match.replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.round(parsed * 1000) / 1000;
}

function parseLotCode(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value).replace('.', '-');
  }
  const text = cellText(value).replace(/\s+/g, ' ');
  if (!text) return undefined;
  if (/^(lote|n\/?a|-)$/i.test(text)) return undefined;
  return text.toUpperCase();
}

function parseRemito(value: unknown): string | undefined {
  const text = cellText(value);
  if (!text) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : text;
  }
  return text.toUpperCase();
}

function identifySheet(name: string): SheetKind | 'skip' | undefined {
  const key = fold(name);
  if (SKIP_SHEETS.has(key) || key.startsWith('dj ')) return 'skip';
  if (key === 'de campo a frio') return 'campo-frio';
  if (key === 'ingreso tolvas santa ana') return 'tolvas';
  if (key === 'env a frio') return 'env-frio';
  if (key === 'ret frio') return 'ret-frio';
  if (key === 'p chica' || key === 'pchica') return 'pchica';
  if (key.startsWith('ingreso trevelin')) return 'trevelin';
  if (key.startsWith('entregas a clientes')) return 'entregas';
  return undefined;
}

function findHeaderRow(rows: unknown[][]): number {
  const limit = Math.min(rows.length, 12);
  for (let index = 0; index < limit; index += 1) {
    const folded = (rows[index] ?? []).map((cell) => fold(cellText(cell)));
    const hasLote = folded.some((cell) => cell === 'lote');
    const hasFecha = folded.some((cell) => cell === 'fecha');
    const hasQty = folded.some((cell) => cell === 'kgs' || cell === 'kg' || cell === 'kilos');
    if (hasLote && (hasFecha || hasQty)) return index;
  }
  return -1;
}

function columnIndex(headers: string[], aliases: string[]): number {
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

function quantityColumn(headers: string[]): number {
  const exact = headers.findIndex((header) => header === 'kgs' || header === 'kg' || header === 'kilos');
  if (exact >= 0) return exact;
  return headers.findIndex((header) => (header === 'kgs' || header.startsWith('kgs ') || header === 'kg') && !header.includes('prom'));
}

function inferLocationType(name: string): LocationType {
  const key = fold(name);
  if (/(frigorifico|frio|frigopap|dospanca|belmonte|cecive|sasula|pancani|teramal)/.test(key)) {
    return 'cold_storage';
  }
  return 'warehouse';
}

export function resolveLocationSpec(raw: string): LocationSpec | undefined {
  const key = fold(raw);
  if (!key) return undefined;
  if (LOCATION_ALIASES[key]) return LOCATION_ALIASES[key];
  for (const [alias, spec] of Object.entries(LOCATION_ALIASES)) {
    if (key.includes(alias) && alias.length >= 5) return spec;
  }
  return { name: titleCase(raw), type: inferLocationType(raw) };
}

function defaultOrigin(kind: SheetKind): string {
  if (kind === 'trevelin') return 'Campo Trevelin';
  if (kind === 'ret-frio') return '';
  if (kind === 'entregas') return 'Planta Santa Ana';
  if (kind === 'env-frio') return 'Planta Santa Ana';
  if (kind === 'tolvas') return 'Campo';
  if (kind === 'campo-frio') return 'Campo';
  if (kind === 'pchica') return 'Campo';
  return 'Campo';
}

function defaultDestination(kind: SheetKind): string {
  if (kind === 'tolvas') return 'Planta Santa Ana';
  if (kind === 'trevelin') return 'Trevelin';
  if (kind === 'ret-frio') return 'Planta Santa Ana';
  if (kind === 'generic') return 'Galpón Principal';
  return '';
}

function movementKind(kind: SheetKind): PlanillaMovementKind {
  if (kind === 'env-frio') return 'transfer';
  if (kind === 'ret-frio' || kind === 'entregas') return 'outbound';
  return 'inbound';
}

function originFromNotes(notes: string, fallback: string): string {
  const key = fold(notes);
  if (!key) return fallback;
  const hit = resolveLocationSpec(notes);
  if (hit && LOCATION_ALIASES[fold(hit.name)]) return hit.name;
  for (const [alias, spec] of Object.entries(LOCATION_ALIASES)) {
    if (key.includes(alias) && alias.length >= 5) return spec.name;
  }
  return fallback;
}

function parseClient(value: unknown): string | undefined {
  const text = cellText(value);
  if (!text || /kg/i.test(text) || /^\d/.test(text)) return undefined;
  return text;
}

function cellAt(row: unknown[], index: number): unknown {
  return index >= 0 ? row[index] : undefined;
}

function stableId(prefix: string, value: string): string {
  const digest = createHash('sha256').update(value).digest('hex').slice(0, 20);
  return `${prefix}-${digest}`.slice(0, 80);
}

function movementData(row: PlanillaImportRow): Record<string, unknown> {
  const data: Record<string, unknown> = {
    source: 'planilla',
    sheet: row.sheet,
    kind: row.kind,
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

interface RawParse {
  fileName: string;
  rows: PlanillaImportRow[];
  issues: PlanillaImportIssue[];
  sheets: PlanillaImportPreview['sheets'];
  skippedSheets: string[];
}

function parseWorkbook(buffer: Buffer, fileName: string): RawParse {
  const isCsv = /\.csv$/i.test(fileName);
  const workbook = isCsv
    ? XLSX.read(buffer.toString('utf8').replace(/^\uFEFF/, ''), { type: 'string', raw: true, cellDates: true })
    : XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: true });
  const issues: PlanillaImportIssue[] = [];
  const rows: PlanillaImportRow[] = [];
  const sheets: PlanillaImportPreview['sheets'] = [];
  const skippedSheets: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const identified = identifySheet(sheetName);
    if (identified === 'skip') {
      skippedSheets.push(sheetName);
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: '',
      blankrows: false,
    });
    const headerRow = findHeaderRow(matrix);
    const kind: SheetKind | undefined = identified ?? (headerRow >= 0 ? 'generic' : undefined);
    if (!kind) {
      skippedSheets.push(sheetName);
      continue;
    }
    if (headerRow < 0) {
      issues.push({
        sheet: sheetName,
        rowNumber: 1,
        code: 'MISSING_HEADERS',
        message: `No se reconocieron columnas en “${sheetName}”.`,
      });
      sheets.push({ name: sheetName, imported: 0, skipped: 0 });
      continue;
    }

    const headers = (matrix[headerRow] ?? []).map((cell) => fold(cellText(cell)));
    const cols = {
      remito: columnIndex(headers, ['remito', 'rto', 'nro']),
      fecha: columnIndex(headers, ['fecha']),
      variedad: columnIndex(headers, ['variedad']),
      lote: columnIndex(headers, ['lote']),
      kg: quantityColumn(headers),
      transporte: columnIndex(headers, ['transporte', 'camion']),
      destino: columnIndex(headers, ['destino']),
      origen: columnIndex(headers, ['origen', 'almacen']),
      bolsas: columnIndex(headers, ['bolsas']),
      observaciones: columnIndex(headers, ['observaciones', 'observciones']),
      calibre: columnIndex(headers, ['calibre']),
      categoria: columnIndex(headers, ['categoria']),
      cliente: columnIndex(headers, ['cliente']),
      dtv: columnIndex(headers, ['numero dtvs', 'dtv', 'valor flete dtv']),
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
        issues.push({ sheet: sheetName, rowNumber, code: 'MISSING_LOT', message: 'Falta el lote.' });
        continue;
      }
      if (quantityKg == null) {
        skipped += 1;
        issues.push({ sheet: sheetName, rowNumber, code: 'MISSING_QUANTITY', message: `El lote ${lotCode} no tiene kilos.` });
        continue;
      }
      const date = parseDate(cellAt(row, cols.fecha));
      if (!date) {
        skipped += 1;
        issues.push({ sheet: sheetName, rowNumber, code: 'MISSING_DATE', message: `El lote ${lotCode} no tiene fecha.` });
        continue;
      }
      if (PROTECTED_DEMO_LOT_CODES.has(lotCode)) {
        skipped += 1;
        issues.push({
          sheet: sheetName,
          rowNumber,
          code: 'PROTECTED_DEMO_LOT',
          message: `El lote ${lotCode} es de demo (N02/N03) y no se importa.`,
        });
        continue;
      }

      const variety = varietyRaw ? titleCase(varietyRaw) : (kind === 'pchica' ? 'Papa chica' : 'Sin especificar');
      const originName = resolveLocationSpec(
        originRaw || originFromNotes(notes, defaultOrigin(kind)) || defaultOrigin(kind),
      )?.name;
      const destinationName = resolveLocationSpec(
        destRaw || defaultDestination(kind),
      )?.name;

      if (!originName || !destinationName) {
        skipped += 1;
        issues.push({
          sheet: sheetName,
          rowNumber,
          code: 'MISSING_LOCATION',
          message: `El lote ${lotCode} no tiene origen o destino.`,
        });
        continue;
      }
      if (fold(originName) === fold(destinationName)) {
        skipped += 1;
        issues.push({
          sheet: sheetName,
          rowNumber,
          code: 'SAME_LOCATION',
          message: `Origen y destino coinciden (${originName}) en el lote ${lotCode}.`,
        });
        continue;
      }

      const bags = parseQuantity(cellAt(row, cols.bolsas));
      const referenceSeed = [kind, date, remito ?? 'sremito', lotCode, quantityKg, originName, destinationName, rowNumber].join('|');
      const parsed: PlanillaImportRow = {
        sheet: sheetName,
        rowNumber,
        remito,
        date,
        lotCode,
        variety,
        quantityKg,
        originName,
        destinationName,
        transporter: cellText(cellAt(row, cols.transporte)) || undefined,
        bags: bags && bags < 100_000 ? bags : undefined,
        caliber: cellText(cellAt(row, cols.calibre)) || undefined,
        category: cellText(cellAt(row, cols.categoria)) || undefined,
        notes: notes || undefined,
        dtv: cellText(cellAt(row, cols.dtv)) || undefined,
        client: kind === 'entregas'
          ? (destRaw || undefined)
          : parseClient(cellAt(row, cols.cliente)),
        kind: movementKind(kind),
        reference: `IMP-${createHash('sha256').update(referenceSeed).digest('hex').slice(0, 16).toUpperCase()}`,
      };
      rows.push(parsed);
      imported += 1;
    }

    sheets.push({ name: sheetName, imported, skipped });
  }

  return { fileName, rows, issues: issues.slice(0, MAX_ISSUES), sheets, skippedSheets };
}

function matchLocation(name: string, locations: Location[]): Location | undefined {
  const key = fold(name);
  return locations.find((item) => fold(item.name) === key || fold(item.id) === key);
}

function matchLot(code: string, lots: Lot[]): Lot | undefined {
  const key = fold(code);
  return lots.find((item) => fold(item.code) === key);
}

export function parsePlanillaBuffer(buffer: Buffer, fileName: string): RawParse {
  if (!buffer.length) {
    throw Object.assign(new Error('El archivo está vacío.'), { status: 400 });
  }
  if (!/\.(xlsx|xls|csv)$/i.test(fileName)) {
    throw Object.assign(new Error('El archivo debe ser .csv, .xls o .xlsx.'), { status: 400 });
  }
  try {
    return parseWorkbook(buffer, fileName);
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error) throw error;
    throw Object.assign(new Error('No se pudo leer la planilla de movimientos.'), { status: 400 });
  }
}

export function buildPlanillaImportPlan(parsed: RawParse, snapshot: PapaStockSnapshot): PlanillaImportPlan {
  const locationNames = new Map<string, LocationSpec>();
  const lotsByCode = new Map<string, { code: string; variety: string; origin: string; harvestDate: string }>();

  for (const row of parsed.rows) {
    const origin = resolveLocationSpec(row.originName);
    const destination = resolveLocationSpec(row.destinationName);
    if (origin) locationNames.set(fold(origin.name), origin);
    if (destination) locationNames.set(fold(destination.name), destination);

    const current = lotsByCode.get(fold(row.lotCode));
    if (!current || row.date < current.harvestDate) {
      lotsByCode.set(fold(row.lotCode), {
        code: row.lotCode,
        variety: current?.variety && current.variety !== 'Sin especificar' ? current.variety : row.variety,
        origin: /trevelin/i.test(row.sheet) ? 'Trevelin, Chubut, Argentina' : 'Balcarce, Buenos Aires, Argentina',
        harvestDate: row.date,
      });
    }
  }

  const newLocations: PlanillaImportPlan['locationsToCreate'] = [];
  const existingLocations: string[] = [];
  for (const spec of locationNames.values()) {
    const found = matchLocation(spec.name, snapshot.locations);
    if (found) {
      existingLocations.push(found.name);
    } else {
      newLocations.push({ id: `loc-imp-${slug(spec.name)}`.slice(0, 80), name: spec.name, type: spec.type });
    }
  }

  const newLots: PlanillaImportPlan['lotsToCreate'] = [];
  const existingLots: string[] = [];
  for (const lot of lotsByCode.values()) {
    const found = matchLot(lot.code, snapshot.lots);
    if (found) {
      existingLots.push(found.code);
    } else {
      newLots.push({
        id: `lot-imp-${slug(lot.code)}`.slice(0, 80),
        code: lot.code,
        variety: lot.variety,
        campaign: '2026',
        producer: 'Papasud',
        origin: lot.origin,
        harvestDate: lot.harvestDate,
      });
    }
  }

  const movementsToInsert = parsed.rows.map((row) => ({
    id: stableId('mov-imp', row.reference),
    reference: row.reference,
    lotCode: row.lotCode,
    originName: row.originName,
    destinationName: row.destinationName,
    quantityKg: row.quantityKg,
    date: row.date,
    data: movementData(row),
  }));

  const preview: PlanillaImportPreview = {
    fileName: parsed.fileName,
    movementCount: parsed.rows.length,
    totalKg: Math.round(parsed.rows.reduce((sum, row) => sum + row.quantityKg, 0) * 1000) / 1000,
    sample: parsed.rows.slice(0, SAMPLE_SIZE),
    sheets: parsed.sheets,
    skippedSheets: parsed.skippedSheets,
    issues: parsed.issues,
    newLocations: newLocations.map(({ name, type }) => ({ name, type })),
    newLots: newLots.map(({ code, variety }) => ({ code, variety })),
    existingLocations,
    existingLots,
    valid: parsed.rows.length > 0,
  };

  return {
    preview,
    locationsToCreate: newLocations,
    lotsToCreate: newLots,
    movementsToInsert,
    stockLotCodes: [...new Set(parsed.rows.map((row) => row.lotCode))],
  };
}

export function buildPlanillaImportFromFile(
  buffer: Buffer,
  fileName: string,
  snapshot: PapaStockSnapshot,
): PlanillaImportPlan {
  return buildPlanillaImportPlan(parsePlanillaBuffer(buffer, fileName), snapshot);
}

export function demoSnapshot(): PapaStockSnapshot {
  return {
    locations: seedLocations.map((item) => ({ ...item })),
    shelfUnits: [],
    shelves: [],
    lots: seedLots.map((item) => ({ ...item })),
    stockRecords: seedStockRecords.map((item) => ({ ...item })),
    movements: seedMovements.map((item) => ({ ...item })),
    transporters: [],
    traceabilityEvents: [],
  };
}

export function materializePlanillaImport(
  plan: PlanillaImportPlan,
  snapshot: PapaStockSnapshot,
): { result: PlanillaImportResult; applied: PapaStockSnapshot } {
  const locations = snapshot.locations.map((item) => ({ ...item }));
  let createdLocations = 0;
  for (const location of plan.locationsToCreate) {
    if (locations.some((item) => fold(item.name) === fold(location.name))) continue;
    locations.push({ id: location.id, name: location.name, type: location.type });
    createdLocations += 1;
  }

  const lots = snapshot.lots.map((item) => ({ ...item }));
  let createdLots = 0;
  for (const lot of plan.lotsToCreate) {
    if (PROTECTED_DEMO_LOT_CODES.has(lot.code)) continue;
    if (lots.some((item) => fold(item.code) === fold(lot.code))) continue;
    lots.push({
      id: lot.id,
      code: lot.code,
      variety: lot.variety,
      campaign: lot.campaign,
      producer: lot.producer,
      origin: lot.origin,
      harvestDate: lot.harvestDate,
    });
    createdLots += 1;
  }

  const locationIdByName = new Map(locations.map((item) => [fold(item.name), item.id]));
  const lotByCode = new Map(lots.map((item) => [item.code.toLowerCase(), item]));
  const movements = snapshot.movements.map((item) => ({ ...item }));
  const existingRefs = new Set(movements.map((item) => item.reference));
  let createdMovements = 0;
  let skippedMovements = 0;

  for (const movement of plan.movementsToInsert) {
    const lot = lotByCode.get(movement.lotCode.toLowerCase());
    const originId = locationIdByName.get(fold(movement.originName));
    const destinationId = locationIdByName.get(fold(movement.destinationName));
    if (!lot || PROTECTED_DEMO_LOT_CODES.has(lot.code) || !originId || !destinationId || originId === destinationId) {
      skippedMovements += 1;
      continue;
    }
    if (existingRefs.has(movement.reference)) {
      skippedMovements += 1;
      continue;
    }
    const next: Movement = {
      id: movement.id,
      reference: movement.reference,
      lotId: lot.id,
      originLocationId: originId,
      destinationLocationId: destinationId,
      quantity: movement.quantityKg,
      date: movement.date,
      status: 'completed',
      data: movement.data,
    };
    movements.unshift(next);
    existingRefs.add(movement.reference);
    createdMovements += 1;
  }

  const importedLotIds = new Set<string>();
  for (const code of plan.stockLotCodes) {
    const lot = lotByCode.get(code.toLowerCase());
    if (lot && !PROTECTED_DEMO_LOT_CODES.has(lot.code)) importedLotIds.add(lot.id);
  }

  const stockRecords = snapshot.stockRecords
    .filter((record) => !importedLotIds.has(record.lotId))
    .map((item) => ({ ...item }));
  let upsertedStockRecords = 0;
  const now = new Date().toISOString();

  for (const lotId of importedLotIds) {
    const net = new Map<string, number>();
    for (const movement of movements) {
      if (movement.lotId !== lotId || movement.status === 'cancelled') continue;
      if (movement.originLocationId) {
        net.set(movement.originLocationId, (net.get(movement.originLocationId) ?? 0) - movement.quantity);
      }
      if (movement.destinationLocationId) {
        net.set(movement.destinationLocationId, (net.get(movement.destinationLocationId) ?? 0) + movement.quantity);
      }
    }
    for (const [locationId, raw] of net) {
      const quantity = Math.max(0, Math.round(raw * 1000) / 1000);
      if (quantity <= 0) continue;
      stockRecords.push({
        id: stableId('stock-imp', `${lotId}|${locationId}`),
        lotId,
        locationId,
        declaredQuantity: quantity,
        verifiedQuantity: quantity,
        verificationPending: false,
        updatedAt: now,
      } satisfies StockRecord);
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
      persisted: false,
    },
    applied: {
      ...snapshot,
      locations,
      lots,
      stockRecords,
      movements,
    },
  };
}

export function buildStockIntakePlan(input: StockIntakeInput, snapshot: PapaStockSnapshot): PlanillaImportPlan {
  const lotCode = input.lotCode.trim().toUpperCase();
  const variety = input.variety.trim();
  const destinationRaw = input.destination.trim();
  const originRaw = input.origin?.trim() || 'Campo';

  const issues: PlanillaImportIssue[] = [];
  if (!lotCode) issues.push({ sheet: 'Carga de stock', rowNumber: 1, code: 'MISSING_LOT', message: 'Falta el lote.' });
  if (!variety) issues.push({ sheet: 'Carga de stock', rowNumber: 1, code: 'MISSING_VARIETY', message: 'Falta la variedad.' });
  if (!Number.isFinite(input.quantityKg) || input.quantityKg <= 0) {
    issues.push({ sheet: 'Carga de stock', rowNumber: 1, code: 'MISSING_QUANTITY', message: 'Los kilos deben ser mayores a cero.' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    issues.push({ sheet: 'Carga de stock', rowNumber: 1, code: 'MISSING_DATE', message: 'La fecha debe ser AAAA-MM-DD.' });
  }
  if (!destinationRaw) issues.push({ sheet: 'Carga de stock', rowNumber: 1, code: 'MISSING_LOCATION', message: 'Falta el destino.' });
  if (PROTECTED_DEMO_LOT_CODES.has(lotCode)) {
    issues.push({
      sheet: 'Carga de stock',
      rowNumber: 1,
      code: 'PROTECTED_DEMO_LOT',
      message: `El lote ${lotCode} es de demo (N02/N03) y no se puede cargar por este formulario.`,
    });
  }

  const originName = resolveLocationSpec(originRaw)?.name;
  const destinationName = resolveLocationSpec(destinationRaw)?.name;
  if (originName && destinationName && fold(originName) === fold(destinationName)) {
    issues.push({
      sheet: 'Carga de stock',
      rowNumber: 1,
      code: 'SAME_LOCATION',
      message: 'El origen y el destino deben ser distintos.',
    });
  }

  if (issues.length > 0 || !originName || !destinationName) {
    return buildPlanillaImportPlan({
      fileName: 'carga-stock',
      rows: [],
      issues,
      sheets: [{ name: 'Carga de stock', imported: 0, skipped: 1 }],
      skippedSheets: [],
    }, snapshot);
  }

  const remito = input.remito?.trim().toUpperCase();
  const row: PlanillaImportRow = {
    sheet: 'Carga de stock',
    rowNumber: 1,
    remito: remito || undefined,
    date: input.date,
    lotCode,
    variety,
    quantityKg: input.quantityKg,
    originName,
    destinationName,
    transporter: input.transporter?.trim() || undefined,
    bags: input.bags,
    caliber: input.caliber?.trim() || undefined,
    category: input.category?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    dtv: input.dtv?.trim() || undefined,
    client: input.client?.trim() || undefined,
    bagColor: input.bagColor?.trim() || undefined,
    threadColor: input.threadColor?.trim() || undefined,
    averageKg: input.averageKg,
    kind: 'inbound',
    reference: `IMP-${createHash('sha256').update(['intake', input.date, remito ?? 'sremito', lotCode, input.quantityKg, originName, destinationName].join('|')).digest('hex').slice(0, 16).toUpperCase()}`,
  };

  const plan = buildPlanillaImportPlan({
    fileName: 'carga-stock',
    rows: [row],
    issues: [],
    sheets: [{ name: 'Carga de stock', imported: 1, skipped: 0 }],
    skippedSheets: [],
  }, snapshot);

  const campaign = input.campaign?.trim() || '2026';
  const producer = input.producer?.trim() || 'Papasud';
  for (const lot of plan.lotsToCreate) {
    lot.campaign = campaign;
    lot.producer = producer;
  }
  return plan;
}
