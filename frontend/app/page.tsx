"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { IssueCard } from "../components/IssueCard";
import { HomeIllustration, EmptyIssuesIllustration } from "../components/Illustrations";
import { useEffect, useState } from "react";

interface Issue {
  id: string;
  title: string;
  category: any;
  status: any;
  priority: any;
  publicAreaLabel: string;
  reportCount: number;
  upvoteCount: number;
  downvoteCount: number;
}

export default function HomePage() {
  const [nearbyIssues, setNearbyIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch public issue feed
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/issues?limit=5`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setNearbyIssues(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-shell">
      <TopBar />

      <main
        className="page-content container"
        id="main-content"
        role="main"
        tabIndex={-1}
      >
        {/* Skip to main content — accessibility */}
        <a
          href="#main-content"
          style={{
            position: "absolute",
            top: "-100px",
            left: 0,
            zIndex: 9999,
            background: "var(--gov-blue)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "0 0 8px 0",
          }}
          className="btn btn--primary"
        >
          Skip to content
        </a>

        {/* Hero illustration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-6)" }}
        >
          <HomeIllustration width={320} height={180} />
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{ marginBottom: "var(--space-6)" }}
        >
          <Link href="/report" className="primary-cta" aria-label="Report a civic problem">
            <div className="primary-cta__icon" aria-hidden="true">📢</div>
            <div>
              <div className="primary-cta__title">REPORT A PROBLEM</div>
              <div className="primary-cta__subtitle">
                Submit evidence → AI analysis → Official routing
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Nearby Issues */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          aria-labelledby="nearby-heading"
          style={{ marginBottom: "var(--space-6)" }}
        >
          <div className="section-header">
            <h2 className="section-title" id="nearby-heading">Nearby Issues</h2>
            <Link href="/issues" className="section-link" aria-label="See all civic issues">
              See all →
            </Link>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
              <span className="spinner spinner--lg" aria-label="Loading nearby issues" />
            </div>
          ) : nearbyIssues.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
              <EmptyIssuesIllustration width={120} height={96} />
              <p style={{ color: "var(--ink-muted)", marginTop: "var(--space-4)", fontSize: "var(--font-size-sm)" }}>
                No issues reported nearby. Your community is doing great! 🌿
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {nearbyIssues.map((issue, i) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/issues/${issue.id}`} style={{ textDecoration: "none" }}>
                    <IssueCard
                      {...issue}
                      onCardPress={() => {}}
                    />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Stats strip */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          aria-label="Platform statistics"
        >
          <div className="card" style={{ background: "var(--surface-soft)" }}>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--ink-muted)", textAlign: "center" }}>
              🌍 <strong>AI-powered</strong> civic issue clustering · <strong>Community</strong> verification · <strong>SLA</strong> accountability
            </p>
          </div>
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
}
