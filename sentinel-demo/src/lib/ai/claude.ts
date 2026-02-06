import { getClaudeClient } from "./claude-client";
import { VALIDATION_SYSTEM_PROMPT, VALIDATION_USER_PROMPT } from "./prompts-validation";
import type { LeaseExtraction, ValidationReport, LeaseValidation } from "@/lib/types-extraction";

/**
 * Apply corrections from validation to extractions
 */
function applyCorrections(
  extractions: LeaseExtraction[],
  validations: LeaseValidation[]
): LeaseExtraction[] {
  const validationMap = new Map(validations.map((v) => [v.lease_id, v]));

  return extractions.map((extraction) => {
    const validation = validationMap.get(extraction.id);
    if (!validation || validation.verdict === "pass") {
      return extraction;
    }

    const corrected = { ...extraction };

    // Apply risk score correction
    if (validation.corrected_risk_score !== null) {
      corrected.risk_score = Math.min(95, validation.corrected_risk_score);
      corrected.risk_calculation_logic += ` [Auditor corrected from ${extraction.risk_score}]`;
    }

    // Apply confidence adjustment
    corrected.overall_confidence = Math.max(
      0,
      Math.min(100, corrected.overall_confidence + validation.confidence_adjustment)
    );

    // Append issue notes
    const issueNotes = validation.issues
      .filter((i) => i.severity === "error" || i.severity === "warning")
      .map((i) => `[Auditor] ${i.field_path}: ${i.description}`);

    corrected.extraction_notes = [...corrected.extraction_notes, ...issueNotes];

    return corrected;
  });
}

/**
 * Validate lease extractions using Claude Opus 4.6 via Vertex AI
 */
export async function validateExtractions(
  extractions: LeaseExtraction[]
): Promise<ValidationReport> {
  const client = getClaudeClient();

  console.log(`[Claude Validator] Validating ${extractions.length} extractions...`);

  const extractionsJson = JSON.stringify(extractions, null, 2);

  console.log(`[Claude Validator] Sending ${extractionsJson.length} chars to Claude Opus 4.6`);

  const response = await client.messages.create({
    model: "us.anthropic.claude-opus-4-5-20251101-v1:0",
    max_tokens: 16384,
    system: VALIDATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: VALIDATION_USER_PROMPT + extractionsJson,
      },
    ],
  });

  // Extract text from response
  const textBlock = response.content[0];
  if (textBlock.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  console.log(`[Claude Validator] Response received: ${textBlock.text.length} chars`);
  console.log(`[Claude Validator] Raw response preview: ${textBlock.text.substring(0, 500)}...`);

  // Parse JSON response
  const parsed = JSON.parse(textBlock.text) as {
    validations: LeaseValidation[];
    summary: ValidationReport["summary"];
  };

  console.log(`[Claude Validator] Validation complete:
    - ${parsed.summary.total_leases} leases validated
    - ${parsed.summary.passed} passed
    - ${parsed.summary.minor_issues} with minor issues
    - ${parsed.summary.major_issues} with major issues`);

  // Apply corrections to extractions
  const correctedExtractions = applyCorrections(extractions, parsed.validations);

  return {
    validations: parsed.validations,
    summary: parsed.summary,
    corrected_extractions: correctedExtractions,
  };
}
