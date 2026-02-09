import type { LeaseExtraction } from '@/lib/types-extraction';

interface RiskScoreResult {
  score: number;
  logic: string;
}

/**
 * Deterministic risk score calculation from extracted lease data.
 * Replaces LLM-calculated risk scores to ensure reproducibility.
 */
export function calculateRiskScore(extraction: LeaseExtraction): RiskScoreResult {
  let score = 50;
  const parts: string[] = ['Base 50'];

  // No break clause: +25
  if (!extraction.timeline.break_options || extraction.timeline.break_options.length === 0) {
    score += 25;
    parts.push('+ 25 (no break clause)');
  }

  // Turnover rent present: +15
  if (extraction.financial_terms.turnover_rent != null) {
    score += 15;
    parts.push('+ 15 (turnover rent)');
  }

  // Uncapped service charges: +10
  if (extraction.financial_terms.service_charge_cap == null) {
    score += 10;
    parts.push('+ 10 (uncapped service charges)');
  }

  // Upward-only rent review: +10
  const hasUpwardOnly = extraction.timeline.rent_review_dates?.some(
    (r) => r.mechanism === 'upward-only'
  );
  if (hasUpwardOnly) {
    score += 10;
    parts.push('+ 10 (upward-only rent review)');
  }

  // Full repairing (high risk): +10
  const hasHighRiskRepair = extraction.clauses?.some(
    (c) => c.category === 'repair' && c.risk_level === 'high'
  );
  if (hasHighRiskRepair) {
    score += 10;
    parts.push('+ 10 (high-risk repair obligation)');
  }

  // No pandemic clause: +5
  const hasPandemic = extraction.clauses?.some((c) => c.category === 'pandemic');
  if (!hasPandemic) {
    score += 5;
    parts.push('+ 5 (no pandemic clause)');
  }

  // Restrictive alienation: +5
  const hasRestrictiveAlienation = extraction.clauses?.some(
    (c) => c.category === 'alienation' && c.risk_level === 'high'
  );
  if (hasRestrictiveAlienation) {
    score += 5;
    parts.push('+ 5 (restrictive alienation)');
  }

  // Cap at 95
  if (score > 95) {
    score = 95;
    parts.push('→ capped at 95');
  }

  const logic = parts.join(' ') + ` = ${score}`;

  return { score, logic };
}
