"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export function TopBar({ title, showBack, rightElement }: TopBarProps) {
  const router = useRouter();

  return (
    <header className="topbar" role="banner">
      {showBack ? (
        <button
          className="btn btn--ghost"
          style={{ padding: "var(--space-2) var(--space-3)", minHeight: "36px", fontSize: "var(--font-size-sm)" }}
          onClick={() => router.back()}
          aria-label="Go back"
        >
          ← Back
        </button>
      ) : (
        <Link href="/" className="topbar__logo" aria-label="EcoConnect home">
          <div className="topbar__logo-icon" aria-hidden="true">🌿</div>
          <span>EcoConnect</span>
        </Link>
      )}

      {title && (
        <h1 style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "var(--font-size-base)",
          fontWeight: 700,
          color: "var(--ink)",
          whiteSpace: "nowrap",
        }}>
          {title}
        </h1>
      )}

      <div className="topbar__spacer" />

      <div className="topbar__actions">
        {rightElement}
        <Link
          href="/notifications"
          className="btn btn--ghost"
          style={{ padding: "var(--space-2)", minHeight: "36px", minWidth: "36px" }}
          aria-label="Notifications"
        >
          🔔
        </Link>
        <Link
          href="/profile"
          className="btn btn--ghost"
          style={{ padding: "var(--space-2)", minHeight: "36px", minWidth: "36px" }}
          aria-label="Profile"
        >
          👤
        </Link>
      </div>
    </header>
  );
}
