"use client";

import { useRef, useEffect, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, Zap, Shield } from "lucide-react";

// Hooks
import { useDemoReducer } from "@/lib/hooks/useDemoReducer";
import { useAIMode } from "@/lib/hooks/useAIMode";

// Components
import { DropZone } from "@/components/upload/DropZone";
import { LoadingScreen } from "@/components/processing/LoadingScreen";
import { DocumentStage } from "@/components/document/DocumentStage";
import { InvoiceView } from "@/components/document/InvoiceView";
import { LeaseView } from "@/components/document/LeaseView";
import { AuditPanel } from "@/components/audit/AuditPanel";
import { AnomalyAlert } from "@/components/audit/AnomalyAlert";
import { ReasoningPanel } from "@/components/audit/ReasoningPanel";
import { SavingsCounter } from "@/components/dashboard/SavingsCounter";
import { SavingsTimeline } from "@/components/dashboard/SavingsTimeline";
import { DisputeModal } from "@/components/actions/DisputeModal";

// Data
import { mockInvoice } from "@/data/invoice";
import { mockLeaseClause } from "@/data/lease";
import { mockLogs } from "@/data/logs";
import { mockTimelineData } from "@/data/timeline";

import type { AuditResult } from "@/lib/types";

function DemoContent() {
  const aiMode = useAIMode();
  const { state, actions } = useDemoReducer(aiMode);
  const isCancelledRef = useRef(false);
  const isAnalyzingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (file) {
        actions.uploadFile(file);
      }
    },
    [actions]
  );

  // Play log sequence with cancellation support
  const playLogSequence = useCallback(async () => {
    isCancelledRef.current = false;

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    // Simulate processing phases with status updates
    const phases = [
      { status: "Processing invoice...", delay: 800 },
      { status: "Extracting line items...", delay: 1000 },
      { status: "Querying lease documents...", delay: 1200 },
      { status: "Analyzing against exclusion clauses...", delay: 1500 },
      { status: "Finalizing results...", delay: 800 },
    ];

    for (const phase of phases) {
      if (isCancelledRef.current) return;
      actions.updateLoadingStatus(phase.status);
      await new Promise((r) => setTimeout(r, phase.delay));
    }

    // After phases complete, call API
    if (!isCancelledRef.current) {
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: aiMode }),
          signal: abortControllerRef.current.signal,
        });
        const result: AuditResult = await response.json();
        if (!isCancelledRef.current) {
          actions.completeAnalysis(result);
        }
      } catch (error) {
        // Ignore AbortError - expected when request is cancelled
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Analysis failed:", error);
        // Import and use mock data as fallback
        const { mockAuditResult } = await import("@/data/reasoning");
        if (!isCancelledRef.current) {
          actions.completeAnalysis(mockAuditResult);
        }
      }
    }
    // Reset analyzing flag when complete
    isAnalyzingRef.current = false;
  }, [actions, aiMode]);

  // Handle analyze button with debouncing
  const handleAnalyze = useCallback(() => {
    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;
    actions.startAnalysis();
  }, [actions]);

  // Handle reset - abort any in-flight requests
  const handleReset = useCallback(() => {
    // Abort any pending API request
    abortControllerRef.current?.abort();
    isCancelledRef.current = true;
    isAnalyzingRef.current = false;
    actions.reset();
  }, [actions]);

  // Start log playback when entering PROCESSING state
  useEffect(() => {
    if (state.appState === "PROCESSING") {
      playLogSequence();
    }
  }, [state.appState, playLogSequence]);

  return (
    <main className="min-h-screen bg-background">
      {/* Anomaly Alert */}
      <AnomalyAlert
        isVisible={state.isAnomalyAlertVisible}
        flaggedItem={state.auditResult?.flaggedItem ?? null}
        clause={state.auditResult?.clause ?? null}
        savings={state.auditResult?.savings ?? 0}
        onDismiss={actions.dismissAnomalyAlert}
        onViewDetails={actions.dismissAnomalyAlert}
      />

      {/* Dispute Modal */}
      {state.auditResult?.flaggedItem && state.auditResult?.clause && (
        <DisputeModal
          isOpen={state.isDisputeModalOpen}
          onClose={actions.closeDisputeModal}
          invoice={mockInvoice}
          flaggedItem={state.auditResult.flaggedItem}
          clause={state.auditResult.clause}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent/10">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-navy">The Sentinel</h1>
                <p className="text-sm text-slate">
                  AI-Powered Lease Audit System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Mode Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate/10 text-xs font-medium text-slate">
                <Zap className="h-3 w-3" />
                {aiMode === "live" ? "Live AI" : "Demo Mode"}
              </div>
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
          {/* IDLE State - Show DropZone */}
          {state.appState === "IDLE" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <div className="w-full max-w-md">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-navy mb-2">
                    Upload Invoice for Analysis
                  </h2>
                  <p className="text-sm text-slate">
                    Drop a service charge invoice to begin the audit process
                  </p>
                </div>
                <DropZone
                  onFileSelect={handleFileSelect}
                  onAnalyze={handleAnalyze}
                />
              </div>
            </motion.div>
          )}

          {/* PROCESSING State - Show LoadingScreen */}
          {state.appState === "PROCESSING" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <LoadingScreen status={state.loadingStatus} />
            </motion.div>
          )}

          {/* RESULTS State - Show Full Dashboard */}
          {state.appState === "RESULTS" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Document Comparison */}
              <section>
                <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs">
                    1
                  </span>
                  Document Comparison
                </h2>
                <DocumentStage
                  leftPanel={
                    <InvoiceView
                      invoice={mockInvoice}
                      highlightedItemId={state.highlightedItemId}
                    />
                  }
                  rightPanel={
                    <LeaseView
                      clause={mockLeaseClause}
                      highlightParagraph={state.highlightedItemId !== null}
                    />
                  }
                />
              </section>

              {/* Audit Results & Reasoning */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs">
                      2
                    </span>
                    Audit Findings
                  </h2>
                  <AuditPanel
                    result={state.auditResult}
                    onItemHover={actions.setHighlightedItem}
                    onItemClick={(item) => {
                      actions.setHighlightedItem(item.id);
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs">
                      3
                    </span>
                    AI Reasoning
                  </h2>
                  <ReasoningPanel
                    steps={state.auditResult?.reasoning ?? []}
                    isExpanded={state.isReasoningExpanded}
                    onToggle={actions.toggleReasoning}
                  />
                </div>
              </section>

              {/* Dashboard */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs">
                      4
                    </span>
                    Savings Impact
                  </h2>
                  <SavingsCounter
                    amount={state.auditResult?.savings ?? 0}
                    duration={1000}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs">
                      5
                    </span>
                    Historical Performance
                  </h2>
                  <SavingsTimeline
                    data={mockTimelineData}
                    currentSavings={state.auditResult?.savings ?? 0}
                  />
                </div>
              </section>

              {/* Actions */}
              {state.auditResult?.anomalyDetected && (
                <section className="flex justify-center pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={actions.openDisputeModal}
                    className="px-8 py-3 bg-blue-700 text-white rounded-lg font-semibold text-sm hover:bg-blue-800 transition-colors shadow-lg shadow-blue-700/20"
                  >
                    Generate Dispute Letter
                  </motion.button>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

// Wrap in Suspense for useSearchParams
export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-slate">Loading...</div>
        </div>
      }
    >
      <DemoContent />
    </Suspense>
  );
}
