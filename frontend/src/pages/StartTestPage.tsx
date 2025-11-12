import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StartTest.css";
import TimeLimitModal from "../components/TimeLimitModal.tsx"; 

type ApiTest = Record<string, any>;
type Quiz = { id: string; title: string; questions: number; createdAt: string; pin?: string };

const API_BASE = "https://knighthoot.app";
const api = (p: string) => `${API_BASE}${p.startsWith("/") ? p : `/${p}`}`;

// --- Auth headers ---
function getAuthHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}`, "x-auth-token": token, "x-access-token": token, } : {}),
  };
}
function getTeacherId(): string {
  // 1) Try to decode from the JWT
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token");

  if (token && token.includes(".")) {
    try {
      const json = JSON.parse(atob(token.split(".")[1]));
      const raw =
        json.TID ??
        json.tid ??
        json.teacherId ??
        json.teacherID ??
        json.uid ??
        json.id ??
        json.sub;
      if (raw != null) return String(raw);
    } catch {}
  }

  // 2) Fallback to stored user/profile
  const storedUser =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user") ||
    localStorage.getItem("profile");
  if (storedUser) {
    try {
      const u = JSON.parse(storedUser);
      const raw =
        u.TID ?? u.tid ?? u.teacherId ?? u.teacherID ?? u.uid ?? u.id;
      if (raw != null) return String(raw);
    } catch {}
  }

  // 3) Direct keys
  const direct =
    localStorage.getItem("TID") ||
    localStorage.getItem("teacherId") ||
    localStorage.getItem("userId");
  if (direct) return String(direct);

  throw new Error("Could not determine your Teacher ID (TID). Please re-login.");
}

// mapTests: capture the predefined PIN (whatever your backend calls it)
function mapTests(raw: ApiTest[]): Quiz[] {
  return (raw || []).map((t) => {
    const id = String(t.ID ?? t._id ?? "");
    const rawTitle = String(t.ID ?? "Untitled Quiz");
    const cleanTitle = rawTitle
      .replace(/[-_][0-9]{10,20}$/, "")
      .replace(/[-_]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

    const qArr =
      Array.isArray(t.questions) ? t.questions :
      Array.isArray(t.Questions) ? t.Questions : [];
    const qCount =
      Number.isFinite(t.questionCount) ? Number(t.questionCount) : qArr.length;

    const created = t.createdAt || t.created_at || t.date || new Date().toISOString();

    // <-- try common field names for your stored PIN
    const pin =
      t.pin ?? t.PIN ?? t.gamePin ?? t.sessionPin ?? t.sessionCode ?? t.code ?? undefined;

    return {
      id,
      title: cleanTitle,
      questions: qCount,
      createdAt: new Date(created).toISOString(),
      pin,
    };
  });
}


export default function StartTestPage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const openTimePicker = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowTimeModal(true);
  };
  const confirmTime = async (seconds: number) => {
    if (!selectedQuiz) return;

    try {
      const tid = getTeacherId();
      await fetch(api(`/api/endTest`), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ID: selectedQuiz.id, TID: Number(tid) }),
      });
    } catch (e) {
      console.warn("Failed to pre-emptively end test, proceeding anyway:", e);
    }

    setShowTimeModal(false);
    navigate("/dashboard/teacher/start/waiting", {
      state: {
        quizId: selectedQuiz.id,
        title: selectedQuiz.title,
        timeLimit: seconds,
        pin: selectedQuiz.pin,
        TID: Number(getTeacherId()),
      },
    });
  };
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const tid = getTeacherId();
        const res = await fetch(api(`/api/test?TID=${encodeURIComponent(tid)}`), { headers: getAuthHeaders() });
        const txt = await res.text();
        const json = txt ? JSON.parse(txt) : null;

        if (!res.ok) {
          const msg = (json && (json.error || json.message)) || txt || `Failed (${res.status})`;
          throw new Error(msg);
        }

        const arr: ApiTest[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.items)
          ? json.items
          : json
          ? [json]
          : [];

        setQuizzes(mapTests(arr));
      } catch (e: any) {
        setError(e?.message || "Failed to load tests");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quizzes;
    return quizzes.filter((t) => t.title.toLowerCase().includes(q));
  }, [quizzes, query]);

  const startTest = (id: string) => {
    navigate(`/dashboard/teacher/start/${id}`);
  };

  if (loading) return <div className="loading">Loading…</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="starttest-page">
      <div className="starttest-container">
        <div className="starttest-header">
          <h1>Start a Test</h1>
          <p>Select a quiz to launch for your students</p>
        </div>

        <div className="starttest-search">
          <input
            placeholder="Search quizzes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="starttest-list">
          {shown.map((q) => (
            <div key={q.id} className="test-card">
              <div className="test-card-left">
                <div className="test-card-title">{q.title || "Untitled Quiz"}</div>
                <div className="test-card-meta">
                  <span>Questions: {q.questions}</span>
                  <span>Time Limit: <strong>No limit</strong></span>
                  <span>Points: <strong>0</strong></span>
                </div>
              </div>

              <button className="start-btn" onClick={() => openTimePicker(q)}>
                ▶ Start Test
              </button>
            </div>
          ))}

          {shown.length === 0 && (
            <div className="empty-state">No quizzes match your search.</div>
          )}
        </div>
      </div>
      <TimeLimitModal
        open={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        onConfirm={confirmTime}
        defaultValue={30}
      />
    </div>
    
  );
}
