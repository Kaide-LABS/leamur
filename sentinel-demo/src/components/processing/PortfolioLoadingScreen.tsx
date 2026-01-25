"use client";

import { motion, AnimatePresence } from "motion/react";
import { Radar, FileText, CheckCircle, AlertCircle } from "lucide-react";
import type { ExtractionProgress } from "@/lib/types-extraction";

interface PortfolioLoadingScreenProps {
  status: string;
  extractionProgress?: ExtractionProgress | null;
}

export function PortfolioLoadingScreen({
  status,
  extractionProgress
}: PortfolioLoadingScreenProps) {
  const hasProgress = extractionProgress && extractionProgress.total_files > 0;
  const progressPercent = hasProgress
    ? Math.round((extractionProgress.completed_files / extractionProgress.total_files) * 100)
    : 0;

  const isExtracting = extractionProgress?.phase === 'extracting';
  const isSynthesizing = extractionProgress?.phase === 'synthesizing';
  const hasErrors = extractionProgress?.failed_files && extractionProgress.failed_files.length > 0;

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md">
      {/* Animated Radar Icon */}
      <div className="relative">
        {/* Outer pulsing rings - radar sweep effect */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 2, 2],
              opacity: [0.4, 0.1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeOut",
            }}
            className="absolute inset-0 rounded-full border-2 border-accent"
            style={{ width: 80, height: 80, margin: 0 }}
          />
        ))}

        {/* Inner spinning ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
          className="w-20 h-20 rounded-full border-4 border-slate/10 border-t-accent"
        />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Radar className="h-8 w-8 text-accent" />
          </motion.div>
        </div>
      </div>

      {/* Phase Indicator */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          isExtracting
            ? 'bg-accent/10 text-accent'
            : 'bg-slate/10 text-slate'
        }`}>
          <FileText className="h-3.5 w-3.5" />
          Extracting
        </div>
        <div className="w-8 h-px bg-slate/20" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          isSynthesizing
            ? 'bg-accent/10 text-accent'
            : 'bg-slate/10 text-slate'
        }`}>
          <Radar className="h-3.5 w-3.5" />
          Synthesizing
        </div>
      </div>

      {/* Progress Bar (only show during extraction) */}
      {hasProgress && isExtracting && (
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs text-slate">
            <span>
              {extractionProgress.completed_files} of {extractionProgress.total_files} leases
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 bg-slate/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          {/* Current file being processed */}
          {extractionProgress.current_filename && (
            <motion.p
              key={extractionProgress.current_filename}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-slate/70 text-center truncate"
            >
              Processing: {extractionProgress.current_filename}
            </motion.p>
          )}
        </div>
      )}

      {/* Status Text */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-navy">
          {isSynthesizing ? 'Synthesizing Portfolio' : 'Analyzing Portfolio'}
        </h3>
        <AnimatePresence mode="wait">
          <motion.p
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-slate-600"
          >
            {status}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Successful Extractions List (show during synthesis) */}
      {isSynthesizing && extractionProgress?.successful_extractions && extractionProgress.successful_extractions.length > 0 && (
        <div className="w-full space-y-2">
          <p className="text-xs text-slate font-medium">Extracted leases:</p>
          <div className="flex flex-wrap gap-2">
            {extractionProgress.successful_extractions.map((extraction) => (
              <div
                key={extraction.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-success/10 text-success rounded text-xs"
              >
                <CheckCircle className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{extraction.filename}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Files Warning */}
      {hasErrors && (
        <div className="w-full p-3 bg-warning/10 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-xs text-warning">
              <p className="font-medium">Some files could not be processed:</p>
              <ul className="mt-1 space-y-0.5">
                {extractionProgress.failed_files.map((f) => (
                  <li key={f.filename} className="truncate">{f.filename}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Progress Dots (only show when no detailed progress) */}
      {!hasProgress && (
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              className="w-2 h-2 rounded-full bg-accent"
            />
          ))}
        </div>
      )}
    </div>
  );
}
