import type { ReasoningStep, AuditResult } from "@/lib/types";
import { mockInvoice } from "./invoice";
import { mockLeaseClause } from "./lease";

export const mockReasoningSteps: ReasoningStep[] = [
  {
    step: 1,
    action: "CATEGORIZE",
    detail: "Classified 'Facade Cleaning - External Window Wash' as exterior building maintenance",
    confidence: 0.96,
  },
  {
    step: 2,
    action: "RETRIEVE",
    detail: "Retrieved Clause 23.1(b) - Service Charge Exclusions from lease document",
    confidence: 0.94,
  },
  {
    step: 3,
    action: "ANALYZE",
    detail: "Parsing exclusion clause for applicable categories: structural, facade, improvements, negligence",
    confidence: 0.98,
  },
  {
    step: 4,
    action: "COMPARE",
    detail: "Comparing 'facade cleaning' against exclusion (iii): exterior facade, cladding, curtain walling",
    confidence: 0.97,
  },
  {
    step: 5,
    action: "MATCH",
    detail: "MATCH FOUND: 'External Window Wash' falls under 'cleaning' of 'exterior facade' per 23.1(b)(iii)",
    confidence: 0.95,
  },
  {
    step: 6,
    action: "CONCLUDE",
    detail: "Tenant should NOT be charged £12,000 for Facade Cleaning per lease exclusion clause 23.1(b)(iii)",
    confidence: 0.93,
  },
];

export const mockAuditResult: AuditResult = {
  anomalyDetected: true,
  flaggedItem: mockInvoice.lineItems.find((item) => item.id === 7) ?? null,
  clause: mockLeaseClause,
  reasoning: mockReasoningSteps,
  savings: 12000,
};
