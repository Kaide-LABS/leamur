"use client";

import { motion } from "motion/react";
import { Building2, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lease } from "@/lib/types-radar";

interface LeaseCardProps {
  lease: Lease;
  isHighlighted: boolean;
  onClick: () => void;
}

const riskIcons = {
  low: CheckCircle,
  medium: AlertCircle,
  high: AlertTriangle,
};

const riskColors = {
  low: "text-success",
  medium: "text-warning",
  high: "text-error",
};

const riskBgColors = {
  low: "bg-success/10 border-success/20",
  medium: "bg-warning/10 border-warning/20",
  high: "bg-error/10 border-error/20",
};

export function LeaseCard({ lease, isHighlighted, onClick }: LeaseCardProps) {
  const RiskIcon = riskIcons[lease.riskLevel];

  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border-2 cursor-pointer transition-all",
        "bg-white shadow-sm hover:shadow-md",
        isHighlighted
          ? "border-accent ring-2 ring-accent/20"
          : "border-slate/10 hover:border-slate/20"
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Risk Badge */}
      <div
        className={cn(
          "absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          riskBgColors[lease.riskLevel],
          riskColors[lease.riskLevel]
        )}
      >
        <RiskIcon className="h-3 w-3" />
        <span className="capitalize">{lease.riskLevel} Risk</span>
      </div>

      {/* Property Icon */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-lg bg-slate/5">
          <Building2 className="h-5 w-5 text-slate" />
        </div>
        <div className="flex-1 min-w-0 pr-20">
          <h3 className="text-sm font-semibold text-navy truncate">
            {lease.property}
          </h3>
          <p className="text-xs text-slate truncate">{lease.tenant}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate/10">
        <div>
          <p className="text-xs text-slate">Annual Rent</p>
          <p className="text-sm font-semibold text-navy">
            £{lease.annualRent.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate">Risk Score</p>
          <p
            className={cn(
              "text-sm font-semibold",
              riskColors[lease.riskLevel]
            )}
          >
            {lease.riskScore}/100
          </p>
        </div>
      </div>

      {/* Clause Count */}
      <div className="mt-3 pt-3 border-t border-slate/10">
        <p className="text-xs text-slate">
          {lease.clauses.length} clauses analyzed •{" "}
          {lease.clauses.filter((c) => c.riskLevel === "high").length} high risk
        </p>
      </div>
    </motion.div>
  );
}
