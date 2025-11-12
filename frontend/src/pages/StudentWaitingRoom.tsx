import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SiteBackground from '../components/SiteBackground';
// Corrected import path for CSS file.
import "../styles/StudentWaitingRoom.css";

const API_BASE = "https://174.138.73.101:5173";
const api = (p: string) => `${API_BASE}${p.startsWith("/") ? p : `/${p}`}`;

type JoinState = { quizId?: string; code?: string; title?: string };

function getAuthHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token
      ? { Authorization: `Bearer ${token}`, "x-auth-token": token, "x-access-token": token }
      : {}),
  };
}

// Try a few common places to find the student's ID (SID) for joinTest
function getSIDRobust(): number | undefined {
  const keys = ["SID", "sid", "studentId", "studentID", "uid", "user", "profile"];
  for (const k of keys) {
    const v = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (!v) continue;
    try {
      if (/^\d+$/.test(v)) return Number(v);
      const obj = JSON.parse(v);
      for (const c of ["SID", "sid", "studentId", "studentID", "id"]) {
        const raw = obj?.[c];
        if (typeof raw === "number") return raw;
        if (typeof raw === "string" && /^\d+$/.test(raw)) return Number(raw);
      }
    } catch {}
  }
  return undefined;
}

export default function StudentWaitingRoom() {
  const navigate = useNavigate();
  const s = (useLocation().state || {}) as JoinState;

  const [code] = useState<string | undefined>(s.code ?? s.quizId);
  const [err, setErr] = useState<string | null>(null);
  const [status] = useState<"waiting" | "starting">("waiting");

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;

    async function joinLoop() {
      if (!code) {
        setErr("Missing access code. Go back and enter your code again.");
        return;
      }
      const SID = getSIDRobust();

      let testID: string | undefined;

      // Keep trying joinTest until it returns 200 (which only happens when isLive === true)
      while (mounted && !testID) {
        try {
          abortRef.current?.abort();
          abortRef.current = new AbortController();

          const res = await fetch(api("/api/joinTest"), {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ PIN: code, ID: SID }), // include SID if available
            signal: abortRef.current.signal,
          });

          if (res.status === 401) {
            setErr("Please log in again.");
            return;
          }

          if (res.ok) {
            const payload: any = await res.json().catch(() => ({}));
            // Backend guarantees: if not live, joinTest responds 400; if live, 200 + test info
            // so it's safe to navigate now.
            testID =
              payload?.testID ||
              payload?.ID ||
              payload?.testId ||
              payload?.test?.ID ||
              payload?.test?._id;

            if (testID) {
              // status is not strictly necessary here, but keeping the logic clean
              navigate("/dashboard/student/live", {
                replace: true,
                state: { quizId: testID, code, title: payload.title || "Quiz" },
              });
              return;
            }
          }

          // Not live yet (or no ID); wait a bit and retry
          await new Promise((r) => setTimeout(r, 900));
        } catch (e: any) {
          if (e?.name !== "AbortError") {
            // Log other errors quietly and retry
            await new Promise((r) => setTimeout(r, 900));
          }
        }
      }
    }

    joinLoop();
    return () => {
      mounted = false;
      abortRef.current?.abort();
    };
  }, [code, navigate]);

  const handleLeaveLobby = () => {
    navigate("/dashboard/student", { replace: true });
  };

  return (
    <main className="student-page waiting-room-page">
      <SiteBackground />
      {/* Centralized Header/Brand */}
      <div className="waiting-header">
        <h1 className="knighthoot-brand">Knighthoot</h1>
        <p className="get-ready-text">Get Ready!</p>
      </div>

      {/* Main Waiting Card */}
      <section className="waiting-card">
        
        {err ? (
          <h2 className="error-message" style={{ marginTop: 12 }}>{err}</h2>
        ) : (
          <>
            {/* Large Yellow Spinner */}
            <div className="spinner-lg"></div>

            <div className="waiting-message-block">
              <h2>Waiting for quiz to start...</h2>
              <p className="instructions">The teacher will start the quiz shortly</p>
            </div>
          </>
        )}
        
        {/* Info Box (Access Code) */}
        <div className="lobby-info-box">
          <div className="lobby-info-item access-code-item">
            <p className="info-label">Access Code</p>
            {/* The code is displayed in gold, center-aligned by CSS */}
            <p className="info-value">{code || "N/A"}</p>
          </div>
        </div>

        <button 
          className="leave-lobby-btn" 
          onClick={handleLeaveLobby}
        >
          Leave Lobby
        </button>
      </section>
      
      {/* Footer Text */}
      <footer className="waiting-footer">
        Make sure your device is ready. The quiz will start automatically when your teacher begins.
      </footer>
    </main>
  );
}
