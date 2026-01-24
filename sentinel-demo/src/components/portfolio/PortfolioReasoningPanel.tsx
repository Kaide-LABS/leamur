"use client";

import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Brain, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortfolioReasoningStep } from "@/lib/types-radar";

interface PortfolioReasoningPanelProps {
  steps: PortfolioReasoningStep[];
  isExpanded: boolean;
  onToggle: () => void;
}

const actionColors: Record<PortfolioReasoningStep["action"], string> = {
  PARSE: "bg-blue-100 text-blue-700",
  EXTRACT: "bg-purple-100 text-purple-700",
  COMPARE: "bg-amber-100 text-amber-700",
  IDENTIFY: "bg-red-100 text-red-700",
  QUANTIFY: "bg-green-100 text-green-700",
  RECOMMEND: "bg-accent/10 text-accent",
};

export function PortfolioReasoningPanel({
  steps,
  isExpanded,
  onToggle,
}: PortfolioReasoningPanelProps) {
  return (
    <motion.div
      layout
      className="bg-white rounded-xl border border-slate/10 overflow-hidden"
    >
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Brain className="h-5 w-5 text-accent" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-navy">AI Reasoning</h3>
            <p className="text-xs text-slate">
              {steps.length} steps • Avg confidence{" "}
              {Math.round(
                steps.reduce((acc, s) => acc + s.confidence, 0) / steps.length
              )}
              %
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-slate" />
        </motion.div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {steps.map((step, idx) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-3 pl-2"
                >
                  {/* Step Number */}
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-medium">
                      {step.step}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="w-0.5 h-8 bg-slate/20 mt-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          actionColors[step.action]
                        )}
                      >
                        {step.action}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate">
                        <CheckCircle className="h-3 w-3 text-success" />
                        {step.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-navy">{step.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
