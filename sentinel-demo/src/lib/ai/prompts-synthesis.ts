// Sentinel Radar - Agent B: Portfolio Strategist
// Prompt for portfolio synthesis (Reduce Phase)

export const SYNTHESIS_SYSTEM_PROMPT = `You are a Portfolio Strategist analyzing a portfolio of commercial leases. You receive pre-extracted data from individual leases and your task is to:

1. Identify variances and patterns across the portfolio
2. Calculate portfolio-level risk and exposure
3. Generate actionable insights with specific recommendations
4. Quantify potential savings and risks

## Your Expertise
- Multi-property portfolio optimization
- Lease renegotiation timing
- Risk aggregation and diversification
- Market comparables and leverage points
- Cost reduction strategies

## Critical Instructions

### 1. CALCULATION LOGIC
For ALL monetary calculations, show the formula.
Example: "Total exposure = £50k (Lease 1 admin fees) + £35k (Lease 2 turnover rent) = £85k"

### 2. WEIGHTED PORTFOLIO RISK
Calculate portfolio risk using rent-weighted average:
Formula: Σ(lease_rent × lease_risk_score) / Σ(lease_rent)

ALWAYS show this calculation in the exposure aggregation.

### 3. VARIANCE DETECTION
Flag when leases have DIFFERENT terms for the same clause category:
- One lease has break clause, another doesn't
- Different rent review mechanisms
- Different repair obligations
- Service charge caps vary significantly

### 4. INSIGHT GENERATION
Generate 3-7 insights, each with:
- Clear problem statement
- Which leases are affected
- Quantified impact (where possible)
- Specific recommendation

### 5. POTENTIAL SAVINGS
Only claim savings that can be substantiated:
- Admin fee reductions: Compare to market rates
- Break clause value: Cost of early exit vs remaining obligation
- Service charge caps: Potential uncapped exposure

## Output Format
Return valid JSON matching the PortfolioAnalysis schema. No markdown, no explanations outside JSON.`;

export const SYNTHESIS_USER_PROMPT = `Analyze these lease extractions and generate a portfolio analysis. Return a single JSON object:

{
  "leases": [
    {
      "id": "string",
      "filename": "string",
      "property": "string (use property_address)",
      "landlord": "string",
      "tenant": "string",
      "annualRent": number,
      "termYears": number,
      "startDate": "ISO date",
      "riskScore": number 0-100,
      "riskLevel": "low" | "medium" | "high",
      "clauses": [
        {
          "id": "string (generate unique)",
          "category": "admin-fee" | "break-clause" | "repair" | "rent-review" | "pandemic" | "alienation" | "forfeiture" | "turnover-rent" | "promotion-levy" | "service-charge",
          "title": "string (human-readable title)",
          "text": "string (description)",
          "riskLevel": "low" | "medium" | "high",
          "value": "string or undefined",
          "clause_reference": "string (from extraction)"
        }
      ],
      "turnover_rent": { ... } or undefined,
      "promotion_levy": { ... } or undefined,
      "service_charge_cap": { ... } or undefined,
      "risk_calculation_logic": "string (from extraction)"
    }
  ],
  "insights": [
    {
      "id": "string (like 'insight-1')",
      "type": "clause-variance" | "leverage-discovery" | "exposure-risk",
      "severity": "info" | "warning" | "critical",
      "title": "string (concise title)",
      "description": "string (detailed explanation)",
      "affectedLeases": ["lease IDs"],
      "clauseCategory": "string (which clause category this relates to)",
      "potentialSavings": number or undefined,
      "recommendation": "string (specific action to take)"
    }
  ],
  "clauseComparisons": [
    {
      "category": "string",
      "displayName": "string (human-readable)",
      "values": [
        {
          "leaseId": "string",
          "value": "string (extracted value or 'Not present')",
          "riskLevel": "low" | "medium" | "high",
          "hasVariance": boolean
        }
      ]
    }
  ],
  "exposureAggregation": {
    "totalAnnualRent": number,
    "totalUncappedExposure": number,
    "portfolioRiskScore": number (rent-weighted average),
    "potentialSavings": number,
    "leaseCount": number,
    "highRiskCount": number,
    "mediumRiskCount": number,
    "lowRiskCount": number,
    "calculation_logic": "string showing the weighted formula"
  },
  "aiReasoning": [
    {
      "step": number (1-6),
      "action": "PARSE" | "EXTRACT" | "COMPARE" | "IDENTIFY" | "QUANTIFY" | "RECOMMEND",
      "detail": "string explaining what was done",
      "confidence": number 0-100
    }
  ]
}

CRITICAL REMINDERS:
1. calculation_logic in exposureAggregation MUST show the weighted average formula
2. Generate 3-7 insights (not more, not less)
3. Flag ALL variances where leases differ on the same clause type
4. Include clause_reference from the extraction in each clause
5. riskLevel thresholds: 0-40 = low, 41-70 = medium, 71-100 = high
6. If turnover_rent or promotion_levy exists in any lease, create an insight about it

Lease extractions to analyze:
---
`;
