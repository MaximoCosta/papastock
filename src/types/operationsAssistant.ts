export type OperationsDataQuality = 'authoritative' | 'operational_only' | 'incomplete';
export type OperationsConfidence = 'high' | 'medium' | 'low';
export type OperationsEntityType = 'lot' | 'location' | 'movement';
export type OperationsEvidenceSource = 'stock_records' | 'movements' | 'ledger';

export interface OperationsAssistantEntity {
  type: OperationsEntityType;
  id: string;
  label: string;
}

export interface OperationsAssistantEvidence {
  source: OperationsEvidenceSource;
  description: string;
}

export interface OperationsAssistantAnswer {
  answer: string;
  confidence: OperationsConfidence;
  dataQuality: OperationsDataQuality;
  entities: OperationsAssistantEntity[];
  warnings: string[];
  evidence: OperationsAssistantEvidence[];
}
