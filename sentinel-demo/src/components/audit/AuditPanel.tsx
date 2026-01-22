"use client";

import { motion } from "motion/react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { AuditResult, LineItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AuditPanelProps {
  result: AuditResult | null;
  onItemHover?: (id: number | null) => void;
  onItemClick?: (item: LineItem) => void;
}

export function AuditPanel({ result, onItemHover, onItemClick }: AuditPanelProps) {
  if (!result) {
    return (
      <div className="rounded-lg border border-slate/20 bg-surface p-6">
        <p className="text-slate text-sm text-center">
          No audit results available
        </p>
      </div>
    );
  }

  // Extract all line items from reasoning for display
  // Since we have the audit result but not the full invoice, we'll display the flagged item
  const flaggedItem = result.flaggedItem;

  return (
    <div className="rounded-lg border border-slate/20 bg-surface overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate/10 bg-slate/5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-navy flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Audit Results
          </h3>
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              result.anomalyDetected
                ? "bg-red-100 text-red-700"
                : "bg-emerald-100 text-emerald-700"
            )}
          >
            {result.anomalyDetected ? "Anomaly Detected" : "All Valid"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {result.anomalyDetected && flaggedItem ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-4"
          >
            {/* Flagged Item */}
            <div
              className="p-3 rounded-lg bg-error/5 border border-error/20 cursor-pointer hover:bg-error/10 transition-colors"
              onMouseEnter={() => onItemHover?.(flaggedItem.id)}
              onMouseLeave={() => onItemHover?.(null)}
              onClick={() => onItemClick?.(flaggedItem)}
            >
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy text-sm">
                    {flaggedItem.description}
                  </p>
                  <p className="text-xs text-slate mt-1">
                    Item #{flaggedItem.id}
                  </p>
                </div>
                <span className="text-red-700 font-semibold text-sm">
                  £{flaggedItem.amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Clause Reference */}
            {result.clause && (
              <div className="p-3 rounded-lg bg-slate/5 border border-slate/10">
                <p className="text-xs font-medium text-slate uppercase tracking-wide mb-1">
                  Exclusion Clause
                </p>
                <p className="text-sm text-navy font-medium">
                  {result.clause.clauseNumber} - {result.clause.title}
                </p>
                <p className="text-xs text-slate mt-1 italic">
                  &quot;{result.clause.relevantParagraph}&quot;
                </p>
              </div>
            )}

            {/* Savings Summary */}
            <div className="flex items-center justify-between pt-2 border-t border-slate/10">
              <span className="text-sm text-slate">Potential Savings</span>
              <span className="text-lg font-bold text-emerald-700">
                £{result.savings.toLocaleString()}
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle className="h-10 w-10 text-success mb-3" />
            <p className="font-medium text-navy">All Line Items Valid</p>
            <p className="text-sm text-slate mt-1">
              No exclusion clause violations detected
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
