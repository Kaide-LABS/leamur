import type { Invoice, LeaseClause } from "@/lib/types";

export const CLAUSE_RETRIEVAL_PROMPT = `You are a legal document analyzer specializing in commercial lease agreements.

Given an invoice line item description, identify which lease clause(s) might be relevant for determining if the charge is valid.

Focus on:
- Service charge exclusions
- Tenant liability limitations
- Cost recovery provisions
- Maintenance and repair obligations

Return your analysis in JSON format:
{
  "relevantClauses": [
    {
      "clauseNumber": "string",
      "title": "string",
      "relevance": "string explaining why this clause applies"
    }
  ],
  "confidence": 0.0-1.0
}`;

export const AUDIT_REASONING_PROMPT = `You are a commercial lease auditor performing a detailed analysis of service charge validity.

Your task is to determine if an invoice line item is a valid charge based on the lease exclusion clauses.

Analyze step by step:
1. CATEGORIZE the invoice item into a service type
2. RETRIEVE the most applicable lease clause
3. ANALYZE the clause for exclusion criteria
4. COMPARE the invoice item against exclusion criteria
5. MATCH or determine no match exists
6. CONCLUDE with a determination

Return your analysis in JSON format:
{
  "anomalyDetected": boolean,
  "reasoning": [
    {
      "step": 1-6,
      "action": "CATEGORIZE" | "RETRIEVE" | "ANALYZE" | "COMPARE" | "MATCH" | "CONCLUDE",
      "detail": "string",
      "confidence": 0.0-1.0
    }
  ],
  "flaggedItemId": number | null,
  "savings": number,
  "conclusion": "string"
}`;

export function buildClauseRetrievalPrompt(
  lineItemDescription: string,
  leaseText: string
): string {
  return `${CLAUSE_RETRIEVAL_PROMPT}

LEASE DOCUMENT:
${leaseText}

INVOICE LINE ITEM:
${lineItemDescription}

Analyze this line item and identify relevant lease clauses.`;
}

export function buildAuditReasoningPrompt(
  invoice: Invoice,
  leaseClause: LeaseClause
): string {
  const lineItemsText = invoice.lineItems
    .map((item) => `- ID ${item.id}: ${item.description} (£${item.amount.toLocaleString()})`)
    .join("\n");

  return `${AUDIT_REASONING_PROMPT}

INVOICE DETAILS:
Property: ${invoice.property}
Period: ${invoice.period}
Total: £${invoice.totalAmount.toLocaleString()}

LINE ITEMS:
${lineItemsText}

LEASE EXCLUSION CLAUSE ${leaseClause.clauseNumber}:
${leaseClause.text}

Analyze each line item against this exclusion clause and identify any invalid charges.`;
}
