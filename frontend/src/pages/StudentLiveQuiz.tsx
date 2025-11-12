// src/pages/StudentLiveQuiz.tsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/StudentJoin.css";

/** ===== API base ===== */
const API_BASE = "http://knighthoot.app".replace(/\/+$/, ""); // keep same origin/port you use in the browser
const api = (p: string) => `${API_BASE}${p.startsWith("/") ? p : `/${p}`}`;

/** ===== Types ===== */
type LiveState = { quizId?: string; code?: string; title?: string };
type TestDoc = {
  title?: string;
  questions?: any[];
  currentQuestion?: number;
  currentIndex?: number;
  isLive?: boolean;
};
type AnswerRecord = {
  qIndex: number;
  question: string;
  choices: string[];
  selected: number | null;
  correct: number | null;
  wasCorrect: boolean | null;
};

/** ===== Auth headers ===== */
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

/** ===== Small helpers ===== */
function testIsLive(obj: any) {
  return Object.prototype.hasOwnProperty.call(obj ?? {}, "isLive")
    ? obj.isLive === true
    : false;
}
function pickQuestionText(src: any): string {
  if (!src) return "";
  const cand = src.question ?? src.Question ?? src.prompt ?? src.text ?? src.title;
  return typeof cand === "string" ? cand : String(cand ?? "");
}
function pickChoices(src: any): string[] {
  if (!src) return [];
  const raw =
    src.options ??
    src.Options ??
    src.choices ??
    src.Choices ??
    src.answers ??
    src.Answers ??
    [];
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((x) => (typeof x === "string" ? x : String(x ?? "")));
}
function pickAnswerIndex(src: any): number | null {
  const idx =
    src?.correctIndex ??
    src?.answerIndex ??
    src?.AnswerIndex ??
    src?.answer ??
    null;
  return typeof idx === "number" ? idx : null;
}
function pickAnswerText(src: any): string | null {
  const t = src?.answerText ?? src?.Answer ?? src?.correct ?? src?.Correct ?? null;
  return typeof t === "string" ? t : t == null ? null : String(t);
}
function inferCorrectIndexFromText(choices: string[], text: string | null): number | null {
  if (!text || !Array.isArray(choices)) return null;
  const norm = text.trim();
  const idx = choices.findIndex(
    (o) =>
      (o ?? "")
        .toString()
        .trim()
        .localeCompare(norm, undefined, { sensitivity: "base" }) === 0
  );
  return idx >= 0 ? idx : null;
}
function getSafePointer(j: TestDoc | null): number {
  if (j == null) return -1;
  if (typeof j.currentQuestion === "number") return j.currentQuestion;
  if (typeof j.currentIndex === "number") return j.currentIndex;
  return -1;
}

/** ===== SID helpers (for reports + local cache) ===== */
function getSID(): string | null {
  // 1) explicit storage wins
  const direct = localStorage.getItem("sid") || sessionStorage.getItem("sid");
  if (direct && String(direct).trim() !== "" && direct !== "null" && direct !== "undefined") {
    return String(direct).trim();
  }
  // 2) fall back to common JWT claims
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    sessionStorage.getItem("token");
  if (!token || token.split(".").length !== 3) return null;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const p: any = JSON.parse(json);
    const cand =
      p.sid ??
      p.SID ??
      p.studentId ??
      p.studentID ??
      p.userId ??
      p.userID ??
      p.uid ??
      p.id ??
      p._id ??
      p.student?.id ??
      p.student?._id ??
      p.student?.SID ??
      p.sub;
    return cand != null ? String(cand).trim() : null;
  } catch {
    return null;
  }
}
function toSidVariants(raw: string | null): { sidStr: string | null; sidNum: number | null } {
  if (!raw) return { sidStr: null, sidNum: null };
  const s = String(raw).trim();
  const n = Number(s);
  return { sidStr: s, sidNum: Number.isFinite(n) ? n : null };
}
function scoresCacheKey(sid: string | number | null) {
  return `scores-cache:v1:${sid ?? "anon"}`;
}
function appendToLocalScoresCache(sid: string | number | null, docs: any[]) {
  try {
    const key = scoresCacheKey(sid);
    const prev = JSON.parse(localStorage.getItem(key) || "[]");
    const next = [...prev, ...docs].slice(-500); // keep last 500 rows
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
}

/** ===== Debug tap (console + window.__k) ===== */
function debugLog(...args: any[]) {
  try {
    console.log("[KNIGHTHOOT]", ...args);
    (window as any).__k = (window as any).__k || [];
    (window as any).__k.push(args);
  } catch {}
}

/** ===== Resolve quizId from multiple sources ===== */
function resolveQuizId(loc: any, fallback?: string): string | undefined {
  // 1) state
  const s = (loc?.state || {}) as any;
  if (s?.quizId) return String(s.quizId);

  // 2) ?id=... in URL
  try {
    const params = new URLSearchParams(loc?.search || "");
    const q = (params.get("id") || "").trim();
    if (q) return q;
  } catch {}

  // 3) last-used from storage
  const saved = localStorage.getItem("currentQuizId") || "";
  if (saved) return saved;

  // 4) fallback
  return fallback;
}

/** ===================================================================== */
/**                           COMPONENT                                   */
/** ===================================================================== */
export default function StudentLiveQuiz() {
  const navigate = useNavigate();
  const loc = useLocation();
  const s = (loc.state || {}) as LiveState;

  const [rawQuizId] = useState<string | undefined>(resolveQuizId(loc, s.quizId));
  const quizId = rawQuizId;
  useEffect(() => {
    if (quizId) localStorage.setItem("currentQuizId", quizId);
    debugLog("Using quizId:", quizId);
  }, [quizId]);

  const [title, setTitle] = useState<string>(s.title || "Quiz");
  const [code] = useState<string | undefined>(s.code);

  // question UI
  const [qIndex, setQIndex] = useState<number>(0);
  const [qText, setQText] = useState<string>("");
  const [choices, setChoices] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // reveal state
  const [reveal, setReveal] = useState<boolean>(false);
  const [correctIdx, setCorrectIdx] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);

  // page state
  const [loading, setLoading] = useState<boolean>(true);
  const [waiting, setWaiting] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // results accumulation
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [finished, setFinished] = useState<boolean>(false);

  // refs
  const pollTimerRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const lastPtrRef = useRef<number | null>(null);
  const lastQuestionsRef = useRef<any[]>([]);
  const mountedRef = useRef<boolean>(false);
  const isRevealingRef = useRef<boolean>(false);
  const submittedRef = useRef<boolean>(false);
  const submittedForIndex = useRef<number | null>(null);
  const hasStartedRef = useRef<boolean>(false);
  const selectionsRef = useRef<Record<number, number | null>>({});
  const isNavigatingRef = useRef<boolean>(false);
  const gameEndedRef = useRef<boolean>(false);

  // constants
  const POLL_MS = 1000;
  const RESULT_HOLD_MS = 1500;

  function clearPoll() {
    if (pollTimerRef.current) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }
  function clearHold() {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function handlePick(i: number) {
    if (reveal || gameEndedRef.current) return;
    setSelectedIdx(i);
    selectionsRef.current[qIndex] = i; // persist choice per question
  }

  /** ===== Submit single question ===== */
  async function submitScoreIfNeeded(
      forIndex: number,
      picked: number | null,
      cIdx: number | null,
      correctAnswerText: string | null
    ) {
      if (submittedRef.current && submittedForIndex.current === forIndex) return;
      if (gameEndedRef.current && answers.some((a) => a.qIndex === forIndex)) return;

      const { sidStr, sidNum } = toSidVariants(getSID());
      const apiSID = sidNum ?? sidStr ?? null; 

      try {
        await fetch(api("/api/submitQuestion"), {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ID: apiSID,               
            testID: String(quizId),                  
            isCorrect: picked != null && cIdx != null ? picked === cIdx : false,
          }),
        });
      } catch (e: any) {
        debugLog("submitQuestion network error:", e?.message || e);
      }

          appendToLocalScoresCache(sidStr, [ 
        {
          kind: "per-question",
          SID: apiSID, 
          testID: quizId,
          code,
          qIndex: forIndex,
          isCorrect: picked != null && cIdx != null ? picked === cIdx : false,
          pickedIndex: picked,
          correctIndex: cIdx,
          pickedText: picked != null ? (choices[picked] ?? null) : null,
          correctText: correctAnswerText,
          createdAt: new Date().toISOString(),
        },
      ]);

      submittedRef.current = true;
      submittedForIndex.current = forIndex;
    }

  /** ===== Finalize ===== */
  async function finalizeAndPersistResults() {
    const { sidStr, sidNum } = toSidVariants(getSID());
    const effectiveSID = sidNum ?? sidStr ?? null; 

    const total = answers.length;
    const correct = answers.filter((a) => a.wasCorrect).length;
    const percent = total > 0 ? Math.round((correct * 100) / total) : 0;

      appendToLocalScoresCache(sidStr, [ 
      {
        kind: "summary",
        SID: effectiveSID, 
        testID: quizId,
        code,
        total,
        correct,
        percent,
        answers: answers.map((a) => ({
          qIndex: a.qIndex,
          pickedIndex: a.selected,
          correctIndex: a.correct,
          wasCorrect: !!a.wasCorrect,
        })),
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  function goToResults() {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    gameEndedRef.current = true;
    clearPoll();
    clearHold();

    // briefly try to write the summary cache before navigating
    Promise.race([
      finalizeAndPersistResults(),
      new Promise((res) => setTimeout(res, 800)),
    ]).finally(() => {
      const totalQ = (lastQuestionsRef.current?.length ?? 0) || answers.length;
      const score = answers.filter((a) => a.wasCorrect === true).length;
      navigate("/student/results", {
        replace: true,
        state: { quizId, title, total: totalQ, score, answers },
      });
    });
  }

  /** ===== Robust test reader ===== */
  async function readTest(): Promise<TestDoc | "WAIT" | "AUTH" | null> {
    if (!quizId || gameEndedRef.current) return null;

    const routes = [
      api(`/api/test/${encodeURIComponent(quizId)}`),
      api(`/api/tests/${encodeURIComponent(quizId)}`),
      api(`/api/test?id=${encodeURIComponent(quizId)}`),
    ];

    for (const url of routes) {
      try {
        const r = await fetch(url, { headers: getAuthHeaders(), cache: "no-store" });
        debugLog("readTest", url, r.status);

        if (r.status === 401 || r.status === 403) return "AUTH";
        if (r.status === 404) continue; // try next route

        if (!r.ok) {
          const t = await r.text().catch(() => "");
          debugLog("readTest non-ok:", r.status, t.slice(0, 200));
          continue;
        }
        const j: TestDoc = await r.json().catch(() => null as any);
        if (j) return j;
      } catch (e: any) {
        debugLog("readTest fetch error", e?.message || e);
      }
    }

    // All tried, nothing: treat as "not visible yet" and keep waiting/polling
    return "WAIT";
  }

  /** ===== First load ===== */
  async function initLoad() {
    setError(null);
    setLoading(true);

    if (!quizId) {
      setError("Missing quiz ID");
      setLoading(false);
      return;
    }

    const j = await readTest();
    if (!mountedRef.current || gameEndedRef.current) return;

    if (j === "AUTH") {
      setError("Not authorized. Make sure you’re logged in (valid token).");
      setLoading(false);
      return;
    }

    if (j === "WAIT") {
      // still waiting for teacher / record to appear
      setWaiting(true);
      setLoading(false);
      return;
    }

    if (!j) {
      setError("Failed to read test");
      setLoading(false);
      return;
    }

    if (!testIsLive(j)) {
      setWaiting(true);
      setLoading(false);
      return;
    }

    const arr: any[] = Array.isArray(j.questions) ? j.questions : [];
    const ptr = getSafePointer(j);

    lastQuestionsRef.current = arr;
    lastPtrRef.current = ptr;
    setTitle(j.title || s.title || "Quiz");

    const curr = arr[ptr];
    if (!curr) {
      setWaiting(true);
      setLoading(false);
      return;
    }

    setQIndex(ptr);
    setQText(pickQuestionText(curr));
    setChoices(pickChoices(curr));
    setSelectedIdx(null);
    setReveal(false);
    setCorrectIdx(null);
    setWasCorrect(null);
    submittedRef.current = false;
    submittedForIndex.current = null;

    setWaiting(false);
    setLoading(false);
  }

  /** ===== Move to next question (after reveal hold) ===== */
  function advanceToNextQuestion(arr: any[], ptr: number) {
    if (!mountedRef.current || gameEndedRef.current) return;

    const curr = arr[ptr];
    if (!curr) {
      gameEndedRef.current = true;
      clearPoll();
      clearHold();
      setFinished(true);
      return;
    }
    setQIndex(ptr);
    setQText(pickQuestionText(curr));
    setChoices(pickChoices(curr));
    setSelectedIdx(null);
    setReveal(false);
    setCorrectIdx(null);
    setWasCorrect(null);
    submittedRef.current = false;
    submittedForIndex.current = null;
  }

  /** ===== Reveal & record previous question, submit/save ===== */
  function revealAndRecord(prevIndex: number) {
    if (isRevealingRef.current) return;
    isRevealingRef.current = true;

    const arr = lastQuestionsRef.current || [];
    const prevQ = arr[prevIndex];
    if (!prevQ) {
      isRevealingRef.current = false;
      return;
    }

    const prevChoices = pickChoices(prevQ);
    const idxFromQ = pickAnswerIndex(prevQ);
    const textFromQ = pickAnswerText(prevQ);
    const cIdx = idxFromQ != null ? idxFromQ : inferCorrectIndexFromText(prevChoices, textFromQ);

    const picked = selectionsRef.current[prevIndex] ?? null;
    const wc = picked != null && cIdx != null ? picked === cIdx : false;

    setCorrectIdx(cIdx);
    setWasCorrect(wc);
    setReveal(true);

    setAnswers((prev) => {
      if (prev.some((a) => a.qIndex === prevIndex)) return prev;
      return prev.concat([
        {
          qIndex: prevIndex,
          question: pickQuestionText(prevQ),
          choices: prevChoices.slice(0),
          selected: picked,
          correct: cIdx,
          wasCorrect: wc,
        },
      ]);
    });

    const correctAnswerText =
      cIdx != null && prevChoices[cIdx] != null ? prevChoices[cIdx] : textFromQ ?? null;

    // submit to server (if it can increment) + always cache locally
    submitScoreIfNeeded(prevIndex, picked, cIdx, correctAnswerText);

    isRevealingRef.current = false;
  }

  /** ===== Polling loop ===== */
  async function pollOnce() {
    const j = await readTest();
    if (!mountedRef.current) return;

    if (j === "AUTH") {
      setError("Not authorized. Please log in again.");
      clearPoll();
      clearHold();
      return;
    }

    if (j === "WAIT" || !j) {
      if (!waiting) setWaiting(true);
      return; // keep polling
    }

    // live/non-live handling
    if (!testIsLive(j)) {
      if (hasStartedRef.current) {
        gameEndedRef.current = true;

        const prevPtr = lastPtrRef.current;
        if (prevPtr != null && answers.every((a) => a.qIndex !== prevPtr)) {
          revealAndRecord(prevPtr);
        }

        clearPoll();
        clearHold();
        setFinished(true);
        // Save summary to local cache so reports show immediately
        finalizeAndPersistResults().catch(() => {});
      } else {
        gameEndedRef.current = true;
        clearPoll();
        clearHold();
        setFinished(true);
        finalizeAndPersistResults().catch(() => {});
      }
      return;
    }

    if (waiting) setWaiting(false);
    if (!hasStartedRef.current) hasStartedRef.current = true;
    if (!mountedRef.current || gameEndedRef.current) return;

    const arr: any[] = Array.isArray(j.questions) ? j.questions : [];
    const ptr = getSafePointer(j);

    lastQuestionsRef.current = arr;

    const prevPtr = lastPtrRef.current;
    if (prevPtr == null) {
      lastPtrRef.current = ptr;
      return;
    }

    if (!arr[ptr]) {
      gameEndedRef.current = true;

      if (prevPtr != null && answers.every((a) => a.qIndex !== prevPtr)) {
        revealAndRecord(prevPtr);
      }

      clearPoll();
      clearHold();
      setFinished(true);
      finalizeAndPersistResults().catch(() => {});
      return;
    }

    if (ptr !== prevPtr) {
      revealAndRecord(prevPtr);
      lastPtrRef.current = ptr;

      clearHold();
      holdTimerRef.current = window.setTimeout(() => {
        advanceToNextQuestion(arr, ptr);
      }, RESULT_HOLD_MS);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    gameEndedRef.current = false;

    const loop = async () => {
      if (!mountedRef.current || gameEndedRef.current) {
        clearPoll();
        return;
      }
      await pollOnce();
      if (mountedRef.current && !gameEndedRef.current) {
        pollTimerRef.current = window.setTimeout(loop, POLL_MS);
      }
    };

    (async () => {
      if (!quizId) {
        setError("Missing quiz ID");
        setLoading(false);
        return;
      }
      await initLoad();
      if (mountedRef.current && !gameEndedRef.current) {
        loop();
      }
    })();

    return () => {
      mountedRef.current = false;
      gameEndedRef.current = true;
      clearPoll();
      clearHold();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  /** ===== Views ===== */
  function renderWaiting() {
    return (
      <main className="student-page">
        <section className="student-card">
          <h2>{title || "Waiting Room"}</h2>
          {code ? <p className="muted">Code: {code}</p> : null}
          <p style={{ marginTop: 16 }}>Waiting for your teacher to start the quiz…</p>
        </section>
      </main>
    );
  }

  function renderQuestion() {
    return (
      <main className="student-page">
        <section className="student-card">
          <header className="student-top">
            <h2 className="student-quiz-title">{title || "Quiz"}</h2>
            <div className="muted">Question {qIndex + 1}</div>
          </header>

          <div className="student-qtext">{qText}</div>

          <div className="student-choices">
            {choices.slice(0, 4).map((c, i) => {
              const isPicked = selectedIdx === i;
              const isCorrect = reveal && correctIdx === i;
              const isWrongPicked = reveal && isPicked && correctIdx != null && i !== correctIdx;

              return (
                <button
                  key={i}
                  className={[
                    "student-answer",
                    isPicked ? "is-picked" : "",
                    isCorrect ? "is-correct" : "",
                    isWrongPicked ? "is-wrong" : "",
                  ].join(" ")}
                  disabled={reveal}
                  onClick={() => handlePick(i)}
                >
                  <span className="choice-index">{String.fromCharCode(65 + i)}.</span> {c || "—"}
                </button>
              );
            })}
          </div>

          <footer className="student-footer">
            {!reveal ? (
              selectedIdx == null ? (
                <span className="muted">Choose an answer…</span>
              ) : (
                <span className="muted">Answer selected. Waiting for results…</span>
              )
            ) : (
              <strong aria-live="polite">{wasCorrect ? "✓ Correct!" : "✗ Incorrect"}</strong>
            )}
          </footer>
        </section>
      </main>
    );
  }

  function renderResults() {
    const total = answers.length;
    const score = answers.filter((a) => a.wasCorrect === true).length;

    return (
      <main className="student-page">
        <section className="student-card">
          <h2>Quiz Over!</h2>
          <p className="muted">
            Your final score: <strong>{score}</strong> / {total}
          </p>
          <p style={{ marginTop: 16 }}>Click the button below to see your detailed results.</p>

          <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
            <button className="student-answer" onClick={goToResults}>
              View My Results
            </button>
          </div>
        </section>
      </main>
    );
  }

  /** ===== Render root ===== */
  if (error) {
    return (
      <main className="student-page">
        <section className="student-card">
          <h2>Error</h2>
          <p className="muted">{error}</p>
          <button
            className="student-answer"
            onClick={() => navigate("/student/start", { replace: true })}
          >
            Back to Start
          </button>
        </section>
      </main>
    );
  }

  if (finished) return renderResults();
  if (loading || waiting) return renderWaiting();
  return renderQuestion();
}
