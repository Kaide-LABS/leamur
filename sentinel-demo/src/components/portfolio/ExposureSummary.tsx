"use client";

import { motion } from "motion/react";
import { TrendingUp, AlertTriangle, PiggyBank, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExposureAggregation } from "@/lib/types-radar";

interface ExposureSummaryProps {
  exposure: ExposureAggregation;
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  iconColor: string;
  delay: number;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  iconColor,
  delay,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-4 bg-white rounded-xl border border-slate/10 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={cn("p-2 rounded-lg", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-slate uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="pl-11">
        <p className="text-2xl font-bold text-navy">{value}</p>
        {subValue && <p className="text-xs text-slate mt-1">{subValue}</p>}
      </div>
    </motion.div>
  );
}

export function ExposureSummary({ exposure }: ExposureSummaryProps) {
  const riskColor =
    exposure.portfolioRiskScore >= 70
      ? "text-error"
      : exposure.portfolioRiskScore >= 40
      ? "text-warning"
      : "text-success";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        icon={Building2}
        label="Total Annual Rent"
        value={`£${exposure.totalAnnualRent.toLocaleString()}`}
        subValue={`${exposure.leaseCount} leases`}
        iconColor="bg-slate/10 text-slate"
        delay={0}
      />

      <MetricCard
        icon={AlertTriangle}
        label="Portfolio Risk"
        value={`${Math.round(exposure.portfolioRiskScore)}/100`}
        subValue={`${exposure.highRiskCount} high risk, ${exposure.mediumRiskCount} medium`}
        iconColor={cn(
          exposure.portfolioRiskScore >= 70
            ? "bg-error/10 text-error"
            : exposure.portfolioRiskScore >= 40
            ? "bg-warning/10 text-warning"
            : "bg-success/10 text-success"
        )}
        delay={0.1}
      />

      <MetricCard
        icon={TrendingUp}
        label="Uncapped Exposure"
        value={`£${exposure.totalUncappedExposure.toLocaleString()}`}
        subValue="From admin fees, repairs, rent reviews"
        iconColor="bg-error/10 text-error"
        delay={0.2}
      />

      <MetricCard
        icon={PiggyBank}
        label="Potential Savings"
        value={`£${exposure.potentialSavings.toLocaleString()}`}
        subValue="If variances resolved"
        iconColor="bg-success/10 text-success"
        delay={0.3}
      />
    </div>
  );
}
