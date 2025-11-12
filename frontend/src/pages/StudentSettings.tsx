import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../App.css";
import "../styles/StudentDash.css";
import "../styles/Settings.css"; // uses .settings-* + .settings-narrow

// Pointing to local server for development to avoid CORS/Port issues
const API_BASE = "https://knighthoot.app";
const api = (path: string, init?: RequestInit) => fetch(`${API_BASE}${path}`, init);

/** Pull a reasonable "username", role, AND email from what your login stored */
function useCurrentUser() {
  return useMemo(() => {
    try {
      const raw = localStorage.getItem("user_data");
      // If no data, return defaults
      if (!raw) return { username: "—", role: "Student", email: null };
      
      const data = JSON.parse(raw);
      // Handle various data structures from different login responses
      const user =
        data?.user ?? data?.profile ?? data?.student ?? data?.data?.user ?? data;

      const username =
        user?.username ??
        user?.name ??
        user?.displayName ??
        user?.email ??
        "User";
        
      // Extract the email to use for the password reset flow
      const email = user?.email ?? null;

      const role =
        (user?.role ?? data?.role ?? (data?.isTeacher ? "Teacher" : "Student")) as
          | "Student"
          | "Teacher";

      return { username: String(username), role, email };
    } catch {
      return { username: "User", role: "Student" as const, email: null };
    }
  }, []);
}

export default function StudentSettingsPage() {
  const navigate = useNavigate();
  // Get email from our hook so we can send it to the API
  const { username, role, email } = useCurrentUser();

  // State for the Password Reset interaction
  const [busyPw, setBusyPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  // Danger zone state
  const [busyDelete, setBusyDelete] = useState(false);
  const [delMsg, setDelMsg] = useState<string | null>(null);
  const [delErr, setDelErr] = useState<string | null>(null);

  // Instead of asking for current password, we just trigger the email code flow
  async function handleSendResetCode() {
    setPwMsg(null);
    setPwErr(null);

    if (!email) {
      setPwErr("Could not find your email. Please try logging in again.");
      return;
    }

    try {
      setBusyPw(true);
      const res = await api("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email }),
      });

      let text = "";
      try {
        const j = await res.json();
        text = j?.message || (j?.otp ? "We sent you a code. Check your email." : "");
      } catch {
        text = (await res.text().catch(() => "")) || "";
      }

      if (!res.ok) {
        setPwErr(text || `Request failed (${res.status})`);
        return;
      }

      setPwMsg(text || "We sent you a code. Check your email.");
      
      setTimeout(() => navigate(`/password-reset/new?email=${encodeURIComponent(email)}`), 1000);

    } catch (err: any) {
      setPwErr(err?.message || "Network error");
    } finally {
      setBusyPw(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("This will permanently delete your account. Continue?")) return;

    setDelMsg(null);
    setDelErr(null);

    try {
      setBusyDelete(true);
      const res = await api("/api/account/delete", { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      let text = "";
      try {
        const j = await res.json();
        text = j?.message || j?.detail || "";
      } catch {
        text = (await res.text().catch(() => "")) || "";
      }

      if (!res.ok) {
        setDelErr(text || `Request failed (${res.status})`);
        return;
      }

      setDelMsg(text || "Account deleted.");
      localStorage.removeItem("token");
      localStorage.removeItem("user_data");
      setTimeout(() => navigate("/"), 800);
    } catch (err: any) {
      setDelErr(err?.message || "Network error");
    } finally {
      setBusyDelete(false);
    }
  }

  return (
    <main className="settings-page"> {/* Use settings-page wrapper */}
      
      <header className="settings-header">
        {/* Back Button (Using correct ghost-btn class from Settings.css) */}
        <button className="ghost-btn" onClick={() => navigate("/dashboard/student")}>
          ← Back to Dashboard
        </button>
      </header>

      <div className="settings-container">
        {/* Main Title Block */}
        <div className="settings-header">
          <h1>Settings</h1>
          <p className="settings-sub">Manage your account settings and preferences</p>
        </div>

        {/* Account information */}
        <section className="settings-card">
          <h2 className="settings-card-title">Account Information</h2>
          <div className="settings-form">
            {/* Key-Value Pair structure (using settings-label for stack) */}
            <div className="settings-label">
              <div className="muted">Username</div>
              <div>{username}</div>
            </div>
            <div className="settings-label">
              <div className="muted">Email</div>
              <div>{email || "—"}</div>
            </div>
            <div className="settings-label">
              <div className="muted">Account Type</div>
              <div>{role || "Student"}</div>
            </div>
          </div>
        </section>

        {/* Change Password (via Email Reset) */}
        <section className="settings-card">
          <h2 className="settings-card-title">Change Password</h2>

          <div className="settings-narrow">
            <p className="settings-note">
              To ensure security, we will send a 6-digit reset code to your email 
              <span className="muted"> ({email})</span>. You will be redirected to verify the code and set a new password.
            </p>

            {/* Display Messages (using correct settings-alert class) */}
            {pwMsg && <div className="settings-alert ok">{pwMsg}</div>}
            {pwErr && <div className="settings-alert error">{pwErr}</div>}

            <button 
              type="button" 
              className="primary-btn" 
              onClick={handleSendResetCode}
              disabled={busyPw}
              style={{ width: 'fit-content', marginTop: '16px' }}
            >
              {busyPw ? "Sending Code..." : "Send Password Reset Code"}
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="settings-card danger">
          <h2 className="settings-card-title">Danger Zone</h2>

          <div className="settings-narrow">
            <p className="settings-note">
              Once you delete your account, there is no going back. Please be certain.
            </p>

            {/* Display Messages */}
            {delMsg && <div className="settings-alert ok">{delMsg}</div>}
            {delErr && <div className="settings-alert error">{delErr}</div>}

            <button
              className="danger-btn" 
              onClick={handleDeleteAccount}
              disabled={busyDelete}
            >
              {busyDelete ? "Deleting…" : "Delete Account"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}