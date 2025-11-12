// src/pages/StudentLiveQuiz.tsx
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "../styles/StudentJoin.css";

const API_BASE = "https://knighthoot.app";
const api = (p: string) => `${API_BASE}${p.startsWith("/") ? p : `/${p}`}`;
const RESULT_HOLD_MS = 1600; // how long to show ✓/✗ before loading the next question

type LiveState = { quizId?: string; code?: string; title?: string };
type TestDoc = { questions?: any[]; currentQuestion?: number; currentIndex?: number };

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

export default function StudentLiveQuiz() {
  const loc = useLocation();
  const s = (loc.state || {}) as LiveState;

  const [isLive, setIsLive] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false); 
  const [quizId] = useState<string | undefined>(s.quizId);
  const [qText, setQText] = useState<string>("");
  const [choices, setChoices] = useState<string[]>([]);
  const [qIndex, setQIndex] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Submission / waiting
  const [submitted, setSubmitted] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submittedForIndex, setSubmittedForIndex] = useState<number | null>(null);

  // Results reveal
  const [reveal, setReveal] = useState(false);
  const [correctIdx, setCorrectIdx] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const holdTimerRef = useRef<number | null>(null);

  function clearHoldTimer() {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  async function fetchCurrentQuestion(testID: string) {
    const r = await fetch(api(`/api/test/${encodeURIComponent(testID)}`), {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!r.ok) {
      const body = await r.text();
      setError(`Failed to read quiz (HTTP ${r.status}): ${body}`);
      return;
    }

    const json: TestDoc & { isLive?: boolean } = await r.json();
    const live = !!json?.isLive;
    setIsLive(live);
    if (isLive && !ready) setReady(true);
    
    // only show question once teacher started & ready flag true
    if (!live) {
      setQText("");
      setChoices([]);
      return;
    }

    const arr: any[] = Array.isArray(json?.questions) ? json.questions : [];
    const idx = Number(json?.currentQuestion ?? json?.currentIndex ?? 0);
    const curr = arr[idx];
    if (!curr) return;

    setQText(pickQuestionText(curr));
    setChoices(pickOptions(curr));
    setQIndex(idx);
    setTotal(arr.length);

    if (submittedForIndex !== null && submittedForIndex !== idx) {
      setSelectedIdx(null);
      setSubmitted(false);
      setSubmittedForIndex(null);
      setReveal(false);
      setCorrectIdx(null);
      setWasCorrect(null);
      clearHoldTimer();
    }
  }

  async function submitScoreIfNeeded(correctAnswerText?: string | null) {
    if (!submitted || submittedForIndex !== qIndex || selectedIdx == null) return;
    const SID = getSIDRobust();
    if (!SID || !quizId) return;

    const myChoice = choices?.[selectedIdx] ?? "";
    const ans = (correctAnswerText ?? "").toString().trim();
    const isCorrect =
      typeof myChoice === "string" &&
      myChoice.toString().trim().localeCompare(ans, undefined, { sensitivity: "base" }) === 0;

    try {
      await fetch(api(`/api/submitQuestion`), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ID: SID, testID: quizId, isCorrect }),
      });
    } catch {
      /* ignore */
    }
  }

  function onPick(i: number) {
    if (!choices[i]) return;
    if (submitted || reveal) return;
    setSelectedIdx(i);
    setSubmitted(true);
    setSubmittedForIndex(qIndex);
  }

  function calcCorrectIdx(answerText: any): number | null {
    if (!Array.isArray(choices) || !choices.length) return null;
    const ans = (answerText ?? "").toString().trim();
    const idx = choices.findIndex((c) => c?.toString().trim().localeCompare(ans, undefined, { sensitivity: "base" }) === 0);
    return idx >= 0 ? idx : null;
  }

  useEffect(() => {
    let mounted = true;

    async function loop() {
      if (!quizId) {
        setError("Missing quiz ID. Return to the join screen.");
        return;
      }

      try {
        await fetchCurrentQuestion(quizId);
      } catch {}

      while (mounted) {
        try {
          abortRef.current?.abort();
          abortRef.current = new AbortController();

          const r = await fetch(api(`/api/waitQuestion`), {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ testID: quizId }),
            signal: abortRef.current.signal,
            cache: "no-store",
          });

          if (!mounted) return;

          if (r.status === 401) {
            setError("You’re not signed in. Please log in again.");
            return;
          }
          if (r.status === 404 || r.status === 400) {
            await new Promise((res) => setTimeout(res, 900));
            continue;
          }

          if (r.ok) {
            // teacher started quiz → mark ready on first success
            if (!ready) {
              setReady(true);
              await fetchCurrentQuestion(quizId);
            }

            // handle reveal phase
            let payload: any = null;
            try {
              payload = await r.json();
            } catch {
              payload = null;
            }

            const cIdx = calcCorrectIdx(payload?.answer ?? null);
            setCorrectIdx(cIdx);

            setReveal(true);
            if (selectedIdx != null && cIdx != null) setWasCorrect(selectedIdx === cIdx);
            else setWasCorrect(null);

            await submitScoreIfNeeded(payload?.answer ?? null);

            clearHoldTimer();
            holdTimerRef.current = window.setTimeout(async () => {
              if (!mounted || !quizId) return;
              await fetchCurrentQuestion(quizId);
              setSubmitted(false);
              setSubmittedForIndex(null);
              setSelectedIdx(null);
              setReveal(false);
              setCorrectIdx(null);
              setWasCorrect(null);
            }, RESULT_HOLD_MS);

            continue;
          }

          await new Promise((res) => setTimeout(res, 800));
        } catch (e: any) {
          if (e?.name !== "AbortError") await new Promise((res) => setTimeout(res, 900));
        }
      }
    }

    loop();
    return () => {
      mounted = false;
      abortRef.current?.abort();
      clearHoldTimer();
    };
  }, [s.quizId]);

  return (
    <main className="student-page">
      <section className="student-card">
        <h2>{s.title || "Quiz In Progress"}</h2>
        <p className="muted">Quiz ID: {s.quizId || "?"}</p>
        <p className="muted">Code: {s.code || "?"}</p>

        {error ? (
          <p className="student-error" style={{ marginTop: 12 }}>{error}</p>
        ) : (
          <div style={{ marginTop: 16 }}>
            {/* WAITING before teacher starts */}
            {!ready ? (
              <div
                className="student-wait"
                role="status"
                aria-live="polite"
                style={{
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  marginBottom: 12,
                }}
              >
                <strong>Waiting for the teacher to start…</strong>
              </div>
            ) : (
              <>
                {/* AFTER SUBMISSION, BEFORE REVEAL */}
                {submitted && !reveal ? (
                  <div
                    className="student-wait"
                    role="status"
                    aria-live="polite"
                    style={{
                      padding: "10px 12px",
                      border: "1px solid #ddd",
                      borderRadius: 10,
                      marginBottom: 12,
                    }}
                  >
                    <strong>Answer submitted.</strong> Waiting for results…
                  </div>
                ) : null}

                <h3 style={{ margin: "10px 0" }}>{qText}</h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {(choices.length ? choices : ["", "", "", ""]).slice(0, 4).map((opt, i) => {
                    const isChosen = selectedIdx === i;
                    const isCorrectOpt = reveal && correctIdx === i;
                    const showTick = reveal && isCorrectOpt;
                    const showX = reveal && isChosen && correctIdx !== i;

                    return (
                      <button
                        key={i}
                        className={`student-answer ${
                          isChosen ? "student-answer--chosen" : ""
                        } ${isCorrectOpt ? "student-answer--correct" : ""} ${showX ? "student-answer--wrong" : ""}`}
                        disabled={!opt || submitted || reveal}
                        onClick={() => onPick(i)}
                        aria-pressed={isChosen ? "true" : "false"}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <span>{opt || "…"}</span>
                          {showTick && <span aria-label="correct" title="Correct">✓</span>}
                          {showX && <span aria-label="incorrect" title="Incorrect">✗</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {reveal ? (
                  <p className="muted" style={{ marginTop: 10 }}>
                    {correctIdx != null ? "Showing correct answer…" : "Showing results…"}
                  </p>
                ) : (
                  <p className="muted" style={{ marginTop: 10 }}>
                    {total ? `Question ${qIndex + 1} of ${total}` : ""}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
