import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteBackground from '../components/SiteBackground';
import "../styles/StudentJoin.css";

function EnterAccessCode() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const trimmed = code.trim();
    if (!trimmed) return setErr("Enter the access code.");
    setLoading(true);

    navigate("/dashboard/student/waiting", {
      state: { quizId: trimmed, code: trimmed, title: "" },
      replace: true,
    });

    setLoading(false);
  }

  const inputId = "access-code";

  return (
    <main className="student-page">
      <SiteBackground />

      {/* ===== FIXED HEADER ===== */}
      <header className="student-live-header">
        <div className="student-live-header__left">
          <button className="back-btn" onClick={() => navigate("/dashboard/student")}>
            &larr; Back to Dashboard
          </button>
        </div>
        <div className="student-live-header__right">
          <span className="student-live-header__brand">Knighthoot</span>
        </div>
      </header>

      {/* ===== CARD CONTAINER ===== */}
      <form className="student-card student-join-card" onSubmit={handleJoin} noValidate>
        {/* Join Quiz Section */}
        <div className="student-card-section join-quiz-details">
          <h2>Join a Quiz</h2>
          <p className="instructions">
            Enter the access code provided by your teacher to join the quiz.
          </p>
        </div>

        {/* Input Form */}
        <div className="input-group">
          <label className="access-code-label" htmlFor={inputId}>Access Code</label>
          <input
            id={inputId}
            className="student-input"
            type="text"
            name="accessCode"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="XXXXXX"
            maxLength={32}
            autoFocus
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            aria-invalid={!!err}
            aria-describedby={err ? "access-code-error" : undefined}
          />
        </div>

        <button className="student-btn" type="submit" disabled={loading}>
          {loading ? "Joining…" : "Join Quiz"}
        </button>

        {err && (
          <p id="access-code-error" className="student-error" role="alert" aria-live="polite">
            {err}
          </p>
        )}
      </form>
    </main>
  );
}

export default EnterAccessCode;
