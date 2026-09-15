"use client";

import { motion } from "framer-motion";

interface TimelineEvent {
  id: string;
  type: string;
  actorType: "SYSTEM" | "CITIZEN" | "OFFICIAL";
  detail: Record<string, unknown>;
  createdAt: string;
}

const EVENT_CONFIG: Record<string, { label: string; icon: string; dotClass: string }> = {
  ISSUE_CREATED:         { label: "Issue Created",              icon: "📋", dotClass: "" },
  ROUTED:                { label: "Routed to Authority",        icon: "→", dotClass: "" },
  NOTIFIED_OFFICIAL:     { label: "Official Notified",          icon: "📧", dotClass: "" },
  ACCEPTED:              { label: "Accepted by Official",       icon: "✓",  dotClass: "timeline-item__dot--success" },
  REJECTED:              { label: "Rejected by Official",       icon: "✗",  dotClass: "timeline-item__dot--danger" },
  IN_PROGRESS:           { label: "Work In Progress",           icon: "🔧", dotClass: "" },
  RESOLVED:              { label: "Marked Resolved",            icon: "✅", dotClass: "timeline-item__dot--success" },
  VERIFICATION_SENT:     { label: "Verification Requested",     icon: "📨", dotClass: "" },
  CONFIRMED_FIXED:       { label: "Citizen Confirmed Fixed",    icon: "🎉", dotClass: "timeline-item__dot--success" },
  REJECTED_RESOLUTION:   { label: "Citizen Rejected Resolution",icon: "⚠️", dotClass: "timeline-item__dot--warning" },
  REOPENED:              { label: "Issue Reopened",             icon: "🔄", dotClass: "timeline-item__dot--warning" },
  AUTO_CLOSED:           { label: "Auto-Closed (No Response)",  icon: "⏱️", dotClass: "" },
  SLA_WARNING_1:         { label: "SLA Warning Issued",         icon: "⚠️", dotClass: "timeline-item__dot--warning" },
  SLA_GRACE_PERIOD:      { label: "Grace Period Started",       icon: "⏳", dotClass: "timeline-item__dot--warning" },
  SLA_WARNING_2:         { label: "Final SLA Warning",          icon: "🚨", dotClass: "timeline-item__dot--danger" },
  ESCALATED:             { label: "Escalated",                  icon: "🔺", dotClass: "timeline-item__dot--danger" },
  OFFICIAL_DISPUTED:     { label: "Official Filed Dispute",     icon: "📝", dotClass: "" },
  COMMUNITY_POLL:        { label: "Community Poll",             icon: "🗳️", dotClass: "" },
};

interface TimelineProps {
  events: TimelineEvent[];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function actorLabel(actorType: string): string {
  return actorType === "SYSTEM" ? "System"
    : actorType === "OFFICIAL" ? "Official"
    : "Citizen";
}

export function Timeline({ events }: TimelineProps) {
  if (!events.length) return null;

  return (
    <section aria-label="Issue timeline">
      <div className="timeline" role="list">
        {events.map((event, index) => {
          const config = EVENT_CONFIG[event.type] || {
            label: event.type.replace(/_/g, " "),
            icon: "●",
            dotClass: "",
          };

          return (
            <motion.div
              key={event.id}
              className="timeline-item"
              role="listitem"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div
                className={`timeline-item__dot ${config.dotClass}`}
                aria-hidden="true"
                title={config.label}
              />
              <div className="timeline-item__content">
                <div className="timeline-item__event">
                  <span aria-hidden="true">{config.icon} </span>
                  {config.label}
                  <span
                    style={{
                      fontSize: "var(--font-size-xs)",
                      color: "var(--ink-muted)",
                      fontWeight: 400,
                      marginLeft: "var(--space-2)",
                    }}
                  >
                    by {actorLabel(event.actorType)}
                  </span>
                </div>
                <div className="timeline-item__time">
                  <time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time>
                </div>
                {/* Show non-system notes */}
                {event.detail && typeof event.detail === "object" && (event.detail as any).note && (
                  <p style={{ fontSize: "var(--font-size-sm)", color: "var(--ink-muted)", marginTop: "4px" }}>
                    {String((event.detail as any).note)}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
