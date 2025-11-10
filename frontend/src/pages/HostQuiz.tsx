import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** -------- Types -------- */
type LiveState = {
  quizId: string;        // id you passed from WaitingRoom (display id or canonical id)
  title: string;
  timeLimit: number;     // 15 / 30 / 45
  pin?: string;
  TID?: number;          // optional if you pass it along
};
type QuestionDTO = { question: string; options: string[] };

/** -------- Helpers -------- */
function getAuthHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("jwt");
  const h: Record<string, string> = {};
  if (token) {
    h.Authorization = `Bearer ${token}`;
    h["x-auth-token"] = token; // handle either style of middleware
  }
  return h;
}
function pickQuestionText(src: any): string {
  if (!src) return "";
  const cand = src.question ?? src.Question ?? src.prompt ?? src.text ?? src.title;
  return typeof cand === "string" ? cand : "";
}

function pickOptions(src: any): string[] {
  if (!src) return [];
  const cand = src.options ?? src.Options ?? src.choices ?? src.Choices;
  return Array.isArray(cand) ? cand : [];
}
function getTIDRobust(stateTid?: number): number | undefined {
  if (typeof stateTid === "number" && !Number.isNaN(stateTid)) return stateTid;

  for (const k of ["TID", "teacherId", "ID", "id"]) {
    const v = localStorage.getItem(k);
    if (v && !Number.isNaN(Number(v))) return Number(v);
  }
  try {
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const claim = (import.meta as any).env?.VITE_JWT_USERID_CLAIM || "id";
      const val = payload?.[claim] ?? payload?.teacherId ?? payload?.ID;
      if (val !== undefined && !Number.isNaN(Number(val))) return Number(val);
    }
  } catch {}
  return undefined;
}

/** -------- Component -------- */
export default function HostQuiz() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const live = (state ?? {}) as Partial<LiveState>;

  const routeId = String(live.quizId || "");
  const title = String(live.title || "Quiz");
  const timePerQ = Number(live.timeLimit || 30);
  const stateTid = typeof live.TID === "number" ? live.TID : undefined;

  const [canonicalId, setCanonicalId] = useState<string>(routeId);
  const [q, setQ] = useState<QuestionDTO | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timePerQ);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  if (!routeId || !timePerQ) {
    return (
      <main className="host-quiz" style={{ minHeight: "100vh", background: "#0f0f10", color: "#fff" }}>
        <div style={{ padding: 24, textAlign: "center", color: "#ffd84d" }}>
          Missing quiz data.
          <div style={{ marginTop: 12 }}>
            <button className="btn btn--gold" onClick={() => navigate("/dashboard/teacher/start")}>
              Back to Start
            </button>
          </div>
        </div>
      </main>
    );
  }

  /** ---- lifecycle: preflight + start-or-resume ---- */
  useEffect(() => {
    let cancelled = false;

    async function startOrResume() {
      setError(null);
      const TID = getTIDRobust(stateTid);
      if (!TID) {
        setError("Missing teacher ID (TID). Please log in again.");
        return;
      }

      try {
        setLoading(true);

        // 0) Preflight: read test to get canonical ID, total, isLive, currentQuestion, and questions
        const preRes = await fetch(`/api/test/${encodeURIComponent(routeId)}`, {
          headers: { ...getAuthHeaders() },
        });
        if (!preRes.ok) {
          const body = await preRes.text();
          setError(`readTest (preflight) failed (HTTP ${preRes.status}): ${body}`);
          return;
        }
        const preJson = await preRes.json();

        const preQuestions: any[] = Array.isArray(preJson?.questions) ? preJson.questions : [];
        const count = preQuestions.length;
        const idFromDb: string = String(preJson?.ID ?? routeId);
        const isLive: boolean = !!(preJson?.isLive ?? preJson?.live ?? preJson?.started);
        const currentIdxRaw = preJson?.currentQuestion ?? preJson?.currentIndex ?? 0;
        const currentIdx = Number(currentIdxRaw);

        if (!cancelled) {
          setCanonicalId(idFromDb);
          setTotal(count);
        }

        // If already live, RESUME: render the current question and start timer
        if (isLive) {
          if (Number.isFinite(currentIdx) && currentIdx < count && preQuestions[currentIdx]) {
            const curr = preQuestions[currentIdx];
            if (!cancelled) {
              setQ({ question: pickQuestionText(curr), options: pickOptions(curr) });
              setQIndex(currentIdx);
              resetTimer();
            }
            return;
          }
          // Edge: live but pointer beyond last question -> go to review
          navigate("/dashboard/teacher/review", { state: { quizId: idFromDb, title, finished: true } });
          return;
        }

        // Not live yet -> START it now
        const startRes = await fetch("/api/startTest", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ ID: idFromDb, TID }),
        });

        if (!startRes.ok) {
          const body = await startRes.text();
          // If backend reports "already live" (race/refresh), fall back to resume path
          if (startRes.status === 400 && /already live/i.test(body)) {
            // show current question from preflight
            if (Number.isFinite(currentIdx) && currentIdx < count && preQuestions[currentIdx]) {
              const curr = preQuestions[currentIdx];
              if (!cancelled) {
                setQ({ question: pickQuestionText(curr), options: pickOptions(curr) });
                setQIndex(currentIdx);
                resetTimer();
              }
              return;
            }
          }
          setError(`startTest failed (HTTP ${startRes.status}): ${body}`);
          return;
        }

        const startJson = await startRes.json();
        const startText = pickQuestionText(startJson) || pickQuestionText(preQuestions[0]);
            const startOpts = pickOptions(startJson).length ? pickOptions(startJson) : pickOptions(preQuestions[0]);
            if (!startText || !startOpts.length) {
            setError("startTest returned no usable question/options.");
            return;
        }
        setQ({ question: startText, options: startOpts });
        if (!cancelled) {
          setQ({ question: startJson.question, options: startJson.options });
          setQIndex(0);
          resetTimer();
        }
      } catch (e: any) {
        setError(e?.message || "Failed to start/resume test.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    startOrResume();
    return () => {
      cancelled = true;
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, stateTid]);

  /** ---- timer ---- */
  function clearTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }
  function resetTimer() {
    clearTimer();
    setTimeLeft(timePerQ);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer();
          goNext(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  /** ---- next / skip ---- */
  async function goNext(_timesUp = false) {
    setError(null);
    const TID = getTIDRobust(stateTid);
    if (!TID) {
      setError("Missing teacher ID (TID). Please log in again.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/nextQuestion", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ TID, ID: canonicalId }),
      });
      if (!res.ok) {
        const body = await res.text();
        setError(`nextQuestion failed (HTTP ${res.status}): ${body}`);
        return;
      }

      const json = await res.json();
      if (json?.gameFinished) {
        navigate("/dashboard/teacher/review", {
          state: { quizId: canonicalId, title, finished: true },
        });
        return;
      }

      const currentIndex: number = Number(json?.currentQuestion ?? NaN);
      if (Number.isNaN(currentIndex)) {
        setError("nextQuestion did not return a valid currentQuestion index.");
        return;
      }

      // Read the test and show that index
      const testRes = await fetch(`/api/test/${encodeURIComponent(canonicalId)}`, {
        headers: { ...getAuthHeaders() },
      });
      if (!testRes.ok) {
        const body = await testRes.text();
        setError(`readTest failed (HTTP ${testRes.status}): ${body}`);
        return;
      }

      const testJson = await testRes.json();
      const arr: any[] = Array.isArray(testJson?.questions) ? testJson.questions : [];
      const nextQ = arr[currentIndex];
      if (!nextQ) {
        setError(`Question ${currentIndex + 1} not found in test.`);
        return;
      }

      setQ({ question: pickQuestionText(nextQ), options: pickOptions(nextQ) });

      setQIndex(currentIndex);
      setTotal(arr.length); // in case it changed
      resetTimer();
    } catch (e: any) {
      setError(e?.message || "Failed to advance question.");
    } finally {
      setLoading(false);
    }
  }

  const progressLabel = useMemo(
    () => `Question ${qIndex + 1} of ${total || "?"}`,
    [qIndex, total]
  );

  /** ---- render ---- */
  return (
    <main className="host-quiz" style={{ minHeight: "100vh", background: "#0f0f10", color: "#fff" }}>
      <header
        className="host-topbar"
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid rgba(255,216,77,.25)",
        }}
      >
        <div style={{ fontWeight: 700, color: "#ffd84d" }}>
          Knighthoot <span style={{ color: "#c9c9c9", fontWeight: 500 }}>| {title}</span>
        </div>

        <div className="host-actions">
          <button
            className="btn btn--ghost"
            onClick={() => goNext(false)}
            disabled={loading}
            style={{
              background: "#2b2b2b",
              border: "1px solid #3a3a3a",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Skip →
          </button>
        </div>
      </header>

      <section
        className="host-stage"
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 24,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px 16px 48px",
        }}
      >
        {/* Left: timer + progress + error */}
        <aside className="host-side">
          <div
            className="host-timer"
            aria-label="seconds remaining"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#ffd84d",
              color: "#1b1b1b",
              fontWeight: 800,
              display: "grid",
              placeItems: "center",
              fontSize: 20,
              border: "2px solid #1b1b1b",
              boxShadow: "0 0 0 3px rgba(255,216,77,.2)",
            }}
          >
            {timeLeft}
          </div>
          <div style={{ marginTop: 10, color: "#bfbfbf" }}>{progressLabel}</div>

          {error && (
            <div style={{ color: "#ff9b9b", marginTop: 12, fontSize: 14, whiteSpace: "pre-wrap" }}>
              {error}
            </div>
          )}
        </aside>

        {/* Right: question + 4 options */}
        <div className="host-question" style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 36, margin: "12px 0 24px" }}>
            {q?.question ?? "Loading..."}
          </h1>

          <div
            className="host-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}
          >
            {(q?.options ?? new Array(4).fill("")).slice(0, 4).map((opt, i) => (
              <button
                key={i}
                className={`host-opt host-opt--${i % 2 ? "grey" : "gold"}`}
                disabled
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  borderRadius: 10,
                  padding: "18px 18px",
                  border: "1px solid",
                  cursor: "default",
                  textAlign: "left",
                  fontSize: 18,
                  background: i % 2 ? "#aab0b6" : "#e3b30f",
                  borderColor: i % 2 ? "#8e949a" : "#c39b0e",
                  color: "#0f0f10",
                }}
              >
                <span
                  className="host-opt__icon"
                  aria-hidden
                  style={{ width: 36, display: "inline-grid", placeItems: "center" }}
                >
                  🛡️
                </span>
                <span className="host-opt__text">{opt}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
