import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/ReportsPage.css"; 

// --- Types ---

type ScoreDoc = {
  SID: number;
  testID: string;
  correct: number;
  incorrect: number;
  totalQuestions: number;
  score?: number; 
  firstName: string; 
  lastName: string;  
  username: string;  
};

type AggregatedScore = {
  SID: number;
  name: string; 
  correct: number;
  incorrect: number;
  total: number;
  points: number;
};

type StudentSummary = {
  SID: number;
  name: string;
  correct: number;
  incorrect: number;
  total: number;
  points: number;
  scorePercent: number;
};

// --- Helper Functions ---

function getAuthHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    h["Authorization"] = `Bearer ${token}`;
    h["x-access-token"] = token;
  }
  return h;
}

function toCSV(rows: StudentSummary[]): string {
  const header = [
    "SID",
    "Name",
    "Correct",
    "Incorrect",
    "Total",
    "Score %",
    "Points",
  ];
  const lines = [header.join(",")].concat(
    rows.map((r) =>
      [
        r.SID,
        `"${r.name.replace(/"/g, '""')}"`,
        r.correct,
        r.incorrect,
        r.total,
        r.scorePercent,
        r.points,
      ].join(",")
    )
  );
  return lines.join("\n");
}


// --- Component ---

export default function TeacherReportDetailsPage() {
  const { testId } = useParams<{ testId: string }>();

  const [title, setTitle] = useState<string>("Quiz Results");
  const [dateConducted, setDateConducted] = useState<string>(""); 
  const [rows, setRows] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  const [studentScoreMap, setStudentScoreMap] =
    useState<Map<number, AggregatedScore>>();

  // 1. Fetch Test metadata (title and date)
  useEffect(() => {
    (async () => {
      if (!testId) return;
      try {
        const res = await fetch(`/api/test/${encodeURIComponent(testId)}`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          const cleanTitle = (data.ID || testId)
            .replace(/[-_][0-9]{10,20}$/, "")
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .trim();
          
          setTitle(cleanTitle);

          if (data.createdAt) {
             setDateConducted(new Date(data.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }));
          } else {
             setDateConducted("Date N/A");
          }

        } else {
          setTitle(testId);
          setDateConducted("Date N/A");
        }
      } catch {
        setTitle(testId);
        setDateConducted("Date N/A");
      }
    })();
  }, [testId]);

  // 2. Fetch and Process Scores (Prioritize the latest attempt)
  useEffect(() => {
    if (!testId) {
      setError("No Test ID found in URL.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        const scoresRes = await fetch(
          `/api/score/test/${encodeURIComponent(testId)}`,
          { headers: getAuthHeaders() }
        );
        if (!scoresRes.ok) {
          throw new Error("Failed to fetch scores for this test instance.");
        }
        
        const scores: ScoreDoc[] = await scoresRes.json();
        
        const aggregatedMap = new Map<number, AggregatedScore>();
        for (const s of scores) {
          const sid = s.SID;
          
          // Use the latest score for the student found in the returned array
          const name = s.firstName && s.lastName 
                       ? `${s.firstName} ${s.lastName}` 
                       : s.username; 
                          
          aggregatedMap.set(sid, {
             SID: sid,
             name: name,
             correct: s.correct || 0,
             incorrect: s.incorrect || 0,
             total: s.totalQuestions || 0,
             points: s.score || 0,
          });
        }
        
        const summaries: StudentSummary[] = Array.from(aggregatedMap.values()).map(data => {
            const scorePercent =
                data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
            return { ...data, scorePercent };
        });

        summaries.sort((a, b) => b.scorePercent - a.scorePercent); 
        setRows(summaries);
        setStudentScoreMap(aggregatedMap); 

      } catch (e: any) {
        setError(e.message || "Failed to load report data");
      } finally {
        setLoading(false);
      }
    })();
  }, [testId]); 

  // 3. Download CSV logic 
  function downloadCSV() {
    const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}_${testId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 4. Summary calculation
  const { totalStudents, attempted, avgScore } = useMemo(() => {
    const totalStudents = rows.length;
    const attemptedRows = rows.filter((r) => r.total > 0);
    const attempted = attemptedRows.length;
    const avg =
      attempted > 0
        ? attemptedRows.reduce((acc, r) => acc + r.scorePercent, 0) / attempted
        : 0;
    return {
      totalStudents,
      attempted,
      avgScore: Math.round(avg * 10) / 10,
    };
  }, [rows]);

  
  // --- RENDER ---
  
  if (loading) {
    return <div className="report-page">Loading results...</div>;
  }
  
  if (error) {
     return <div className="report-page report-error">{error}</div>;
  }

  return (
    <main className="report-page">
      <header className="report-header">
        <div>
          <h1 className="report-title">{title}</h1>
          <span className="report-sub">Date Conducted: {dateConducted}</span>
        </div>
        <button
          className="btn-export"
          onClick={downloadCSV}
          disabled={!rows.length}
        >
          Export CSV
        </button>
      </header>
      
      <section className="report-table-section">
          
          <div className="report-summary">
            Total Students: <strong>{totalStudents}</strong> • Attempted:{" "}
            <strong>{attempted}</strong> • Class Average:{" "}
            <strong>{avgScore}%</strong>
          </div>

          {rows.length === 0 ? (
             <div className="report-empty">No scores found for this test instance.</div>
          ) : (
            <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Student Name</th>
                      <th>SID</th>
                      <th>Score</th>
                      <th>Correct</th>
                      <th>Incorrect</th>
                      <th>Total Qs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, index) => (
                      <tr key={r.SID}>
                        <td>{index + 1}</td>
                        <td>{r.name}</td>
                        <td>{r.SID}</td>
                        <td className="num">
                          <strong>{r.scorePercent}%</strong>
                        </td>
                        <td className="num">{r.correct}</td>
                        <td className="num">{r.incorrect}</td>
                        <td className="num">{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          )}
        </section>
    </main>
  );
}