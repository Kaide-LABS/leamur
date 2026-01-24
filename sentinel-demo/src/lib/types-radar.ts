// Sentinel Radar - Portfolio Intelligence Types

export interface LeaseClauseExtended {
  id: string;
  category: 'admin-fee' | 'break-clause' | 'repair' | 'rent-review' | 'pandemic' | 'alienation' | 'forfeiture';
  title: string;
  text: string;
  riskLevel: 'low' | 'medium' | 'high';
  value?: string; // e.g., "5%", "Year 5", "£2,000"
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
  | { type: 'RESET' };

export interface RadarState {
  appState: RadarAppState;
  selectedFiles: File[];
  loadingStatus: string;
  portfolioAnalysis: PortfolioAnalysis | null;
  highlightedLeaseId: string | null;
  highlightedInsightId: string | null;
  isReasoningExpanded: boolean;
}
