"use client";

import { useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, Radar } from "lucide-react";

// Hooks
import { useRadarReducer } from "@/lib/hooks/useRadarReducer";

// Components
import { MultiDropZone } from "@/components/upload/MultiDropZone";
import { PortfolioLoadingScreen } from "@/components/processing/PortfolioLoadingScreen";
import { PortfolioDashboard } from "@/components/portfolio/PortfolioDashboard";

// Data & Types
import { mockPortfolioAnalysis } from "@/data/portfolioMock";
import type { PortfolioAnalysis } from "@/lib/types-radar";
import type { LeaseExtraction, ExtractionProgress } from "@/lib/types-extraction";

// Concurrency limit for map phase
const MAX_CONCURRENT_EXTRACTIONS = 5;

function RadarContent() {
  const searchParams = useSearchParams();
  // Default to live mode, use ?mock=true to switch to mock
  const isLiveMode = searchParams.get("mock") !== "true";

  const { state, actions } = useRadarReducer();
  const isCancelledRef = useRef(false);
  const isAnalyzingRef = useRef(false);

  // Handle file selection
  const handleFilesChange = useCallback(
    (files: File[]) => {
      actions.uploadFiles(files);
    },
    [actions]
  );

  // Play analysis sequence - mock mode with simulated phases
  const playMockSequence = useCallback(async (): Promise<PortfolioAnalysis | null> => {
    const phases = [
      { status: "Parsing lease documents...", delay: 1000 },
      { status: "Extracting key clauses...", delay: 1200 },
      { status: "Comparing across portfolio...", delay: 1500 },
      { status: "Identifying risk variances...", delay: 1200 },
      { status: "Quantifying exposure...", delay: 1000 },
      { status: "Generating recommendations...", delay: 800 },
    ];

    for (const phase of phases) {
      if (isCancelledRef.current) return null;
      actions.updateLoadingStatus(phase.status);
      await new Promise((r) => setTimeout(r, phase.delay));
    }

    return mockPortfolioAnalysis;
  }, [actions]);

  // Play analysis sequence - live mode with real API call (legacy monolithic approach)
  const playLiveSequence = useCallback(async () => {
    actions.updateLoadingStatus("Uploading lease documents...");

    // Create FormData with files
    const formData = new FormData();
    for (const file of state.selectedFiles) {
      formData.append("files", file);
    }

    actions.updateLoadingStatus("Extracting text from PDFs...");

    // Call the API
    const response = await fetch("/api/analyze-portfolio", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    actions.updateLoadingStatus("Analyzing with Gemini AI...");

    const analysis = await response.json();

    // Check if API fell back to mock data
    if (analysis._isMockFallback) {
      console.error("[RadarContent] API fell back to mock data. Error:", analysis._error);
    } else {
      console.log("[RadarContent] Got real Gemini analysis");
    }

    return analysis as PortfolioAnalysis;
  }, [actions, state.selectedFiles]);

  // Play Map-Reduce sequence - scalable architecture
  const playMapReduceSequence = useCallback(async (): Promise<PortfolioAnalysis | null> => {
    const files = state.selectedFiles;
    const totalFiles = files.length;

    // Initialize extraction progress
    const progress: ExtractionProgress = {
      phase: 'extracting',
      total_files: totalFiles,
      completed_files: 0,
      current_filename: files[0]?.name,
      successful_extractions: [],
      failed_files: [],
    };
    actions.updateExtractionProgress(progress);

    // Extract single file
    const extractFile = async (file: File): Promise<LeaseExtraction | null> => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/extract-lease', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        console.log(`[MapReduce] Extracted ${file.name}: risk=${result.extraction.risk_score}`);
        return result.extraction as LeaseExtraction;
      } catch (error) {
        console.error(`[MapReduce] Failed to extract ${file.name}:`, error);
        return null;
      }
    };

    // Process files with concurrency limit
    let extractions: LeaseExtraction[] = [];
    const failedFiles: { filename: string; error: string }[] = [];

    for (let i = 0; i < totalFiles; i += MAX_CONCURRENT_EXTRACTIONS) {
      if (isCancelledRef.current) return null;

      const batch = files.slice(i, i + MAX_CONCURRENT_EXTRACTIONS);
      const batchPromises = batch.map(extractFile);

      // Update progress for current batch
      actions.updateExtractionProgress({
        ...progress,
        completed_files: i,
        current_filename: batch[0]?.name,
        successful_extractions: [...extractions],
        failed_files: [...failedFiles],
      });

      const results = await Promise.all(batchPromises);

      results.forEach((result, idx) => {
        const file = batch[idx];
        if (result) {
          extractions.push(result);
        } else {
          failedFiles.push({ filename: file.name, error: 'Extraction failed' });
        }
      });
    }

    // Check if we have enough successful extractions to continue
    if (extractions.length === 0) {
      actions.analysisError('All extractions failed', []);
      return null;
    }

    // Update progress - extraction complete
    actions.extractionComplete(extractions);
    console.log(`[MapReduce] Extraction complete: ${extractions.length}/${totalFiles} successful`);

    // === VALIDATION PHASE (Claude Opus 4.6) ===
    if (isCancelledRef.current) return null;
    actions.validationStarted();

    try {
      const validationResponse = await fetch('/api/validate-extractions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractions }),
      });

      if (validationResponse.ok) {
        const { correctedExtractions, report } = await validationResponse.json();
        actions.validationComplete({ correctedExtractions, report });
        extractions = correctedExtractions; // Use corrected for synthesis
      } else {
        console.warn('[MapReduce] Validation failed, proceeding unvalidated');
        actions.validationComplete({ correctedExtractions: extractions, report: null });
      }
    } catch (error) {
      console.warn('[MapReduce] Validation error:', error);
      actions.validationComplete({ correctedExtractions: extractions, report: null });
    }

    // Start synthesis phase
    if (isCancelledRef.current) return null;
    actions.synthesisStarted();

    try {
      const synthesisResponse = await fetch('/api/synthesize-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractions }),
      });

      if (!synthesisResponse.ok) {
        const errorData = await synthesisResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${synthesisResponse.status}`);
      }

      const { analysis } = await synthesisResponse.json();
      console.log(`[MapReduce] Synthesis complete: ${analysis.insights.length} insights generated`);

      // Add warning if some files failed
      if (failedFiles.length > 0) {
        analysis._warnings = [`${failedFiles.length} file(s) could not be processed`];
        analysis._failedFiles = failedFiles;
      }

      return analysis as PortfolioAnalysis;
    } catch (error) {
      console.error('[MapReduce] Synthesis failed:', error);
      actions.analysisError(`Synthesis failed: ${error}`, extractions);
      return null;
    }
  }, [actions, state.selectedFiles]);

  // Main analysis sequence
  const playAnalysisSequence = useCallback(async () => {
    isCancelledRef.current = false;

    // Read live mode directly from URL to avoid stale closure issues
    // Default to live mode, use ?mock=true to switch to mock
    const urlParams = new URLSearchParams(window.location.search);
    const isLive = urlParams.get("mock") !== "true";

    console.log("[RadarContent] isLive (from URL):", isLive, "(default is live, use ?mock=true for mock)");

    try {
      let analysis: PortfolioAnalysis | null;

      if (isLive) {
        // Use Map-Reduce architecture for scalable processing
        console.log("[RadarContent] Live mode - using Map-Reduce sequence");
        analysis = await playMapReduceSequence();
      } else {
        console.log("[RadarContent] Mock mode - using simulated data");
        analysis = await playMockSequence();
      }

      // Complete with analysis data (if not cancelled)
      if (!isCancelledRef.current && analysis) {
        actions.completeAnalysis(analysis);
      }
    } catch (error) {
      console.error("[RadarContent] Analysis failed:", error);
      // Fallback to mock data on error
      if (!isCancelledRef.current) {
        actions.completeAnalysis(mockPortfolioAnalysis);
      }
    }

    isAnalyzingRef.current = false;
  }, [actions, playMapReduceSequence, playMockSequence]);

  // Handle analyze button with debouncing
  const handleAnalyze = useCallback(() => {
    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;
    actions.startAnalysis();
  }, [actions]);

  // Handle reset
  const handleReset = useCallback(() => {
    isCancelledRef.current = true;
    isAnalyzingRef.current = false;
    actions.reset();
  }, [actions]);

  // Start analysis sequence when entering PROCESSING state
  useEffect(() => {
    if (state.appState === "PROCESSING") {
      playAnalysisSequence();
    }
  }, [state.appState, playAnalysisSequence]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Leamur Logo */}
              <img
                src="/leamur-logo.svg"
                alt="Leamur"
                className="h-8 w-auto"
              />
              {/* Divider */}
              <div className="h-8 w-px bg-slate/20" />
              {/* Product Name */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent/10">
                  <Radar className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-navy">
                    Sentinel Radar
                  </h1>
                  <p className="text-xs text-slate">Portfolio Intelligence</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Reset Button (only in RESULTS) */}
              {state.appState === "RESULTS" && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate/10 hover:bg-slate/20 text-sm font-medium text-navy transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  New Analysis
                </motion.button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content - State-based Rendering */}
        <AnimatePresence mode="wait">
          {/* IDLE State - Show MultiDropZone */}
          {state.appState === "IDLE" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <div className="w-full max-w-lg">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-navy mb-2">
                    Analyze Your Lease Portfolio
                  </h2>
                  <p className="text-sm text-slate">
                    Upload up to 20 lease documents to discover variances, risks, and
                    savings opportunities across your portfolio
                  </p>
                </div>
                <MultiDropZone
                  onFilesChange={handleFilesChange}
                  onAnalyze={handleAnalyze}
                  maxFiles={20}
                  minFiles={2}
                />
              </div>
            </motion.div>
          )}

          {/* PROCESSING State - Show PortfolioLoadingScreen */}
          {state.appState === "PROCESSING" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <PortfolioLoadingScreen
                status={state.loadingStatus}
                extractionProgress={state.extractionProgress}
              />
            </motion.div>
          )}

          {/* RESULTS State - Show PortfolioDashboard */}
          {state.appState === "RESULTS" && state.portfolioAnalysis && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PortfolioDashboard
                analysis={state.portfolioAnalysis}
                highlightedLeaseId={state.highlightedLeaseId}
                highlightedInsightId={state.highlightedInsightId}
                isReasoningExpanded={state.isReasoningExpanded}
                onLeaseClick={actions.setHighlightedLease}
                onInsightClick={actions.setHighlightedInsight}
                onToggleReasoning={actions.toggleReasoning}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate/10 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <img
                src="/leamur-logo.svg"
                alt="Leamur"
                className="h-6 w-auto opacity-60"
              />
              <span className="text-xs text-slate/60">Powered by Leamur.ai</span>
            </div>
            <p className="text-xs text-slate/50">
              The AI-powered Operating System for commercial tenants
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Wrap in Suspense for any future useSearchParams usage
export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
          <img
            src="/leamur-logo.svg"
            alt="Leamur"
            className="h-10 w-auto animate-pulse"
          />
          <div className="text-slate text-sm">Loading...</div>
        </div>
      }
    >
      <RadarContent />
    </Suspense>
  );
}
