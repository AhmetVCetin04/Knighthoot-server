import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

type Question = {
  text: string;
  options: string[];
  correctIndex: number;
};

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

export default function ViewQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [pin, setPin] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load quiz data
  useEffect(() => {
    console.log("Fetching quiz with ID:", id);
    (async () => {
      try {
        const res = await fetch(`/api/test/${encodeURIComponent(id!)}`, {
          headers: getAuthHeaders(),
        });
        console.log("Response status:", res.status);
        const txt = await res.text();
        console.log("Raw response:", txt);
        const data = txt ? JSON.parse(txt) : null;
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        //const data = await res.json();
        setTitle(data.ID || "Untitled Quiz");
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

  if (loading) return <p className="p-6">Loading quiz...</p>;
  if (error)
    return (
      <div className="p-6 text-red-600 text-sm whitespace-pre-wrap">{error}</div>
    );

  return (
    <div className="min-h-screen w-full bg-neutral-900 text-white flex justify-center">
      <div className="w-full max-w-4xl p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-sm text-gray-300">
            {questions.length} question{questions.length !== 1 && "s"} • Created{" "}
            {new Date().toLocaleDateString()}
          </p>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => navigate(`/dashboard/teacher/edit/${id}`)}
              className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-1"
            >
              ✏️ Edit Quiz
            </button>
            <button
              onClick={() => alert("Preview feature coming soon!")}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-1"
            >
              ▶️ Preview Quiz
            </button>
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-600 px-3 py-2 rounded-lg hover:opacity-80 text-sm"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {questions.map((q, i) => (
            <div
              key={i}
              className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-yellow-400 text-black font-bold px-3 py-1 rounded-lg">
                    {i + 1}
                  </div>
                  <h2 className="font-semibold text-lg">
                    {q.text || `Question ${i + 1}`}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {q.options.map((opt, j) => (
                  <div
                    key={j}
                    className={`rounded-lg px-4 py-2 border ${
                      q.correctIndex === j
                        ? "bg-green-800 border-green-500"
                        : "bg-neutral-700 border-neutral-600"
                    }`}
                  >
                    <span className="font-bold mr-2">
                      {String.fromCharCode(65 + j)}.
                    </span>
                    {opt || "—"}
                  </div>
                ))}
              </div>

              <p className="text-sm text-green-400">
                Correct answer:{" "}
                <span className="font-semibold">
                  {String.fromCharCode(65 + q.correctIndex)}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
