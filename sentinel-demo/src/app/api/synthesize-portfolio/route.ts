import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SYNTHESIS_SYSTEM_PROMPT, SYNTHESIS_USER_PROMPT } from '@/lib/ai/prompts-synthesis';
import type { LeaseExtraction } from '@/lib/types-extraction';
import type { PortfolioAnalysis } from '@/lib/types-radar';

export const maxDuration = 120; // 120s timeout for synthesis

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[synthesize-portfolio] Missing OPENAI_API_KEY');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const extractions = body.extractions as LeaseExtraction[];

    if (!extractions || !Array.isArray(extractions) || extractions.length === 0) {
      return NextResponse.json(
        { error: 'No extractions provided' },
        { status: 400 }
      );
    }

    console.log(`[synthesize-portfolio] Synthesizing ${extractions.length} lease extractions`);

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });

    // Build the prompt with extractions
    const extractionsJson = JSON.stringify(extractions);

    // Call GPT-5.2 for synthesis via Responses API (xhigh reasoning effort)
    console.log('[synthesize-portfolio] Calling OpenAI GPT-5.2 for synthesis...');
    const response = await openai.responses.create({
      model: 'gpt-5.2',
      instructions: SYNTHESIS_SYSTEM_PROMPT,
      input: SYNTHESIS_USER_PROMPT + extractionsJson,
      text: {
        format: {
          type: 'json_object',
        },
      },
      reasoning: {
        effort: 'low',
      },
      max_output_tokens: 16384,
      store: true,
    });

    // Extract text from response
    console.log(`[synthesize-portfolio] Response status: ${response.status}, output items: ${response.output?.length ?? 0}`);
    for (const item of response.output ?? []) {
      console.log(`[synthesize-portfolio] Output item: type=${item.type}, ${item.type === 'message' ? `content_types=${item.content?.map((c: { type: string }) => c.type).join(',')}` : ''}`);
    }
    const responseText = response.output_text;
    if (!responseText) {
      console.error('[synthesize-portfolio] Empty output_text from OpenAI');
      console.error('[synthesize-portfolio] Full response keys:', Object.keys(response));
      return NextResponse.json(
        { error: 'Empty response from AI' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let analysis: PortfolioAnalysis;
    try {
      analysis = JSON.parse(responseText);

      // Validate required fields
      if (!analysis.leases || !analysis.insights || !analysis.exposureAggregation) {
        throw new Error('Missing required fields in analysis');
      }

      // Ensure insight count is within bounds (3-7)
      if (analysis.insights.length < 3) {
        console.warn('[synthesize-portfolio] Too few insights, OpenAI returned:', analysis.insights.length);
      }
      if (analysis.insights.length > 7) {
        console.warn('[synthesize-portfolio] Too many insights, trimming to 7');
        analysis.insights = analysis.insights.slice(0, 7);
      }

      // Recalculate portfolio risk score deterministically from lease data
      const totalWeightedRisk = analysis.leases.reduce(
        (sum, l) => sum + l.annualRent * l.riskScore, 0
      );
      const totalRent = analysis.leases.reduce(
        (sum, l) => sum + l.annualRent, 0
      );
      if (totalRent > 0) {
        analysis.exposureAggregation.portfolioRiskScore =
          Math.round((totalWeightedRisk / totalRent) * 100) / 100;
      }

      // Recalculate risk level counts from lease data
      analysis.exposureAggregation.highRiskCount = analysis.leases.filter(
        (l) => l.riskLevel === 'high'
      ).length;
      analysis.exposureAggregation.mediumRiskCount = analysis.leases.filter(
        (l) => l.riskLevel === 'medium'
      ).length;
      analysis.exposureAggregation.lowRiskCount = analysis.leases.filter(
        (l) => l.riskLevel === 'low'
      ).length;

      console.log(`[synthesize-portfolio] Generated ${analysis.insights.length} insights, portfolio risk: ${analysis.exposureAggregation.portfolioRiskScore}`);
    } catch (parseError) {
      console.error('[synthesize-portfolio] Failed to parse OpenAI response:', parseError);
      console.error('[synthesize-portfolio] Raw response:', responseText.substring(0, 1000));
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: String(parseError) },
        { status: 500 }
      );
    }

    const processingTimeMs = Date.now() - startTime;
    console.log(`[synthesize-portfolio] Completed synthesis in ${processingTimeMs}ms`);

    return NextResponse.json({
      analysis,
      processingTimeMs
    });

  } catch (error) {
    console.error('[synthesize-portfolio] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Synthesis failed', details: String(error) },
      { status: 500 }
    );
  }
}
