"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import type { LineItem, LeaseClause } from "@/lib/types";

interface AnomalyAlertProps {
  isVisible: boolean;
  flaggedItem: LineItem | null;
  clause: LeaseClause | null;
  savings: number;
  onDismiss?: () => void;
  onViewDetails?: () => void;
}

export function AnomalyAlert({
  isVisible,
  flaggedItem,
  clause,
  savings,
  onDismiss,
  onViewDetails,
}: AnomalyAlertProps) {
  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (isVisible && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && flaggedItem && clause && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
          className="fixed top-20 right-4 z-50 w-full max-w-sm"
        >
          <div className="bg-surface border border-danger/30 rounded-lg shadow-lg overflow-hidden">
            {/* Alert Content */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 p-2 bg-danger/10 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-danger" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-navy">
                    Invalid Charge Detected
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    <span className="font-medium">{flaggedItem.description}</span>
                    {" "}violates{" "}
                    <span className="font-medium">
                      Clause {clause.clauseNumber}
                    </span>
                  </p>

                  {/* Savings Badge & Action */}
                  <div className="mt-3 flex items-center gap-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                      £{savings.toLocaleString()} recoverable
                    </span>
                    {onViewDetails && (
                      <button
                        onClick={onViewDetails}
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded"
                      >
                        View Details
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dismiss Button */}
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className="flex-shrink-0 p-1 rounded hover:bg-slate/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label="Dismiss alert"
                  >
                    <X className="h-4 w-4 text-slate" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar Animation */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 8, ease: "linear" }}
              className="h-0.5 bg-danger/30 origin-left"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
