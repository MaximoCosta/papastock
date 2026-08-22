import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import { locations } from '../../src/data/locations';
import { lots } from '../../src/data/lots';
import { movements } from '../../src/data/movements';
import { stockRecords } from '../../src/data/stock';
import {
  buildPlanillaImportFromFile,
  buildStockIntakePlan,
  fold,
  PROTECTED_DEMO_LOT_CODES,
  resolveLocationSpec,
} from './planillaImport';

function snapshot(): PapaStockSnapshot {
  return {
    locations: locations.map((item) => ({ ...item })),
    shelfUnits: [],
    shelves: [],
    lots: lots.map((item) => ({ ...item })),
    stockRecords: stockRecords.map((item) => ({ ...item })),
    movements: movements.map((item) => ({ ...item })),
    transporters: [],
    traceabilityEvents: [],
  };
}

function workbookBuffer(sheets: Record<string, unknown[][]>): Buffer {
  const workbook = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), name);
  }
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

describe('planillaImport', () => {
  it('resuelve alias operativos de frigoríficos y galpón', () => {
    expect(resolveLocationSpec('dospanca')).toMatchObject({ name: 'Dos Panca', type: 'cold_storage' });
    expect(resolveLocationSpec('galpon-galpon')).toMatchObject({ name: 'Galpón Principal', type: 'warehouse' });
    expect(fold('Frigoríficos')).toBe('frigorificos');
  });

  it('parsea ingresos de campo, omite filas vacías y no toca lotes de demo', () => {
    const buffer = workbookBuffer({
      'De campo a Frío': [
        ['Remito', 'Fecha', 'Variedad', 'Lote', 'Kgs.', 'Transporte', 'Destino', 'Bolsas', 'Observaciones / DTV'],
        [1001, new Date('2026-03-09T00:00:00Z'), 'agata', 241, 35160, 'serantes-vera', 'dospanca', 705, 'dtv 13354667-7'],
        [1003, new Date('2026-03-10T00:00:00Z'), 'spunta', 300, 10200, 'Camillo Gastón', 'galpon', 204, 'b.blanca'],
        [1004, new Date('2026-03-11T00:00:00Z'), 'innovator', 'A-204', 500, 'pampa', 'dospanca', 10, 'no debe entrar'],
        [],
        [undefined, undefined, undefined, undefined, undefined],
      ],
      'Env a Frio': [
        ['Remito', 'Fecha', 'Variedad', 'Lote', 'Categoría', 'Calibre', 'Bolsas', 'Kgs.', 'Transporte', 'Destino'],
        [805, new Date('2026-03-07T00:00:00Z'), 'agata', 224, '', 'exportacion', 568, 29120, 'alvaro arenas', 'dospanca'],
        [806, new Date('2026-03-08T00:00:00Z'), 'agata', 224, '', 'exportacion', '', '', 'cerone', 'dospanca'],
      ],
      Stocks: [
        ['Variedad', 'Lote', 'Superficie'],
        ['Agata', '37A', 13],
      ],
    });

    const plan = buildPlanillaImportFromFile(buffer, 'Planilla de movimientos 2026.xlsx', snapshot());

    expect(plan.preview.valid).toBe(true);
    expect(plan.preview.movementCount).toBe(3);
    expect(plan.preview.sample.map((row) => row.lotCode).sort()).toEqual(['224', '241', '300']);
    expect(plan.preview.sample.find((row) => row.lotCode === '241')).toMatchObject({
      originName: 'Campo',
      destinationName: 'Dos Panca',
      quantityKg: 35160,
      remito: '1001',
    });
    expect(plan.preview.sample.find((row) => row.lotCode === '300')?.destinationName).toBe('Galpón Principal');
    expect(plan.preview.existingLocations).toContain('Galpón Principal');
    expect(plan.preview.newLocations.map((item) => item.name)).toEqual(expect.arrayContaining(['Campo', 'Dos Panca', 'Planta Santa Ana']));
    expect(plan.preview.newLots.map((item) => item.code)).toEqual(expect.arrayContaining(['241', '300', '224']));
    expect(plan.preview.skippedSheets).toContain('Stocks');
    expect(plan.preview.issues.some((issue) => issue.code === 'PROTECTED_DEMO_LOT')).toBe(true);
    expect(plan.preview.issues.some((issue) => issue.code === 'MISSING_QUANTITY')).toBe(true);
    expect(PROTECTED_DEMO_LOT_CODES.has('A-204')).toBe(true);
    expect(plan.stockLotCodes).not.toContain('A-204');
  });

  it('genera referencias estables para el mismo remito con varios lotes', () => {
    const rows: unknown[][] = [
      ['Remito', 'Fecha', 'Variedad', 'Lote', 'Kgs', 'Transporte'],
      [698, new Date('2026-04-16T00:00:00Z'), 'spunta', 301, 40960, 'camillo/mario'],
      [698, new Date('2026-04-16T00:00:00Z'), 'spunta', 302, 37500, 'arenas/jaimez'],
    ];
    const buffer = workbookBuffer({ 'Ingreso Tolvas Santa Ana': rows });
    const plan = buildPlanillaImportFromFile(buffer, 'tolvas.xlsx', snapshot());
    expect(plan.preview.movementCount).toBe(2);
    expect(new Set(plan.preview.sample.map((row) => row.reference)).size).toBe(2);
    expect(plan.preview.sample.every((row) => row.originName === 'Campo' && row.destinationName === 'Planta Santa Ana')).toBe(true);

    const again = buildPlanillaImportFromFile(buffer, 'tolvas.xlsx', snapshot());
    expect(again.preview.sample.map((row) => row.reference)).toEqual(plan.preview.sample.map((row) => row.reference));
  });

  it('importa un CSV genérico con lote, kilos y destino', () => {
    const csv = Buffer.from('Remito,Fecha,Variedad,Lote,Kgs,Origen,Destino\n1001,2026-03-09,spunta,310,10200,campo,galpon\n');
    const plan = buildPlanillaImportFromFile(csv, 'movimientos.csv', snapshot());
    expect(plan.preview.valid).toBe(true);
    expect(plan.preview.movementCount).toBe(1);
    expect(plan.preview.sample[0]).toMatchObject({
      lotCode: '310',
      originName: 'Campo',
      destinationName: 'Galpón Principal',
      quantityKg: 10200,
    });
  });

  it('carga stock por formulario con los campos de la planilla y bloquea A-204', () => {
    const accepted = buildStockIntakePlan({
      lotCode: '241',
      variety: 'Agata',
      quantityKg: 35160,
      date: '2026-03-09',
      destination: 'dospanca',
      origin: 'Campo',
      remito: '1001',
      bags: 705,
      caliber: 'exportacion',
      transporter: 'serantes-vera',
      dtv: '13354667-7',
    }, snapshot());
    expect(accepted.preview.valid).toBe(true);
    expect(accepted.preview.sample[0]).toMatchObject({
      lotCode: '241',
      originName: 'Campo',
      destinationName: 'Dos Panca',
      remito: '1001',
      bags: 705,
    });

    const blocked = buildStockIntakePlan({
      lotCode: 'A-204',
      variety: 'Innovator',
      quantityKg: 1000,
      date: '2026-03-09',
      destination: 'Dos Panca',
    }, snapshot());
    expect(blocked.preview.valid).toBe(false);
    expect(blocked.preview.issues.some((issue) => issue.code === 'PROTECTED_DEMO_LOT')).toBe(true);
  });

  const operationalFile = 'C:/Users/Usser/Downloads/Planilla de movimientos 2026.xls';
  it.skipIf(!existsSync(operationalFile))('acepta la planilla operativa 2026 de Papasud', () => {
    const plan = buildPlanillaImportFromFile(readFileSync(operationalFile), 'Planilla de movimientos 2026.xls', snapshot());
    expect(plan.preview.valid).toBe(true);
    expect(plan.preview.movementCount).toBeGreaterThan(300);
    expect(plan.preview.newLots.length).toBeGreaterThan(20);
    expect(plan.stockLotCodes).not.toEqual(expect.arrayContaining(['A-204', 'A-310']));
    expect(plan.preview.sheets.some((sheet) => sheet.name.includes('campo') || sheet.name.includes('Frío') || sheet.imported > 0)).toBe(true);
  });
});
