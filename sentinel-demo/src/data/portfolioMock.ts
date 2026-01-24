import type { PortfolioAnalysis, PortfolioInsight, ClauseComparison, ExposureAggregation, PortfolioReasoningStep } from '@/lib/types-radar';
import { mockLeases } from './leases';

export const mockInsights: PortfolioInsight[] = [
  {
    id: 'insight-admin-fee',
    type: 'clause-variance',
    severity: 'critical',
    title: 'Admin Fee Cap Inconsistency',
    description: 'Soho Square lease has a 15% UNCAPPED admin fee while Fenchurch caps at 5% and Bishopsgate is fixed at £2,000/year. This creates unpredictable exposure.',
    affectedLeases: ['lease-unfavorable'],
    clauseCategory: 'admin-fee',
    potentialSavings: 31500, // 15% vs 5% of estimated £315k service costs
    recommendation: 'Renegotiate Soho Square admin fee to align with portfolio standard of 5% cap.',
  },
  {
    id: 'insight-pandemic',
    type: 'leverage-discovery',
    severity: 'info',
    title: 'Pandemic Abatement Precedent',
    description: 'Bishopsgate lease includes full rent suspension for Pandemic Events. This can be used as precedent in future negotiations.',
    affectedLeases: ['lease-favorable'],
    clauseCategory: 'pandemic',
    recommendation: 'Use Bishopsgate pandemic clause as template for renewal negotiations on other leases.',
  },
  {
    id: 'insight-break-clause',
    type: 'exposure-risk',
    severity: 'critical',
    title: 'No Tenant Break at Soho Square',
    description: 'Soho Square lease has LANDLORD-ONLY break clause. Tenant is locked in for 10 years with no exit option while landlord can terminate at Year 5.',
    affectedLeases: ['lease-unfavorable'],
    clauseCategory: 'break-clause',
    potentialSavings: 0,
    recommendation: 'Flag for immediate attention. Consider subletting rights or negotiate break option at next review.',
  },
  {
    id: 'insight-repair',
    type: 'clause-variance',
    severity: 'warning',
    title: 'Repair Obligation Variance',
    description: 'Soho Square uses "put AND keep" wording requiring tenant to remedy pre-existing disrepair. Other leases use standard "keep in repair" with insured risk carve-outs.',
    affectedLeases: ['lease-unfavorable'],
    clauseCategory: 'repair',
    potentialSavings: 50000, // Estimated cost to remedy hypothetical disrepair
    recommendation: 'Commission dilapidations survey for Soho Square to quantify potential liability.',
  },
  {
    id: 'insight-rent-review',
    type: 'exposure-risk',
    severity: 'warning',
    title: 'Rent Review Exposure',
    description: 'Soho Square rent review includes tenant improvements in valuation - tenant pays rent on their own fit-out. Bishopsgate has 3% cap protection.',
    affectedLeases: ['lease-unfavorable', 'lease-favorable'],
    clauseCategory: 'rent-review',
    potentialSavings: 21000, // Estimated annual saving if improvements excluded
    recommendation: 'Document all tenant improvements at Soho Square for rent review negotiations.',
  },
];

export const mockClauseComparisons: ClauseComparison[] = [
  {
    category: 'admin-fee',
    displayName: 'Admin Fee',
    values: [
      { leaseId: 'lease-standard', value: '5% cap', riskLevel: 'low', hasVariance: false },
      { leaseId: 'lease-unfavorable', value: '15% UNCAPPED', riskLevel: 'high', hasVariance: true },
      { leaseId: 'lease-favorable', value: '£2,000 fixed', riskLevel: 'low', hasVariance: false },
    ],
  },
  {
    category: 'break-clause',
    displayName: 'Break Clause',
    values: [
      { leaseId: 'lease-standard', value: 'Tenant Yr 5 (6mo)', riskLevel: 'medium', hasVariance: false },
      { leaseId: 'lease-unfavorable', value: 'LANDLORD ONLY', riskLevel: 'high', hasVariance: true },
      { leaseId: 'lease-favorable', value: 'Mutual Yr 3 & 5 (3mo)', riskLevel: 'low', hasVariance: false },
    ],
  },
  {
    category: 'repair',
    displayName: 'Repair Obligation',
    values: [
      { leaseId: 'lease-standard', value: 'Keep in repair', riskLevel: 'low', hasVariance: false },
      { leaseId: 'lease-unfavorable', value: 'PUT AND KEEP', riskLevel: 'high', hasVariance: true },
      { leaseId: 'lease-favorable', value: 'Keep only + carve-outs', riskLevel: 'low', hasVariance: false },
    ],
  },
  {
    category: 'rent-review',
    displayName: 'Rent Review',
    values: [
      { leaseId: 'lease-standard', value: 'Upward only', riskLevel: 'medium', hasVariance: false },
      { leaseId: 'lease-unfavorable', value: 'Upward + improvements', riskLevel: 'high', hasVariance: true },
      { leaseId: 'lease-favorable', value: 'Capped 3% p.a.', riskLevel: 'low', hasVariance: false },
    ],
  },
  {
    category: 'pandemic',
    displayName: 'Pandemic Protection',
    values: [
      { leaseId: 'lease-standard', value: 'None', riskLevel: 'medium', hasVariance: false },
      { leaseId: 'lease-unfavorable', value: 'None', riskLevel: 'medium', hasVariance: false },
      { leaseId: 'lease-favorable', value: 'Full suspension', riskLevel: 'low', hasVariance: true },
    ],
  },
];

export const mockExposureAggregation: ExposureAggregation = {
  totalAnnualRent: 685000, // 125k + 210k + 350k
  totalUncappedExposure: 450000, // Estimated exposure from uncapped admin fees, repair obligations, etc.
  portfolioRiskScore: 52, // Weighted average
  potentialSavings: 102500, // Sum of all insight savings
  leaseCount: 3,
  highRiskCount: 1,
  mediumRiskCount: 1,
  lowRiskCount: 1,
};

export const mockReasoningSteps: PortfolioReasoningStep[] = [
  {
    step: 1,
    action: 'PARSE',
    detail: 'Extracted structured data from 3 lease documents totaling 47 pages',
    confidence: 98,
  },
  {
    step: 2,
    action: 'EXTRACT',
    detail: 'Identified 14 key clauses across Admin Fee, Break, Repair, Rent Review, and Pandemic categories',
    confidence: 95,
  },
  {
    step: 3,
    action: 'COMPARE',
    detail: 'Cross-referenced clause terms to identify variances - found 5 significant discrepancies',
    confidence: 92,
  },
  {
    step: 4,
    action: 'IDENTIFY',
    detail: 'Flagged Soho Square (lease_unfavorable) as highest risk: landlord-only break, uncapped admin, put-and-keep repair',
    confidence: 97,
  },
  {
    step: 5,
    action: 'QUANTIFY',
    detail: 'Calculated total potential savings of £102,500 if variances resolved to tenant-favorable terms',
    confidence: 85,
  },
  {
    step: 6,
    action: 'RECOMMEND',
    detail: 'Generated 5 actionable insights with prioritized recommendations for portfolio optimization',
    confidence: 90,
  },
];

export const mockPortfolioAnalysis: PortfolioAnalysis = {
  leases: mockLeases,
  insights: mockInsights,
  clauseComparisons: mockClauseComparisons,
  exposureAggregation: mockExposureAggregation,
  aiReasoning: mockReasoningSteps,
};
