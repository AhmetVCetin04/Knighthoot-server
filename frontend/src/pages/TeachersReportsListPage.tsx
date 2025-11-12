import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/TeacherReportsList.css"; 

// --- Helper Functions ---

function getAuthHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token");
  if (!token) throw new Error("Not authenticated — missing token.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-access-token": token,
  };
}

function getTeacherId(): string {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token");
  if (token && token.includes(".")) {
    try {
      const json = JSON.parse(atob(token.split(".")[1]));
      const raw =
        json.TID ?? json.tid ?? json.teacherId ?? json.id ?? json.sub;
      if (raw != null) return String(raw);
    } catch {}
  }
  const direct = localStorage.getItem("TID") || localStorage.getItem("teacherId");
  if (direct) return String(direct);
  throw new Error("Could not determine your Teacher ID (TID). Please re-login.");
}

// --- Types ---

type TestDoc = {
  ID: string;
  questions: any[];
  createdAt?: string;
};

type ScoreDoc = {
  SID: number;
  testID: string;
  correct: number;
  incorrect: number;
  totalQuestions: number;
};

type TestReportSummary = {
  reportKey: string; 
  id: string; 
  title: string;
  date: string;
  studentCount: number;
  avgScore: number; 
};

// --- Component ---

export default function TeacherReportsListPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<TestReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const tid = getTeacherId();
        const testsRes = await fetch(`/api/test?TID=${encodeURIComponent(tid)}`, {
          headers: getAuthHeaders(),
        });
        if (!testsRes.ok) throw new Error("Failed to fetch tests");
        const tests: TestDoc[] = await testsRes.json();

        const reportPromises = tests.map(async (test) => {
          
          const uniqueTestId = test.ID; 

          try {
            const scoresRes = await fetch(
              `/api/score/test/${encodeURIComponent(uniqueTestId)}`,
              { headers: getAuthHeaders() }
            );
            if (!scoresRes.ok) return null;
            const scores: ScoreDoc[] = await scoresRes.json();

            // Aggregation: We use the last score found for each student to prevent 125% error
            const scoresByStudent = new Map<
              number,
              { correct: number; total: number }
            >();

            for (const s of scores) {
              const sid = s.SID;
              // Overwrite with the current score (assumes scores are roughly ordered latest last)
              scoresByStudent.set(sid, {
                correct: s.correct || 0,
                total: s.totalQuestions || 0,
              });
            }

            const studentCount = scoresByStudent.size;
            let avgScore = 0;
            if (studentCount > 0) {
              let totalPercentSum = 0;
              for (const studentStat of scoresByStudent.values()) {
                if (studentStat.total > 0) {
                  totalPercentSum += studentStat.correct / studentStat.total;
                }
              }
              avgScore = (totalPercentSum / studentCount) * 100;
            }

            const cleanTitle = test.ID.replace(/[-_][0-9]{10,20}$/, "")
              .replace(/[-_]+/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())
              .trim();
            
            const dateString = test.createdAt 
              ? new Date(test.createdAt).toLocaleString() 
              : "N/A";

            return {
              reportKey: uniqueTestId,
              id: uniqueTestId, 
              title: `${cleanTitle} (${dateString})`,
              date: test.createdAt
                ? new Date(test.createdAt).toLocaleDateString()
                : "N/A",
              studentCount,
              avgScore: Math.round(avgScore * 10) / 10,
            };
          } catch {
            return null;
          }
        });

        const settledReports = (await Promise.all(reportPromises)).filter(
          (r): r is TestReportSummary => r !== null
        );

        settledReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setReports(settledReports);
      } catch (e: any) {
        setError(e.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="tr-list-loading">Loading reports...</div>;
  if (error) return <div className="tr-list-error">{error}</div>;

  return (
    <main className="tr-list-page">
      <header className="tr-list-header">
        <h1>Test Reports</h1>
        <p>Select a test instance to view detailed student results.</p>
      </header>

      {reports.length === 0 ? (
        <div className="tr-list-empty">No reports found.</div>
      ) : (
        <section className="tr-list-grid">
          {reports.map((report) => (
            <button
              key={report.reportKey}
              className="tr-list-card"
              onClick={() => navigate(`/dashboard/teacher/reports/${report.id}`)}
            >
              <h2 className="tr-list-card__title">{report.title}</h2>
              <div className="tr-list-card__meta">
                <span>{report.studentCount} student/s </span>
              </div>
              <div className="tr-list-card__arrow">›</div>
            </button>
          ))}
        </section>
      )}
    </main>
  );
}