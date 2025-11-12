import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = "https://knighthoot.app"; 
const api = (p: string) => `${API_BASE}${p.startsWith("/") ? p : `/${p}`}`;

type HostLocationState = {
  quizId?: string;
  title?: string;
  TID?: number;
  pin?: string;
  timeLimit?: number;
  autoStart?: boolean; 
};

type TestDoc = {
  ID?: string;
  title?: string;
  questions?: any[];
  isLive?: boolean;
  currentQuestion?: number;
  currentIndex?: number;
};

function getAuthHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
          "x-auth-token": token,
          "x-access-token": token,
        }
      : {}),
  };
}

function textOf(q: any) {
  return q?.question ?? q?.Question ?? q?.prompt ?? q?.text ?? q?.title ?? "";
}
function optsOf(q: any): string[] {
  const arr = q?.options ?? q?.Options ?? q?.choices ?? q?.Choices;
  return Array.isArray(arr) ? arr : [];
}

// Try to recover TID from localStorage if not passed via state
function deriveTID(initial?: number): number | undefined {
  if (typeof initial === "number") return initial;
  const keys = ["TID", "tid", "teacherId", "teacherID", "user", "profile"];
  for (const k of keys) {
    const v = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (!v) continue;
    try {
      // handle raw number or JSON object
      if (/^\d+$/.test(v)) return Number(v);
      const obj = JSON.parse(v);
      for (const cand of ["TID", "tid", "teacherId", "teacherID", "id"]) {
        if (typeof obj?.[cand] === "number") return obj[cand];
        if (typeof obj?.[cand] === "string" && /^\d+$/.test(obj[cand])) return Number(obj[cand]);
      }
    } catch {}
  }
  return undefined;
}

// --- detect the correct answer index robustly ---
function getCorrectIndex(q: any): number {
  if (!q) return -1;
  if (typeof q?.correctIndex === "number") return q.correctIndex;
  if (typeof q?.answerIndex === "number") return q.answerIndex;
  if (typeof q?.AnswerIndex === "number") return q.AnswerIndex;
  if (typeof q?.answer === "number") return q.answer;

  const opts = q?.options ?? q?.Options ?? q?.choices ?? q?.Choices ?? [];
  const ansText = q?.answerText ?? q?.Answer ?? q?.correct ?? q?.Correct ?? "";

  if (typeof ansText === "string" && Array.isArray(opts)) {
    const idx = opts.findIndex((o: any) => {
      const t = (o?.text ?? o?.Text ?? o ?? "").toString().trim();
      return t.localeCompare(ansText.toString().trim(), undefined, { sensitivity: "base" }) === 0;
    });
    if (idx >= 0) return idx;
  }
  return -1;
}

export default function HostQuiz() {
  const navigate = useNavigate();
  const s = (useLocation().state || {}) as HostLocationState;

  const [quizId, setQuizId] = useState<string | undefined>(s.quizId);
  const [title, setTitle] = useState<string>(s.title || "Hosted Quiz");
  const [pin] = useState<string | undefined>(s.pin);
  const [TID, setTID] = useState<number | undefined>(deriveTID(s.TID));

  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [qIndex, setQIndex] = useState(-1);
  const [qText, setQText] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [total, setTotal] = useState(0);

  // current question + reveal state
  const [currentQ, setCurrentQ] = useState<any | null>(null);
  const [reveal, setReveal] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState<number>(s.timeLimit ?? 20);
  const timerRef = useRef<number | null>(null);
  const startIssuedRef = useRef(false); // prevents duplicate starts

  // ---------- helpers ----------
  const timeString = useMemo(() => `${Math.max(0, secondsLeft)}s`, [secondsLeft]);

  function startTimer() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((t) => (t <= 1 ? (window.clearInterval(timerRef.current!), 0) : t - 1) as number);
    }, 1000);
  }
  function resetTimer() {
    setSecondsLeft(s.timeLimit ?? 20);
    startTimer();
  }

  function finishAndGo(message?: string) {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setStarted(false);
    setReveal(false);
    // Pass along any useful state; your router already has /dashboard/teacher/finished
    navigate("/dashboard/teacher/finished", {
      state: { quizId, title, pin, TID, finished: true, message: message || "Test has finished." },
      replace: true,
    });
  }

  async function readById(id: string): Promise<TestDoc | null> {
    const r = await fetch(api(`/api/test/${encodeURIComponent(id)}`), {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!r.ok) return null;
    return (await r.json()) as TestDoc;
  }

  async function readWithRetry(id: string, tries = 3): Promise<TestDoc | null> {
    for (let i = 0; i < tries; i++) {
      const doc = await readById(id);
      if (doc) return doc;
      await new Promise((r) => setTimeout(r, 250 + i * 250));
    }
    return null;
  }

  function showQuestion(doc: TestDoc) {
    const arr = Array.isArray(doc.questions) ? doc.questions : [];
    setTotal(arr.length);

    const idx = Number(doc.currentQuestion ?? doc.currentIndex ?? 0);

    // If we've reached/passed the end, finish
    if (!arr.length || idx < 0 || idx >= arr.length) {
      finishAndGo("No more questions.");
      return;
    }

    const curr = arr[idx];
    setStarted(true);
    setQIndex(idx);
    setQText(textOf(curr));
    setChoices(optsOf(curr));
    setCurrentQ(curr);
    setReveal(false); // hide until timer completes
    resetTimer();
  }

  // ---------- lifecycle ----------
  useEffect(() => {
    if (!quizId && s.quizId) setQuizId(s.quizId);
    if (s.TID != null && TID == null) setTID(s.TID);
  }, [s.quizId, s.TID, quizId, TID]);

  // Auto-start when arriving from the waiting room
  useEffect(() => {
    if (s.autoStart && !started && !startIssuedRef.current) {
      onStart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.autoStart, started]);

  useEffect(() => {
    (async () => {
      if (!quizId) return;
      try {
        const doc = await readById(quizId);
        if (doc?.title) setTitle(doc.title);
        if (Array.isArray(doc?.questions)) setTotal(doc.questions.length);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when timer hits 0, reveal correct answer (do NOT auto-advance)
  useEffect(() => {
    if (secondsLeft === 0 && !reveal) {
      setReveal(true);
    }
  }, [secondsLeft, reveal]);

  // ---------- actions ----------
  async function onStart() {
    if (busy || startIssuedRef.current) return;
    setBusy(true);
    setError(null);
    startIssuedRef.current = true; // latch immediately

    try {
      if (!quizId) throw new Error("Missing quiz ID.");
      if (TID == null) throw new Error("Missing teacher ID (TID).");

      // 0) If already live, skip POST and just render
      const pre = await readById(quizId);
      if (pre?.isLive) {
        showQuestion(pre);
        return;
      }

      // 1) Start (single-shot)
      const res = await fetch(api(`/api/startTest`), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ID: quizId, TID }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        // If server 500s (common when already live), try reading; if live, proceed
        if (res.status >= 500) {
          const fallback = await readWithRetry(quizId, 3);
          if (fallback?.isLive) {
            showQuestion(fallback);
            return;
          }
        }
        throw new Error(`startTest failed (HTTP ${res.status}): ${body}`);
      }

      // 2) Read fresh doc (cover write→read timing)
      const doc = await readWithRetry(quizId, 3);
      if (!doc) throw new Error("Could not read quiz right after start.");
      showQuestion(doc);
    } catch (e: any) {
      setError(e?.message || "Failed to start.");
      // allow retry if it truly failed (not already-live)
      startIssuedRef.current = false;
    } finally {
      setBusy(false);
    }
  }

  async function onNext() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (!quizId || TID == null) return;

      const res = await fetch(api(`/api/nextQuestion`), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ID: quizId, TID }),
      });

      // ---- NEW: branch on gameFinished from the API response
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        // ignore parse issues; we'll fall back to read
      }

      if (!res.ok) {
        const bodyTxt = typeof payload === "object" ? JSON.stringify(payload) : (await res.text().catch(() => ""));
        throw new Error(`nextQuestion failed (HTTP ${res.status}): ${bodyTxt}`);
      }

      if (payload?.gameFinished) {
        // Backend already set isLive=false and reset currentQuestion
        finishAndGo("Test has ended. No more questions.");
        return;
      }

      // If not finished, read latest and show next question
      const doc = await readWithRetry(quizId, 3);
      if (!doc) throw new Error("Could not load next question.");
      showQuestion(doc); // resets timer + reveal
    } catch (e: any) {
      setError(e?.message || "Failed to advance.");
    } finally {
      setBusy(false);
    }
  }

  async function onEnd() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (!quizId || TID == null) return;
      const res = await fetch(api(`/api/endTest`), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ID: quizId, TID }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`endTest failed (HTTP ${res.status}): ${body}`);
      }
      finishAndGo("Test ended by teacher.");
    } catch (e: any) {
      setError(e?.message || "Failed to end.");
    } finally {
      setBusy(false);
      startIssuedRef.current = false;
    }
  }

  // ---------- UI ----------
  const Header = (
    <header style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      {pin ? <span className="muted">Code: {pin}</span> : null}
      {quizId ? <span className="muted">ID: {quizId}</span> : null}
    </header>
  );

  const correctIdx = useMemo(() => getCorrectIndex(currentQ), [currentQ]);

  return (
    <main className="host-page" style={{ padding: 20 }}>
      <section className="host-card" style={{ maxWidth: 900, margin: "0 auto" }}>
        {Header}
        {error ? (
          <p style={{ color: "#c0392b", marginTop: 12, whiteSpace: "pre-wrap" }}>{error}</p>
        ) : (
          <>
            <div style={{ marginTop: 16 }}>
              <div className="timer" style={{ fontSize: 24, fontWeight: 700 }}>{timeString}</div>
              <h3 style={{ margin: "12px 0" }}>{started ? qText || "…" : "Ready to start"}</h3>

              {started && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  {choices.slice(0, 4).map((opt, i) => {
                    const isCorrect = reveal && i === correctIdx;
                    return (
                      <div
                        key={i}
                        className={`host-opt ${isCorrect ? "option--correct" : ""}`}
                        aria-checked={isCorrect ? "true" : "false"}
                        data-correct={isCorrect ? "true" : "false"}
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px 12px",
                          borderRadius: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span aria-hidden>🛡️</span>
                        <span>{opt}</span>
                        {isCorrect && <span className="option-check">✓ Correct</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {total ? (
                <p className="muted" style={{ marginTop: 8 }}>
                  {started ? `Question ${qIndex + 1} of ${total}` : `${total} questions`}
                </p>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              {!started ? (
                <button className="btn" onClick={onStart} disabled={busy}>
                  {busy ? "Starting…" : "Start"}
                </button>
              ) : (
                <>
                  {/* Only allow Next after reveal */}
                  <button className="btn" onClick={onNext} disabled={busy || !reveal}>
                    {busy ? "…" : "Next"}
                  </button>
                  <button className="btn danger" onClick={onEnd} disabled={busy}>
                    End
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
