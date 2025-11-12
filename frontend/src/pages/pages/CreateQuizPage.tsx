import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    // Backend requires: { TID (number), ID (string), questions }
    const TID = getTeacherTID();; 
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
    <div className="min-h-screen w-full bg-neutral-100 flex justify-center">
      <div className="w-full max-w-3xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Create a Quiz</h1>
          <button
            className="px-3 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-sm"
            onClick={() => navigate(-1)}
            type="button"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g., UCF History Quiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Questions */}
          <div className="space-y-5">
            {questions.map((q, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-medium">Question {i + 1}</h2>
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Answer:</label>
                    <select
                      className="rounded-lg border border-gray-300 px-2 py-1"
                      value={q.correctIndex}
                      onChange={(e) =>
                        updateQuestion(i, { correctIndex: Number(e.target.value) })
                      }
                    >
                      <option value={0}>A</option>
                      <option value={1}>B</option>
                      <option value={2}>C</option>
                      <option value={3}>D</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeQuestion(i)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <input
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter the question text"
                  value={q.text}
                  onChange={(e) => updateQuestion(i, { text: e.target.value })}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, j) => (
                    <input
                      key={j}
                      className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 ${
                        q.correctIndex === j
                          ? 'border-emerald-500 ring-emerald-300'
                          : 'border-gray-300 focus:ring-black'
                      }`}
                      placeholder={`Option ${String.fromCharCode(65 + j)}`}
                      value={opt}
                      onChange={(e) => updateOption(i, j, e.target.value)}
                    />
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addQuestion}
              className="w-full rounded-2xl border-2 border-dashed border-gray-300 py-3 hover:bg-gray-50"
            >
              + Add Question
            </button>
          </div>

          {/* Form footer */}
          <div className="flex items-center gap-3">
            <button
              disabled={saving}
              className="rounded-xl bg-black text-white px-4 py-2 hover:opacity-90 disabled:opacity-60"
              type="submit"
            >
              {saving ? 'Saving…' : 'Save Quiz'}
            </button>
            {error && <span className="text-red-600 text-sm">{error}</span>}
            {successPin && (
              <span className="text-emerald-700 text-sm">
                Saved!{' '}
                {successPin !== '✓ Saved' ? `PIN: ${successPin}` : successPin}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
