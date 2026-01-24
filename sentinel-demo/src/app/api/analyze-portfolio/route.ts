// API Route: POST /api/analyze-portfolio
// Accepts multipart form data with PDF files, extracts text, and analyzes with Gemini

import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { analyzePortfolio, type LeaseDocument } from "@/lib/ai/gemini-portfolio";
import { mockPortfolioAnalysis } from "@/data/portfolioMock";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds for Gemini processing

/**
 * Extract text content from a PDF file using unpdf
 */
async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    console.log(`[API] Received ${files.length} files for analysis`);

    // Extract text from each PDF
    const leaseDocuments: LeaseDocument[] = [];

    for (const file of files) {
      try {
        console.log(`[API] Extracting text from: ${file.name} (${file.size} bytes)`);
        const content = await extractPdfText(file);
        console.log(`[API] Extracted ${content.length} characters from ${file.name}`);

        if (content.trim().length === 0) {
          console.warn(`[API] Warning: Empty content extracted from ${file.name}`);
        }

        leaseDocuments.push({
          filename: file.name,
          content: content.trim(),
        });
      } catch (extractError) {
        console.error(`[API] Failed to extract text from ${file.name}:`, extractError);
        // Continue with other files instead of failing completely
      }
    }

    if (leaseDocuments.length === 0) {
      console.error("[API] No valid documents extracted");
      return NextResponse.json(
        { error: "Could not extract text from any uploaded files" },
        { status: 400 }
      );
    }

    // Analyze portfolio with Gemini
    console.log(`[API] Starting Gemini analysis of ${leaseDocuments.length} documents`);
    const analysis = await analyzePortfolio(leaseDocuments);
    console.log("[API] Gemini analysis complete");

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[API] Portfolio analysis failed:", error);
    console.error("[API] Error details:", error instanceof Error ? error.stack : String(error));

    // Graceful fallback to mock data - demo must never fail
    console.log("[API] Falling back to mock data");

    // Add flag so frontend knows it's mock data
    return NextResponse.json({
      ...mockPortfolioAnalysis,
      _isMockFallback: true,
      _error: error instanceof Error ? error.message : String(error)
    });
  }
}
