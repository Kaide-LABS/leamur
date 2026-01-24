"use client";

import { motion } from "motion/react";
import { AlertTriangle, Info, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortfolioInsight } from "@/lib/types-radar";

interface RiskCardProps {
  insight: PortfolioInsight;
  isHighlighted: boolean;
  onClick: () => void;
}

const severityIcons = {
  info: Info,
  warning: AlertCircle,
  critical: AlertTriangle,
};

const severityColors = {
  info: {
    text: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-100",
  },
  warning: {
    text: "text-warning",
    bg: "bg-warning/5",
    border: "border-warning/20",
    iconBg: "bg-warning/10",
  },
  critical: {
    text: "text-error",
    bg: "bg-error/5",
    border: "border-error/20",
    iconBg: "bg-error/10",
  },
};

const typeLabels = {
  "clause-variance": "Variance",
  "leverage-discovery": "Leverage",
  "exposure-risk": "Exposure",
};

export function RiskCard({ insight, isHighlighted, onClick }: RiskCardProps) {
  const SeverityIcon = severityIcons[insight.severity];
  const colors = severityColors[insight.severity];

  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border cursor-pointer transition-all",
        colors.bg,
        colors.border,
        isHighlighted && "ring-2 ring-accent/30"
      )}
      whileHover={{ scale: 1.01, x: 4 }}
      whileTap={{ scale: 0.99 }}
      layout
    >
      <div className="flex items-start gap-3">
        {/* Severity Icon */}
        <div className={cn("p-2 rounded-lg", colors.iconBg)}>
          <SeverityIcon className={cn("h-5 w-5", colors.text)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={cn("text-sm font-semibold", colors.text)}>
              {insight.title}
            </h3>
            <span
              className={cn(
                "shrink-0 px-2 py-0.5 rounded text-xs font-medium",
                colors.bg,
                colors.text,
                "border",
                colors.border
              )}
            >
              {typeLabels[insight.type]}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-slate leading-relaxed mb-2">
            {insight.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            {insight.potentialSavings ? (
              <span className="text-xs font-medium text-success">
                Potential Savings: £{insight.potentialSavings.toLocaleString()}
              </span>
            ) : (
              <span className="text-xs text-slate">
                Affects {insight.affectedLeases.length} lease
                {insight.affectedLeases.length !== 1 && "s"}
              </span>
            )}
            <ChevronRight className={cn("h-4 w-4", colors.text)} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
