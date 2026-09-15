"use client";

import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge, PriorityBadge } from "./StatusBadge";
import { CATEGORY_DISPLAY } from "@ecoconnect/types";
import type { IssueStatus, Priority, IssueCategory } from "@ecoconnect/types";
import { useState, useCallback } from "react";

interface IssueCardProps {
  id: string;
  title: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: Priority;
  publicAreaLabel: string;
  reportCount: number;
  upvoteCount: number;
  downvoteCount: number;
  mediaUrl?: string;
  userVote?: "UP" | "DOWN" | null;
  onVote?: (type: "UP" | "DOWN") => Promise<void>;
  onCardPress?: () => void;
  swipeMode?: boolean;
}

const SWIPE_THRESHOLD = 80;
const TILT_MAX = 15;

export function IssueCard({
  id,
  title,
  category,
  status,
  priority,
  publicAreaLabel,
  reportCount,
  upvoteCount,
  downvoteCount,
  mediaUrl,
  userVote,
  onVote,
  onCardPress,
  swipeMode = false,
}: IssueCardProps) {
  const [dragX, setDragX] = useState(0);
  const [votingUp, setVotingUp] = useState(false);
  const [votingDown, setVotingDown] = useState(false);

  const catDisplay = CATEGORY_DISPLAY[category];

  const handleVote = useCallback(async (type: "UP" | "DOWN") => {
    if (!onVote) return;
    if (type === "UP") setVotingUp(true);
    else setVotingDown(true);
    try {
      await onVote(type);
    } finally {
      setVotingUp(false);
      setVotingDown(false);
    }
  }, [onVote]);

  const swipeOpacityExperiencing = Math.max(0, Math.min(1, dragX / SWIPE_THRESHOLD));
  const swipeOpacityNotExperiencing = Math.max(0, Math.min(1, -dragX / SWIPE_THRESHOLD));

  return (
    <motion.article
      className="issue-card"
      drag={swipeMode ? "x" : false}
      dragElastic={0.3}
      dragConstraints={{ left: -200, right: 200 }}
      onDrag={(_, info) => setDragX(info.offset.x)}
      onDragEnd={(_, info) => {
        setDragX(0);
        if (info.offset.x > SWIPE_THRESHOLD) {
          handleVote("UP");
        } else if (info.offset.x < -SWIPE_THRESHOLD) {
          handleVote("DOWN");
        }
      }}
      animate={{
        rotate: swipeMode ? dragX / 15 : 0,
      }}
      onClick={onCardPress}
      style={{ cursor: swipeMode ? "grab" : onCardPress ? "pointer" : "default" }}
      role="article"
      aria-label={`Civic issue: ${title}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onCardPress?.();
      }}
    >
      {/* Swipe overlays (visible only during drag) */}
      {swipeMode && (
        <>
          <div
            className="issue-card__swipe-overlay issue-card__swipe-overlay--experiencing"
            style={{ opacity: swipeOpacityExperiencing }}
            aria-hidden="true"
          >
            EXPERIENCING
          </div>
          <div
            className="issue-card__swipe-overlay issue-card__swipe-overlay--not-experiencing"
            style={{ opacity: swipeOpacityNotExperiencing }}
            aria-hidden="true"
          >
            NOT AFFECTED
          </div>
        </>
      )}

      {/* Evidence image or placeholder */}
      {mediaUrl ? (
        <img
          src={mediaUrl}
          alt={`Evidence for: ${title}`}
          className="issue-card__image"
          draggable={false}
        />
      ) : (
        <div className="issue-card__image-placeholder" aria-hidden="true">
          {catDisplay?.icon || "📋"}
        </div>
      )}

      <div className="issue-card__body">
        {/* Category + Priority */}
        <div className="issue-card__meta">
          <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--ink-muted)" }}>
            {catDisplay?.icon} {catDisplay?.label || category}
          </span>
          <StatusBadge status={status} />
          <PriorityBadge priority={priority} />
        </div>

        {/* Title */}
        <h2 className="issue-card__title">{title}</h2>

        {/* Location */}
        <p className="issue-card__location">
          <span aria-hidden="true">📍</span>
          <span>{publicAreaLabel}</span>
          {reportCount > 1 && (
            <span style={{ marginLeft: "auto", fontWeight: 600, color: "var(--gov-blue)" }}>
              {reportCount} reports
            </span>
          )}
        </p>
      </div>

      {/* Vote controls */}
      <div className="issue-card__signals" role="group" aria-label="Community signals">
        <button
          className={`vote-btn ${userVote === "UP" ? "vote-btn--active-up" : ""}`}
          onClick={(e) => { e.stopPropagation(); handleVote("UP"); }}
          disabled={votingUp}
          aria-pressed={userVote === "UP"}
          aria-label={`${upvoteCount} people experiencing this problem. ${userVote === "UP" ? "Currently marked as experiencing." : "Mark as experiencing."}`}
        >
          {votingUp ? <span className="spinner spinner--sm" aria-hidden="true" /> : "👍"}
          <span>{upvoteCount}</span>
          <span style={{ fontSize: "10px", color: "inherit" }}>Experiencing</span>
        </button>

        <button
          className={`vote-btn ${userVote === "DOWN" ? "vote-btn--active-down" : ""}`}
          onClick={(e) => { e.stopPropagation(); handleVote("DOWN"); }}
          disabled={votingDown}
          aria-pressed={userVote === "DOWN"}
          aria-label={`${downvoteCount} people not experiencing this problem. ${userVote === "DOWN" ? "Currently marked as not affected." : "Mark as not affected."}`}
        >
          {votingDown ? <span className="spinner spinner--sm" aria-hidden="true" /> : "👎"}
          <span>{downvoteCount}</span>
          <span style={{ fontSize: "10px", color: "inherit" }}>Not Affected</span>
        </button>
      </div>
    </motion.article>
  );
}
