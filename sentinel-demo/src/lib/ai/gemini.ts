import { getGeminiClient } from "./gemini-client";
import { buildClauseRetrievalPrompt } from "./prompts";
import type { LeaseClause } from "@/lib/types";

interface ClauseRetrievalResult {
  relevantClauses: Array<{
    clauseNumber: string;
    title: string;
    relevance: string;
  }>;
  confidence: number;
}

export async function retrieveRelevantClause(
  lineItemDescription: string,
  leaseText: string
): Promise<ClauseRetrievalResult> {
  const ai = getGeminiClient();
  const prompt = buildClauseRetrievalPrompt(lineItemDescription, leaseText);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  // Extract text from response
  const text = response.text;
  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  // Parse JSON response
  const result = JSON.parse(text) as ClauseRetrievalResult;
  return result;
}

export async function analyzeClauseApplicability(
  lineItemDescription: string,
  clause: LeaseClause
): Promise<{
  isExcluded: boolean;
  matchedParagraph: string | null;
  confidence: number;
}> {
  const ai = getGeminiClient();

  const prompt = `Analyze if this invoice line item is excluded by the lease clause.

LINE ITEM: ${lineItemDescription}

LEASE CLAUSE ${clause.clauseNumber} - ${clause.title}:
${clause.text}

Return JSON:
{
  "isExcluded": boolean,
  "matchedParagraph": "the specific paragraph text that excludes this item, or null",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  return JSON.parse(text);
}
