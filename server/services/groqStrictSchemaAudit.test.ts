import { describe, expect, it } from 'vitest';
import { createAiOperationsAssistant, buildAiOperationsContext } from './aiOperationsAssistant';
import { createMovementIntentParser } from './groqMovementIntent';
import {
  auditGroqStrictSchema,
  compareFailedGenerationToSchema,
  parseGroqErrorDiagnostic,
  schemaKeywordDiff,
  summarizeSchemaObjects,
} from './groqStrictSchemaAudit';
import { showcaseOperationsSnapshot, PINNED_TIMESTAMP, LOT_HISTORY_QUESTION } from './aiOperationsLotHistory.harness';

async function captureSerializedSchema(
  run: (fetchImpl: typeof fetch) => Promise<unknown>,
): Promise<Record<string, unknown>> {
  let sentBody = '';
  const fetchImpl = (async (_url: unknown, init?: { body?: unknown }) => {
    sentBody = String(init?.body ?? '');
    return new Response(JSON.stringify({ error: { code: 'fixture_capture' } }), { status: 400 });
  }) as unknown as typeof fetch;
  const info = console.info;
  const warn = console.warn;
  console.info = () => undefined;
  console.warn = () => undefined;
  try {
    await run(fetchImpl);
  } catch {
    // Capture-only: the fixture 400 is expected for LOT_HISTORY.
  } finally {
    console.info = info;
    console.warn = warn;
  }
  if (!sentBody) throw new Error('No se serializó el request.');
  const payload = JSON.parse(sentBody) as {
    response_format?: { json_schema?: { schema?: Record<string, unknown> } };
  };
  const schema = payload.response_format?.json_schema?.schema;
  if (!schema) throw new Error('El payload no incluye json_schema.schema.');
  return schema;
}

describe('auditoría JSON Schema strict enviado a Groq', () => {
  it('rechaza un objeto strict con properties fuera de required', () => {
    const audit = auditGroqStrictSchema({
      type: 'object',
      additionalProperties: false,
      required: ['answer'],
      properties: { answer: { type: 'string' }, extra: { type: 'string' } },
    });
    expect(audit.allPropertiesRequired).toBe(false);
    expect(audit.objects[0]?.missingFromRequired).toEqual(['extra']);
  });

  it('omite message/failed_generation con forma de secreto', () => {
    const diagnostic = parseGroqErrorDiagnostic({
      error: {
        code: 'json_validate_failed',
        type: 'invalid_request_error',
        message: 'ok',
        failed_generation: 'gsk_not_a_real_key',
      },
    });
    expect(diagnostic.message).toBe('ok');
    expect(diagnostic.failedGeneration).toBeUndefined();
    expect(diagnostic.omittedSecretLikeFields).toEqual(['failed_generation']);
  });

  it('LOT_HISTORY serializado cumple required[] y additionalProperties:false en todos los objetos', async () => {
    const schema = await captureSerializedSchema(async (fetchImpl) => {
      const question = LOT_HISTORY_QUESTION;
      await createAiOperationsAssistant({
        apiKey: 'fixture',
        model: 'openai/gpt-oss-20b',
        timeoutMs: 100,
        fetchImpl,
      })(question, buildAiOperationsContext(question, showcaseOperationsSnapshot(), PINNED_TIMESTAMP));
    });
    const audit = auditGroqStrictSchema(schema);
    expect(audit.disallowedKeywords).toEqual([]);
    expect(audit.allPropertiesRequired).toBe(true);
    expect(audit.additionalPropertiesFalseRecursively).toBe(true);
    expect(summarizeSchemaObjects(schema)).toEqual([
      {
        path: '$',
        type: 'object',
        additionalProperties: false,
        required: ['answer', 'confidence', 'dataQuality', 'entities', 'warnings', 'evidence'],
        properties: ['answer', 'confidence', 'dataQuality', 'entities', 'warnings', 'evidence'],
        missingFromRequired: [],
        requiredMissingProperties: [],
      },
      {
        path: '$.properties.entities.items',
        type: 'object',
        additionalProperties: false,
        required: ['type', 'id', 'label'],
        properties: ['type', 'id', 'label'],
        missingFromRequired: [],
        requiredMissingProperties: [],
      },
      {
        path: '$.properties.evidence.items',
        type: 'object',
        additionalProperties: false,
        required: ['source', 'recordId', 'description'],
        properties: ['source', 'recordId', 'description'],
        missingFromRequired: [],
        requiredMissingProperties: [],
      },
    ]);
    expect(audit.undocumentedKeywords.map((item) => `${item.path}:${item.keyword}`).sort()).toEqual([
      '$.properties.entities:maxItems',
      '$.properties.evidence:maxItems',
      '$.properties.evidence:minItems',
      '$.properties.warnings:maxItems',
    ]);
  });

  it('N01 serializado también cumple required[] y additionalProperties:false', async () => {
    const schema = await captureSerializedSchema(async (fetchImpl) => {
      await createMovementIntentParser({
        apiKey: 'fixture',
        model: 'openai/gpt-oss-20b',
        timeoutMs: 100,
        fetchImpl,
      })('Mové 100 kg del lote SHOW-001 del Campo Oriente al Frigorifico A.', {
        lots: [{ code: 'SHOW-001' }],
        locations: [{ name: 'Campo Oriente' }, { name: 'Frigorifico A' }],
      });
    });
    const audit = auditGroqStrictSchema(schema);
    expect(audit.disallowedKeywords).toEqual([]);
    expect(audit.allPropertiesRequired).toBe(true);
    expect(audit.additionalPropertiesFalseRecursively).toBe(true);
    expect(summarizeSchemaObjects(schema)).toEqual([
      {
        path: '$',
        type: 'object',
        additionalProperties: false,
        required: ['action', 'remitoNumber', 'origin', 'destination', 'items'],
        properties: ['action', 'remitoNumber', 'origin', 'destination', 'items'],
        missingFromRequired: [],
        requiredMissingProperties: [],
      },
      {
        path: '$.properties.items.items',
        type: 'object',
        additionalProperties: false,
        required: ['lotCode', 'quantity', 'unit'],
        properties: ['lotCode', 'quantity', 'unit'],
        missingFromRequired: [],
        requiredMissingProperties: [],
      },
    ]);
    expect(audit.undocumentedKeywords).toEqual([
      { path: '$.properties.items', keyword: 'minItems' },
    ]);
  });

  it('diff estructural N01 vs LOT_HISTORY no inventa un required/additionalProperties roto', async () => {
    const lotHistory = await captureSerializedSchema(async (fetchImpl) => {
      const question = LOT_HISTORY_QUESTION;
      await createAiOperationsAssistant({
        apiKey: 'fixture',
        model: 'openai/gpt-oss-20b',
        timeoutMs: 100,
        fetchImpl,
      })(question, buildAiOperationsContext(question, showcaseOperationsSnapshot(), PINNED_TIMESTAMP));
    });
    const n01 = await captureSerializedSchema(async (fetchImpl) => {
      await createMovementIntentParser({
        apiKey: 'fixture',
        model: 'openai/gpt-oss-20b',
        timeoutMs: 100,
        fetchImpl,
      })('Mové 100 kg del lote SHOW-001 del Campo Oriente al Frigorifico A.', {
        lots: [{ code: 'SHOW-001' }],
        locations: [{ name: 'Campo Oriente' }, { name: 'Frigorifico A' }],
      });
    });
    const diff = schemaKeywordDiff(n01, lotHistory);
    expect(diff.onlyLeft.some((key) => key.includes('action') || key.includes('lotCode'))).toBe(true);
    expect(diff.onlyRight.some((key) => key.includes('evidence') || key.includes('dataQuality'))).toBe(true);
    expect(n01.additionalProperties).toBe(false);
    expect(lotHistory.additionalProperties).toBe(false);
  });

  it('compara failed_generation contra el schema LOT_HISTORY', async () => {
    const schema = await captureSerializedSchema(async (fetchImpl) => {
      const question = LOT_HISTORY_QUESTION;
      await createAiOperationsAssistant({
        apiKey: 'fixture',
        model: 'openai/gpt-oss-20b',
        timeoutMs: 100,
        fetchImpl,
      })(question, buildAiOperationsContext(question, showcaseOperationsSnapshot(), PINNED_TIMESTAMP));
    });
    expect(compareFailedGenerationToSchema({
      answer: 'x',
      confidence: 'high',
      extra: true,
    }, schema)).toMatchObject({
      extraRootKeys: ['extra'],
      missingRootKeys: ['dataQuality', 'entities', 'warnings', 'evidence'],
    });
  });
});
