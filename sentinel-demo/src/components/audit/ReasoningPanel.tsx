"use client";

import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronRight, Brain } from "lucide-react";
import type { ReasoningStep } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ReasoningPanelProps {
  steps: ReasoningStep[];
  isExpanded?: boolean;
  onToggle?: () => void;
}

const actionColors: Record<ReasoningStep["action"], string> = {
  CATEGORIZE: "bg-blue-100 text-blue-700 border-blue-200",
  RETRIEVE: "bg-purple-100 text-purple-700 border-purple-200",
  ANALYZE: "bg-amber-100 text-amber-700 border-amber-200",
  COMPARE: "bg-cyan-100 text-cyan-700 border-cyan-200",
  MATCH: "bg-green-100 text-green-700 border-green-200",
  CONCLUDE: "bg-rose-100 text-rose-700 border-rose-200",
};

const actionIcons: Record<ReasoningStep["action"], string> = {
  CATEGORIZE: "1",
  RETRIEVE: "2",
  ANALYZE: "3",
  COMPARE: "4",
  MATCH: "5",
  CONCLUDE: "6",
};

export function ReasoningPanel({
  steps,
  isExpanded = false,
  onToggle,
}: ReasoningPanelProps) {
  return (
    <div className="rounded-lg border border-slate/20 bg-surface overflow-hidden">
      {/* Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-navy text-sm">Chain of Thought</h3>
          <span className="text-xs text-slate bg-slate/10 px-2 py-0.5 rounded-full">
            {steps.length} steps
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-slate" />
        </motion.div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.15 }}
                  className="flex items-start gap-3"
                >
                  {/* Step Line Connector */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border",
                        actionColors[step.action]
                      )}
                    >
                      {actionIcons[step.action]}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-px h-full min-h-[20px] bg-slate/20 mt-1" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded border",
                          actionColors[step.action]
                        )}
                      >
                        {step.action}
                      </span>
                      <span className="text-xs text-slate">
                        {Math.round(step.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-navy leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
