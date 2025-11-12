import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SiteBackground from "../components/SiteBackground";
import ucf from "../assets/ucf.png";
import "../Register.css";

function Login() {
  const [message, setMessage] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  function handleSetName(e: any): void {
    setLoginName(e.target.value);
  }

  function handleSetPassword(e: any): void {
    setPassword(e.target.value);
  }

  async function doLogin(event: any): Promise<void> {
    event.preventDefault();
    setMessage('');
    const body = JSON.stringify({ username: loginName, password: loginPassword });

    try {
      setBusy(true);

      // Use relative path; Vite proxy forwards to your backend
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      // Try to read JSON (even on non-OK to show server error)
      let data: any = null;
      try {
        data = await response.json();
      } catch {
        /* ignore */
      }

      if (!response.ok) {
        const serverMsg = (data && (data.error || data.message)) || 'User/Password combination incorrect';
        setMessage(serverMsg);
        return;
      }

      // Save token (support various response shapes)
      const token = data?.token ?? data?.accessToken ?? data?.jwt ?? data?.data?.token ?? null;
      if (token) {
        localStorage.setItem('token', token);
      }

      // Keep original behavior: store whole payload for compatibility
      localStorage.setItem('user_data', JSON.stringify(data));

      // Try to find a usable teacher id for TID later
      const user = data?.user ?? data?.teacher ?? data?.profile ?? data?.data?.user ?? data;
      const teacherId = user?._id ?? user?.id ?? data?.teacherId ?? data?.TID ?? data?.id ?? null;
      if (teacherId) {
        localStorage.setItem('teacherId', String(teacherId));
      }

      // Decide role robustly
      const isTeacher = user?.role === 'teacher' || data?.role === 'teacher' || data?.isTeacher === true;
      navigate(isTeacher ? '/dashboard/teacher' : '/dashboard/student', { replace: true });
    } catch (err: any) {
      setMessage(err?.message || 'Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="site-bg">
      <SiteBackground />

      {/* Top bar */}
      <header className="reg-topbar">
        <button className="reg-back" onClick={() => navigate(-1)} aria-label="Back">← Back</button>
        <div className="reg-title">Knighthoot</div>
        <img src={ucf} alt="UCF" className="reg-logo" />
      </header>

      {/* Stage & Card */}
      <div className="reg-stage">
        <section className="reg-card">
          <h2 className="reg-card__heading">Log in</h2>
          <form className="reg-form" onSubmit={doLogin}>
            <input
              type="text"
              placeholder="Username or email"
              className="reg-input"
              value={loginName}
              onChange={handleSetName}
              autoFocus
            />
            <div className="reg-password-wrap">
              <input
                type="password"
                placeholder="Password"
                className="reg-input"
                value={loginPassword}
                onChange={handleSetPassword}
              />
            </div>
            <p className="reg-inline-help">
              Forgot password?{" "}
              <Link to="/password-reset" className="reg-link">Reset your password</Link>
            </p>
            <button type="submit" className="reg-submit" disabled={busy}>
              {busy ? "Signing in..." : "Log in"}
            </button>
            <p className="reg-footer">
              Don’t have an account?{" "}
              <Link to="/account-type" className="reg-link">Sign up</Link>
            </p>
            {message && <p className="reg-error">{message}</p>}
          </form>
        </section>
      </div>
    </main>
  );
}

export default Login;
