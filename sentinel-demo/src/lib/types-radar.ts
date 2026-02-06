// Sentinel Radar - Portfolio Intelligence Types

import type { ExtractionProgress, LeaseExtraction, ValidationReport } from './types-extraction';

export interface LeaseClauseExtended {
  id: string;
  category: 'admin-fee' | 'break-clause' | 'repair' | 'rent-review' | 'pandemic' | 'alienation' | 'forfeiture' | 'turnover-rent' | 'promotion-levy' | 'service-charge' | 'insurance' | 'dilapidations';
  title: string;
  text: string;
  riskLevel: 'low' | 'medium' | 'high';
  value?: string; // e.g., "5%", "Year 5", "£2,000"
  clause_reference?: string; // e.g., "Clause 12.3", "Schedule 2, Part A"
}

export interface Lease {
  id: string;
  filename: string;
  property: string;
  landlord: string;
  tenant: string;
  annualRent: number;
  termYears: number;
  startDate: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  clauses: LeaseClauseExtended[];
  // New financial fields (Iteration 4)
  turnover_rent?: {
    percentage: number;
    threshold?: number;
    clause_reference: string;
  };
  promotion_levy?: {
    percentage?: number;
    fixed_amount?: number;
    clause_reference: string;
  };
  service_charge_cap?: {
    cap_percentage?: number;
    cap_amount?: number;
    clause_reference: string;
  };
  risk_calculation_logic?: string; // e.g., "Base 50 + 25 (no break) = 75"
}

export interface PortfolioInsight {
  id: string;
  type: 'clause-variance' | 'leverage-discovery' | 'exposure-risk';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affectedLeases: string[]; // Lease IDs
  clauseCategory: LeaseClauseExtended['category'];
  potentialSavings?: number;
  recommendation?: string;
}

export interface ClauseComparison {
  category: LeaseClauseExtended['category'];
  displayName: string;
  values: {
    leaseId: string;
    value: string;
    riskLevel: 'low' | 'medium' | 'high';
    hasVariance: boolean;
  }[];
}

export interface ExposureAggregation {
  totalAnnualRent: number;
  totalUncappedExposure: number;
  portfolioRiskScore: number;
  potentialSavings: number;
  leaseCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  calculation_logic?: string; // e.g., "Portfolio risk = (L1×£50k×75 + L2×£75k×60) / total rent"
}

export interface PortfolioReasoningStep {
  step: number;
  action: 'PARSE' | 'EXTRACT' | 'COMPARE' | 'IDENTIFY' | 'QUANTIFY' | 'RECOMMEND';
  detail: string;
  confidence: number;
}

export interface PortfolioAnalysis {
  leases: Lease[];
  insights: PortfolioInsight[];
  clauseComparisons: ClauseComparison[];
  exposureAggregation: ExposureAggregation;
  aiReasoning: PortfolioReasoningStep[];
}

// State types
export type RadarAppState = 'IDLE' | 'PROCESSING' | 'RESULTS';

export type RadarAction =
  | { type: 'UPLOAD_FILES'; payload: File[] }
  | { type: 'REMOVE_FILE'; payload: string } // filename
  | { type: 'START_ANALYSIS' }
  | { type: 'UPDATE_LOADING_STATUS'; payload: string }
  | { type: 'ANALYSIS_COMPLETE'; payload: PortfolioAnalysis }
  | { type: 'SET_HIGHLIGHTED_LEASE'; payload: string | null }
  | { type: 'SET_HIGHLIGHTED_INSIGHT'; payload: string | null }
  | { type: 'TOGGLE_REASONING' }
  | { type: 'RESET' }
  // New Map-Reduce actions
  | { type: 'UPDATE_EXTRACTION_PROGRESS'; payload: ExtractionProgress }
  | { type: 'EXTRACTION_COMPLETE'; payload: LeaseExtraction[] }
  | { type: 'SYNTHESIS_STARTED' }
  | { type: 'VALIDATION_STARTED' }
  | { type: 'VALIDATION_COMPLETE'; payload: { correctedExtractions: LeaseExtraction[]; report: ValidationReport | null } }
  | { type: 'ANALYSIS_ERROR'; payload: { error: string; partialResults?: LeaseExtraction[] } };

export interface RadarState {
  appState: RadarAppState;
  selectedFiles: File[];
  loadingStatus: string;
  portfolioAnalysis: PortfolioAnalysis | null;
  highlightedLeaseId: string | null;
  highlightedInsightId: string | null;
  isReasoningExpanded: boolean;
  // Map-Reduce extraction progress
  extractionProgress: ExtractionProgress | null;
  validationReport: ValidationReport | null;
  analysisError: string | null;
}
