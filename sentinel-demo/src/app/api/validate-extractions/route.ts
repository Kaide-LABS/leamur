import { NextRequest, NextResponse } from 'next/server';
import { validateExtractions } from '@/lib/ai/claude';
import type { LeaseExtraction } from '@/lib/types-extraction';

export const maxDuration = 120; // 120s timeout for Claude Opus validation

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Parse request body early so it's available in catch block for fallback
  let extractions: LeaseExtraction[] | null = null;

  try {
    // Parse request body
    const body = await request.json();
    extractions = body.extractions as LeaseExtraction[];

    if (!extractions || !Array.isArray(extractions) || extractions.length === 0) {
      return NextResponse.json(
        { error: 'No extractions provided' },
        { status: 400 }
      );
    }

    console.log(`[validate-extractions] Validating ${extractions.length} lease extractions`);

    // Call Claude Opus for validation
    const report = await validateExtractions(extractions);

    const processingTimeMs = Date.now() - startTime;
    console.log(`[validate-extractions] Completed validation in ${processingTimeMs}ms`);

    return NextResponse.json({
      report,
      correctedExtractions: report.corrected_extractions,
      processingTimeMs
    });

  } catch (error) {
    console.error('[validate-extractions] Validation error:', error);

    // Graceful fallback — return original extractions unvalidated
    if (extractions && Array.isArray(extractions) && extractions.length > 0) {
      const processingTimeMs = Date.now() - startTime;
      console.warn(`[validate-extractions] Falling back to unvalidated extractions after ${processingTimeMs}ms`);

      return NextResponse.json({
        report: null,
        correctedExtractions: extractions,
        processingTimeMs,
        _fallback: true,
      });
    }

    return NextResponse.json(
      { error: 'Validation failed', details: String(error) },
      { status: 500 }
    );
  }
}
