import { z } from 'zod';
import {
  EXPORT_FIELD_KEYS,
  type AiExportRequirementsResult,
  type ExportFieldKey,
} from '../../src/types/export';
import { normalizeForMatch, requestStructuredOutput, type GroqOptions } from './groqStructured';

export interface ExportRequirementsInput {
  country: string;
  documentType: string;
  sourceText: string;
}

/** Etiqueta canónica por campo: la UI nunca depende del texto que devuelva el modelo. */
const canonicalLabels: Record<ExportFieldKey, string> = {
  lotCode: 'Número de lote',
  variety: 'Variedad',
  campaign: 'Campaña',
  producer: 'Productor',
  origin: 'Origen',
  harvestDate: 'Fecha de cosecha',
  quantity: 'Peso neto',
  treatment: 'Tratamiento fitosanitario',
  destination: 'País de destino',
  customer: 'Comprador / consignatario',
  incoterm: 'Incoterm',
  departurePort: 'Puerto de salida',
  destinationPort: 'Puerto de destino',
  transport: 'Transporte',
};

/** Términos que permiten detectar cada campo sin modelo, para el fallback. */
const keywords: Record<ExportFieldKey, string[]> = {
  lotCode: ['numero de lote', 'número de lote', 'nro de lote', 'lote', 'partida'],
  variety: ['variedad', 'cultivar'],
  campaign: ['campana', 'campaña', 'cosecha 20', 'temporada'],
  producer: ['productor', 'establecimiento', 'finca'],
  origin: ['origen', 'procedencia', 'localidad de origen'],
  harvestDate: ['fecha de cosecha', 'cosechado'],
  quantity: ['peso neto', 'peso', 'cantidad', 'kilos', 'kg'],
  treatment: ['tratamiento', 'fitosanitario', 'fumigacion', 'fumigación', 'principio activo'],
  destination: ['pais de destino', 'país de destino', 'destino'],
  customer: ['comprador', 'consignatario', 'importador', 'cliente'],
  incoterm: ['incoterm', 'fob', 'cif', 'exw', 'dap'],
  departurePort: ['puerto de salida', 'puerto de embarque', 'punto de salida'],
  destinationPort: ['puerto de destino', 'puerto de llegada', 'puerto de arribo'],
  transport: ['transporte', 'transportista', 'camion', 'camión', 'medio de transporte'],
};

const requirementsSchema = z.object({
  requirements: z.array(z.object({
    key: z.enum(EXPORT_FIELD_KEYS),
    label: z.string().trim().min(1).max(120),
    required: z.boolean(),
  })).max(EXPORT_FIELD_KEYS.length),
});

const jsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['requirements'],
  properties: {
    requirements: {
      type: 'array',
      maxItems: EXPORT_FIELD_KEYS.length,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'label', 'required'],
        properties: {
          key: { type: 'string', enum: [...EXPORT_FIELD_KEYS] },
          label: { type: 'string' },
          required: { type: 'boolean' },
        },
      },
    },
  },
} as const;

export function parseRequirementsWithHeuristic(input: ExportRequirementsInput): AiExportRequirementsResult {
  const text = normalizeForMatch(input.sourceText);
  const requirements = EXPORT_FIELD_KEYS
    .filter((key) => keywords[key].some((term) => text.includes(normalizeForMatch(term))))
    .map((key) => ({ key, label: canonicalLabels[key], required: true }));

  return { engine: 'heuristic', requirements };
}

export function createExportRequirementsParser(options: GroqOptions) {
  return async function parseExportRequirements(
    input: ExportRequirementsInput,
  ): Promise<AiExportRequirementsResult> {
    const fallback = () => parseRequirementsWithHeuristic(input);
    if (!options.apiKey) return fallback();

    try {
      const raw = await requestStructuredOutput(options, {
        schemaName: 'papastock_export_requirements',
        jsonSchema,
        system: [
          'Convertís un texto documental de exportación en una lista estructurada de requisitos.',
          'Solo podés usar las claves del catálogo cerrado provisto; no inventes claves nuevas.',
          'Incluí únicamente los campos que el texto menciona explícitamente.',
          'No decidas si la exportación está aprobada: eso lo resuelve el sistema de forma determinística.',
          'No repitas la misma clave dos veces.',
          'Respondé exclusivamente con el JSON Schema solicitado.',
        ],
        user: {
          country: input.country,
          documentType: input.documentType,
          sourceText: input.sourceText,
          allowedKeys: EXPORT_FIELD_KEYS,
        },
      });

      const parsed = requirementsSchema.parse(raw);
      const seen = new Set<ExportFieldKey>();
      for (const requirement of parsed.requirements) {
        if (seen.has(requirement.key)) throw new Error(`Groq repitió la clave ${requirement.key}.`);
        seen.add(requirement.key);
      }
      if (parsed.requirements.length === 0) return fallback();

      return {
        engine: 'llm',
        // La etiqueta canónica gana: el modelo no define cómo se llama un campo en la UI.
        requirements: parsed.requirements.map((requirement) => ({
          key: requirement.key,
          label: canonicalLabels[requirement.key],
          required: requirement.required,
        })),
      };
    } catch (error) {
      console.warn('[ai] requisitos → parser local:', error instanceof Error ? error.message : error);
      return fallback();
    }
  };
}
