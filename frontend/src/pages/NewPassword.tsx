import React, { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import SiteBackground from "../components/SiteBackground";

/* Use the exact same CSS that already works for the Reset page */
import "/src/styles/PasswordReset.css";

//const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const API_BASE = "https://knighthoot.app";
const api = (path: string, init?: RequestInit) => fetch(`${API_BASE}${path}`, init);

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function NewPasswordPage() {
  const q = useQuery();
  const navigate = useNavigate();
  const email = q.get("email") || "";

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const canSubmit =
    !!email && otp.trim().length > 0 && password && confirm && password === confirm;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!canSubmit) { setErr("Enter the code and matching passwords."); return; }

    try {
      setBusy(true);
      const res = await api("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp: otp.trim(), newPassword: password }),
      });

      let message = "";
      try {
        const j = await res.json();
        message = j?.message || j?.error || j?.detail || "";
      } catch {
        message = (await res.text().catch(() => "")) || "";
      }

      if (!res.ok) { setErr(message || `Request failed (${res.status})`); return; }

      setMsg(message || "Password updated. Redirecting to login…");
      setTimeout(() => navigate("/login", { replace: true }), 1000);
    } catch (e: any) {
      setErr(e?.message || "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pr-root">
      {/* Background layer */}
      <div className="pr-bg" aria-hidden="true">
        <div className="pr-bg-inner"><SiteBackground /></div>
      </div>

      {/* Centered card */}
      <main className="pr-center" role="main">
        <section className="pr-card" role="form" aria-labelledby="np-title">
          <h1 id="np-title" className="pr-title">Choose a new password</h1>

          {!email && (
            <p className="pr-sub" style={{ color: "#ffb4b4" }}>
              Missing email. Start from{" "}
              <Link className="pr-link" to="/password-reset">Reset Password</Link>.
            </p>
          )}

          <form className="pr-form" onSubmit={handleSubmit} noValidate>
            <label className="pr-label" htmlFor="otp">6-digit code</label>
            <input
              id="otp"
              className="pr-input"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              disabled={!email || busy}
              required
            />

            <label className="pr-label" htmlFor="pw">New password</label>
            <input
              id="pw"
              className="pr-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              disabled={!email || busy}
            />

            <label className="pr-label" htmlFor="pwc">Confirm password</label>
            <input
              id="pwc"
              className="pr-input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
              disabled={!email || busy}
            />

            {msg && <div className="pr-msg pr-ok">{msg}</div>}
            {err && <div className="pr-msg pr-err">{err}</div>}

            <button type="submit" className="pr-submit" disabled={!canSubmit || busy}>
              {busy ? "Saving..." : "Update password"}
            </button>
          </form>

          <p className="pr-footer">
            Return to <Link to="/login" className="pr-link">Login</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
