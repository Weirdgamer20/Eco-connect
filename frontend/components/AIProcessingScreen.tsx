"use client";

import { motion, AnimatePresence } from "framer-motion";

const AI_STEPS = [
  "Checking evidence...",
  "Identifying the issue...",
  "Finding similar reports...",
  "Finding the responsible authority...",
  "Preparing notification...",
];

interface AIProcessingProps {
  currentStep: number; // 0-indexed step, -1 = not started, 5 = done
}

export function AIProcessingScreen({ currentStep }: AIProcessingProps) {
  return (
    <div className="ai-processing" role="status" aria-live="polite" aria-label="AI is analyzing your report">
      <motion.div
        className="ai-processing__spinner"
        aria-hidden="true"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
      />

      <div>
        <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, marginBottom: "var(--space-2)" }}>
          Analyzing your report
        </h2>
        <p style={{ color: "var(--ink-muted)", fontSize: "var(--font-size-sm)" }}>
          Our AI is reviewing your evidence and routing your report to the right authority.
        </p>
      </div>

      <div className="ai-processing__step-list" role="list">
        {AI_STEPS.map((step, index) => {
          const isDone = index < currentStep;
          const isActive = index === currentStep;

          return (
            <motion.div
              key={step}
              className={`ai-step-item ${isDone ? "ai-step-item--done" : ""} ${isActive ? "ai-step-item--active" : ""}`}
              role="listitem"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: isDone || isActive ? 1 : 0.4 }}
              transition={{ duration: 0.3 }}
            >
              <div className="ai-step-item__indicator" aria-hidden="true">
                {isDone ? "✓" : isActive ? "•" : "○"}
              </div>
              <span>{step}</span>
              {isActive && (
                <motion.span
                  aria-hidden="true"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  style={{ fontSize: "var(--font-size-xs)", color: "inherit" }}
                >
                  …
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      <p style={{ fontSize: "var(--font-size-xs)", color: "var(--ink-muted)", textAlign: "center" }}>
        This usually takes 10–30 seconds
      </p>
    </div>
  );
}
