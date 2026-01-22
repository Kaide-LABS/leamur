"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import type { LogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LogStreamProps {
  logs: LogEntry[];
  isComplete?: boolean;
}

const serviceColors: Record<LogEntry["service"], string> = {
  "OCR-SERVICE": "text-cyan-400",
  "VECTOR-DB": "text-purple-400",
  "LEASE-RETRIEVAL": "text-yellow-400",
  "AUDIT-ENGINE": "text-emerald-400",
};

export function LogStream({ logs, isComplete = false }: LogStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs appear
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [logs.length]);

  return (
    <div className="bg-navy rounded-lg overflow-hidden shadow-lg">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-navy border-b border-white/10">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-3 text-xs text-slate font-mono">sentinel-audit.log</span>
      </div>

      {/* Log Content */}
      <div className="p-4 font-mono text-xs leading-relaxed min-h-[200px] max-h-[400px] overflow-y-auto">
        {/* Empty state */}
        {logs.length === 0 && !isComplete && (
          <div className="flex items-center gap-2 text-slate/60">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Initializing analysis...</span>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {logs.map((log, index) => {
            const isAnomaly = log.message.includes("ANOMALY");
            const serviceColor = isAnomaly ? "text-red-400" : serviceColors[log.service];

            return (
              <motion.div
                key={`${log.timestamp}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="mb-1"
              >
                <span className="text-slate/60">[{log.timestamp}]</span>{" "}
                <span className={cn("font-semibold", serviceColor)}>
                  [{log.service}]
                </span>{" "}
                <span className={cn("text-slate/90", isAnomaly && "text-red-400 font-semibold")}>
                  {log.message}
                </span>
                {log.metrics && (
                  <span className="text-slate/50 ml-2">({log.metrics})</span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Cursor blink or completion indicator */}
        {logs.length > 0 && (
          isComplete ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 mt-2 text-emerald-400"
            >
              <Check className="h-3 w-3" />
              <span>Analysis complete</span>
            </motion.div>
          ) : (
            <span className="inline-block w-2 h-4 bg-slate/50 animate-pulse" />
          )
        )}

        {/* Auto-scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
