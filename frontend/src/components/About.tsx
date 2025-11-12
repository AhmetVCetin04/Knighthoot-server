// src/components/About.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import SiteBackground from "../components/SiteBackground";
import ucf from "../assets/ucf.png";
import "../Register.css";

export default function About() {
  const navigate = useNavigate();

  return (
    <main className="site-bg">
      <SiteBackground />

      {/* Top bar */}
      <header className="reg-topbar">
        <button className="reg-back" onClick={() => navigate(-1)} aria-label="Back">
          ← Back
        </button>
        <div className="reg-title">Knighthoot</div>
        <img src={ucf} alt="UCF" className="reg-logo" />
      </header>

      {/* Stage & Card */}
      <div className="reg-stage">
        <section
          className="reg-card"
          style={{ width: "min(720px, 92vw)", marginInline: "auto" }} // valid inline style
        >
          <h2 className="reg-card__heading">About Us</h2>

          <p style={{ marginTop: 8, lineHeight: 1.6 }}>
            Knighthoot is a project for COP4331 at the University of Central Florida.
          </p>
          <p style={{ marginTop: 10, lineHeight: 1.6 }}>
            Our goal is to create a simple, reliable platform for teachers to host quizzes
            and for students to participate with minimal friction. The app includes
            registration/login, dashboards for teachers and students, quiz creation and
            management, and in-class participation features.
          </p>
          <p style={{ marginTop: 10, lineHeight: 1.6 }}>
            This site is a work in progress. If you run into issues or have suggestions,
            please reach out to the team.
          </p>
        </section>
      </div>
    </main>
  );
}
