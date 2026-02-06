// Sentinel Radar - Lease Extraction Types (Map Phase)
// Used by Agent A: Forensic Auditor

/**
 * Clause extraction with mandatory citation
 */
export interface ClauseExtraction {
  clause_reference: string; // e.g., "Clause 12.3", "Schedule 2, Part A"
  verbatim_text: string; // Exact quote from the lease
  category: ClauseCategory;
  risk_level: 'low' | 'medium' | 'high';
  risk_rationale: string; // Why this risk level was assigned
  value?: string; // Extracted value, e.g., "5%", "Year 5", "£2,000"
}

export type ClauseCategory =
  | 'break-clause'
  | 'rent-review'
  | 'repair'
  | 'admin-fee'
  | 'turnover-rent'
  | 'promotion-levy'
  | 'service-charge'
  | 'pandemic'
  | 'alienation'
  | 'forfeiture'
  | 'insurance'
  | 'dilapidations';

/**
 * Financial terms extracted from lease
 */
export interface FinancialTerms {
  base_rent: {
    annual_amount: number;
    currency: string;
    clause_reference: string;
  };
  turnover_rent?: {
    percentage: number; // e.g., 8 for 8%
    threshold?: number;
    clause_reference: string;
  };
  promotion_levy?: {
    percentage?: number;
    fixed_amount?: number;
    clause_reference: string;
  };
  service_charge_cap?: {
    cap_percentage?: number; // e.g., 5 for 5% annual increase cap
    cap_amount?: number;
    clause_reference: string;
  };
  admin_fees: {
    type: string;
    amount: number;
    clause_reference: string;
  }[];
}

/**
 * Key dates extracted from lease
 */
export interface LeaseTimeline {
  start_date: string; // ISO date
  end_date: string;
  term_years: number;
  break_options: {
    date: string;
    conditions: string;
    clause_reference: string;
  }[];
  rent_review_dates: {
    date: string;
    mechanism: 'upward-only' | 'open-market' | 'fixed' | 'indexed';
    clause_reference: string;
  }[];
}

/**
 * Complete lease extraction result from Agent A
 */
export interface LeaseExtraction {
  // Identification
  id: string;
  filename: string;
  extraction_timestamp: string;

  // Parties
  property_address: string;
  landlord: string;
  tenant: string;

  // Financial
  financial_terms: FinancialTerms;

  // Timeline
  timeline: LeaseTimeline;

  // Clauses - all with mandatory clause_reference
  clauses: ClauseExtraction[];

  // Risk Assessment
  risk_score: number; // 0-100
  risk_calculation_logic: string; // e.g., "Base 50 + 25 (no break) + 15 (turnover rent) = 90"
  risk_factors: string[]; // List of identified risks

  // Metadata
  overall_confidence: number; // 0-100 explicit
  extraction_notes: string[]; // Any ambiguities or issues found
}

/**
 * Extraction progress tracking
 */
export interface ExtractionProgress {
  phase: 'extracting' | 'validating' | 'synthesizing' | 'complete' | 'error';
  total_files: number;
  completed_files: number;
  current_filename?: string;
  successful_extractions: LeaseExtraction[];
  failed_files: {
    filename: string;
    error: string;
  }[];
}

/**
 * Portfolio synthesis request
 */
export interface SynthesisRequest {
  extractions: LeaseExtraction[];
}

/**
 * Cache entry for extraction results
 */
export interface ExtractionCacheEntry {
  hash: string; // filename + size hash
  extraction: LeaseExtraction;
  cached_at: string;
}

/**
 * Individual validation issue found by Claude
 */
export interface ValidationIssue {
  field_path: string; // e.g., "risk_score", "financial_terms.base_rent.annual_amount"
  severity: 'info' | 'warning' | 'error';
  description: string;
  original_value: string | number | null;
  suggested_value: string | number | null;
}

/**
 * Per-lease validation result from Claude
 */
export interface LeaseValidation {
  lease_id: string;
  verdict: 'pass' | 'minor_issues' | 'major_issues';
  confidence_adjustment: number; // e.g., -10 means reduce confidence by 10
  corrected_risk_score: number | null; // null if no correction needed
  issues: ValidationIssue[];
  quality_score: number; // 0-100
}

/**
 * Full validation report from Claude Opus
 */
export interface ValidationReport {
  validations: LeaseValidation[];
  summary: {
    total_leases: number;
    passed: number;
    minor_issues: number;
    major_issues: number;
  };
  corrected_extractions: LeaseExtraction[];
}
