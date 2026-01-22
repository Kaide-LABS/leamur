"use client";

import { motion, AnimatePresence } from "motion/react";
import { Shield } from "lucide-react";

interface LoadingScreenProps {
  status: string;
}

export function LoadingScreen({ status }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md">
      {/* Animated Logo/Spinner */}
      <div className="relative">
        {/* Outer pulsing ring */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-accent/20"
          style={{ width: 120, height: 120, margin: -20 }}
        />

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
            <Shield className="h-8 w-8 text-accent" />
          </motion.div>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-navy">Analyzing Invoice</h3>
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
