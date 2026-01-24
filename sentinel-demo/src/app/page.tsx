"use client";

import { useRef, useEffect, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, Radar } from "lucide-react";

// Hooks
import { useRadarReducer } from "@/lib/hooks/useRadarReducer";

// Components
import { MultiDropZone } from "@/components/upload/MultiDropZone";
import { PortfolioLoadingScreen } from "@/components/processing/PortfolioLoadingScreen";
import { PortfolioDashboard } from "@/components/portfolio/PortfolioDashboard";

// Data
import { mockPortfolioAnalysis } from "@/data/portfolioMock";

function RadarContent() {
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

  // Play analysis sequence
  const playAnalysisSequence = useCallback(async () => {
    isCancelledRef.current = false;

    // Simulate processing phases with status updates
    const phases = [
      { status: "Parsing lease documents...", delay: 1000 },
      { status: "Extracting key clauses...", delay: 1200 },
      { status: "Comparing across portfolio...", delay: 1500 },
      { status: "Identifying risk variances...", delay: 1200 },
      { status: "Quantifying exposure...", delay: 1000 },
      { status: "Generating recommendations...", delay: 800 },
    ];

    for (const phase of phases) {
      if (isCancelledRef.current) return;
      actions.updateLoadingStatus(phase.status);
      await new Promise((r) => setTimeout(r, phase.delay));
    }

    // Complete with mock data
    if (!isCancelledRef.current) {
      actions.completeAnalysis(mockPortfolioAnalysis);
    }

    isAnalyzingRef.current = false;
  }, [actions]);

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
                    Upload 3 lease documents to discover variances, risks, and
                    savings opportunities across your portfolio
                  </p>
                </div>
                <MultiDropZone
                  onFilesChange={handleFilesChange}
                  onAnalyze={handleAnalyze}
                  maxFiles={3}
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
              <PortfolioLoadingScreen status={state.loadingStatus} />
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
