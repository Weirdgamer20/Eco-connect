"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TopBar } from "../../components/TopBar";
import { BottomNav } from "../../components/BottomNav";
import { StatusBadge } from "../../components/StatusBadge";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Grievance {
  id: string;
  status: any;
  category: any;
  createdAt: string;
  civicIssue?: { id: string; title: string; status: any; priority: any };
  media: Array<{ publicUrl?: string; type: string }>;
}

const STATUS_ICONS: Record<string, string> = {
  DRAFT: "📝",
  SUBMITTED: "📤",
  AI_PENDING: "🤖",
  MATCHED: "🔗",
  NEW_ISSUE: "🆕",
  ROUTED: "📨",
  REJECTED: "❌",
};

export default function MyReportsPage() {
  const router = useRouter();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => typeof window !== "undefined" ? localStorage.getItem("ec_token") : null;

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    fetch(`${API_URL}/grievances/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setGrievances(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-shell">
      <TopBar title="My Reports" />
      <main className="page-content container" role="main" id="main-content">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
            <span className="spinner spinner--lg" aria-label="Loading your reports" />
          </div>
        ) : grievances.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📁</div>
            <h2 className="empty-state__title">No reports yet</h2>
            <p className="empty-state__subtitle">Report your first civic issue to get started.</p>
            <Link href="/report" className="btn btn--primary btn--lg" style={{ marginTop: "var(--space-4)" }}>
              Report an Issue
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {grievances.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="card card--interactive">
                  {/* Grievance status */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span aria-hidden="true">{STATUS_ICONS[g.status] || "📋"}</span>
                      <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", color: "var(--ink)" }}>
                        {g.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <time dateTime={g.createdAt} style={{ fontSize: "var(--font-size-xs)", color: "var(--ink-muted)" }}>
                      {new Date(g.createdAt).toLocaleDateString("en-IN")}
                    </time>
                  </div>

                  {/* Linked civic issue */}
                  {g.civicIssue && (
                    <Link
                      href={`/issues/${g.civicIssue.id}`}
                      style={{ textDecoration: "none", display: "block" }}
                    >
                      <div style={{ background: "var(--gov-blue-tint)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", color: "var(--ink)", flex: 1 }}>
                            {g.civicIssue.title}
                          </span>
                          <StatusBadge status={g.civicIssue.status} />
                        </div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--gov-blue)", marginTop: "var(--space-1)" }}>
                          View civic issue →
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* AI pending state */}
                  {g.status === "AI_PENDING" && (
                    <div className="alert alert--info" style={{ marginTop: "var(--space-3)" }} role="status">
                      <span aria-hidden="true">🤖</span>
                      <span>AI is analyzing your report. This usually takes 10–30 seconds.</span>
                    </div>
                  )}

                  {/* Media thumbnails */}
                  {g.media.length > 0 && (
                    <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)", flexWrap: "wrap" }}>
                      {g.media.slice(0, 4).map((m, mi) => (
                        m.type === "PHOTO" && m.publicUrl ? (
                          <img
                            key={mi}
                            src={m.publicUrl}
                            alt={`Evidence ${mi + 1}`}
                            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: "var(--radius-sm)" }}
                          />
                        ) : (
                          <div
                            key={mi}
                            style={{ width: 48, height: 48, background: "var(--surface-soft)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}
                            aria-label="Video evidence"
                          >
                            🎬
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
