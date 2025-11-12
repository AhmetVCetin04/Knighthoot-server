import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/StudentJoin.css";

const API_BASE = "https://knighthoot.app"; 
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

export default function StudentWaitingRoom() {
  const navigate = useNavigate();
  const s = (useLocation().state || {}) as JoinState;

  const [quizId] = useState<string | undefined>(s.quizId ?? s.code);
  const [code] = useState<string | undefined>(s.code ?? s.quizId);
  const [title] = useState<string | undefined>(s.title);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<"waiting" | "starting">("waiting");

  const abortRef = useRef<AbortController | null>(null);
  const backoffRef = useRef<number>(1000); // 1s → 5s

  useEffect(() => {
    let mounted = true;

    async function poll() {
      if (!code) {
        setErr("Missing access code. Go back and enter your code again.");
        return;
      }

      while (mounted) {
        try {
          // make each request cancelable
          abortRef.current?.abort();
          abortRef.current = new AbortController();

          const res = await fetch(api("/api/joinTest"), {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ PIN: code }), // ✅ PIN only
            signal: abortRef.current.signal,
          });

          if (res.status === 401) {
            setErr("Please log in again.");
            return;
          }

          // Not live yet (your backend commonly returns 400 here)
          if (res.status === 400 || res.status === 404 || res.status === 409) {
            await new Promise((r) => setTimeout(r, 1200));
            continue;
          }

          if (res.ok) {
            // Teacher started the test — get the real test ID
            const payload = await res.json();
            const realId =
              payload?.testID ||
              payload?.ID ||
              payload?.testId ||
              payload?.test?.ID ||
              payload?.test?._id;

            if (!realId) {
              setErr("Joined but couldn’t read the quiz ID. Ask the teacher to re-start.");
              return;
            }

            setStatus("starting");
            navigate("/dashboard/student/live", {
              replace: true,
              state: { quizId: realId, code, title: s.title || "Quiz" },
            });
            return;
          }

          // Any other status — brief delay and retry
          await new Promise((r) => setTimeout(r, 900));
        } catch (e: any) {
          if (e?.name !== "AbortError") {
            await new Promise((r) => setTimeout(r, 900));
          }
        }
      }
    }

    poll();
    return () => {
      mounted = false;
      abortRef.current?.abort();
    };
  }, [code, s.title, navigate]);

  return (
    <main className="student-page">
      <section className="student-card">
        <h2>{title || "Waiting Room"}</h2>
        {code ? <p className="muted">Code: {code}</p> : null}
        {quizId ? <p className="muted">Quiz ID: {quizId}</p> : null}

        {err ? (
          <p className="student-error" style={{ marginTop: 12 }}>{err}</p>
        ) : (
          <p style={{ marginTop: 16 }}>
            {status === "waiting" ? "Waiting for your teacher to start the quiz…" : "Starting…"}
          </p>
        )}
      </section>
    </main>
  );
}
