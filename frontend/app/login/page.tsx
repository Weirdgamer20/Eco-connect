"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type AuthMode = "login" | "register" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sessionToken, setSessionToken] = useState("");

  const handleSendOTP = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.data.sessionToken) setSessionToken(data.data.sessionToken);
        setMessage(`OTP sent to ${phone}. ${data.data.mockOtp ? `(Dev: ${data.data.mockOtp})` : ""}`);
        setMode("otp");
      } else {
        setError(data.error?.message || "Failed to send OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name, consentGiven: true }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage("Registration successful! Check your phone for OTP.");
        if (data.data.sessionToken) setSessionToken(data.data.sessionToken);
        setMode("otp");
      } else {
        setError(data.error?.message || "Registration failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, sessionToken }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("ec_token", data.data.accessToken);
        if (data.data.refreshToken) {
          localStorage.setItem("ec_refresh", data.data.refreshToken);
        }
        router.push("/");
      } else {
        setError(data.error?.message || "Invalid OTP. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell" style={{ minHeight: "100vh", background: "var(--canvas)", display: "flex", alignItems: "center" }}>
      <div className="container" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-8)" }}>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: "var(--space-8)" }}
        >
          <div style={{
            width: 64, height: 64,
            background: "var(--gov-blue)",
            borderRadius: "var(--radius-lg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, margin: "0 auto var(--space-4)",
          }} aria-hidden="true">
            🌿
          </div>
          <h1 style={{ fontSize: "var(--font-size-2xl)", fontWeight: 800, color: "var(--ink)" }}>EcoConnect</h1>
          <p style={{ color: "var(--ink-muted)", fontSize: "var(--font-size-sm)", marginTop: "var(--space-2)" }}>
            Civic issue reporting for your community
          </p>
        </motion.div>

        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ maxWidth: 380, margin: "0 auto", padding: "var(--space-8) var(--space-6)" }}
        >
          {/* OTP entry */}
          {mode === "otp" ? (
            <>
              <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, marginBottom: "var(--space-2)" }}>Enter OTP</h2>
              <p style={{ color: "var(--ink-muted)", fontSize: "var(--font-size-sm)", marginBottom: "var(--space-6)" }}>
                {message || `A 6-digit code was sent to ${phone}`}
              </p>

              <div className="form-group" style={{ marginBottom: "var(--space-5)" }}>
                <label htmlFor="otp-input" className="form-label form-label--required">6-Digit OTP</label>
                <input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="form-input"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                  placeholder="• • • • • •"
                  style={{ fontSize: "var(--font-size-xl)", letterSpacing: "0.3em", textAlign: "center" }}
                  autoFocus
                  autoComplete="one-time-code"
                  aria-describedby="otp-error"
                />
              </div>

              {error && <p id="otp-error" className="form-error" role="alert" style={{ marginBottom: "var(--space-4)" }}>{error}</p>}

              <button
                className="btn btn--primary btn--full btn--lg"
                onClick={handleVerifyOTP}
                disabled={loading || otp.length < 6}
                aria-label="Verify OTP"
              >
                {loading ? <span className="spinner spinner--sm spinner--white" aria-hidden="true" /> : "Verify & Login →"}
              </button>

              <button
                className="btn btn--ghost btn--full"
                style={{ marginTop: "var(--space-3)" }}
                onClick={() => { setMode("login"); setOtp(""); setError(""); }}
              >
                ← Change phone number
              </button>
            </>
          ) : mode === "register" ? (
            <>
              <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, marginBottom: "var(--space-6)" }}>Create Account</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
                <div className="form-group">
                  <label htmlFor="reg-name" className="form-label form-label--required">Full Name</label>
                  <input
                    id="reg-name"
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ravi Kumar"
                    autoComplete="name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reg-phone" className="form-label form-label--required">Mobile Number</label>
                  <input
                    id="reg-phone"
                    type="tel"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>
              </div>

              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--ink-muted)", marginBottom: "var(--space-5)" }}>
                By registering, you consent to EcoConnect's Terms of Service and Privacy Policy. Your data is used only for civic reporting.
              </p>

              {error && <p className="form-error" role="alert" style={{ marginBottom: "var(--space-4)" }}>{error}</p>}

              <button
                className="btn btn--primary btn--full btn--lg"
                onClick={handleRegister}
                disabled={loading || !phone || !name}
              >
                {loading ? <span className="spinner spinner--sm spinner--white" aria-hidden="true" /> : "Register & Send OTP →"}
              </button>

              <button
                className="btn btn--ghost btn--full"
                style={{ marginTop: "var(--space-3)" }}
                onClick={() => { setMode("login"); setError(""); }}
              >
                Already have an account? Login
              </button>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, marginBottom: "var(--space-6)" }}>Login</h2>

              <div className="form-group" style={{ marginBottom: "var(--space-5)" }}>
                <label htmlFor="login-phone" className="form-label form-label--required">Mobile Number</label>
                <input
                  id="login-phone"
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(""); }}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  inputMode="tel"
                  autoFocus
                />
              </div>

              {error && <p className="form-error" role="alert" style={{ marginBottom: "var(--space-4)" }}>{error}</p>}

              <button
                className="btn btn--primary btn--full btn--lg"
                onClick={handleSendOTP}
                disabled={loading || !phone.trim()}
                aria-label="Send OTP to mobile number"
              >
                {loading ? <span className="spinner spinner--sm spinner--white" aria-hidden="true" /> : "Send OTP →"}
              </button>

              <button
                className="btn btn--ghost btn--full"
                style={{ marginTop: "var(--space-3)" }}
                onClick={() => { setMode("register"); setError(""); }}
              >
                New user? Register
              </button>
            </>
          )}
        </motion.div>

        <p style={{ textAlign: "center", fontSize: "var(--font-size-xs)", color: "var(--ink-muted)", marginTop: "var(--space-6)" }}>
          EcoConnect is a civic accountability platform. No spam, ever.
        </p>
      </div>
    </div>
  );
}
