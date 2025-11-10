import React, { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import SiteBackground from "../components/SiteBackground";

import ucf from "../assets/ucf.png";

// CSS
import "../App.css";
import "../Register.css";
import "../styles/StartTest.css";
import "../styles/StudentDash.css";



export default function StartTestPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const user = JSON.parse(localStorage.getItem("user_data") || "{}");
  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : (user?.name || "Student");


  async function handleJoin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!code.trim()) return;
        // const resp = await fetch("/api/join-quiz", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ accessCode: code })});
        // const data = await resp.json();
        // if (!resp.ok) { /* show an error */ return; }
    navigate(`/cards?code=${encodeURIComponent(code.trim())}`);
  }


  return (
    <div className="site-bg">
      <SiteBackground />

      <header className="studenttopbar">
        <div className="studenttopbar__left">
          <Link to="/" className="studenttopbar__brand">Knighthoot</Link>
          <span className="studenttopbar__divider">|</span>
          <span className="studenttopbar__context">Start Test</span>
        </div>

        <div className="studenttopbar__right">
          <img src={ucf} alt="UCF" className="studenttopbar__logo" />
          <button
            className="studenttopbar__logout"
            onClick={() => navigate("/login")}
          >
            Logout
          </button>
        </div>
      </header>


      <main className="starttest-shell">
        <section className="starttest-card">
          <div className="st-who">Logged in as</div>
          <h2 className="st-name">{displayName}</h2>

          <hr className="st-sep" />

          <h3 className="st-title">Join a Quiz</h3>
          <p className="st-sub">
            Enter the access code provided by your teacher to join the quiz.
          </p>

          <form onSubmit={handleJoin} className="st-form">
            <label className="st-label" htmlFor="access">Access Code</label>
            <input
              id="access"
              className="st-input"
              placeholder="XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={32}
            />
            <div className="st-hint">Access codes are not case-sensitive</div>

            <button type="submit" className="st-submit">Join Quiz</button>
          </form>

          <p className="st-footer">
            Need help? <Link to="/cards" className="st-link">See example</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
