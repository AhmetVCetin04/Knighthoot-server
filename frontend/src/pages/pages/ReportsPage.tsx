import { useMemo, useState } from "react";
import "../styles/ReportsPage.css";



type ReportsPageProps = {
  quizId: string;
  title?: string;
  totalQuestions?: number;
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

function toCSV(rows: StudentSummary[]): string {
  const header = ["SID", "Name", "Correct", "Incorrect", "Total", "Points"];
  const lines = [header.join(",")].concat(
    rows.map((r) =>
      [r.SID, `"${r.name.replace(/"/g, '""')}"`, r.correct, r.incorrect, r.total, r.points].join(",")
    )
  );
  return lines.join("\n");
}

export default function ReportsPage(props: ReportsPageProps) {
  const [quizId] = useState<string>(props.quizId);
  const [title] = useState<string>(props.title || "Quiz Results");

  const [rosterText, setRosterText] = useState<string>("");
  const [rows, setRows] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchScoresForSid(sid: number) {
    const res = await fetch(`/api/getStudentScores/${encodeURIComponent(String(sid))}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`getStudentScores ${res.status}: ${body}`);
    }
    return res.json();
  }

  async function generateReport() {
    setError(null);
    const parsed = parseRosterCSV(rosterText);
    if (!parsed.length) {
      setError("Please paste a roster CSV with lines like: SID,Full Name");
      return;
    }

    try {
      setLoading(true);
      const summaries: StudentSummary[] = [];

      await Promise.all(
        parsed.map(async ({ SID, name }) => {
          try {
            const scores = await fetchScoresForSid(SID);
            const relevant = (scores || []).filter((s: any) => String(s.testID) === String(quizId));
            const correct = relevant.reduce((a: number, b: any) => a + (Number(b.correct) || 0), 0);
            const incorrect = relevant.reduce((a: number, b: any) => a + (Number(b.incorrect) || 0), 0);
            const total = relevant.reduce((a: number, b: any) => a + (Number(b.total) || 0), 0);
            const points = relevant.reduce((a: number, b: any) => a + (Number(b.score) || 0), 0);
            summaries.push({ SID, name, correct, incorrect, total, points });
          } catch {
            summaries.push({ SID, name, correct: 0, incorrect: 0, total: 0, points: 0 });
          }
        })
      );

      summaries.sort((a, b) => b.points - a.points);
      setRows(summaries);
    } catch (e: any) {
      setError(e?.message || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV() {
    const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}_${quizId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalStudents = rows.length;
  const attempted = rows.filter((r) => r.total > 0 || r.correct > 0 || r.incorrect > 0).length;

  return (
    <main className="report-page">
      <header className="report-header">
        <h1 className="report-title">
          {title} <span className="report-sub">| {quizId}</span>
        </h1>
        <button className="btn-export" onClick={downloadCSV} disabled={!rows.length}>
          Export CSV
        </button>
      </header>

      <section className="report-roster">
        <label>Paste class roster (CSV): <code>SID,Full Name</code></label>
        <textarea
          placeholder="201,Alice Johnson\n202,Bob Smith"
          value={rosterText}
          onChange={(e) => setRosterText(e.target.value)}
        />
        <button className="btn-load" onClick={generateReport} disabled={loading || !quizId}>
          {loading ? "Loading..." : "Load Scores"}
        </button>
      </section>

      {error && <div className="report-error">{error}</div>}

      {rows.length > 0 && (
        <section className="report-table-section">
          <div className="report-summary">
            Students: <strong>{totalStudents}</strong> • Attempted:{" "}
            <strong>{attempted}</strong>
          </div>

          <div className="report-table-wrapper">
            <table className="report-table">
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
        </section>
      )}
    </main>
  );
}
