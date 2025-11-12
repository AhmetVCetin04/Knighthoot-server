import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StudentJoin.css";

function getUserIdFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    const claim = import.meta.env.VITE_JWT_USERID_CLAIM || "id";
    return payload[claim] ?? payload.userId ?? payload.sub ?? null;
  } catch {
    return null;
  }
}

const JOIN_ENDPOINT = "/api/joinTest"; // matches your joinTest.js

export default function StudentJoinPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const ID = getUserIdFromToken();
    if (!ID) {
      setLoading(false);
      setError("You're not logged in.");
      return;
    }

    try {
      const res = await fetch(JOIN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ ID, PIN: pin.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Expected errors from backend: WRONG PIN, Test is not live
        if (data?.error === "Test is not live") {
          // Go to waiting room; we’ll poll until host starts.
          navigate("/dashboard/student/waiting", {
            state: { pin: pin.trim() },
            replace: true,
          });
          return;
        }
        setError(data?.error || "Unable to join. Try again.");
        setLoading(false);
        return;
      }

      // If host already started, you can route straight into the quiz flow here.
      // We at least know testID/currentQuestion from your API.
      navigate("/dashboard/student/waiting", {
        state: { pin: pin.trim(), testId: data.testID },
        replace: true,
      });
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="join-wrap">
      <header className="join-topbar">
        <button className="join-back" onClick={() => navigate("/dashboard/student")}>← Back to Dashboard</button>
        <div className="join-brand">Knighthoot</div>
      </header>

      <section className="join-card">
        <h3 className="join-card__subtle">Join a Quiz</h3>
        <h1 className="join-card__title">Enter Access Code</h1>

        <form onSubmit={handleSubmit} className="join-form">
          <label className="join-label">Access Code</label>
          <input
            className="join-input"
            inputMode="numeric"
            maxLength={8}
            placeholder="XXXX"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
          {error && <p className="join-error">{error}</p>}
          <button className="join-btn" disabled={loading}>
            {loading ? "Joining..." : "Join Quiz"}
          </button>
        </form>

        <p className="join-hint">Access codes are not case-sensitive.</p>
      </section>
    </main>
  );
}
