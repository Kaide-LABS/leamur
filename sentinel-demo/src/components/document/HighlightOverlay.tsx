"use client";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface HighlightOverlayProps {
  isActive?: boolean;
  className?: string;
}

export function HighlightOverlay({ isActive = false, className }: HighlightOverlayProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "absolute inset-0 pointer-events-none",
            "border-2 border-danger rounded",
            "animate-pulse-glow",
            className
          )}
          aria-hidden="true"
        >
          {/* Inner glow effect */}
          <motion.div
            animate={{
              opacity: [0.1, 0.25, 0.1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-danger/10 rounded"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
