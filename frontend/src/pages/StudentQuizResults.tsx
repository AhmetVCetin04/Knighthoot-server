import { useLocation, useNavigate } from "react-router-dom";

type AnswerRecord = {
  qIndex: number;
  question: string;
  choices: string[];
  selected: number | null;
  correct: number | null;
  wasCorrect: boolean | null;
};

type ResultsState = {
  quizId?: string;
  title?: string;
  total?: number;
  score?: number;
  answers?: AnswerRecord[];
};

export default function StudentQuizResults() {
  const navigate = useNavigate();
  const loc = useLocation();
  const s = (loc.state || {}) as ResultsState;

  const title = s.title || "Quiz";
  const total = s.total ?? (s.answers?.length ?? 0);
  const score = s.score ?? (s.answers?.filter(a => a.wasCorrect).length ?? 0);
  const answers = s.answers ?? [];

  return (
    <main className="student-page">
      <section className="student-card">
        <h2>{title} — Results</h2>
        <p className="muted">Score: <strong>{score}</strong> / {total}</p>

        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {answers.map((a) => {
            const correctText = (a.correct != null ? a.choices[a.correct] : "—") ?? "—";
            const pickedText = (a.selected != null ? a.choices[a.selected] : "No answer") ?? "No answer";
            return (
              <div key={a.qIndex} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                <div style={{ marginBottom: 6 }}>
                  <strong>Q{a.qIndex + 1}.</strong> {a.question || "—"}
                </div>
                <div>
                  <div><span className="muted">Your answer:</span> {pickedText}</div>
                  <div><span className="muted">Correct answer:</span> {correctText}</div>
                  <div style={{ marginTop: 6 }}>
                    {a.wasCorrect ? (
                      <span style={{ fontWeight: 600 }} aria-label="correct">✓ Correct</span>
                    ) : (
                      <span style={{ fontWeight: 600 }} aria-label="incorrect">✗ Incorrect</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
          <button onClick={() => navigate(-1)} className="student-answer">Back</button>
          <button onClick={() => navigate("/dashboard/student")} className="student-answer">Go to Dashboard</button>
        </div>
      </section>
    </main>
  );
}
