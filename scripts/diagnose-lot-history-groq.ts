import { operationsAnswerSchema } from '../server/services/aiOperationsAssistant';
import {
  OPERATIONS_MODEL,
  captureLotHistoryStructuredRequest,
  safeRequestMeta,
} from '../server/services/aiOperationsLotHistory.harness';
import { createMovementIntentParser } from '../server/services/groqMovementIntent';
import {
  auditGroqStrictSchema,
  compareFailedGenerationToSchema,
  parseGroqErrorDiagnostic,
  schemaKeywordDiff,
  summarizeSchemaObjects,
} from '../server/services/groqStrictSchemaAudit';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DIAGNOSTIC_120B = 'openai/gpt-oss-120b';
const MAX_A_REPEATS = 3;

type SafeGroqResult = {
  label: string;
  status: number;
  code?: string;
  type?: string;
  message?: string;
  failedGeneration?: string;
  failedGenerationParsed?: unknown;
  failedGenerationVsSchema?: Record<string, unknown>;
  omittedSecretLikeFields?: string[];
  requestId?: string;
  model?: string;
  requestBytes: number;
  durationMs: number;
  remainingRequests?: string | null;
  remainingTokens?: string | null;
};

function wantsLiveGroq(): boolean {
  return process.argv.includes('--run');
}

function apiKey(): string {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) {
    console.error('GROQ_API_KEY ausente. Schema audit local listo; tests A-D no ejecutados.');
    process.exit(2);
  }
  return key;
}

function clonePayload(payload: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
}

async function postGroq(body: string, label: string): Promise<SafeGroqResult> {
  const started = Date.now();
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey()}`,
      'content-type': 'application/json',
    },
    body,
  });
  const durationMs = Date.now() - started;
  const json = await response.json().catch(() => undefined);
  const diagnostic = parseGroqErrorDiagnostic(json);
  const payload = JSON.parse(body) as { model?: string; response_format?: { json_schema?: { schema?: Record<string, unknown> } } };
  const schema = payload.response_format?.json_schema?.schema;
  const result: SafeGroqResult = {
    label,
    status: response.status,
    code: diagnostic.code,
    type: diagnostic.type,
    message: diagnostic.message,
    failedGeneration: diagnostic.failedGeneration,
    failedGenerationParsed: diagnostic.failedGenerationParsed,
    failedGenerationVsSchema: diagnostic.failedGenerationParsed && schema
      ? compareFailedGenerationToSchema(diagnostic.failedGenerationParsed, schema)
      : undefined,
    omittedSecretLikeFields: diagnostic.omittedSecretLikeFields,
    requestId: response.headers.get('x-request-id') ?? undefined,
    model: payload.model,
    requestBytes: Buffer.byteLength(body, 'utf8'),
    durationMs,
    remainingRequests: response.headers.get('x-ratelimit-remaining-requests'),
    remainingTokens: response.headers.get('x-ratelimit-remaining-tokens'),
  };
  if (response.status === 200) {
    const content = (json as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content;
    let parsed: unknown;
    try {
      parsed = content ? JSON.parse(content) : undefined;
    } catch {
      parsed = undefined;
    }
    console.log(JSON.stringify({
      ...result,
      successKeys: parsed && typeof parsed === 'object' ? Object.keys(parsed as object) : [],
      zodSuccess: parsed === undefined ? null : operationsAnswerSchema.safeParse(parsed).success,
    }));
    return result;
  }
  console.log(JSON.stringify(result));
  return result;
}

async function captureN01Schema(): Promise<Record<string, unknown>> {
  let sentBody = '';
  const fetchImpl = (async (_url: unknown, init?: { body?: unknown }) => {
    sentBody = String(init?.body ?? '');
    return new Response(JSON.stringify({ error: { code: 'fixture_capture' } }), { status: 400 });
  }) as unknown as typeof fetch;
  await createMovementIntentParser({
    apiKey: 'fixture',
    model: OPERATIONS_MODEL,
    timeoutMs: 100,
    fetchImpl,
  })('Mové 100 kg del lote SHOW-001 del Campo Oriente al Frigorifico A.', {
    lots: [{ code: 'SHOW-001' }],
    locations: [{ name: 'Campo Oriente' }, { name: 'Frigorifico A' }],
  });
  if (!sentBody) throw new Error('No se serializó el schema N01.');
  const payload = JSON.parse(sentBody) as {
    response_format: { json_schema: { schema: Record<string, unknown> } };
  };
  return payload.response_format.json_schema.schema;
}

function minimalStrictSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['answer'],
    properties: { answer: { type: 'string' } },
  };
}

function syntheticLotHistoryUser(): string {
  return JSON.stringify({
    question: '¿Qué pasó con SHOW-001?',
    context: {
      intent: 'LOT_HISTORY',
      lots: [{ id: 'lot-showcase-001', code: 'SHOW-001' }],
      locations: [],
      movements: [],
      movementItems: [],
      traceability: [],
      stockRecords: [],
      ledger: { ledgerAuthority: false, blockingIssues: [], classifications: [] },
    },
  });
}

async function main(): Promise<void> {
  const captured = await captureLotHistoryStructuredRequest();
  const lotHistorySchema = captured.payload.response_format.json_schema.schema as Record<string, unknown>;
  const n01Schema = await captureN01Schema();
  const lotHistoryAudit = auditGroqStrictSchema(lotHistorySchema);
  const n01Audit = auditGroqStrictSchema(n01Schema);
  const diff = schemaKeywordDiff(n01Schema, lotHistorySchema);

  console.log(JSON.stringify({
    phase: 'schema-audit',
    lotHistory: {
      objects: summarizeSchemaObjects(lotHistorySchema),
      allPropertiesRequired: lotHistoryAudit.allPropertiesRequired,
      additionalPropertiesFalseRecursively: lotHistoryAudit.additionalPropertiesFalseRecursively,
      undocumentedKeywords: lotHistoryAudit.undocumentedKeywords,
      disallowedKeywords: lotHistoryAudit.disallowedKeywords,
    },
    n01: {
      objects: summarizeSchemaObjects(n01Schema),
      allPropertiesRequired: n01Audit.allPropertiesRequired,
      additionalPropertiesFalseRecursively: n01Audit.additionalPropertiesFalseRecursively,
      undocumentedKeywords: n01Audit.undocumentedKeywords,
      disallowedKeywords: n01Audit.disallowedKeywords,
    },
    schemaDiff: {
      onlyN01: diff.onlyLeft,
      onlyLotHistory: diff.onlyRight,
    },
    requestMeta: safeRequestMeta(captured),
  }));

  if (!wantsLiveGroq()) {
    console.log(JSON.stringify({ phase: 'stop', reason: 'pass --run to execute Groq tests A-D' }));
    return;
  }

  const schemaLooksStrictValid = lotHistoryAudit.allPropertiesRequired
    && lotHistoryAudit.additionalPropertiesFalseRecursively
    && lotHistoryAudit.disallowedKeywords.length === 0;

  const aResults: SafeGroqResult[] = [];
  const aBody = JSON.stringify(captured.payload);
  for (let index = 1; index <= MAX_A_REPEATS; index += 1) {
    aResults.push(await postGroq(aBody, `TEST_A_${index}`));
    const remainingTokens = Number(aResults.at(-1)?.remainingTokens ?? '0');
    if (Number.isFinite(remainingTokens) && remainingTokens < 2500 && index < MAX_A_REPEATS) {
      await new Promise((resolve) => setTimeout(resolve, 20_000));
    }
  }

  const aFailed = aResults.filter((result) => result.status !== 200);
  const aFailedValidate = aResults.filter((result) => result.status === 400 && result.code === 'json_validate_failed');
  console.log(JSON.stringify({
    phase: 'TEST_A_summary',
    attempts: aResults.length,
    statuses: aResults.map((result) => result.status),
    codes: aResults.map((result) => result.code ?? null),
    requestIds: aResults.map((result) => result.requestId ?? null),
    failed: aFailed.length,
    jsonValidateFailed: aFailedValidate.length,
  }));

  if (aFailed.length === 0) {
    console.log(JSON.stringify({ phase: 'stop', reason: 'TEST A passed; B/C/D not required' }));
    return;
  }

  const bPayload = clonePayload(captured.payload);
  const bFormat = bPayload.response_format as { json_schema: { name: string; strict: boolean; schema: unknown } };
  bFormat.json_schema = { name: 'minimal_answer', strict: true, schema: minimalStrictSchema() };
  const bResult = await postGroq(JSON.stringify(bPayload), 'TEST_B');

  const cPayload = clonePayload(captured.payload);
  const cMessages = cPayload.messages as Array<{ role: string; content: string }>;
  cMessages[0] = { role: 'system', content: 'Respondé exclusivamente con el JSON Schema solicitado.' };
  cMessages[1] = { role: 'user', content: syntheticLotHistoryUser() };
  const cResult = await postGroq(JSON.stringify(cPayload), 'TEST_C');

  let dResult: SafeGroqResult | undefined;
  if (schemaLooksStrictValid) {
    const dPayload = clonePayload(captured.payload);
    dPayload.model = DIAGNOSTIC_120B;
    dResult = await postGroq(JSON.stringify(dPayload), 'TEST_D');
  } else {
    console.log(JSON.stringify({ phase: 'TEST_D_skipped', reason: 'LOT_HISTORY schema failed local strict audit' }));
  }

  console.log(JSON.stringify({
    phase: 'interpretation',
    schemaLooksStrictValid,
    aFailBPass: aFailed.length > 0 && bResult.status === 200,
    aFailCPass: aFailed.length > 0 && cResult.status === 200,
    aFailDPass: Boolean(dResult && aFailed.length > 0 && dResult.status === 200),
    aIntermittent: aFailed.length > 0 && aFailed.length < aResults.length,
  }));
}

await main();
