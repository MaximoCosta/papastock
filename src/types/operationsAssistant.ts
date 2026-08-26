export type OperationsDataQuality = 'authoritative' | 'operational_only' | 'incomplete';
export type OperationsConfidence = 'high' | 'medium' | 'low';
export type OperationsEntityType = 'lot' | 'location' | 'movement' | string;
export type OperationsEvidenceSource = string;

export interface OperationsAssistantEntity {
  type: OperationsEntityType;
  id: string;
  label: string;
}

export interface OperationsAssistantEvidence {
  source: OperationsEvidenceSource;
  recordId: string | null;
  recordLabel: string | null;
  description: string;
}

export interface OperationsAssistantAnswer {
  answer: string;
  confidence?: OperationsConfidence;
  dataQuality?: OperationsDataQuality;
  entities: OperationsAssistantEntity[];
  warnings: string[];
  evidence: OperationsAssistantEvidence[];
  engine?: 'llm' | 'heuristic' | 'deterministic';
}

export interface OperationsAssistantStatus {
  groqConfigured: boolean;
}
