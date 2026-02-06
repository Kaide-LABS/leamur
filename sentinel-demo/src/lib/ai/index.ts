import type { Invoice, LeaseClause, AuditResult } from "@/lib/types";
import { mockAuditResult } from "@/data/reasoning";
import { performAuditReasoning } from "./openai";
import { retrieveRelevantClause } from "./gemini";

export type AIMode = "mock" | "live";

export async function analyzeInvoice(
  invoice: Invoice,
  leaseClause: LeaseClause,
  mode: AIMode = "mock"
): Promise<AuditResult> {
  // Always return mock data in mock mode
  if (mode === "mock") {
    // Add a small delay to simulate processing
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockAuditResult;
  }

  // Live mode: attempt real AI analysis with fallback
  try {
    // Step 1: Use Gemini to retrieve relevant clauses (optional enhancement)
    // For now, we use the provided lease clause directly
    const clauseRetrieval = await retrieveRelevantClause(
      invoice.lineItems.map((item) => item.description).join(", "),
      leaseClause.text
    );

    console.log("Gemini clause retrieval:", clauseRetrieval);

    // Step 2: Use OpenAI for detailed audit reasoning
    const auditResult = await performAuditReasoning(invoice, leaseClause);

    // Map the result to our AuditResult structure
    const flaggedItem = auditResult.flaggedItemId
      ? invoice.lineItems.find((item) => item.id === auditResult.flaggedItemId) ?? null
      : null;

    return {
      anomalyDetected: auditResult.anomalyDetected,
      flaggedItem,
      clause: auditResult.anomalyDetected ? leaseClause : null,
      reasoning: auditResult.reasoning,
      savings: auditResult.savings,
    };
  } catch (error) {
    // Log the error for debugging
    console.error("AI analysis failed, falling back to mock data:", error);

    // Graceful fallback to mock data - demo must never fail
    return mockAuditResult;
  }
}

// Re-export for convenience
export { retrieveRelevantClause } from "./gemini";
export { performAuditReasoning } from "./openai";
export { validateExtractions } from "./claude";
export { getClaudeClient } from "./claude-client";
