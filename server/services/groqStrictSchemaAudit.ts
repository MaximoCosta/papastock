export interface GroqStrictObjectFinding {
  path: string;
  type?: unknown;
  additionalProperties?: unknown;
  propertyKeys: string[];
  required: string[];
  missingFromRequired: string[];
  requiredMissingProperties: string[];
  additionalPropertiesFalse: boolean;
  allPropertiesRequired: boolean;
}

export interface GroqStrictSchemaAudit {
  objects: GroqStrictObjectFinding[];
  allPropertiesRequired: boolean;
  additionalPropertiesFalseRecursively: boolean;
  undocumentedKeywords: Array<{ path: string; keyword: string }>;
  disallowedKeywords: Array<{ path: string; keyword: string }>;
}

const DOCUMENTED_STRICT_KEYWORDS = new Set([
  'type',
  'properties',
  'required',
  'additionalProperties',
  'enum',
  'items',
  'anyOf',
  'description',
  'title',
  '$defs',
  '$ref',
]);

const CONSTRAINT_KEYWORDS = new Set([
  'minItems',
  'maxItems',
  'minimum',
  'maximum',
  'minLength',
  'maxLength',
  'pattern',
  'uniqueItems',
  'default',
]);

const DISALLOWED_STRICT_KEYWORDS = new Set([
  '$schema',
  '$id',
  'definitions',
  'patternProperties',
  'unevaluatedProperties',
  'dependentRequired',
  'dependentSchemas',
  'if',
  'then',
  'else',
  'not',
  'allOf',
  'oneOf',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function looksLikeSchemaNode(node: Record<string, unknown>): boolean {
  return 'type' in node
    || 'properties' in node
    || 'items' in node
    || 'anyOf' in node
    || 'enum' in node
    || '$ref' in node
    || '$defs' in node
    || 'additionalProperties' in node
    || 'required' in node;
}

function visit(node: unknown, path: string, audit: GroqStrictSchemaAudit): void {
  if (Array.isArray(node)) {
    node.forEach((item, index) => visit(item, `${path}[${index}]`, audit));
    return;
  }
  if (!isRecord(node)) return;

  if (looksLikeSchemaNode(node)) {
    for (const keyword of Object.keys(node)) {
      if (DISALLOWED_STRICT_KEYWORDS.has(keyword)) {
        audit.disallowedKeywords.push({ path, keyword });
      } else if (CONSTRAINT_KEYWORDS.has(keyword) || !DOCUMENTED_STRICT_KEYWORDS.has(keyword)) {
        if (!DOCUMENTED_STRICT_KEYWORDS.has(keyword)) {
          audit.undocumentedKeywords.push({ path, keyword });
        }
      }
    }

    const type = node.type;
    const isObject = type === 'object'
      || (Array.isArray(type) && type.includes('object'))
      || Boolean(node.properties);
    if (isObject && node.properties !== undefined) {
      const properties = isRecord(node.properties) ? node.properties : {};
      const propertyKeys = Object.keys(properties);
      const required = Array.isArray(node.required)
        ? node.required.filter((item): item is string => typeof item === 'string')
        : [];
      const missingFromRequired = propertyKeys.filter((key) => !required.includes(key));
      const requiredMissingProperties = required.filter((key) => !propertyKeys.includes(key));
      const additionalPropertiesFalse = node.additionalProperties === false;
      const finding: GroqStrictObjectFinding = {
        path,
        type,
        additionalProperties: node.additionalProperties,
        propertyKeys,
        required,
        missingFromRequired,
        requiredMissingProperties,
        additionalPropertiesFalse,
        allPropertiesRequired: missingFromRequired.length === 0 && requiredMissingProperties.length === 0,
      };
      audit.objects.push(finding);
      if (!finding.allPropertiesRequired) audit.allPropertiesRequired = false;
      if (!additionalPropertiesFalse) audit.additionalPropertiesFalseRecursively = false;
    }
  }

  if (isRecord(node.properties)) {
    for (const [key, value] of Object.entries(node.properties)) {
      visit(value, `${path}.properties.${key}`, audit);
    }
  }
  if (node.items !== undefined) visit(node.items, `${path}.items`, audit);
  if (node.anyOf !== undefined) visit(node.anyOf, `${path}.anyOf`, audit);
  if (isRecord(node.$defs)) {
    for (const [key, value] of Object.entries(node.$defs)) {
      visit(value, `${path}.$defs.${key}`, audit);
    }
  }
}

export function auditGroqStrictSchema(schema: unknown): GroqStrictSchemaAudit {
  const audit: GroqStrictSchemaAudit = {
    objects: [],
    allPropertiesRequired: true,
    additionalPropertiesFalseRecursively: true,
    undocumentedKeywords: [],
    disallowedKeywords: [],
  };
  visit(schema, '$', audit);
  if (audit.objects.length === 0) {
    audit.allPropertiesRequired = false;
    audit.additionalPropertiesFalseRecursively = false;
  }
  return audit;
}

export function summarizeSchemaObjects(schema: unknown) {
  return auditGroqStrictSchema(schema).objects.map((object) => ({
    path: object.path,
    type: object.type,
    additionalProperties: object.additionalProperties,
    required: object.required,
    properties: object.propertyKeys,
    missingFromRequired: object.missingFromRequired,
    requiredMissingProperties: object.requiredMissingProperties,
  }));
}

export function schemaKeywordDiff(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): { onlyLeft: string[]; onlyRight: string[]; both: string[] } {
  function collect(node: unknown, path: string, into: Set<string>): void {
    if (Array.isArray(node)) {
      node.forEach((item, index) => collect(item, `${path}[${index}]`, into));
      return;
    }
    if (!isRecord(node)) {
      into.add(`${path}=${JSON.stringify(node)}`);
      return;
    }
    for (const key of Object.keys(node)) {
      into.add(`${path}.${key}`);
      collect(node[key], `${path}.${key}`, into);
    }
  }
  const leftKeys = new Set<string>();
  const rightKeys = new Set<string>();
  collect(left, '$', leftKeys);
  collect(right, '$', rightKeys);
  return {
    onlyLeft: [...leftKeys].filter((key) => !rightKeys.has(key)).sort(),
    onlyRight: [...rightKeys].filter((key) => !leftKeys.has(key)).sort(),
    both: [...leftKeys].filter((key) => rightKeys.has(key)).sort(),
  };
}

const SECRET_PATTERN = /GROQ_API_KEY|DATABASE_URL|Bearer\s+\S+|postgres(?:ql)?:\/\/|cookie|set-cookie|gsk_[A-Za-z0-9]+|sk-[A-Za-z0-9]+/i;

export interface GroqErrorDiagnostic {
  code?: string;
  type?: string;
  message?: string;
  failedGeneration?: string;
  failedGenerationParsed?: unknown;
  messageBytes?: number;
  failedGenerationBytes?: number;
  omittedSecretLikeFields: string[];
}

function redactIfSecret(value: unknown, field: string, omitted: string[]): string | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  if (SECRET_PATTERN.test(value)) {
    omitted.push(field);
    return undefined;
  }
  return value;
}

export function parseGroqErrorDiagnostic(payload: unknown): GroqErrorDiagnostic {
  const omittedSecretLikeFields: string[] = [];
  if (!payload || typeof payload !== 'object') {
    return { omittedSecretLikeFields };
  }
  const error = (payload as { error?: unknown }).error;
  const source = error && typeof error === 'object' && !Array.isArray(error)
    ? error as Record<string, unknown>
    : {};
  const message = redactIfSecret(source.message, 'message', omittedSecretLikeFields);
  const failedGeneration = redactIfSecret(source.failed_generation, 'failed_generation', omittedSecretLikeFields);
  let failedGenerationParsed: unknown;
  if (failedGeneration) {
    try {
      failedGenerationParsed = JSON.parse(failedGeneration);
    } catch {
      failedGenerationParsed = undefined;
    }
  }
  return {
    code: typeof source.code === 'string' ? source.code : undefined,
    type: typeof source.type === 'string' ? source.type : undefined,
    message,
    failedGeneration,
    failedGenerationParsed,
    messageBytes: typeof source.message === 'string' ? Buffer.byteLength(source.message, 'utf8') : undefined,
    failedGenerationBytes: typeof source.failed_generation === 'string'
      ? Buffer.byteLength(source.failed_generation, 'utf8')
      : undefined,
    omittedSecretLikeFields,
  };
}

export function compareFailedGenerationToSchema(
  generated: unknown,
  schema: Record<string, unknown>,
): Record<string, unknown> {
  if (!generated || typeof generated !== 'object' || Array.isArray(generated)) {
    return { generatedType: generated === null ? 'null' : Array.isArray(generated) ? 'array' : typeof generated };
  }
  const record = generated as Record<string, unknown>;
  const rootRequired = Array.isArray(schema.required) ? schema.required.filter((item): item is string => typeof item === 'string') : [];
  const rootProperties = schema.properties && typeof schema.properties === 'object' && !Array.isArray(schema.properties)
    ? Object.keys(schema.properties as Record<string, unknown>)
    : [];
  const extraRootKeys = Object.keys(record).filter((key) => !rootProperties.includes(key));
  const missingRootKeys = rootRequired.filter((key) => !(key in record));
  const evidence = record.evidence;
  const entities = record.entities;
  const warnings = record.warnings;
  return {
    extraRootKeys,
    missingRootKeys,
    presentRootKeys: Object.keys(record),
    evidenceIsArray: Array.isArray(evidence),
    evidenceLength: Array.isArray(evidence) ? evidence.length : null,
    entitiesIsArray: Array.isArray(entities),
    entitiesLength: Array.isArray(entities) ? entities.length : null,
    warningsIsArray: Array.isArray(warnings),
    warningsLength: Array.isArray(warnings) ? warnings.length : null,
    confidence: record.confidence ?? null,
    dataQuality: record.dataQuality ?? null,
    evidenceSources: Array.isArray(evidence)
      ? evidence.map((item) => (item && typeof item === 'object' && 'source' in item ? (item as { source?: unknown }).source : null))
      : null,
    entityTypes: Array.isArray(entities)
      ? entities.map((item) => (item && typeof item === 'object' && 'type' in item ? (item as { type?: unknown }).type : null))
      : null,
  };
}
