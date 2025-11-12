import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/EndQuiz.css";

type EndState = {
  quizId: string;
  title?: string;
  pin?: string;
};

type RosterEntry = { SID: number; name: string };
type StudentSummary = {
  SID: number;
  name: string;
  correct: number;
  incorrect: number;
  total: number;
  points: number;
};

function getAuthHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("jwt");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    h["Authorization"] = `Bearer ${token}`;
    h["x-auth-token"] = token;
  }
  return h;
}

function parseRosterCSV(csv: string): RosterEntry[] {
  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [sidRaw, ...nameParts] = line.split(",");
      const sid = Number(String(sidRaw || "").trim());
      const name = nameParts.join(",").trim();
      return { SID: sid, name };
    })
    .filter((r) => Number.isFinite(r.SID) && r.name);
}

export default function EndOfQuiz() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { quizId, title, pin } = (state ?? {}) as Partial<EndState>;

  // Average computation (optional, frontend only)
  const [showAveragePanel, setShowAveragePanel] = useState(false);
  const [rosterText, setRosterText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<StudentSummary[]>([]);

  const stats = useMemo(() => {
    if (!rows.length) return null;
    const attempted = rows.filter(r => r.total > 0 || r.correct > 0 || r.incorrect > 0);
    const n = attempted.length || 1;
    const sumPoints = attempted.reduce((a, b) => a + b.points, 0);
    const sumCorrect = attempted.reduce((a, b) => a + b.correct, 0);
    const sumTotal = attempted.reduce((a, b) => a + b.total, 0);

    return {
      participants: attempted.length,
      avgPoints: +(sumPoints / n).toFixed(1),
      avgCorrect: +(sumCorrect / n).toFixed(2),
      avgAccuracy: sumTotal > 0 ? +((sumCorrect / sumTotal) * 100).toFixed(1) : 0,
    };
  }, [rows]);

  async function fetchScoresForSid(sid: number) {
    const res = await fetch(`/api/getStudentScores/${encodeURIComponent(String(sid))}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`getStudentScores ${res.status}: ${body}`);
    }
    return res.json(); // array
  }

  async function computeAverage() {
    setError(null);
    if (!quizId) {
      setError("Missing quiz ID.");
      return;
    }
    const roster = parseRosterCSV(rosterText);
    if (!roster.length) {
      setError("Paste a roster: SID,Full Name per line.");
      return;
    }

    try {
      setLoading(true);
      const summaries: StudentSummary[] = [];

      await Promise.all(
        roster.map(async ({ SID, name }) => {
          try {
            const scores = await fetchScoresForSid(SID);
            const relevant = (scores || []).filter((s: any) => String(s.testID) === String(quizId));
            const correct = relevant.reduce((a: number, b: any) => a + (Number(b.correct) || 0), 0);
            const incorrect = relevant.reduce((a: number, b: any) => a + (Number(b.incorrect) || 0), 0);
            const total = relevant.reduce((a: number, b: any) => a + (Number(b.total) || 0), 0);
            const points = relevant.reduce((a: number, b: any) => a + (Number(b.score) || 0), 0);
            summaries.push({ SID, name, correct, incorrect, total, points });
          } catch (e: any) {
            // still include student with zeros if their fetch fails
            summaries.push({ SID, name, correct: 0, incorrect: 0, total: 0, points: 0 });
          }
        })
      );

      // Optional: keep only students who attempted
      // const attempted = summaries.filter(r => r.total > 0 || r.correct > 0 || r.incorrect > 0);
      summaries.sort((a, b) => b.points - a.points);
      setRows(summaries);
    } catch (e: any) {
      setError(e?.message || "Failed to compute average.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="finish-page">
      <header className="finish-header">
        <h1 className="finish-title">
          Quiz Finished <span className="finish-sub">| {title || "Untitled"}</span>
        </h1>
        {!!pin && <div className="finish-pin">PIN: <strong>{pin}</strong></div>}
      </header>

      <section className="finish-hero">
        <div className="finish-badge">🎉</div>
        <h2 className="finish-headline">Great job! That’s a wrap.</h2>
        <p className="finish-caption">You can compute a quick class average without leaving this page.</p>

        <div className="finish-actions">
          <button className="btn-primary" onClick={() => setShowAveragePanel(v => !v)}>
            {showAveragePanel ? "Hide Average Panel" : "Compute Class Average"}
          </button>

          <button className="btn-secondary" onClick={() => navigate("/dashboard/teacher/start")}>
            Back to Start
          </button>
        </div>
      </section>

      {showAveragePanel && (
        <section className="avg-panel">
          <h3>Class Average (Frontend-only)</h3>
          <p className="avg-hint">
            Paste roster as <code>SID,Full Name</code> — one per line. We will read each student’s
            scores from your existing <code>getStudentScores</code> endpoint and compute the average for this quiz.
          </p>

          <textarea
            className="avg-textarea"
            placeholder={`201,Alice Johnson\n202,Bob Smith`}
            value={rosterText}
            onChange={(e) => setRosterText(e.target.value)}
          />

          <div className="avg-actions">
            <button className="btn-primary" onClick={computeAverage} disabled={loading || !quizId}>
              {loading ? "Loading..." : "Calculate"}
            </button>
            {error && <div className="avg-error">{error}</div>}
          </div>

          {rows.length > 0 && stats && (
            <div className="avg-results">
              <div className="avg-cards">
                <div className="card">
                  <div className="card-label">Participants</div>
                  <div className="card-value">{stats.participants}</div>
                </div>
                <div className="card">
                  <div className="card-label">Avg Points</div>
                  <div className="card-value">{stats.avgPoints}</div>
                </div>
                <div className="card">
                  <div className="card-label">Avg Correct</div>
                  <div className="card-value">{stats.avgCorrect}</div>
                </div>
                <div className="card">
                  <div className="card-label">Avg Accuracy</div>
                  <div className="card-value">{stats.avgAccuracy}%</div>
                </div>
              </div>

              <div className="avg-table-wrap">
                <table className="avg-table">
                  <thead>
                    <tr>
                      <th>SID</th>
                      <th>Name</th>
                      <th>Correct</th>
                      <th>Incorrect</th>
                      <th>Total</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.SID}>
                        <td>{r.SID}</td>
                        <td>{r.name}</td>
                        <td className="num">{r.correct}</td>
                        <td className="num">{r.incorrect}</td>
                        <td className="num">{r.total}</td>
                        <td className="num">{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
