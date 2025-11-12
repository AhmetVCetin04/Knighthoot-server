import React, { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteBackground from "../components/SiteBackground";
import "/src/styles/PasswordReset.css";

const API_BASE = "https://knighthoot.app";
const api = (path: string, init?: RequestInit) => fetch(`${API_BASE}${path}`, init);

export default function PasswordResetPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    const value = email.trim();
    if (!value) { setErr("Please enter your email."); return; }

    try {
      setBusy(true);
      const res = await api("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: value }),
      });

      let text = "";
      try {
        const j = await res.json();
        text = j?.message || (j?.otp ? "We sent you a code. Check your email." : "");
      } catch {
        text = (await res.text().catch(() => "")) || "";
      }

      if (!res.ok) { setErr(text || `Request failed (${res.status})`); return; }

      setMsg(text || "We sent you a code. Check your email.");
      setTimeout(() => navigate(`/password-reset/new?email=${encodeURIComponent(value)}`), 700);
    } catch (e: any) {
      setErr(e?.message || "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pr-root password-reset">
      {/* Fixed, non-layout background */}
      <div className="pr-bg" aria-hidden="true">
        <div className="pr-bg-inner">
          <SiteBackground />
        </div>
      </div>

      {/* Centered content */}
      <main className="pr-center" role="main">
        <section className="pr-card" role="form" aria-labelledby="pr-title">
          <h1 id="pr-title" className="pr-title">Reset your password</h1>
          <p className="pr-sub">
            Enter the email tied to your account. We’ll send a 6-digit code.
          </p>

          <form className="pr-form" onSubmit={handleSubmit} noValidate>
            <label className="pr-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="pr-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
              disabled={busy}
            />

            {msg && <div className="pr-msg pr-ok">{msg}</div>}
            {err && <div className="pr-msg pr-err">{err}</div>}

            <button className="pr-submit" type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send reset code"}
            </button>
          </form>

          <p className="pr-footer">
            Remembered? <Link to="/login" className="pr-link">Back to login</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
