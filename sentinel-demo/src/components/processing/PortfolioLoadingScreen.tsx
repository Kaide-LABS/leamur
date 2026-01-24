"use client";

import { motion, AnimatePresence } from "motion/react";
import { Radar } from "lucide-react";

interface PortfolioLoadingScreenProps {
  status: string;
}

export function PortfolioLoadingScreen({ status }: PortfolioLoadingScreenProps) {
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

      {/* Status Text */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-navy">Analyzing Portfolio</h3>
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

      {/* Progress Dots */}
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
    </div>
  );
}
