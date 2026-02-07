import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import { getGeminiClient, GEMINI_MODEL } from '@/lib/ai/gemini-client';
import { EXTRACTION_SYSTEM_PROMPT, EXTRACTION_USER_PROMPT } from '@/lib/ai/prompts-extraction';
import type { LeaseExtraction } from '@/lib/types-extraction';

// In-memory cache for extraction results (avoids redundant API calls during testing)
const extractionCache = new Map<string, LeaseExtraction>();

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
    const MAX_ATTEMPTS = 2;

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
          temperature: 0.1,
          maxOutputTokens: 16384,
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
        try {
          extraction = JSON.parse(sanitized);
        } catch {
          console.warn(`[extract-lease] Attempt ${attempt}: standard parse failed, trying compacted`);
          const compacted = sanitized.replace(/\n/g, ' ').replace(/\s+/g, ' ');
          extraction = JSON.parse(compacted);
        }
        break; // success
      } catch (parseError) {
        lastError = parseError;
        console.warn(`[extract-lease] Attempt ${attempt}: parse failed: ${String(parseError).substring(0, 120)}`);
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

    if (extraction.risk_score > 95) {
      extraction.risk_score = 95;
      extraction.risk_calculation_logic += ' → capped at 95';
    }

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
