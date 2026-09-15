"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TopBar } from "../../../components/TopBar";
import { BottomNav } from "../../../components/BottomNav";
import { StatusBadge, PriorityBadge } from "../../../components/StatusBadge";
import { Timeline } from "../../../components/Timeline";
import { SLABadge } from "../../../components/SLABadge";
import { CATEGORY_DISPLAY } from "@ecoconnect/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface IssueDetail {
  id: string;
  title: string;
  category: any;
  status: any;
  priority: any;
  department: string;
  publicAreaLabel: string;
  reportCount: number;
  upvoteCount: number;
  downvoteCount: number;
  resolutionNote?: string;
  resolutionEvidenceUrls?: string[];
  slaDeadline?: string;
  createdAt: string;
  updatedAt: string;
  accountabilityEvents: any[];
  comments: any[];
  officialResponses: any[];
  slaRecord?: { slaType: string; warning1SentAt?: string; warning2SentAt?: string; escalatedAt?: string };
}

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params?.id as string;

  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userVote, setUserVote] = useState<"UP" | "DOWN" | null>(null);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "comments">("overview");

  const getToken = () => typeof window !== "undefined" ? localStorage.getItem("ec_token") : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [issueRes, voteRes] = await Promise.allSettled([
          fetch(`${API_URL}/issues/${issueId}`),
          getToken()
            ? fetch(`${API_URL}/issues/${issueId}/my-vote`, {
                headers: { Authorization: `Bearer ${getToken()}` },
              })
            : Promise.resolve(null),
        ]);

        if (issueRes.status === "fulfilled") {
          const data = await issueRes.value.json();
          if (data.success) setIssue(data.data);
          else setError("Issue not found.");
        }

        if (voteRes.status === "fulfilled" && voteRes.value) {
          const vData = await (voteRes.value as Response).json();
          if (vData.success && vData.data) setUserVote(vData.data.type);
        }
      } catch {
        setError("Failed to load issue details.");
      } finally {
        setLoading(false);
      }
    };

    if (issueId) fetchData();
  }, [issueId]);

  const handleVote = async (type: "UP" | "DOWN") => {
    if (!getToken()) { router.push("/login"); return; }
    const prev = userVote;
    setUserVote(prev === type ? null : type);

    await fetch(`${API_URL}/issues/${issueId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ type }),
    }).catch(() => setUserVote(prev));
  };

  const handleComment = async () => {
    if (!comment.trim() || !getToken()) return;
    setSubmittingComment(true);
    try {
      const r = await fetch(`${API_URL}/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ content: comment }),
      });
      const data = await r.json();
      if (data.success && issue) {
        setIssue(prev => prev ? {
          ...prev,
          comments: [data.data, ...(prev.comments || [])],
        } : prev);
        setComment("");
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return (
    <div className="app-shell">
      <TopBar showBack title="Issue Detail" />
      <main className="page-content container" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <span className="spinner spinner--lg" aria-label="Loading issue details" />
      </main>
    </div>
  );

  if (error || !issue) return (
    <div className="app-shell">
      <TopBar showBack title="Issue Detail" />
      <main className="page-content container">
        <div className="error-state">
          <div className="error-state__icon">⚠️</div>
          <h1 className="error-state__title">{error || "Issue not found"}</h1>
          <button onClick={() => router.back()} className="btn btn--ghost">← Go Back</button>
        </div>
      </main>
    </div>
  );

  const catDisplay = (CATEGORY_DISPLAY as Record<string, any>)[issue.category];

  return (
    <div className="app-shell">
      <TopBar showBack title={catDisplay?.label || issue.category} />
      <main className="page-content container" role="main" id="main-content">

        {/* Heading + Meta */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
            {issue.slaDeadline && !["CLOSED", "AUTO_CLOSED", "RESOLVED"].includes(issue.status) && (
              <SLABadge
                deadline={issue.slaDeadline}
                escalated={issue.status === "ESCALATED"}
                warning1={!!issue.slaRecord?.warning1SentAt}
                warning2={!!issue.slaRecord?.warning2SentAt}
              />
            )}
          </div>

          <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: 800, marginBottom: "var(--space-3)", lineHeight: 1.3 }}>
            {issue.title}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-5)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--font-size-sm)", color: "var(--ink-muted)" }}>
              <span aria-hidden="true">📍</span> {issue.publicAreaLabel}
            </span>
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--ink-muted)" }}>
              {catDisplay?.icon} {catDisplay?.label}
            </span>
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--ink-muted)" }}>
              🏢 {issue.department.replace(/_/g, " ")}
            </span>
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--ink-muted)" }}>
              {issue.reportCount} reports
            </span>
          </div>

          {/* Community signals */}
          <div className="card card--flat" style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-5)" }} role="group" aria-label="Community signals">
            <button
              className={`vote-btn ${userVote === "UP" ? "vote-btn--active-up" : ""}`}
              onClick={() => handleVote("UP")}
              aria-pressed={userVote === "UP"}
              aria-label={`${issue.upvoteCount} people experiencing this. Mark as experiencing.`}
            >
              👍 {issue.upvoteCount} <span style={{ fontSize: "10px" }}>Experiencing</span>
            </button>
            <button
              className={`vote-btn ${userVote === "DOWN" ? "vote-btn--active-down" : ""}`}
              onClick={() => handleVote("DOWN")}
              aria-pressed={userVote === "DOWN"}
              aria-label={`${issue.downvoteCount} people not affected. Mark as not affected.`}
            >
              👎 {issue.downvoteCount} <span style={{ fontSize: "10px" }}>Not Affected</span>
            </button>
          </div>

          {/* Tab navigation */}
          <div role="tablist" aria-label="Issue sections" style={{ display: "flex", gap: "var(--space-1)", borderBottom: "1px solid var(--border)", marginBottom: "var(--space-5)" }}>
            {([
              { id: "overview", label: "Overview" },
              { id: "timeline", label: `Timeline (${issue.accountabilityEvents?.length || 0})` },
              { id: "comments", label: `Comments (${issue.comments?.length || 0})` },
            ] as const).map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "var(--space-3) var(--space-4)",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? "var(--gov-blue)" : "var(--ink-muted)",
                  borderBottom: activeTab === tab.id ? "2px solid var(--gov-blue)" : "2px solid transparent",
                  marginBottom: "-1px",
                  transition: "all var(--transition-fast)",
                  minHeight: "44px",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" hidden={activeTab !== "overview"}>
            {/* Resolution note */}
            {issue.resolutionNote && (
              <div className="card" style={{ background: "var(--civic-green-tint)", border: "1px solid rgba(93,128,106,0.2)", marginBottom: "var(--space-5)" }}>
                <div style={{ fontWeight: 700, marginBottom: "var(--space-2)", color: "var(--civic-green)" }}>
                  ✅ Resolution Note
                </div>
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--ink)" }}>{issue.resolutionNote}</p>
              </div>
            )}

            {/* Verification CTA */}
            {issue.status === "AWAITING_VERIFICATION" && getToken() && (
              <div className="verification-panel" style={{ marginBottom: "var(--space-5)" }}>
                <div className="verification-panel__icon">🤔</div>
                <h2 className="verification-panel__title">Is this fixed?</h2>
                <p className="verification-panel__subtitle">
                  The authority has marked this as resolved. Can you confirm if the problem is actually fixed?
                </p>
                <div className="verification-panel__actions">
                  <a href={`/issues/${issueId}/verify?confirm=true`} className="btn btn--success btn--full">
                    ✅ Yes, it's fixed!
                  </a>
                  <a href={`/issues/${issueId}/verify?confirm=false`} className="btn btn--danger btn--full">
                    ❌ No, still broken
                  </a>
                </div>
              </div>
            )}

            {/* Official responses */}
            {issue.officialResponses?.length > 0 && (
              <div style={{ marginBottom: "var(--space-5)" }}>
                <h2 style={{ fontSize: "var(--font-size-base)", fontWeight: 700, marginBottom: "var(--space-3)" }}>Official Response</h2>
                {issue.officialResponses.map((r: any) => (
                  <div key={r.id} className="card card--flat" style={{ marginBottom: "var(--space-3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                      <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{r.action?.replace(/_/g, " ")}</span>
                      <span style={{ fontSize: "var(--font-size-xs)", color: "var(--ink-muted)" }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {r.note && <p style={{ fontSize: "var(--font-size-sm)", color: "var(--ink-muted)" }}>{r.note}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-card__value">{issue.reportCount}</div>
                <div className="stat-card__label">Total Reports</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value">{issue.upvoteCount}</div>
                <div className="stat-card__label">Experiencing</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value">{issue.downvoteCount}</div>
                <div className="stat-card__label">Not Affected</div>
              </div>
            </div>
          </div>

          <div role="tabpanel" id="panel-timeline" aria-labelledby="tab-timeline" hidden={activeTab !== "timeline"}>
            <Timeline events={issue.accountabilityEvents || []} />
          </div>

          <div role="tabpanel" id="panel-comments" aria-labelledby="tab-comments" hidden={activeTab !== "comments"}>
            {/* Comment form */}
            {getToken() && (
              <div className="card" style={{ marginBottom: "var(--space-5)" }}>
                <div className="form-group">
                  <label htmlFor="new-comment" className="form-label">Add a comment</label>
                  <textarea
                    id="new-comment"
                    className="form-textarea"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your observation or update about this issue…"
                    maxLength={1000}
                    rows={3}
                    aria-label="Your comment"
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      className="btn btn--primary"
                      onClick={handleComment}
                      disabled={!comment.trim() || submittingComment}
                    >
                      {submittingComment ? <span className="spinner spinner--sm spinner--white" aria-hidden="true" /> : "Post Comment"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Comments list */}
            {(issue.comments || []).length === 0 ? (
              <div className="empty-state" style={{ padding: "var(--space-8)" }}>
                <div style={{ fontSize: 40 }}>💬</div>
                <p style={{ color: "var(--ink-muted)" }}>No comments yet. Be the first to share an update.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {(issue.comments || []).map((c: any) => (
                  <div key={c.id} className="card card--flat">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                      <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>
                        {c.user?.anonymous ? "Anonymous" : c.user?.name || "Community Member"}
                      </span>
                      <time dateTime={c.createdAt} style={{ fontSize: "var(--font-size-xs)", color: "var(--ink-muted)" }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </time>
                    </div>
                    <p style={{ fontSize: "var(--font-size-sm)", color: "var(--ink-muted)" }}>{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
}
