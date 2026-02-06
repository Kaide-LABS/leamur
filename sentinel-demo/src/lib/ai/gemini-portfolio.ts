// Gemini Portfolio Analysis Function
// Uses Gemini 2.5 Flash for multi-lease comparison

import { getGeminiClient } from "./gemini-client";
import type { PortfolioAnalysis } from "@/lib/types-radar";
import { buildPortfolioAnalysisPrompt } from "./prompts-portfolio";

export interface LeaseDocument {
  filename: string;
  content: string;
}

/**
 * Analyze a portfolio of lease documents using Gemini 2.5 Flash
 *
 * @param leaseDocuments - Array of lease documents with filename and extracted text
 * @returns PortfolioAnalysis - Structured analysis matching the PortfolioAnalysis type
 */
export async function analyzePortfolio(
  leaseDocuments: LeaseDocument[]
): Promise<PortfolioAnalysis> {
  if (leaseDocuments.length === 0) {
    throw new Error("No lease documents provided");
  }

  const ai = getGeminiClient();
  const prompt = buildPortfolioAnalysisPrompt(leaseDocuments);

  console.log(`[Gemini Portfolio] Analyzing ${leaseDocuments.length} leases...`);
  console.log(`[Gemini Portfolio] Total content length: ${prompt.length} characters`);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      // Note: responseSchema removed due to Gemini's max nesting depth limit
      // The detailed prompt ensures correct JSON structure
      responseMimeType: "application/json",
    },
  });

  // Extract text from response
  const text = response.text;
  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  console.log(`[Gemini Portfolio] Response received: ${text.length} characters`);
  console.log(`[Gemini Portfolio] Raw response preview: ${text.substring(0, 500)}...`);

  // Parse and validate JSON response
  let result: PortfolioAnalysis;
  try {
    result = JSON.parse(text) as PortfolioAnalysis;
  } catch (parseError) {
    console.error(`[Gemini Portfolio] JSON parse error. Raw text:`, text.substring(0, 1000));
    throw new Error(`Failed to parse Gemini response as JSON: ${parseError}`);
  }

  console.log(`[Gemini Portfolio] Parsed result keys:`, Object.keys(result));

  // Basic validation
  if (!result.leases || !Array.isArray(result.leases)) {
    throw new Error("Invalid response: missing leases array");
  }
  if (!result.insights || !Array.isArray(result.insights)) {
    throw new Error("Invalid response: missing insights array");
  }
  if (!result.clauseComparisons || !Array.isArray(result.clauseComparisons)) {
    throw new Error("Invalid response: missing clauseComparisons array");
  }
  if (!result.exposureAggregation) {
    throw new Error("Invalid response: missing exposureAggregation");
  }
  if (!result.aiReasoning || !Array.isArray(result.aiReasoning)) {
    throw new Error("Invalid response: missing aiReasoning array");
  }

  console.log(`[Gemini Portfolio] Analysis complete:
    - ${result.leases.length} leases extracted
    - ${result.insights.length} insights identified
    - ${result.clauseComparisons.length} clause categories compared
    - Portfolio risk score: ${result.exposureAggregation.portfolioRiskScore}`);

  return result;
}
