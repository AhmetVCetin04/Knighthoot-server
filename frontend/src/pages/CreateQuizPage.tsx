import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/CreateQuiz.css";

// --- Types (UI only) ---
type Question = {
  text: string;
  options: string[]; // fixed 4 options for now
  correctIndex: number; // 0..3
};

// Helper: build safe headers with auth token (auth middleware requires a token)
function getAuthHeaders() {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('token');

  if (!token)
    throw new Error('Not authenticated — missing token. Please log in first.');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'x-access-token': token, // cover both common patterns
  };
}

function getTeacherTID(): number {
  // 1) Where the token might be stored
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('token');

  if (token && token.includes('.')) {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = JSON.parse(atob(base64));
      // Common claim names your backend might use:
      const raw =
        json.TID ??
        json.tid ??
        json.teacherId ??
        json.teacherID ??
        json.uid ??
        json.id ??
        json.sub;
      const asNum = Number(raw);
      if (!Number.isNaN(asNum)) return asNum;
    } catch {
    }
  }

  const storedUser =
    localStorage.getItem('user') ||
    sessionStorage.getItem('user') ||
    localStorage.getItem('profile');

  if (storedUser) {
    try {
      const u = JSON.parse(storedUser);
      const raw =
        u.TID ?? u.tid ?? u.teacherId ?? u.teacherID ?? u.uid ?? u.id;
      const asNum = Number(raw);
      if (!Number.isNaN(asNum)) return asNum;
    } catch {
    }
  }

  const direct = Number(
    localStorage.getItem('TID') ||
      localStorage.getItem('teacherId') ||
      sessionStorage.getItem('TID')
  );
  if (!Number.isNaN(direct)) return direct;

  throw new Error(
    'Could not determine your Teacher ID (TID). Please re-login so your TID is available.'
  );
}

// Helper: make a simple ID from the title + timestamp if you don't have one yet
function makeQuizIdFromTitle(t: string) {
  const slug = (t || 'quiz')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14); // yyyymmddhhmmss
  return `${slug || 'quiz'}-${stamp}`;
}

export default function CreateQuiz() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successPin, setSuccessPin] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', options: ['', '', '', ''], correctIndex: 0 },
  ]);

  // Helpers
  const updateQuestion = (idx: number, patch: Partial<Question>) => {
    setQuestions((qs) =>
      qs.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
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
      { text: '', options: ['', '', '', ''], correctIndex: 0 },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  };

  // Simple validation (client-side)
  const validate = () => {
    if (!title.trim()) return 'Please enter a quiz title.';
    if (questions.length === 0) return 'Add at least one question.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1} is empty.`;
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim())
          return `Question ${i + 1} option ${j + 1} is empty.`;
      }
      if (q.correctIndex < 0 || q.correctIndex > 3)
        return `Question ${i + 1} has an invalid correct option.`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessPin(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    // ====== Map UI -> Backend expected payload ======
    const TID = getTeacherTID();
    const ID = makeQuizIdFromTitle(title);

    const payload = {
      TID,
      ID,
      questions: questions.map((q) => ({
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
      })),
    };
    // ================================================

    setSaving(true);
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: getAuthHeaders(), // <-- include token
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed with ${res.status}`);
      }

      const data = await res.json(); // expected: { test, message }
      const pin = String(data?.test?.PIN || data?.pin || data?.PIN || '');
      setSuccessPin(pin || '✓ Saved');

      navigate('/dashboard/teacher/quizzes');
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="create-quiz-container">
      {/* PAGE HEADER */}
      <h1 className="cq__page-title">Create New Quiz</h1>
      <p className="cq__page-subtitle">
        Design your quiz with multiple choice questions
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

        {/* QUESTIONS MAPPING */}
        {questions.map((q, i) => {
          const selectId = `q${i}-correct`; // for label/select association

          return (
            <div key={i} className="cq__card">
              {/* Question Header */}
              <div className="cq__question-header" style={{ marginBottom: '16px' }}>
                <h2 className="cq__question-title">Question {i + 1}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label
                    htmlFor={selectId}
                    className="cq__label"
                    style={{ margin: 0, fontSize: '15px' }}
                  >
                    Answer:
                  </label>
                  <select
                    id={selectId}
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
                    title="Delete Question"
                    onClick={() => removeQuestion(i)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      width="20"
                      height="20"
                    >
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
          );
        })}

        {/* ADD QUESTION BUTTON */}
        <button
          type="button"
          onClick={addQuestion}
          className="cq__button cq__button--secondary"
        >
          + Add Question
        </button>

        {/* BOTTOM BUTTONS */}
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
            {saving ? 'Saving…' : 'Save Quiz'}
          </button>
        </div>

        {/* Form Status... */}
      </form>
    </div>
  );
}
