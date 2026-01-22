import OpenAI from "openai";
import { buildAuditReasoningPrompt } from "./prompts";
import type { Invoice, LeaseClause, ReasoningStep } from "@/lib/types";

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
};

interface AuditReasoningResult {
  anomalyDetected: boolean;
  reasoning: ReasoningStep[];
  flaggedItemId: number | null;
  savings: number;
  conclusion: string;
}

export async function performAuditReasoning(
  invoice: Invoice,
  leaseClause: LeaseClause
): Promise<AuditReasoningResult> {
  const openai = getOpenAIClient();
  const prompt = buildAuditReasoningPrompt(invoice, leaseClause);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a commercial lease auditor. Analyze invoices against lease exclusion clauses to identify invalid charges. Always respond with valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const result = JSON.parse(content) as AuditReasoningResult;

  // Ensure reasoning steps have the correct structure
  result.reasoning = result.reasoning.map((step, index) => ({
    step: index + 1,
    action: step.action,
    detail: step.detail,
    confidence: step.confidence ?? 0.9,
  }));

  return result;
}
