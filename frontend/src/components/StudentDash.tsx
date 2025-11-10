import React from "react";
import { useNavigate } from "react-router-dom";
import ucf from "../assets/ucf.png";
import play from "../assets/play.png";
import reports from "../assets/reports.png";
import settings from "../assets/settings.png";
import "../styles/StudentDash.css";

function StudentDash() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("user_data");
    navigate("/login", { replace: true });
  }

  return (
    <main className="site-bg">
      {/* ===== HEADER (copied & adjusted) ===== */}
      <header className="studenttopbar">
        <div className="studenttopbar__left">
          <span className="studenttopbar__brand">Knighthoot</span>
          <span className="studenttopbar__divider">|</span>
          <span className="studenttopbar__context">Student Dashboard</span>
        </div>

        <div className="studenttopbar__right">
          <img src={ucf} alt="UCF" className="studenttopbar__logo" />
          <button className="studenttopbar__logout" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <section className="student__stage">
        <div className="student__welcome">
          <h1>Welcome, Student!</h1>
          <p>Choose an option to get started</p>
        </div>

        <div className="student__grid">
          <div
            className="student__tile gold"
            onClick={() => navigate("/student/start")}
          >
            <img src={play} alt="Start Test" />
            <div>
              <h3>Start Test</h3>
              <p>Join a quiz with a game code</p>
            </div>
          </div>

          <div
            className="student__tile silver"
            onClick={() => navigate("/student/reports")}
          >
            <img src={reports} alt="Reports" />
            <div>
              <h3>Reports</h3>
              <p>View your quiz results and progress</p>
            </div>
          </div>

          <div
            className="student__tile silver-dark"
            onClick={() => navigate("/student/settings")}
          >
            <img src={settings} alt="Settings" />
            <div>
              <h3>Settings</h3>
              <p>Account and preferences</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
export default StudentDash;