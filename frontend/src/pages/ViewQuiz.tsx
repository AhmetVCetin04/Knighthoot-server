import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/QuizView.css";


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
    // 1. Root Wrappers (Using CSS classes defined in QuizView.css)
    <div className="qv-main-wrapper">
      <div className="qv-content-area">
        
        {/* Header Block: Title, Meta, and Action Buttons */}
        <div className="qv-header">
            
            {/* Title & Meta Info */}
            <div>
                <h1 className="qv-title">{title}</h1>
                <p className="qv-meta">
                    {questions.length} question{questions.length !== 1 && "s"} • Created{" "}
                    {new Date().toLocaleDateString()}
                </p>
            </div>
            
            {/* Action Buttons */}
            <div className="qv-actions">
                {/* Edit Quiz */}
                <button
                    onClick={() => navigate(`/dashboard/teacher/edit/${id}`)}
                    className="qv-btn qv-btn--edit" // ⬅️ Custom CSS Class
                >
                    ✏️ Edit Quiz
                </button>
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="qv-btn qv-btn--back" // ⬅️ Custom CSS Class
                >
                    ← Back
                </button>
            </div>
        </div>

        {/* Questions List/Cards */}
        <div className="qv-question-list">
          {questions.map((q, i) => {
            const optLetterCorrect = String.fromCharCode(65 + q.correctIndex);
            
            return (
              <div key={i} className="qv-question-card">
                
                {/* Question Header */}
                <div className="qv-question-header">
                    <span className="qv-question-number">{i + 1}</span>
                    <h2 className="qv-question-text">
                        {q.text || `Question ${i + 1}`}
                    </h2>
                </div>

                {/* Options Grid */}
                <div className="qv-options-grid">
                  {q.options.map((opt, j) => {
                    const optLetter = String.fromCharCode(65 + j);
                    const isCorrect = q.correctIndex === j;

                    return (
                      <div
                        key={j}
                        className={`qv-option ${
                          isCorrect ? "qv-option--correct" : "qv-option--incorrect"
                        }`}
                      >
                        <span className="qv-option-letter">{optLetter}</span>
                        <span className="qv-option-text">{opt || "—"}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Correct Answer Footer */}
                <p className="qv-correct-answer">
                  Correct answer:{" "}
                  <span className="qv-correct-value">{optLetterCorrect}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
