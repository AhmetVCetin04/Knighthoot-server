import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/CreateQuiz.css";

type Question = {
  text: string;
  options: string[];
  correctIndex: number;
};

// --- Helper for auth headers ---
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

// --- Helper: Numeric TID ---
function getTeacherId(): string {
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
      if (raw) return String(raw);
    } catch {}
  }

  // Fallbacks if user info is stored separately
  const storedUser =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user") ||
    localStorage.getItem("profile");
  if (storedUser) {
    try {
      const u = JSON.parse(storedUser);
      const raw =
        u.TID ?? u.tid ?? u.teacherId ?? u.teacherID ?? u.uid ?? u.id;
      if (raw) return String(raw);
    } catch {}
  }

  // Direct stored key
  const stored =
    localStorage.getItem("TID") ||
    localStorage.getItem("teacherId") ||
    localStorage.getItem("userId");
  if (stored) return stored;

  throw new Error("No valid teacher ID found. Please re-login.");
}

export default function EditQuiz() {
  const navigate = useNavigate();
  const { id } = useParams(); // quiz ID from URL

  const [title, setTitle] = useState("");
  const [pin, setPin] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // --- Load existing quiz data ---
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/test/${encodeURIComponent(id!)}`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Failed (${res.status})`);
        }

        const data = await res.json();
        setTitle(data.ID || "");
        setPin(data.PIN || "");

        setQuestions(
          (data.questions || []).map((q: any) => ({
            text: q.text || "",
            options: q.options || ["", "", "", ""],
            correctIndex:
              typeof q.correctIndex === "number" ? q.correctIndex : 0,
          }))
        );
      } catch (e: any) {
        setError(e?.message || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // --- Helper updaters ---
  const updateQuestion = (idx: number, patch: Partial<Question>) => {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.map((o, j) =>
                j === optIdx ? value : o
              ),
            }
          : q
      )
    );
  };

  const addQuestion = () => {
    setQuestions((qs) => [
      ...qs,
      { text: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  };

  // --- Submit updates ---
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setError(null);
      setSuccess(false);

      try {
        const payload = {
          TID: Number(getTeacherId()), 
          ID: title.trim(),
          PIN: pin.trim(),
          questions: questions.map((q) => ({
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
          })),
        };

      const res = await fetch(`/api/test/${encodeURIComponent(id!)}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}

      if (!res.ok) {
        throw new Error(
          (json && (json.error || json.message)) ||
            text ||
            `Failed (${res.status})`
        );
      }

      setSuccess(true);
      alert(json?.message || "Quiz updated successfully!");
      navigate("/dashboard/teacher/quizzes");
    } catch (e: any) {
      setError(e?.message || "Error updating quiz");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6">Loading quiz...</p>;

  // Find the original return block in EditQuiz.tsx and replace it entirely.

  return (
    <div className="create-quiz-container"> {/* Uses the wrapper class for consistency */}
      
      {/* PAGE HEADER */}
      <h1 className="cq__page-title">Edit Quiz</h1>
      <p className="cq__page-subtitle">
        Update questions and options for this quiz.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* QUIZ TITLE CARD */}
        <div className="cq__card">
          <label htmlFor="quiz-title" className="cq__label">
            Quiz Title
          </label>
          <input
            type="text"
            id="quiz-title"
            className="cq__input"
            placeholder="Enter quiz title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* PIN CARD (NEW) */}
        <div className="cq__card">
          <label htmlFor="quiz-pin" className="cq__label">
            PIN (Used for Starting Test)
          </label>
          <input
            type="text"
            id="quiz-pin"
            className="cq__input"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </div>


        {/* QUESTIONS MAPPING */}
        {questions.map((q, i) => (
          <div key={i} className="cq__card">
            
            {/* Question Header */}
            <div className="cq__question-header" style={{ marginBottom: '16px' }}>
              <h2 className="cq__question-title">Question {i + 1}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label className="cq__label" style={{ margin: 0, fontSize: '15px' }}>
                  Answer:
                </label>
                {/* Select dropdown (Styled by cq__input + inline styles) */}
                <select
                  className="cq__input" 
                  style={{ width: 'auto', padding: '8px 12px' }}
                  value={q.correctIndex}
                  onChange={(e) =>
                    updateQuestion(i, { correctIndex: Number(e.target.value) })
                  }
                >
                  <option value={0}>Option 1</option>
                  <option value={1}>Option 2</option>
                  <option value={2}>Option 3</option>
                  <option value={3}>Option 4</option>
                </select>
                <button
                  type="button"
                  className="cq__delete-btn"
                  title="Remove Question"
                  onClick={() => removeQuestion(i)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M17 6h-4V5a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3v1H2v2h2v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8h2V6zM9 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V5zm9 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V8h12v10z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <label htmlFor={`q${i}-text`} className="cq__label">
              Question Text
            </label>
            <textarea
              id={`q${i}-text`}
              className="cq__input"
              placeholder="Enter your question..."
              value={q.text}
              onChange={(e) => updateQuestion(i, { text: e.target.value })}
            />

            {/* Answer Options */}
            <label className="cq__label" style={{ marginTop: '20px' }}>
              Answer Options
            </label>
            <div className="cq__option-grid">
              {q.options.map((opt, j) => (
                <React.Fragment key={j}>
                  <label htmlFor={`q${i}-op${j}`} className="cq__label">
                    Option {j + 1}
                  </label>
                  <input
                    type="text"
                    id={`q${i}-op${j}`}
                    className="cq__input"
                    placeholder={`Enter option ${j + 1}...`}
                    value={opt}
                    onChange={(e) => updateOption(i, j, e.target.value)}
                  />
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
        
        {/* ADD QUESTION BUTTON (Secondary style) */}
        <button
          type="button"
          onClick={addQuestion}
          className="cq__button cq__button--secondary"
          style={{marginBottom: '24px'}}
        >
          + Add Question
        </button>

        {/* BOTTOM BUTTONS (Save/Cancel) */}
        <div className="cq__button-bar">
          <button
            type="button"
            className="cq__button cq__button--secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="cq__button cq__button--primary"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
        
        {/* Status */}
        <div className="flex items-center gap-3 mt-4">
          {error && <span className="text-red-600 text-sm">{error}</span>}
          {success && (
            <span className="text-emerald-700 text-sm">✓ Saved</span>
          )}
        </div>
      </form>
    </div>
  );
}
