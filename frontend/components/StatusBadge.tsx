import { STATUS_DISPLAY, PRIORITY_DISPLAY } from "@ecoconnect/types";
import type { IssueStatus, Priority } from "@ecoconnect/types";

interface StatusBadgeProps {
  status: IssueStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const display = STATUS_DISPLAY[status] || { label: status, color: "#667783" };
  const cssClass = `status-badge status-badge--${status.toLowerCase().replace(/_/g, "_")}`;

  return (
    <span className={cssClass} role="status" aria-label={`Status: ${display.label}`}>
      {display.label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const display = PRIORITY_DISPLAY[priority] || { label: priority, color: "#667783" };
  const cssClass = `priority-badge priority-badge--${priority.toLowerCase()}`;

  return (
    <span className={cssClass} aria-label={`Priority: ${display.label}`}>
      {priority}: {display.label}
    </span>
  );
}
