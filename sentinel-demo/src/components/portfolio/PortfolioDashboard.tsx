"use client";

import { motion } from "motion/react";
import type { PortfolioAnalysis } from "@/lib/types-radar";
import { LeaseCard } from "./LeaseCard";
import { RiskCard } from "./RiskCard";
import { ClauseComparisonTable } from "./ClauseComparisonTable";
import { ExposureSummary } from "./ExposureSummary";
import { PortfolioReasoningPanel } from "./PortfolioReasoningPanel";

interface PortfolioDashboardProps {
  analysis: PortfolioAnalysis;
  highlightedLeaseId: string | null;
  highlightedInsightId: string | null;
  isReasoningExpanded: boolean;
  onLeaseClick: (leaseId: string) => void;
  onInsightClick: (insightId: string) => void;
  onToggleReasoning: () => void;
}

export function PortfolioDashboard({
  analysis,
  highlightedLeaseId,
  highlightedInsightId,
  isReasoningExpanded,
  onLeaseClick,
  onInsightClick,
  onToggleReasoning,
}: PortfolioDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Section 1: Portfolio Overview (Lease Cards) */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs">
            1
          </span>
          Portfolio Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysis.leases.map((lease, idx) => (
            <motion.div
              key={lease.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <LeaseCard
                lease={lease}
                isHighlighted={highlightedLeaseId === lease.id}
                onClick={() => onLeaseClick(lease.id)}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section 2: Exposure Summary */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs">
            2
          </span>
          Exposure Summary
        </h2>
        <ExposureSummary exposure={analysis.exposureAggregation} />
      </section>

      {/* Section 3: Risk Insights */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs">
            3
          </span>
          Risk Insights
        </h2>
        <div className="space-y-3">
          {analysis.insights.map((insight, idx) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
            >
              <RiskCard
                insight={insight}
                isHighlighted={highlightedInsightId === insight.id}
                onClick={() => onInsightClick(insight.id)}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section 4: Clause Comparison Table */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs">
            4
          </span>
          Clause Comparison
        </h2>
        <ClauseComparisonTable
          comparisons={analysis.clauseComparisons}
          leases={analysis.leases}
          highlightedLeaseId={highlightedLeaseId}
          onLeaseClick={onLeaseClick}
        />
      </section>

      {/* Section 5: AI Reasoning */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs">
            5
          </span>
          Analysis Details
        </h2>
        <PortfolioReasoningPanel
          steps={analysis.aiReasoning}
          isExpanded={isReasoningExpanded}
          onToggle={onToggleReasoning}
        />
      </section>
    </div>
  );
}
