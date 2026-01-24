// Portfolio Analysis Prompts for Gemini 2.5 Flash
// This prompt is designed to analyze multiple commercial leases and identify variances

import { z } from "zod";

// Zod schema for structured output - using Zod v4 native toJSONSchema
const LeaseClauseExtendedSchema = z.object({
  id: z.string().describe("Unique identifier for the clause"),
  category: z.enum([
    "admin-fee",
    "break-clause",
    "repair",
    "rent-review",
    "pandemic",
    "alienation",
    "forfeiture",
  ]).describe("Category of the clause"),
  title: z.string().describe("Short descriptive title"),
  text: z.string().describe("Exact or summarized text from the lease"),
  riskLevel: z.enum(["low", "medium", "high"]).describe("Risk level for tenant"),
  value: z.string().optional().describe("Key value (e.g., '5%', 'Year 5', '£2,000')"),
});

const LeaseSchema = z.object({
  id: z.string().describe("Unique identifier (use filename without extension as base)"),
  filename: z.string().describe("Original filename"),
  property: z.string().describe("Property address/description"),
  landlord: z.string().describe("Landlord name/entity"),
  tenant: z.string().describe("Tenant name/entity"),
  annualRent: z.number().describe("Annual rent in GBP"),
  termYears: z.number().describe("Lease term in years"),
  startDate: z.string().describe("Lease start date (YYYY-MM-DD format)"),
  riskScore: z.number().min(0).max(100).describe("Overall risk score 0-100"),
  riskLevel: z.enum(["low", "medium", "high"]).describe("Overall risk level"),
  clauses: z.array(LeaseClauseExtendedSchema).describe("Extracted key clauses"),
});

const PortfolioInsightSchema = z.object({
  id: z.string().describe("Unique identifier"),
  type: z.enum(["clause-variance", "leverage-discovery", "exposure-risk"]).describe("Type of insight"),
  severity: z.enum(["info", "warning", "critical"]).describe("Severity level"),
  title: z.string().describe("Short actionable title"),
  description: z.string().describe("Detailed explanation"),
  affectedLeases: z.array(z.string()).describe("Array of affected lease IDs"),
  clauseCategory: z.enum([
    "admin-fee",
    "break-clause",
    "repair",
    "rent-review",
    "pandemic",
    "alienation",
    "forfeiture",
  ]).describe("Related clause category"),
  potentialSavings: z.number().optional().describe("Estimated savings in GBP if resolved"),
  recommendation: z.string().optional().describe("Actionable recommendation"),
});

const ClauseComparisonValueSchema = z.object({
  leaseId: z.string(),
  value: z.string().describe("Summary value for comparison table"),
  riskLevel: z.enum(["low", "medium", "high"]),
  hasVariance: z.boolean().describe("True if this value differs significantly from others"),
});

const ClauseComparisonSchema = z.object({
  category: z.enum([
    "admin-fee",
    "break-clause",
    "repair",
    "rent-review",
    "pandemic",
  ]).describe("Clause category being compared"),
  displayName: z.string().describe("Human-readable name for the category"),
  values: z.array(ClauseComparisonValueSchema).describe("Comparison values for each lease"),
});

const ExposureAggregationSchema = z.object({
  totalAnnualRent: z.number().describe("Sum of all annual rents"),
  totalUncappedExposure: z.number().describe("Estimated uncapped financial exposure"),
  portfolioRiskScore: z.number().min(0).max(100).describe("Weighted average risk score"),
  potentialSavings: z.number().describe("Total potential savings from all insights"),
  leaseCount: z.number().describe("Number of leases analyzed"),
  highRiskCount: z.number().describe("Number of high risk leases"),
  mediumRiskCount: z.number().describe("Number of medium risk leases"),
  lowRiskCount: z.number().describe("Number of low risk leases"),
});

const PortfolioReasoningStepSchema = z.object({
  step: z.number().describe("Step number"),
  action: z.enum(["PARSE", "EXTRACT", "COMPARE", "IDENTIFY", "QUANTIFY", "RECOMMEND"]).describe("Action type"),
  detail: z.string().describe("Description of what was done"),
  confidence: z.number().min(0).max(100).describe("Confidence percentage"),
});

export const PortfolioAnalysisSchema = z.object({
  leases: z.array(LeaseSchema).describe("Extracted lease information"),
  insights: z.array(PortfolioInsightSchema).describe("Identified portfolio insights"),
  clauseComparisons: z.array(ClauseComparisonSchema).describe("Side-by-side clause comparisons"),
  exposureAggregation: ExposureAggregationSchema.describe("Portfolio-level metrics"),
  aiReasoning: z.array(PortfolioReasoningStepSchema).describe("Chain-of-thought reasoning steps"),
});

// Use Zod v4's native toJSONSchema - no $ref issues!
export const portfolioAnalysisJsonSchema = z.toJSONSchema(PortfolioAnalysisSchema);

// System prompt for portfolio analysis
export const PORTFOLIO_ANALYSIS_SYSTEM_PROMPT = `You are an expert UK commercial lease analyst. Your task is to analyze multiple commercial lease documents and provide a comprehensive portfolio comparison.

ANALYSIS FRAMEWORK:

1. EXTRACT key information from each lease:
   - Property details (address, landlord, tenant)
   - Financial terms (rent, term length, start date)
   - Key clauses in these categories:
     * Admin Fee: Management/administration fee provisions
     * Break Clause: Tenant and/or landlord break options
     * Repair: Repair obligations (keep vs put-and-keep)
     * Rent Review: Review mechanism and caps
     * Pandemic: Force majeure or pandemic abatement provisions

2. COMPARE clauses across all leases to identify variances:
   - Flag terms that deviate significantly from market standard
   - Identify landlord-favorable vs tenant-favorable provisions
   - Note any unique or unusual clauses

3. ASSESS RISK for each lease (0-100 scale):
   - Low risk (0-33): Tenant-favorable terms, good protections
   - Medium risk (34-66): Market standard terms
   - High risk (67-100): Landlord-favorable, limited tenant protections

4. IDENTIFY INSIGHTS:
   - clause-variance: Significant differences between leases
   - leverage-discovery: Tenant-favorable terms that set precedent
   - exposure-risk: Uncapped or unusual financial exposures

5. QUANTIFY exposure:
   - Calculate total portfolio rent
   - Estimate uncapped exposure from problematic clauses
   - Identify potential savings if variances resolved

UK COMMERCIAL LEASE EXPERTISE:
- "Put and keep" repair = tenant must remedy pre-existing disrepair (HIGH RISK)
- "Keep in repair" = maintain current condition (LOWER RISK)
- Uncapped admin fees >10% = unusual and risky
- Landlord-only break = tenant locked in (HIGH RISK)
- Upward-only rent review = standard but note any caps
- Tenant improvements in valuation = paying rent on own fit-out (HIGH RISK)

IMPORTANT:
- Be conservative with risk scores - only flag truly problematic clauses as high risk
- Provide specific, actionable recommendations
- Calculate potential savings realistically based on market benchmarks
- If information is missing from a lease, note it but don't penalize the risk score`;

// Build the full prompt with lease content
export function buildPortfolioAnalysisPrompt(
  leaseDocuments: { filename: string; content: string }[]
): string {
  const leaseTexts = leaseDocuments
    .map(
      (doc, index) => `
=== LEASE ${index + 1}: ${doc.filename} ===
${doc.content}
=== END LEASE ${index + 1} ===`
    )
    .join("\n\n");

  return `${PORTFOLIO_ANALYSIS_SYSTEM_PROMPT}

LEASE DOCUMENTS TO ANALYZE:

${leaseTexts}

Analyze all ${leaseDocuments.length} leases and return a comprehensive portfolio analysis.

YOU MUST RETURN VALID JSON in this exact structure:
{
  "leases": [
    {
      "id": "string",
      "filename": "string",
      "property": "string",
      "landlord": "string",
      "tenant": "string",
      "annualRent": number,
      "termYears": number,
      "startDate": "YYYY-MM-DD",
      "riskScore": number,
      "riskLevel": "low" | "medium" | "high",
      "clauses": [
        {
          "id": "string",
          "category": "admin-fee" | "break-clause" | "repair" | "rent-review" | "pandemic" | "alienation" | "forfeiture",
          "title": "string",
          "text": "string",
          "riskLevel": "low" | "medium" | "high",
          "value": "string"
        }
      ]
    }
  ],
  "insights": [
    {
      "id": "string",
      "type": "clause-variance" | "leverage-discovery" | "exposure-risk",
      "severity": "info" | "warning" | "critical",
      "title": "string",
      "description": "string",
      "affectedLeases": ["leaseId1", "leaseId2"],
      "clauseCategory": "admin-fee" | "break-clause" | "repair" | "rent-review" | "pandemic",
      "potentialSavings": number,
      "recommendation": "string"
    }
  ],
  "clauseComparisons": [
    {
      "category": "admin-fee" | "break-clause" | "repair" | "rent-review" | "pandemic",
      "displayName": "string",
      "values": [
        {
          "leaseId": "string",
          "value": "string",
          "riskLevel": "low" | "medium" | "high",
          "hasVariance": boolean
        }
      ]
    }
  ],
  "exposureAggregation": {
    "totalAnnualRent": number,
    "totalUncappedExposure": number,
    "portfolioRiskScore": number,
    "potentialSavings": number,
    "leaseCount": number,
    "highRiskCount": number,
    "mediumRiskCount": number,
    "lowRiskCount": number
  },
  "aiReasoning": [
    {
      "step": number,
      "action": "PARSE" | "EXTRACT" | "COMPARE" | "IDENTIFY" | "QUANTIFY" | "RECOMMEND",
      "detail": "string",
      "confidence": number
    }
  ]
}

Include:
1. Extracted information for each lease
2. At least 3-5 meaningful insights about variances and risks
3. Clause comparisons for all 5 categories
4. Aggregated portfolio metrics
5. Your reasoning steps

Focus on actionable insights for commercial tenant negotiations.`;
}
