"use client";

import { motion } from "framer-motion";

interface SLABadgeProps {
  deadline: string | Date;
  escalated?: boolean;
  warning1?: boolean;
  warning2?: boolean;
}

function getTimeRemaining(deadline: string | Date): {
  ms: number;
  label: string;
  level: "ok" | "warning" | "critical" | "expired";
} {
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const ms = end - now;

  if (ms <= 0) return { ms: 0, label: "SLA Expired", level: "expired" };

  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  const label =
    days > 0 ? `${days}d ${remHours}h remaining`
    : hours > 0 ? `${hours}h remaining`
    : `${Math.floor(ms / 60000)}m remaining`;

  const level = hours <= 4 ? "critical" : hours <= 24 ? "warning" : "ok";
  return { ms, label, level };
}

export function SLABadge({ deadline, escalated, warning1, warning2 }: SLABadgeProps) {
  if (escalated) {
    return (
      <span className="sla-badge sla-badge--expired" role="status" aria-label="SLA breached — Escalated">
        🚨 Escalated
      </span>
    );
  }

  const { label, level } = getTimeRemaining(deadline);

  return (
    <motion.span
      className={`sla-badge sla-badge--${level}`}
      role="status"
      aria-label={`SLA: ${label}`}
      animate={level === "critical" ? { opacity: [1, 0.6, 1] } : {}}
      transition={level === "critical" ? { repeat: Infinity, duration: 1.5 } : {}}
    >
      {level === "expired" ? "⏱️"
        : level === "critical" ? "🚨"
        : level === "warning" ? "⚠️"
        : "✅"
      }
      {" "}{label}
      {warning2 && " (Final Warning)"}
      {warning1 && !warning2 && " (Warning Issued)"}
    </motion.span>
  );
}
