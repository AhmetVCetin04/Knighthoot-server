import React from "react";
import { useNavigate } from "react-router-dom";
import ucf from "../assets/ucf.png";
import plus from "../assets/plus.png";
import book from "../assets/book.png";
import play from "../assets/play.png";
import reports from "../assets/reports.png";
import settings from "../assets/settings.png";
import SiteBackground from '../components/SiteBackground';
import "../styles/TeacherDash.css";

function TeacherDash() {
  const navigate = useNavigate();
  const [uOpen, setUOpen] = React.useState(false);

  function logout() {
    localStorage.removeItem("user_data");
    navigate("/login", { replace: true });
  }

  return (
    <main className="site-bg" aria-label="Teacher dashboard">
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
          <div className="userMenu">
            <button
              className="userMenu__btn"
              aria-haspopup="menu"
              aria-expanded={uOpen}
              aria-label="Account menu"
              onClick={() => setUOpen(v => !v)}
            >
              Account ▾
            </button>
            {uOpen && (
              <div className="userMenu__list" role="menu">
                <button role="menuitem" onClick={() => { setUOpen(false); navigate("/dashboard/teacher/settings"); }}>
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
          <h1>Welcome, Teacher!</h1>
          <p>Choose an option to get started</p>
        </div>

        <div className="teacher__grid">
          <div className="teacher__tile gold" onClick={() => navigate("create-quiz")}>
            <img src={plus} alt="Create" />
            <div>
              {/* h2 to keep heading order sequential after the page h1 */}
              <h2>Create Quiz</h2>
              <p>Design a new quiz or game</p>
            </div>
          </div>

          <div className="teacher__tile gold-dark" onClick={() => navigate("quizzes")}>
            <img src={book} alt="My Quizzes" />
            <div>
              <h2>My Quizzes</h2>
              <p>View and manage your quizzes</p>
            </div>
          </div>

          <div className="teacher__tile silver" onClick={() => navigate("start")}>
            <img src={play} alt="Start Test" />
            <div>
              <h2>Start Test</h2>
              <p>Launch a quiz for your students</p>
            </div>
          </div>

          <div className="teacher__tile silver-dark" onClick={() => navigate("reports")}>
            <img src={reports} alt="Reports" />
            <div>
              <h2>Reports</h2>
              <p>View analytics and student progress</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
export default TeacherDash;
