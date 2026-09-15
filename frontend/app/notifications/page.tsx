"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "../../components/TopBar";
import { BottomNav } from "../../components/BottomNav";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  civicIssueId?: string;
}

const NOTIFICATION_ICONS: Record<string, string> = {
  NEARBY_ISSUE: "📍",
  YOUR_GRIEVANCE: "📋",
  RESOLUTION_VERIFICATION: "❓",
  OFFICIAL_UPDATE: "🏛️",
  ESCALATION: "🚨",
  REWARD: "🎉",
  FRAUD_WARNING: "⚠️",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  const getToken = () => typeof window !== "undefined" ? localStorage.getItem("ec_token") : null;

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    fetch(`${API_URL}/notifications?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setNotifications(data.data);
          setUnread(data.meta?.unread || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    const token = getToken();
    if (!token) return;
    await fetch(`${API_URL}/notifications/${id}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(u => Math.max(0, u - 1));
  };

  const markAllRead = async () => {
    const token = getToken();
    if (!token) return;
    await fetch(`${API_URL}/notifications/read-all`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  return (
    <div className="app-shell">
      <TopBar
        title={unread > 0 ? `Notifications (${unread})` : "Notifications"}
        rightElement={
          unread > 0 ? (
            <button
              className="btn btn--ghost"
              style={{ fontSize: "var(--font-size-xs)", padding: "var(--space-2) var(--space-3)", minHeight: "32px" }}
              onClick={markAllRead}
              aria-label="Mark all notifications as read"
            >
              Mark all read
            </button>
          ) : undefined
        }
      />
      <main className="page-content" role="main" id="main-content">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
            <span className="spinner spinner--lg" aria-label="Loading notifications" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🔔</div>
            <h2 className="empty-state__title">No notifications yet</h2>
            <p className="empty-state__subtitle">You'll be notified about updates to your reports and nearby issues.</p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }} role="list" aria-label="Notifications">
            {notifications.map((notif, i) => (
              <motion.li
                key={notif.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <button
                  className={`notification-item ${!notif.read ? "notification-item--unread" : ""}`}
                  style={{ width: "100%", border: "none", textAlign: "left" }}
                  onClick={() => {
                    if (!notif.read) markRead(notif.id);
                    if (notif.civicIssueId) router.push(`/issues/${notif.civicIssueId}`);
                  }}
                  aria-label={`${notif.title}. ${notif.read ? "Read" : "Unread"}`}
                >
                  <div className="notification-item__icon" aria-hidden="true">
                    {NOTIFICATION_ICONS[notif.type] || "📢"}
                  </div>
                  <div className="notification-item__content">
                    <div className="notification-item__title">{notif.title}</div>
                    <div className="notification-item__body">{notif.body}</div>
                    <div className="notification-item__time">
                      <time dateTime={notif.createdAt}>
                        {new Date(notif.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                      </time>
                    </div>
                  </div>
                  {!notif.read && (
                    <div
                      style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gov-blue)", flexShrink: 0, alignSelf: "center" }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
