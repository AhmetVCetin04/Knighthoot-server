import React, { useMemo, useState } from "react";
import "../styles/Settings.css";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const API_RESET_PASSWORD = "/api/reset-password";
const API_DELETE_ACCOUNT = "/api/account/delete"; // change if your server mounted a different path

export default function SettingsPage() {
  // If you save the email on login, prefill from storage; otherwise leave blank
  const savedEmail = useMemo(() => localStorage.getItem("email") || "", []);
  const [email, setEmail] = useState(savedEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function clearAlerts() {
    setMsg(null);
    setErr(null);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    clearAlerts();

    if (!email || !otp || !newPassword) {
      setErr("Please fill in email, OTP, and a new password.");
      return;
    }

    try {
      setBusy(true);
      const res = await fetch(API_RESET_PASSWORD, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to reset password");
      }

      setMsg("Password has been reset successfully.");
      setOtp("");
      setNewPassword("");
    } catch (e: any) {
      setErr(e.message || "Something went wrong resetting the password.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAccount() {
    clearAlerts();
    const sure = window.confirm(
      "This will permanently delete your account. This action cannot be undone. Continue?"
    );
    if (!sure) return;

    try {
      setBusy(true);
      const res = await fetch(API_DELETE_ACCOUNT, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete account");
      }

      setMsg("Your account was deleted. You will be signed out.");
      // optional: clear local data and redirect after a short delay
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        // navigate to landing/login (adjust to your router)
        window.location.href = "/login";
      }, 1000);
    } catch (e: any) {
      setErr(e.message || "Something went wrong deleting your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="settings-page">
      <header className="settings-header">
        <h1>Settings</h1>
        <p className="settings-sub">Manage your account and security.</p>
      </header>

      {/* Alerts */}
      {(msg || err) && (
        <div className={`settings-alert ${msg ? "ok" : "error"}`}>
          {msg || err}
        </div>
      )}

      {/* Change Password (OTP) */}
      <section className="settings-card">
        <h2>Change Password</h2>
        <p className="muted">
          Enter your email, the OTP you received, and a new password.
        </p>

        <form className="settings-form" onSubmit={handleResetPassword}>
          <label className="settings-label">
            Email
            <input
              type="email"
              className="settings-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="settings-label">
            OTP
            <input
              type="text"
              className="settings-input"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              required
            />
          </label>

          <label className="settings-label">
            New Password
            <div className="pwd-wrap">
              <input
                type={showPwd ? "text" : "password"}
                className="settings-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowPwd((s) => !s)}
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <button className="primary-btn" type="submit" disabled={busy}>
            {busy ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div className="otp-hint">
          <strong>Need an OTP?</strong> Use your “Forgot Password” flow to send
          one to your email, then come back here to finish the reset.
        </div>
      </section>

      {/* Danger Zone */}
      <section className="settings-card danger">
        <h2>Danger Zone</h2>
        <p className="muted">
          Permanently delete your account and all associated data.
        </p>
        <button className="danger-btn" onClick={handleDeleteAccount} disabled={busy}>
          {busy ? "Processing..." : "Delete Account"}
        </button>
      </section>
    </main>
  );
}
