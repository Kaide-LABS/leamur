import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { SYNTHESIS_SYSTEM_PROMPT, SYNTHESIS_USER_PROMPT } from '@/lib/ai/prompts-synthesis';
import type { LeaseExtraction } from '@/lib/types-extraction';
import type { PortfolioAnalysis } from '@/lib/types-radar';

export const maxDuration = 120; // 120s timeout for synthesis

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[synthesize-portfolio] Missing GEMINI_API_KEY');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
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

    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey });

    // Build the prompt with extractions
    const extractionsJson = JSON.stringify(extractions, null, 2);
    const fullPrompt = SYNTHESIS_USER_PROMPT + extractionsJson;

    // Call Gemini 2.5 Flash
    console.log('[synthesize-portfolio] Calling Gemini for synthesis...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }]
        }
      ],
      config: {
        systemInstruction: SYNTHESIS_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.3, // Slightly higher for creative insights
        maxOutputTokens: 16384, // Large output for full analysis
      }
    });

    // Extract text from response
    const responseText = response.text;
    if (!responseText) {
      console.error('[synthesize-portfolio] Empty response from Gemini');
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
        console.warn('[synthesize-portfolio] Too few insights, Gemini returned:', analysis.insights.length);
      }
      if (analysis.insights.length > 7) {
        console.warn('[synthesize-portfolio] Too many insights, trimming to 7');
        analysis.insights = analysis.insights.slice(0, 7);
      }

      console.log(`[synthesize-portfolio] Generated ${analysis.insights.length} insights, portfolio risk: ${analysis.exposureAggregation.portfolioRiskScore}`);
    } catch (parseError) {
      console.error('[synthesize-portfolio] Failed to parse Gemini response:', parseError);
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
