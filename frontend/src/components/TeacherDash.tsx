import React from "react";
import { useNavigate } from "react-router-dom";
import ucf from "../assets/ucf.png";
import plus from "../assets/plus.png";
import book from "../assets/book.png";
import play from "../assets/play.png";
import students from "../assets/students.png";
import reports from "../assets/reports.png";
import settings from "../assets/settings.png";
import SiteBackground from '../components/SiteBackground';
import "../styles/TeacherDash.css";

function TeacherDash() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("user_data");
    navigate("/login", { replace: true });
  }

  return (
    <main className="site-bg">
      <SiteBackground />
      {/* ===== HEADER ===== */}
      <header className="teachertopbar">
        <div className="teachertopbar__left">
          <span className="teachertopbar__brand">Knighthoot</span>
          <span className="teachertopbar__divider">|</span>
          <span className="teachertopbar__context">Teacher Dashboard</span>
        </div>

        <div className="teachertopbar__right">
          <img src={ucf} alt="UCF" className="teachertopbar__logo" />
          <button className="teachertopbar__logout" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <section className="teacher__stage">
      <div className="teacher__welcome">
        <h1>Welcome, Teacher!</h1>
        <p>Choose an option to get started</p>
      </div>

      <div className="teacher__grid">
        <div className="teacher__tile gold" onClick={() => navigate("create-quiz")}>
          <img src={plus} alt="Create" />
          <div><h3>Create Quiz</h3><p>Design a new quiz or game</p></div>
        </div>

        <div className="teacher__tile gold-dark" onClick={() => navigate("quizzes")}>
          <img src={book} alt="My Quizzes" />
          <div><h3>My Quizzes</h3><p>View and manage your quizzes</p></div>
        </div>

        <div className="teacher__tile gold" onClick={() => navigate("start")}>
          <img src={play} alt="Start Test" />
          <div><h3>Start Test</h3><p>Launch a quiz for your students</p></div>
        </div>

        <div className="teacher__tile silver" onClick={() => navigate("students")}>
          <img src={students} alt="Students" />
          <div><h3>Students</h3><p>Manage your students</p></div>
        </div>

        <div className="teacher__tile silver-dark" onClick={() => navigate("reports")}>
          <img src={reports} alt="Reports" />
          <div><h3>Reports</h3><p>View analytics and student progress</p></div>
        </div>

        <div className="teacher__tile bronze" onClick={() => navigate("settings")}>
          <img src={settings} alt="Settings" />
          <div><h3>Settings</h3><p>Account and preferences</p></div>
        </div>
      </div>
    </section>
    </main>
  );
}
export default TeacherDash;