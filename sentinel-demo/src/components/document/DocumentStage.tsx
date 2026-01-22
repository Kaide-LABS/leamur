"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface DocumentStageProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
}

export function DocumentStage({ leftPanel, rightPanel }: DocumentStageProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Panel - Invoice (55%) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex-[55] min-w-0"
      >
        {leftPanel}
      </motion.div>

      {/* Right Panel - Lease/Audit (45%) */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut", delay: 0.1 }}
        className="flex-[45] min-w-0"
      >
        {rightPanel}
      </motion.div>
    </div>
  );
}
