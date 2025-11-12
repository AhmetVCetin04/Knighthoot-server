import React from "react";
import { useNavigate } from "react-router-dom";
import ucf from "../assets/ucf.png";
import play from "../assets/play.png";
import reports from "../assets/reports.png";
import settings from "../assets/settings.png";
import SiteBackground from '../components/SiteBackground';
import "../styles/StudentDash.css";

function StudentDash() {
  const navigate = useNavigate();
  const [uOpen, setUOpen] = React.useState(false);

  function logout() {
    localStorage.removeItem("user_data");
    navigate("/login", { replace: true });
  }

  return (
    <main className="site-bg">
      <SiteBackground />

      {/* ===== HEADER ===== */}
      <header className="studenttopbar">
        <div className="studenttopbar__left">
          <span className="studenttopbar__brand">Knighthoot</span>
          <span className="studenttopbar__divider">|</span>
          <span className="studenttopbar__context">Student Dashboard</span>
        </div>

        <div className="studenttopbar__right">
          <img src={ucf} alt="UCF" className="studenttopbar__logo" />
          <div className="userMenu">
            <button
              className="userMenu__btn"
              aria-haspopup="menu"
              aria-expanded={uOpen}
              onClick={() => setUOpen(v => !v)}
            >
              Account ▾
            </button>
            {uOpen && (
              <div className="userMenu__list" role="menu">
                <button role="menuitem" onClick={() => { setUOpen(false); navigate("settings"); }}>
                  Settings
                </button>
                <button role="menuitem" onClick={() => { setUOpen(false); logout(); }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <section className="teacher__stage">
        <div className="teacher__welcome">
          <h1>Welcome, Student!</h1>
          <p>Choose an option to get started</p>
        </div>

        <div className="teacher__grid">
          <div
            className="teacher__tile gold"
            onClick={() => navigate("/student/start")}
          >
            <img src={play} alt="Start Test" />
            <div>
              {/* h3 -> h2 to keep heading order: h1 (page) → h2 (tiles) */}
              <h2>Start Test</h2>
              <p>Join a quiz with a game code</p>
            </div>
          </div>

          <div
            className="teacher__tile gold-dark"
            onClick={() => navigate("/student/reports")}
          >
            <img src={reports} alt="Reports" />
            <div>
              {/* h3 -> h2 for sequential order */}
              <h2>Reports</h2>
              <p>View your quiz results and progress</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default StudentDash;
