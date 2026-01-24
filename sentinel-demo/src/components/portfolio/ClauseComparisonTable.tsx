"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ClauseComparison, Lease } from "@/lib/types-radar";

interface ClauseComparisonTableProps {
  comparisons: ClauseComparison[];
  leases: Lease[];
  highlightedLeaseId: string | null;
  onLeaseClick: (leaseId: string) => void;
}

const riskColors = {
  low: "text-success bg-success/10",
  medium: "text-warning bg-warning/10",
  high: "text-error bg-error/10 font-semibold",
};

export function ClauseComparisonTable({
  comparisons,
  leases,
  highlightedLeaseId,
  onLeaseClick,
}: ClauseComparisonTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate/10 overflow-hidden"
    >
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-slate/10 bg-slate/5">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate uppercase tracking-wider">
                Clause
              </th>
              {leases.map((lease) => (
                <th
                  key={lease.id}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors",
                    highlightedLeaseId === lease.id
                      ? "text-accent bg-accent/5"
                      : "text-slate hover:text-navy"
                  )}
                  onClick={() => onLeaseClick(lease.id)}
                >
                  <div className="flex flex-col">
                    <span className="truncate max-w-[120px]">
                      {lease.property.split(",")[0]}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {comparisons.map((comparison, idx) => (
              <motion.tr
                key={comparison.category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "border-b border-slate/5 last:border-0",
                  idx % 2 === 0 ? "bg-white" : "bg-slate/[0.02]"
                )}
              >
                {/* Clause Name */}
                <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">
                  {comparison.displayName}
                </td>

                {/* Values */}
                {comparison.values.map((val) => (
                  <td
                    key={val.leaseId}
                    className={cn(
                      "px-4 py-3 transition-colors cursor-pointer",
                      highlightedLeaseId === val.leaseId && "bg-accent/5"
                    )}
                    onClick={() => onLeaseClick(val.leaseId)}
                  >
                    <span
                      className={cn(
                        "inline-block px-2 py-1 rounded text-xs",
                        riskColors[val.riskLevel],
                        val.hasVariance && "ring-1 ring-current"
                      )}
                    >
                      {val.value}
                    </span>
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-slate/5 border-t border-slate/10">
        <div className="flex items-center gap-4 text-xs text-slate">
          <span className="font-medium">Risk Level:</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success"></span> Low
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-warning"></span> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-error"></span> High
          </span>
          <span className="ml-auto">Ring indicates variance from portfolio norm</span>
        </div>
      </div>
    </motion.div>
  );
}
