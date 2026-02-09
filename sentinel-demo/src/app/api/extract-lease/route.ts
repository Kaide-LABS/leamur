import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import { getGeminiClient, GEMINI_MODEL } from '@/lib/ai/gemini-client';
import { EXTRACTION_SYSTEM_PROMPT, EXTRACTION_USER_PROMPT } from '@/lib/ai/prompts-extraction';
import { EXTRACTION_JSON_SCHEMA } from '@/lib/ai/schema-extraction';
import type { LeaseExtraction } from '@/lib/types-extraction';
import { calculateRiskScore } from '@/lib/ai/calculate-risk-score';

// In-memory cache for extraction results (avoids redundant API calls during testing)
const extractionCache = new Map<string, LeaseExtraction>();

/**
 * Attempt to repair malformed JSON from Gemini.
 * Handles: trailing commas, truncated output (unclosed braces/brackets/strings).
 */
function repairJson(text: string): string {
  let repaired = text;

  // Remove trailing commas before } or ]
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');

  // Walk the string to detect unclosed structures
  let inString = false;
  let escaped = false;
  let braces = 0;
  let brackets = 0;

  for (const char of repaired) {
    if (escaped) { escaped = false; continue; }
    if (char === '\\') { escaped = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (char === '{') braces++;
    if (char === '}') braces--;
    if (char === '[') brackets++;
    if (char === ']') brackets--;
  }

  // If stuck inside a string value, close it
  if (inString) {
    // Truncate back to the last complete key-value before the broken string
    const lastGoodComma = repaired.lastIndexOf(',');
    const lastGoodBrace = repaired.lastIndexOf('}');
    const cutPoint = Math.max(lastGoodComma, lastGoodBrace);
    if (cutPoint > repaired.length * 0.5) {
      repaired = repaired.substring(0, cutPoint + 1);
      // Re-count after truncation
      inString = false; escaped = false; braces = 0; brackets = 0;
      for (const char of repaired) {
        if (escaped) { escaped = false; continue; }
        if (char === '\\') { escaped = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (char === '{') braces++;
        if (char === '}') braces--;
        if (char === '[') brackets++;
        if (char === ']') brackets--;
      }
    } else {
      repaired += '"';
    }
  }

  // Close unclosed brackets then braces
  while (brackets > 0) { repaired += ']'; brackets--; }
  while (braces > 0) { repaired += '}'; braces--; }

  return repaired;
}

// Generate cache key from filename and size
function getCacheKey(filename: string, size: number): string {
  return `${filename}:${size}`;
}

export const maxDuration = 60; // 60s timeout for single lease extraction

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Initialize Gemini client (supports Vertex AI and API key)
    let ai;
    try {
      ai = getGeminiClient();
    } catch (configError) {
      console.error('[extract-lease] Gemini client init failed:', configError);
      return NextResponse.json(
        { error: 'Gemini AI not configured', details: String(configError) },
        { status: 500 }
      );
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`[extract-lease] Processing: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    // Check cache first
    const cacheKey = getCacheKey(file.name, file.size);
    const cachedResult = extractionCache.get(cacheKey);
    if (cachedResult) {
      console.log(`[extract-lease] Cache hit for ${file.name}`);
      return NextResponse.json({
        extraction: cachedResult,
        cached: true,
        processingTimeMs: Date.now() - startTime
      });
    }

    // Extract text from PDF
    let leaseText: string;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const { text } = await extractText(uint8Array);
      // unpdf returns string[] (one per page), join them
      leaseText = Array.isArray(text) ? text.join('\n\n') : text;

      if (!leaseText || leaseText.trim().length < 100) {
        return NextResponse.json(
          { error: 'Could not extract sufficient text from PDF' },
          { status: 400 }
        );
      }

      console.log(`[extract-lease] Extracted ${leaseText.length} chars from ${file.name}`);
    } catch (pdfError) {
      console.error('[extract-lease] PDF extraction failed:', pdfError);
      return NextResponse.json(
        { error: 'Failed to extract text from PDF', details: String(pdfError) },
        { status: 400 }
      );
    }

    // Build the prompt
    const fullPrompt = EXTRACTION_USER_PROMPT + leaseText;

    // Call Gemini with retry — Gemini sometimes produces malformed JSON
    console.log(`[extract-lease] Calling Gemini for ${file.name}...`);

    let extraction: LeaseExtraction | null = null;
    let lastError: unknown = null;
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [{ text: fullPrompt }]
          }
        ],
        config: {
          systemInstruction: EXTRACTION_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseJsonSchema: EXTRACTION_JSON_SCHEMA,
          temperature: 0.1,
          maxOutputTokens: 32768,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        lastError = new Error('Empty response from Gemini');
        console.warn(`[extract-lease] Attempt ${attempt}: empty response`);
        continue;
      }

      try {
        let text = responseText.trim();
        if (text.startsWith('```')) {
          text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
        }
        const sanitized = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        // Try 1: direct parse
        try {
          extraction = JSON.parse(sanitized);
        } catch {
          // Try 2: compact (collapse whitespace)
          const compacted = sanitized.replace(/\n/g, ' ').replace(/\s+/g, ' ');
          try {
            extraction = JSON.parse(compacted);
          } catch (compactError) {
            // Log context around failure position for debugging
            const match = String(compactError).match(/position (\d+)/);
            if (match) {
              const pos = parseInt(match[1]);
              console.warn(`[extract-lease] Attempt ${attempt}: JSON error near position ${pos}: ...${compacted.substring(Math.max(0, pos - 60), pos + 60)}...`);
            }
            // Try 3: repair truncated/malformed JSON
            console.warn(`[extract-lease] Attempt ${attempt}: compacted parse failed, trying repair`);
            const repaired = repairJson(compacted);
            extraction = JSON.parse(repaired);
          }
        }
        break; // success
      } catch (parseError) {
        lastError = parseError;
        console.warn(`[extract-lease] Attempt ${attempt}: all parse strategies failed: ${String(parseError).substring(0, 150)}`);
      }
    }

    if (!extraction) {
      console.error('[extract-lease] All parse attempts failed:', lastError);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: String(lastError) },
        { status: 500 }
      );
    }

    // Ensure required fields
    extraction.filename = file.name;
    extraction.extraction_timestamp = new Date().toISOString();

    // Override LLM risk score with deterministic calculation
    const riskResult = calculateRiskScore(extraction);
    extraction.risk_score = riskResult.score;
    extraction.risk_calculation_logic = riskResult.logic;

    console.log(`[extract-lease] Extracted ${file.name}: risk=${extraction.risk_score}, confidence=${extraction.overall_confidence}`);

    // Cache the result
    extractionCache.set(cacheKey, extraction);

    const processingTimeMs = Date.now() - startTime;
    console.log(`[extract-lease] Completed ${file.name} in ${processingTimeMs}ms`);

    return NextResponse.json({
      extraction,
      cached: false,
      processingTimeMs
    });

  } catch (error) {
    console.error('[extract-lease] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Extraction failed', details: String(error) },
      { status: 500 }
    );
  }
}
