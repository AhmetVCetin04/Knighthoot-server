import React, { useMemo, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import ucf from "../assets/ucf.png";
import house from "../assets/house.png";
import plus from "../assets/plus.png";
import book from "../assets/book.png";
import play from "../assets/play.png";
import reports from "../assets/reports.png";
import settings from "../assets/settings.png";
import logoutbut from "../assets/logoutbut.png";
import SiteBackground from '../components/SiteBackground';
import "../styles/TeacherLayout.css";

export default function TeacherLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // exactly /dashboard/teacher => the dashboard (index) route
  const onDashboard = location.pathname === "/dashboard/teacher";

  const pageTitle = useMemo(() => {
    if (onDashboard) return "";
    if (location.pathname.includes("/create-quiz")) return "Create Quiz";
    if (location.pathname.includes("/quizzes"))     return "My Quizzes";
    if (location.pathname.includes("/start"))       return "Start a Test";
    if (location.pathname.includes("/students"))    return "My Classes";
    if (location.pathname.includes("/reports"))     return "Reports";
    if (location.pathname.includes("/settings"))    return "Settings";
    return "";
  }, [location, onDashboard]);

  function logout() {
    localStorage.removeItem("user_data");
    navigate("/login", { replace: true });
  }

  return (
    <main className="site-bg">
      <SiteBackground />
      {/* HEADER + SIDEBAR only on inner pages */}
      {!onDashboard && (
        <>
          <header className="tl__topbar">
            <div className="tl__left">
              <span className="tl__brand">Knighthoot</span>
              <span className="tl__divider">|</span>
              <span className="tl__context">{pageTitle}</span>
            </div>
          </header>

          <aside className={`tl__sidebar ${open ? "is-open" : ""}`} aria-label="Teacher navigation">
            
            <div className="tl__sideHeader">
              <img src={ucf} alt="UCF" className="tl__sideSeal" />
            </div>
            <nav className="tl__menu" onClick={() => setOpen(false)}>
              <NavLink end to="/dashboard/teacher" className="tl__item">
                <img src={house} alt="" className="tl__icon" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/dashboard/teacher/create-quiz" className="tl__item">
                <img src={plus} alt="" className="tl__icon" />
                <span>Create Quiz</span>
              </NavLink>
              <NavLink to="/dashboard/teacher/quizzes" className="tl__item">
                <img src={book} alt="" className="tl__icon" />
                <span>My Quizzes</span>
              </NavLink>
              <NavLink to="/dashboard/teacher/start" className="tl__item">
                <img src={play} alt="" className="tl__icon" />
                <span>Start Test</span>
              </NavLink>
              <NavLink to="/dashboard/teacher/reports" className="tl__item">
                <img src={reports} alt="" className="tl__icon" />
                <span>Reports</span>
              </NavLink>
              <NavLink to="/dashboard/teacher/settings" className="tl__item">
                <img src={settings} alt="" className="tl__icon" />
                <span>Settings</span>
              </NavLink>
            </nav>

            <button className="tl__logoutBottom" onClick={logout}>
              <img src={logoutbut} alt="" className="tl__icon" />
              <span>Log Out</span>
            </button>
          </aside>

          {open && <div className="tl__overlay" onClick={() => setOpen(false)} />}
        </>
      )}

      {/* Content: dashboard owns its header (no padding); inner pages keep padding */}
      <section className={`tl__content ${onDashboard ? "tl__content--raw" : ""}`}>
        <Outlet />
      </section>
    </main>
  );
}
