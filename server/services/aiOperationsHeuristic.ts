import { formatQuantity } from '../../src/lib/quantity';
import type { OperationsAssistantAnswer } from '../../src/types/operationsAssistant';
import type { AiOperationsContext } from './aiOperationsContext';
import { buildCanonicalLotStockAnswer } from './aiOperationsFacts';

const HEURISTIC_WARNING = 'Respuesta heurística: Groq no estuvo disponible. Los datos salen del snapshot PostgreSQL y no se modificó stock.';

function entitiesFrom(context: AiOperationsContext): OperationsAssistantAnswer['entities'] {
  return [
    ...context.lots.slice(0, 15).map((lot) => ({ type: 'lot' as const, id: lot.id, label: lot.code })),
    ...context.locations.slice(0, 10).map((location) => ({ type: 'location' as const, id: location.id, label: location.name })),
    ...context.movements.slice(0, 5).map((movement) => ({ type: 'movement' as const, id: movement.id, label: movement.reference })),
  ].slice(0, 30);
}

function withHeuristicMeta(answer: OperationsAssistantAnswer): OperationsAssistantAnswer {
  return {
    ...answer,
    engine: 'heuristic',
    warnings: answer.warnings.includes(HEURISTIC_WARNING)
      ? answer.warnings
      : [...answer.warnings, HEURISTIC_WARNING],
  };
}

export function buildHeuristicOperationsAnswer(context: AiOperationsContext): OperationsAssistantAnswer {
  if (context.intent === 'LOT_STOCK') {
    return withHeuristicMeta(buildCanonicalLotStockAnswer(context));
  }

  if (context.intent === 'PENDING_VERIFICATION') {
    if (context.stockRecords.length === 0) {
      return withHeuristicMeta({
        answer: 'No hay lotes con verificación pendiente en el snapshot actual.',
        confidence: 'high',
        dataQuality: 'operational_only',
        entities: [],
        warnings: [],
        evidence: [{ source: 'stock_records', recordId: null, recordLabel: null, description: 'Ningún registro tiene verificationPending.' }],
      });
    }
    const lines = context.stockRecords.map((record) => {
      const lot = context.lots.find((item) => item.id === record.lotId);
      const location = context.locations.find((item) => item.id === record.locationId);
      return `${lot?.code ?? record.lotId} en ${location?.name ?? record.locationId}: ${formatQuantity(record.declaredQuantity, record.unit)} declarados.`;
    });
    return withHeuristicMeta({
      answer: `Hay ${context.stockRecords.length} registro${context.stockRecords.length === 1 ? '' : 's'} con verificación pendiente. ${lines.join(' ')}`,
      confidence: 'high',
      dataQuality: 'operational_only',
      entities: entitiesFrom(context),
      warnings: [],
      evidence: context.stockRecords.slice(0, 30).map((record) => ({
        source: 'stock_records' as const,
        recordId: record.id,
        recordLabel: null,
        description: `${record.id} pendiente de verificación.`,
      })),
    });
  }

  if (context.intent === 'PENDING_RECEPTION') {
    if (context.movements.length === 0) {
      return withHeuristicMeta({
        answer: 'No hay movimientos pendientes de recepción en el snapshot actual.',
        confidence: 'high',
        dataQuality: 'operational_only',
        entities: [],
        warnings: [],
        evidence: [{ source: 'ledger', recordId: null, recordLabel: null, description: 'Ningún movimiento está pending o needs_reconciliation.' }],
      });
    }
    const lines = context.movements.map((movement) => `${movement.reference} (${movement.receptionStatus}).`);
    return withHeuristicMeta({
      answer: `Hay ${context.movements.length} movimiento${context.movements.length === 1 ? '' : 's'} pendiente${context.movements.length === 1 ? '' : 's'} de recepción: ${lines.join(' ')}`,
      confidence: 'high',
      dataQuality: 'operational_only',
      entities: entitiesFrom(context),
      warnings: [],
      evidence: context.movements.slice(0, 30).map((movement) => ({
        source: 'movements' as const,
        recordId: movement.id,
        recordLabel: movement.reference,
        description: `${movement.reference} · ${movement.receptionStatus}.`,
      })),
    });
  }

  if (context.intent === 'LOT_LOCATION') {
    if (context.stockRecords.length === 0) {
      return withHeuristicMeta({
        answer: 'No hay stock persistido para el lote consultado; no se interpreta esa ausencia como ubicación cero.',
        confidence: 'high',
        dataQuality: 'incomplete',
        entities: entitiesFrom(context),
        warnings: [],
        evidence: [{ source: 'stock_records', recordId: null, recordLabel: null, description: 'Sin coordenadas de stock para el lote.' }],
      });
    }
    const lines = context.stockRecords.map((record) => {
      const lot = context.lots.find((item) => item.id === record.lotId);
      const location = context.locations.find((item) => item.id === record.locationId);
      return `${lot?.code ?? record.lotId} está en ${location?.name ?? record.locationId} con ${formatQuantity(record.declaredQuantity, record.unit)} declarados.`;
    });
    return withHeuristicMeta({
      answer: lines.join(' '),
      confidence: 'high',
      dataQuality: context.ledger.ledgerAuthority ? 'authoritative' : 'operational_only',
      entities: entitiesFrom(context),
      warnings: [],
      evidence: context.stockRecords.slice(0, 30).map((record) => ({
        source: 'stock_records' as const,
        recordId: record.id,
        recordLabel: null,
        description: `${record.id} en ${record.locationId}.`,
      })),
    });
  }

  if (context.intent === 'LEDGER_AUTHORITY') {
    return withHeuristicMeta({
      answer: context.ledger.ledgerAuthority
        ? 'El ledger reconstruido es autoritativo para el recorte consultado.'
        : `El ledger todavía no es autoritativo. Hay ${context.ledger.blockingIssues} problema${context.ledger.blockingIssues === 1 ? '' : 's'} de bloqueo. El stock operativo persistido sigue siendo la referencia.`,
      confidence: 'high',
      dataQuality: context.ledger.ledgerAuthority ? 'authoritative' : 'operational_only',
      entities: [],
      warnings: context.ledger.ledgerAuthority ? [] : ['El stock operativo persistido es la referencia actual; el historial de movimientos todavía no reconstruye todos los saldos.'],
      evidence: [{
        source: 'ledger',
        recordId: null,
        recordLabel: null,
        description: context.ledger.ledgerAuthority
          ? 'ledgerAuthority=true en el recorte actual.'
          : `ledgerAuthority=false · blockingIssues=${context.ledger.blockingIssues}.`,
      }],
    });
  }

  if (context.intent === 'LOT_HISTORY' && context.derivedFacts) {
    const facts = context.derivedFacts.stock;
    const movements = context.movements.slice(0, 8).map((movement) => movement.reference).join(', ');
    const stockLine = facts.length
      ? facts.map((fact) => `${fact.lotCode}: ${formatQuantity(fact.declared, fact.unit)} declarados`).join('. ')
      : 'Sin stock proyectado para el lote.';
    return withHeuristicMeta({
      answer: `${stockLine} Movimientos en el recorte: ${movements || 'ninguno'}. El asistente no afirma causalidad entre movimientos y discrepancias.`,
      confidence: 'medium',
      dataQuality: context.ledger.ledgerAuthority ? 'authoritative' : 'operational_only',
      entities: entitiesFrom(context),
      warnings: ['El stock operativo persistido es la referencia actual; el historial de movimientos todavía no reconstruye todos los saldos.'],
      evidence: [
        ...context.stockRecords.slice(0, 8).map((record) => ({
          source: 'stock_records' as const,
          recordId: record.id,
          recordLabel: null,
          description: `${record.id}: ${formatQuantity(record.declaredQuantity, record.unit)} declarados.`,
        })),
        ...context.movements.slice(0, 8).map((movement) => ({
          source: 'movements' as const,
          recordId: movement.id,
          recordLabel: movement.reference,
          description: `${movement.reference} · ${movement.kind} · ${movement.status}.`,
        })),
      ].slice(0, 30),
    });
  }

  const pending = context.summary.pendingVerification;
  const reception = context.summary.pendingReception;
  return withHeuristicMeta({
    answer: `Snapshot operativo: ${context.summary.totalLots} lotes, ${context.summary.totalLocations} ubicaciones, ${context.summary.totalStockRecords} registros de stock y ${context.summary.totalMovements} movimientos. Verificaciones pendientes: ${pending}. Recepciones pendientes: ${reception}.`,
    confidence: 'medium',
    dataQuality: context.ledger.ledgerAuthority ? 'authoritative' : 'operational_only',
    entities: entitiesFrom(context),
    warnings: [],
    evidence: [{
      source: 'stock_records',
      recordId: null,
      recordLabel: null,
      description: `${context.summary.totalStockRecords} registros de stock en el recorte.`,
    }],
  });
}
