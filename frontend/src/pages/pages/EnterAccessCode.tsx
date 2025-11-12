// EnterAccessCode.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StudentJoin.css";

export default function EnterAccessCode() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const trimmed = code.trim();
    if (!trimmed) return setErr("Enter the access code.");
    setLoading(true);

    // ✅ Don’t call /api/test — go straight to Waiting with the code as testID
    navigate("/dashboard/student/waiting", {
      state: { quizId: trimmed, code: trimmed, title: "" },
      replace: true,
    });

    setLoading(false);
  }

  return (
    <main className="student-page">
      <form className="student-card" onSubmit={handleJoin}>
        <h2>Enter Access Code</h2>
        <input
          className="student-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g., TEST123"
          maxLength={32}
        />
        <button className="student-btn" disabled={loading}>
          {loading ? "Joining…" : "Join"}
        </button>
        {err && <p className="student-error">{err}</p>}
      </form>
    </main>
  );
}
