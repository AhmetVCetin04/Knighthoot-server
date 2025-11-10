import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
        TID: 1, // backend uses numeric TID
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
      navigate("/dashboard/teacher/myquizzes");
    } catch (e: any) {
      setError(e?.message || "Error updating quiz");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6">Loading quiz...</p>;

  return (
    <div className="min-h-screen w-full bg-neutral-100 flex justify-center">
      <div className="w-full max-w-3xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Edit Quiz</h1>
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-medium mb-1">PIN</label>
            <input
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
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
                          ? "border-emerald-500 ring-emerald-300"
                          : "border-gray-300 focus:ring-black"
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

          {/* Footer */}
          <div className="flex items-center gap-3">
            <button
              disabled={saving}
              className="rounded-xl bg-black text-white px-4 py-2 hover:opacity-90 disabled:opacity-60"
              type="submit"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {error && <span className="text-red-600 text-sm">{error}</span>}
            {success && (
              <span className="text-emerald-700 text-sm">✓ Saved</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
