"use client";

import { motion } from "motion/react";
import type { TimelineDataPoint } from "@/lib/types";
import { TrendingUp } from "lucide-react";

interface SavingsTimelineProps {
  data: TimelineDataPoint[];
  currentSavings: number;
}

export function SavingsTimeline({ data, currentSavings }: SavingsTimelineProps) {
  // Calculate cumulative savings - current quarter adds to the running total
  const lastQuarterTotal = data[data.length - 1]?.savings ?? 0;
  const cumulativeCurrentSavings = lastQuarterTotal + currentSavings;

  // Build points array with cumulative current
  const points = [
    ...data,
    { date: "Now", savings: cumulativeCurrentSavings, invoice: "Current" },
  ];

  // Calculate the maximum savings for scaling (with 10% padding)
  const maxSavings = Math.max(...points.map((d) => d.savings)) * 1.1;
  const minSavings = 0;

  // Chart dimensions - using viewBox coordinates
  const viewBoxWidth = 400;
  const viewBoxHeight = 200;
  const padding = { top: 20, right: 40, bottom: 40, left: 20 };
  const graphWidth = viewBoxWidth - padding.left - padding.right;
  const graphHeight = viewBoxHeight - padding.top - padding.bottom;

  // Calculate point positions
  const pathPoints = points.map((point, index) => {
    const x = padding.left + (index / (points.length - 1)) * graphWidth;
    const y =
      padding.top +
      graphHeight -
      ((point.savings - minSavings) / (maxSavings - minSavings)) * graphHeight;
    return { x, y, ...point };
  });

  // Generate smooth curve path using cardinal spline
  const linePath = pathPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  // Create area path (for gradient fill)
  const areaPath = `${linePath} L ${pathPoints[pathPoints.length - 1].x} ${padding.top + graphHeight} L ${pathPoints[0].x} ${padding.top + graphHeight} Z`;

  // Calculate growth percentage
  const growthPercent = lastQuarterTotal > 0
    ? Math.round((currentSavings / lastQuarterTotal) * 100)
    : 0;

  return (
    <div className="rounded-lg border border-slate/20 bg-surface p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-success" />
          <span className="text-sm font-medium text-slate">Cumulative Savings</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate">Running Total</p>
          <p className="text-lg font-bold text-emerald-700">
            £{cumulativeCurrentSavings.toLocaleString()}
          </p>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full" style={{ height: 180 }}>
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        >
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines with Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + graphHeight * (1 - ratio);
            const value = Math.round(minSavings + (maxSavings - minSavings) * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={viewBoxWidth - padding.right}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray={ratio === 0 ? "0" : "4,4"}
                />
                {ratio > 0 && (
                  <text
                    x={viewBoxWidth - padding.right + 5}
                    y={y + 4}
                    className="text-[10px] fill-slate/40"
                    fontSize="10"
                  >
                    £{(value / 1000).toFixed(0)}k
                  </text>
                )}
              </g>
            );
          })}

          {/* Area Fill */}
          <motion.path
            d={areaPath}
            fill="url(#savingsGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          {/* Line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="rgb(16, 185, 129)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* Data Points */}
          {pathPoints.map((point, index) => (
            <motion.g key={index}>
              {/* Outer glow */}
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="8"
                fill="rgb(16, 185, 129)"
                fillOpacity="0.15"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15 * index + 0.3, duration: 0.3 }}
              />
              {/* Inner point */}
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="white"
                stroke="rgb(16, 185, 129)"
                strokeWidth="2.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15 * index + 0.3, duration: 0.3 }}
              />
            </motion.g>
          ))}

          {/* X-Axis Labels */}
          {pathPoints.map((point, index) => (
            <text
              key={index}
              x={point.x}
              y={viewBoxHeight - 10}
              textAnchor="middle"
              className="fill-slate/60"
              fontSize="12"
              fontWeight="500"
            >
              {point.date}
            </text>
          ))}

          {/* Value labels on hover points */}
          {pathPoints.map((point, index) => (
            <motion.text
              key={`label-${index}`}
              x={point.x}
              y={point.y - 15}
              textAnchor="middle"
              className="fill-navy"
              fontSize="11"
              fontWeight="600"
              initial={{ opacity: 0, y: point.y }}
              animate={{ opacity: 1, y: point.y - 15 }}
              transition={{ delay: 0.15 * index + 0.5, duration: 0.3 }}
            >
              £{(point.savings / 1000).toFixed(1)}k
            </motion.text>
          ))}
        </svg>
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-4 border-t border-slate/10 flex items-center justify-between">
        <div className="text-xs text-slate">
          <span className="font-medium text-navy">+£{currentSavings.toLocaleString()}</span>
          {" "}this quarter
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-emerald-700">
          <TrendingUp className="h-3 w-3" />
          +{growthPercent}% growth
        </div>
      </div>
    </div>
  );
}
