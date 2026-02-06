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

    // Call Gemini 2.5 Flash
    console.log(`[extract-lease] Calling Gemini for ${file.name}...`);
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
        temperature: 0.2, // Low temperature for consistent extraction
        maxOutputTokens: 8192, // Enough for detailed extraction
      }
    });

    // Extract text from response
    const responseText = response.text;
    if (!responseText) {
      console.error('[extract-lease] Empty response from Gemini');
      return NextResponse.json(
        { error: 'Empty response from AI' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let extraction: LeaseExtraction;
    try {
      extraction = JSON.parse(responseText);

      // Ensure required fields
      extraction.filename = file.name;
      extraction.extraction_timestamp = new Date().toISOString();

      // Validate risk score cap
      if (extraction.risk_score > 95) {
        extraction.risk_score = 95;
        extraction.risk_calculation_logic += ' → capped at 95';
      }

      console.log(`[extract-lease] Extracted ${file.name}: risk=${extraction.risk_score}, confidence=${extraction.overall_confidence}`);
    } catch (parseError) {
      console.error('[extract-lease] Failed to parse Gemini response:', parseError);
      console.error('[extract-lease] Raw response:', responseText.substring(0, 500));
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: String(parseError) },
        { status: 500 }
      );
    }

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
