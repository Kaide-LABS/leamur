import { NextRequest, NextResponse } from "next/server";
import { analyzeInvoice, type AIMode } from "@/lib/ai";
import { mockInvoice } from "@/data/invoice";
import { mockLeaseClause } from "@/data/lease";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mode: AIMode = body.mode === "live" ? "live" : "mock";

    // Analyze the mock invoice against the mock lease clause
    // In a real application, these would come from the request or database
    const result = await analyzeInvoice(mockInvoice, mockLeaseClause, mode);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);

    // Return a structured error response
    return NextResponse.json(
      {
        error: "Analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
