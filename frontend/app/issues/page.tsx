"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "../../components/TopBar";
import { BottomNav } from "../../components/BottomNav";
import { IssueCard } from "../../components/IssueCard";
import { EmptyIssuesIllustration } from "../../components/Illustrations";
import { CATEGORY_DISPLAY } from "@ecoconnect/types";
import type { IssueCategory } from "@ecoconnect/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Issue {
  id: string;
  title: string;
  category: IssueCategory;
  status: any;
  priority: any;
  publicAreaLabel: string;
  reportCount: number;
  upvoteCount: number;
  downvoteCount: number;
}

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ESCALATED", label: "Escalated" },
  { value: "AWAITING_VERIFICATION", label: "Awaiting Verification" },
  { value: "RESOLVED", label: "Resolved" },
];

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [votes, setVotes] = useState<Record<string, "UP" | "DOWN" | null>>({});
  const limit = 10;

  const fetchIssues = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) params.set("status", status);
    if (category) params.set("category", category);

    try {
      const r = await fetch(`${API_URL}/issues?${params}`);
      const data = await r.json();
      if (data.success) {
        setIssues(data.data);
        setTotal(data.meta?.total || 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssues(); }, [page, status, category]);

  const handleVote = async (issueId: string, type: "UP" | "DOWN") => {
    const token = typeof window !== "undefined" ? localStorage.getItem("ec_token") : null;
    if (!token) { window.location.href = "/login"; return; }

    const prev = votes[issueId] || null;
    const next = prev === type ? null : type;
    setVotes(v => ({ ...v, [issueId]: next }));

    await fetch(`${API_URL}/issues/${issueId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type }),
    }).catch(() => {
      // Revert on failure
      setVotes(v => ({ ...v, [issueId]: prev }));
    });
  };

  return (
    <div className="app-shell">
      <TopBar title="Civic Issues" />
      <main className="page-content container" role="main" id="main-content">

        {/* Filters */}
        <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-5)", flexWrap: "wrap" }} role="group" aria-label="Filter issues">
          {/* Status filter */}
          <select
            id="status-filter"
            className="form-select"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            aria-label="Filter by status"
            style={{ flex: "1", minWidth: "140px" }}
          >
            {STATUS_FILTERS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {/* Category filter */}
          <select
            id="category-filter"
            className="form-select"
            value={category}
            onChange={(e) => { setCategory(e.target.value as IssueCategory | ""); setPage(1); }}
            aria-label="Filter by category"
            style={{ flex: "1", minWidth: "160px" }}
          >
            <option value="">All Categories</option>
            {(Object.entries(CATEGORY_DISPLAY) as [IssueCategory, { label: string; icon: string }][]).map(([key, d]) => (
              <option key={key} value={key}>{d.icon} {d.label}</option>
            ))}
          </select>
        </div>

        {/* Results count */}
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--ink-muted)", marginBottom: "var(--space-4)" }} aria-live="polite">
          {loading ? "Loading…" : `${total} issue${total !== 1 ? "s" : ""} found`}
        </p>

        {/* Issue list */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
            <span className="spinner spinner--lg" aria-label="Loading issues" />
          </div>
        ) : issues.length === 0 ? (
          <div className="empty-state">
            <EmptyIssuesIllustration width={160} height={120} />
            <h2 className="empty-state__title">No issues found</h2>
            <p className="empty-state__subtitle">
              {status || category ? "Try adjusting your filters." : "Your community is doing great! Be the first to report."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {issues.map((issue, i) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <IssueCard
                  {...issue}
                  userVote={votes[issue.id] ?? null}
                  onVote={(type) => handleVote(issue.id, type)}
                  swipeMode={false}
                  onCardPress={() => { window.location.href = `/issues/${issue.id}`; }}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div
            style={{ display: "flex", justifyContent: "center", gap: "var(--space-3)", marginTop: "var(--space-6)" }}
            role="navigation"
            aria-label="Pagination"
          >
            <button
              className="btn btn--ghost"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              ← Previous
            </button>
            <span style={{ display: "flex", alignItems: "center", fontSize: "var(--font-size-sm)", color: "var(--ink-muted)" }}>
              Page {page} of {Math.ceil(total / limit)}
            </span>
            <button
              className="btn btn--ghost"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / limit)}
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        )}

      </main>
      <BottomNav />
    </div>
  );
}
