"use client";

import { useState, useEffect } from "react";
import { useMotionValue, useMotionValueEvent, animate } from "motion/react";
import { TrendingUp } from "lucide-react";

interface SavingsCounterProps {
  amount: number;
  duration?: number;
  prefix?: string;
  label?: string;
}

export function SavingsCounter({
  amount,
  duration = 1000,
  prefix = "£",
  label = "Potential Savings Identified",
}: SavingsCounterProps) {
  const count = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useMotionValueEvent(count, "change", (latest) => {
    setDisplayValue(Math.round(latest));
  });

  useEffect(() => {
    const controls = animate(count, amount, {
      duration: duration / 1000,
      ease: "easeOut",
    });

    return () => controls.stop();
  }, [count, amount, duration]);

  return (
    <div className="rounded-lg border border-slate/20 bg-surface p-6">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-5 w-5 text-success" />
        <span className="text-sm font-medium text-slate">{label}</span>
      </div>
      <div className="text-4xl font-bold text-emerald-700 tracking-tight">
        {prefix}
        {displayValue.toLocaleString()}
      </div>
      <p className="text-xs text-slate mt-2">
        This quarter&apos;s recoverable amount
      </p>
    </div>
  );
}
