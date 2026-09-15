"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TopBar } from "../../components/TopBar";
import { BottomNav } from "../../components/BottomNav";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Profile {
  id: string;
  name: string;
  phone: string;
  anonymous: boolean;
  role: string;
  trustState: string;
  phoneVerified: boolean;
  verifiedCount: number;
  createdAt: string;
  coupons: Array<{ id: string; description: string; expiresAt: string; redeemedAt?: string }>;
}

const TRUST_DISPLAY: Record<string, { label: string; icon: string; cssClass: string }> = {
  TRUSTED:     { label: "Trusted Reporter", icon: "✅", cssClass: "trust-badge--trusted" },
  SUSPICIOUS:  { label: "Under Review", icon: "⚠️", cssClass: "trust-badge--suspicious" },
  VERIFICATION:{ label: "Being Verified", icon: "🔍", cssClass: "trust-badge--verification" },
  FAKER:       { label: "Flagged", icon: "🚫", cssClass: "trust-badge--faker" },
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const getToken = () => typeof window !== "undefined" ? localStorage.getItem("ec_token") : null;

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    fetch(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) { setProfile(data.data); setNewName(data.data.name); }
        else { router.push("/login"); }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveName = async () => {
    if (!newName.trim() || newName === profile?.name) { setEditingName(false); return; }
    setSaving(true);
    setSaveError("");
    try {
      const r = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name: newName }),
      });
      const data = await r.json();
      if (data.success) {
        setProfile(prev => prev ? { ...prev, name: data.data.name } : prev);
        setEditingName(false);
      } else {
        setSaveError(data.error?.message || "Failed to update");
      }
    } catch {
      setSaveError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ec_token");
    localStorage.removeItem("ec_refresh");
    router.push("/login");
  };

  if (loading || !profile) return (
    <div className="app-shell">
      <TopBar title="Profile" />
      <main className="page-content container" style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <span className="spinner spinner--lg" aria-label="Loading profile" />
      </main>
    </div>
  );

  const trustDisplay = TRUST_DISPLAY[profile.trustState] || TRUST_DISPLAY.TRUSTED;
  const initials = profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <TopBar title="Profile" />
      <main className="page-content container" role="main" id="main-content">

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}
        >

          {/* Profile card */}
          <div className="profile-card">
            <div className="profile-card__avatar" aria-hidden="true">{initials}</div>
            <div className="profile-card__info">
              <div className="profile-card__name">{profile.name}</div>
              <div className="profile-card__meta">
                {profile.phone} {profile.phoneVerified ? "✅" : ""}
              </div>
              <div style={{ marginTop: "var(--space-2)" }}>
                <span className={`trust-badge ${trustDisplay.cssClass}`} aria-label={`Trust status: ${trustDisplay.label}`}>
                  {trustDisplay.icon} {trustDisplay.label}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-card__value">{profile.verifiedCount}</div>
              <div className="stat-card__label">Verifications</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">
                {profile.coupons?.filter(c => !c.redeemedAt).length || 0}
              </div>
              <div className="stat-card__label">Active Rewards</div>
            </div>
          </div>

          {/* Edit name */}
          <div className="card">
            <h2 style={{ fontSize: "var(--font-size-base)", fontWeight: 700, marginBottom: "var(--space-4)" }}>Account Settings</h2>

            <div className="form-group" style={{ marginBottom: "var(--space-4)" }}>
              <label htmlFor="display-name" className="form-label">Display Name</label>
              {editingName ? (
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <input
                    id="display-name"
                    type="text"
                    className="form-input"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                    aria-describedby="name-error"
                  />
                  <button className="btn btn--primary" onClick={handleSaveName} disabled={saving}>
                    {saving ? <span className="spinner spinner--sm spinner--white" aria-hidden="true" /> : "Save"}
                  </button>
                  <button className="btn btn--ghost" onClick={() => { setEditingName(false); setNewName(profile.name); }}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                  <div className="form-input" style={{ flex: 1, background: "var(--canvas)", color: "var(--ink-muted)" }}>{profile.name}</div>
                  <button className="btn btn--secondary" onClick={() => setEditingName(true)} aria-label="Edit display name">Edit</button>
                </div>
              )}
              {saveError && <p id="name-error" className="form-error" role="alert">{saveError}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Report Privacy</label>
              <div className="alert alert--info" role="note">
                <span aria-hidden="true">👤</span>
                <span>
                  {profile.anonymous
                    ? "Your reports are submitted anonymously by default."
                    : "Your display name may appear on public issue cards."}
                </span>
              </div>
            </div>
          </div>

          {/* Rewards / Coupons */}
          {profile.coupons?.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: "var(--font-size-base)", fontWeight: 700, marginBottom: "var(--space-4)" }}>🎉 Rewards</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {profile.coupons.map(coupon => (
                  <div
                    key={coupon.id}
                    className="card card--flat"
                    style={{ opacity: coupon.redeemedAt ? 0.5 : 1 }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", marginBottom: "var(--space-1)" }}>
                      {coupon.description}
                    </div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--ink-muted)" }}>
                      {coupon.redeemedAt
                        ? `Redeemed on ${new Date(coupon.redeemedAt).toLocaleDateString()}`
                        : `Expires ${new Date(coupon.expiresAt).toLocaleDateString()}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            className="btn btn--danger btn--full"
            onClick={handleLogout}
            aria-label="Sign out of EcoConnect"
          >
            Sign Out
          </button>

        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
}
