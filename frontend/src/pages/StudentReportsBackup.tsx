import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SiteBackground from '../components/SiteBackground';
import "../styles/StudentJoin.css"; // For the shared fixed header styling
import "../styles/StudentReports.css"; // For the grade-book report styling

/** ========= API helpers ========= */

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (window as any).__API_BASE__ ||
  "https://knighthoot.app";

// Helper to construct the API URL path
const api = (p: string) => (p.startsWith("/") ? p : `/${p}`);

// Helper to get authorization headers from local/session storage
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

/** ========= SID + cache helpers ========= */

// Decodes the JWT payload to find user claims
function decodeJwtPayload(): any | null {
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
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Attempts to find the Student ID (SID) from storage or JWT payload
function guessSID(): string | null {
  const direct = localStorage.getItem("sid") || sessionStorage.getItem("sid");
  if (direct && direct !== "null" && direct !== "undefined" && String(direct).trim() !== "") {
    return String(direct).trim();
  }
  const env = (import.meta as any).env?.VITE_SID || (window as any).__SID__;
  if (env && String(env).trim() !== "") return String(env).trim();
  const p = decodeJwtPayload();
  if (!p) return null;
  const candidates = [
    p.sid, p.SID, p.studentId, p.studentID,
    p.userId, p.userID, p.uid, p.id, p._id,
    p.student?.id, p.student?._id, p.student?.SID,
    p.sub,
  ].filter((x) => x != null && String(x).trim() !== "");
  return candidates.length ? String(candidates[0]).trim() : null;
}

// Generates the key used for local storage cache
function scoresCacheKey(sid: string | number | null) {
  return `scores-cache:v1:${sid ?? "anon"}`;
}

// Reads all local score records, checking multiple possible SID variants
function readLocalScoresCacheAllVariants(): any[] {
  try {
    const raw = (localStorage.getItem("sid") || sessionStorage.getItem("sid") || "").trim();
    const variants: (string | number | null)[] = [raw || null];
    const n = Number(raw);
    if (Number.isFinite(n)) variants.push(n);
    const merged: any[] = [];
    for (const v of variants) {
      const key = scoresCacheKey(v);
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(arr)) merged.push(...arr);
    }
    return merged;
  } catch {
    return [];
  }
}

// Converts a MongoDB ObjectId string prefix to a Date object
function objectIdToDate(id?: string) {
  if (!id || typeof id !== "string" || id.length < 8) return null;
  try {
    return new Date(parseInt(id.substring(0, 8), 16) * 1000);
  } catch {
    return null;
  }
}

// Formats a Date object into a readable local string
function formatDate(d?: Date | null) {
  return d ? d.toLocaleString() : "—";
}

/** ========= Types ========= */

// Standardized type for a single question submission/score record
type ScoreDoc = {
  _id?: string;
  SID?: string | number;
  testID: string;
  qIndex?: number | null;
  isCorrect: boolean;
  pickedIndex?: number | null;
  correctIndex?: number | null;
  pickedText?: string | null;
  correctText?: string | null;
  createdAt?: string | Date | null;
};

// Type for a grouped set of scores (one entry per quiz attempt)
type GroupRow = {
  testID: string;
  total: number;
  correct: number;
  latest: Date | null;
  rows: ScoreDoc[];
};

// Type for test metadata fetched from the backend
type TestMeta = {
  ID?: string;
  _id?: string;
  title?: string;
  name?: string;
  PIN?: string;
  TID?: number;
  [k: string]: any;
};

/** ========= Shared Header Component ========= */

// Fixed header matching the one in EnterAccessCode.tsx
function StudentHeader({ navigate }: { navigate: any }) {
    return (
        <header className="student-live-header">
            <div className="student-live-header__left">
                <button className="back-btn" onClick={() => navigate("/dashboard/student")}> 
                    &larr; Back to Dashboard 
                </button>
            </div>
            <div className="student-live-header__right">
                <span className="student-live-header__brand">Knighthoot</span>
            </div>
        </header>
    );
}

/** ========= Main Component ========= */
export default function StudentReports() {
  const navigate = useNavigate(); 
  const location = useLocation();

  // --- State for Student ID (SID) and UI ---
  const [sidOverride, setSidOverride] = useState<string | null>(null);
  const [tempSid, setTempSid] = useState<string>("");
  const sid = (sidOverride ?? guessSID()) || null;

  // State for data and loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<ScoreDoc[]>([]);
  const [testsMeta, setTestsMeta] = useState<Record<string, TestMeta>>({});
  
  // Removed: State for Teacher Names (teachersMap) and Filtering/Sorting (searchQuery, filterSort)

  // --- Effect to manage SID in local storage ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sidParam = (params.get("sid") || "").trim();
    if (sidParam) {
      localStorage.setItem("sid", sidParam);
      setSidOverride(sidParam);
    } 
    // Ensures derived SID is also persisted for consistency
    else if (sid) { 
      const currentStoredSid = localStorage.getItem("sid");
      if (currentStoredSid !== sid) {
        localStorage.setItem("sid", sid);
      }
    }
    
  }, [location.search, sid]); 

  // --- Effect to fetch scores from server and local cache ---
  useEffect(() => {
    // Logic to fetch and merge scores from API and local cache
    (async () => {
      if (sid == null) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const urls = [
          api(`/api/scores/student/${encodeURIComponent(sid)}`),
          api(`/api/score/student/${encodeURIComponent(sid)}`),
        ];

        let rawArray: any[] = [];
        let lastErr = "";

        // 1) SERVER: Fetch server scores
        for (const u of urls) {
          const r = await fetch(u, { headers: getAuthHeaders(), cache: "no-store" });
          if (r.ok) {
            const raw = await r.json().catch(() => null);
            rawArray = Array.isArray(raw) ? raw : raw?.data ?? raw?.scores ?? [];
            break;
          } else {
            const t = await r.text().catch(() => "");
            lastErr = `${u} -> (${r.status}) ${t}`;
          }
        }

        // Normalize server aggregates into per-question records for uniform processing
        const serverNorm: ScoreDoc[] = rawArray.map((s: any) => {
          const testIDCandidate =
            s.testID ?? s.testId ?? s.test_id ?? s.test ?? s.TestID ?? s.TestId ?? s.ID ?? s.id ?? "unknown";
          const created =
            s.createdAt ?? s.timestamp ?? (typeof s._id === "string" ? objectIdToDate(s._id)?.toISOString() : null);
          const correct = Number(s.correct || 0);
          const incorrect = Number(s.incorrect || 0);
          const exploded: ScoreDoc[] = [];
          for (let i = 0; i < correct; i++) {
            exploded.push({
              _id: s._id, SID: s.SID ?? s.sid ?? s.studentId ?? s.studentID,
              testID: String(testIDCandidate), qIndex: null, isCorrect: true, createdAt: created,
              pickedIndex: null, correctIndex: null, pickedText: null, correctText: null,
            });
          }
          for (let i = 0; i < incorrect; i++) {
            exploded.push({
              _id: s._id, SID: s.SID ?? s.sid ?? s.studentId ?? s.studentID,
              testID: String(testIDCandidate), qIndex: null, isCorrect: false, createdAt: created,
              pickedIndex: null, correctIndex: null, pickedText: null, correctText: null,
            });
          }
          return exploded;
        }).flat();

        // 2) LOCAL: read local cache (per-question + summary)
        const local = readLocalScoresCacheAllVariants();
        const localNorm: ScoreDoc[] = [];
        for (const doc of local) {
          const testIDCandidate =
            doc.testID ?? doc.testId ?? doc.ID ?? doc.id ?? doc.code ?? "unknown";
          const base = {
            _id: doc._id,
            SID: doc.SID ?? doc.sid ?? doc.studentId ?? doc.studentID,
            testID: String(testIDCandidate),
            createdAt: doc.createdAt ?? new Date().toISOString(),
          };
          if (doc.kind === "per-question") {
            localNorm.push({
              ...base,
              qIndex: doc.qIndex ?? null,
              isCorrect: !!doc.isCorrect,
              pickedIndex: doc.pickedIndex ?? null,
              correctIndex: doc.correctIndex ?? null,
              pickedText: doc.pickedText ?? null,
              correctText: doc.correctText ?? null,
            });
          } else if (doc.kind === "summary") {
            const arr = Array.isArray(doc.answers) ? doc.answers : [];
            if (arr.length) {
              for (const a of arr) {
                localNorm.push({
                  ...base,
                  qIndex: a.qIndex ?? null,
                  isCorrect: !!a.wasCorrect,
                  pickedIndex: a.pickedIndex ?? null,
                  correctIndex: a.correctIndex ?? null,
                  pickedText: null, correctText: null
                });
              }
            } else {
              // placeholder row to make the test appear
              localNorm.push({ ...base, qIndex: null, isCorrect: false, pickedIndex: null, correctIndex: null, pickedText: null, correctText: null });
            }
          }
        }

        // Merge server and local, prioritizing local cache if a question/date matches
        function rowKey(r: ScoreDoc) {
          return [r.testID, r.qIndex ?? "-", r.createdAt ?? "-"].join("|");
        }
        const mergedMap = new Map<string, ScoreDoc>();
        for (const r of [...localNorm, ...serverNorm]) mergedMap.set(rowKey(r), r);
        const merged = Array.from(mergedMap.values());

        if (!Array.isArray(rawArray)) {
          console.warn("Scores payload not array. Debug:", lastErr);
        }

        setScores(merged);
      } catch (e: any) {
        setError(e?.message || "Failed to fetch scores.");
      } finally {
        setLoading(false);
      }
    })();
  }, [sid]);

  // --- Memo: Group scores by test attempt (testID + date) ---
  const grouped: GroupRow[] = useMemo(() => {
    const byAttempt: Record<string, GroupRow> = {};
    for (const row of scores) {
      const key = row.testID || (row as any).testId || (row as any).ID || "unknown";
      
      const dateObj =
        row.createdAt instanceof Date
          ? row.createdAt
          : row.createdAt
          ? new Date(row.createdAt)
          : objectIdToDate(row._id);

      // Create a unique key based on Test ID and the date/minute of the attempt
      const dateKey = dateObj ? formatDate(dateObj).substring(0, 19) : 'unknown'; 
      const compositeKey = `${key}|${dateKey}`; 

      if (!byAttempt[compositeKey]) {
        byAttempt[compositeKey] = { 
            testID: key, 
            total: 0, 
            correct: 0, 
            latest: dateObj, 
            rows: [] 
        };
      }
      
      byAttempt[compositeKey].total += 1;
      if (row.isCorrect) byAttempt[compositeKey].correct += 1;

      if (dateObj && (!byAttempt[compositeKey].latest || dateObj > byAttempt[compositeKey].latest)) {
        byAttempt[compositeKey].latest = dateObj;
      }
      
      byAttempt[compositeKey].rows.push(row);
    }

    // Sort by latest attempt time descending
    return Object.values(byAttempt).sort(
      (a, b) => (b.latest?.getTime() ?? 0) - (a.latest?.getTime() ?? 0)
    );
  }, [scores]);

  // --- Effect to fetch test metadata for display titles and PINs ---
  useEffect(() => {
    (async () => {
      const need = grouped.map((g) => g.testID).filter((tid) => tid && !testsMeta[tid]);
      if (need.length === 0) return;

      const copy: Record<string, TestMeta> = { ...testsMeta };
      for (const tid of need) {
        const routes = [
          api(`/api/test/${encodeURIComponent(tid)}`),
          api(`/api/tests/${encodeURIComponent(tid)}`),
          api(`/api/test?id=${encodeURIComponent(tid)}`),
        ];
        let meta: any = null;
        for (const url of routes) {
          try {
            const r = await fetch(url, { headers: getAuthHeaders(), cache: "no-store" });
            if (r.ok) { meta = await r.json(); break; }
          } catch {}
        }
        copy[tid] = meta ? meta : { ID: tid, title: tid };
      }
      setTestsMeta(copy);
    })();
  }, [grouped]); 

  // --- Memo: Calculate overall statistics ---
  const totalAttempts = grouped.length;
  const totalQuestionsAllTime = grouped.reduce((sum, g) => sum + g.total, 0);
  const totalCorrectAllTime = grouped.reduce((sum, g) => sum + g.correct, 0);
  const averageScore = totalQuestionsAllTime > 0 
    ? ((totalCorrectAllTime / totalQuestionsAllTime) * 100).toFixed(1)
    : "—";

  // Note: filteredGrouped logic removed, using 'grouped' directly for rendering


  /** ========= Render Content (Loading, Error, Empty, or Data) ========= */
  
  const renderContent = () => {
    if (loading) {
      return <p style={{ color: '#fff' }}>Loading your results…</p>;
    }

    if (error) {
      return (
        <div style={{ background: "#3a0d0d", color: "#ffd9d9", padding: "12px 16px", borderRadius: 8, maxWidth: 720, marginTop: 16 }}>
            <b>Couldn’t load scores</b>
            <div style={{ opacity: 0.9, marginTop: 6 }}>{String(error)}</div>
        </div>
      );
    }

    if (grouped.length === 0) {
      return (
        <div style={{ background: "#2a2a2d", color: "#ddd", padding: "14px 16px", borderRadius: 8, maxWidth: 600, marginTop: 16 }}>
          No scores yet. Once you finish a test, it will appear here with your result.
        </div>
      );
    }

    /* --- Data View --- */
    return (
        <>
            <h2 style={{ fontSize: 28, margin: 0, fontWeight: 700 }}>Quiz Reports</h2>
            
            {/* User and Stats */}
            <div style={{ marginBottom: 20, marginTop: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 500, color: "#e9e9ec" }}>John Smith</div> 
                <div className="reports-stats-section" style={{ marginTop: 16 }}>
                    <div className="reports-stat-item">
                        Total Tests Taken
                        <div className="reports-stat-value">{totalAttempts}</div>
                    </div>
                    <div className="reports-stat-item">
                        Average Score
                        <div className="reports-stat-value reports-stat-value--average">{averageScore}%</div>
                    </div>
                    
                    {/* Join Quiz CTA Button */}
                    <button 
                      className="reports-cta-button"
                      onClick={() => navigate("/dashboard/student/start")} // Directs to EnterAccessCode
                    >
                        Join New Quiz
                    </button>
                </div>
            </div>
            
            {/* Quiz List */}
            <div className="quiz-report-card-list">
                {grouped.map((g, index) => { 
                    const meta = testsMeta[g.testID];
                    const title = meta?.title || meta?.name || g.testID || "Untitled Test"; 
                    const scorePct = g.total > 0 ? Math.round((100 * g.correct) / Math.max(1, g.total)) : 0;
                    const scoreDisplay = `${g.correct}/${g.total}`;
                    
                    const scoreColor = scorePct >= 80 ? "#9be28a" : scorePct >= 60 ? "#d5ac16" : "#ffb3b3";
                    
                    // Extract the unique date key used for grouping the specific attempt
                    const latestDateKey = g.latest ? formatDate(g.latest).substring(0, 19) : 'unknown';

                    return (
                        <div
                            key={g.testID + formatDate(g.latest) + index} 
                            className="quiz-report-card"
                            onClick={() => navigate("/dashboard/student/report-details", { 
                                state: { 
                                    testID: g.testID, 
                                    latestDateKey: latestDateKey, // Pass the unique attempt key
                                    title: title, 
                                    total: g.total,
                                    score: g.correct
                                }
                            })}
                        >
                            <div className="quiz-report-card-title-area">
                                <div className="quiz-report-title">{title}</div>
                                <div className="quiz-report-meta-line">
                                    <span>{formatDate(g.latest)}</span> 
                                </div>
                            </div>
                            <div className="quiz-report-score-box">
                                <div className="quiz-report-score-fraction" style={{ color: scoreColor }}>
                                    {scoreDisplay}
                                </div>
                                <div className="quiz-report-score-percent" style={{ color: scoreColor }}>
                                    {scorePct}%
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
  };
  
  // Final Render (including the fixed header and content area)
  return (
    <div className="reports-page-container">
      <SiteBackground />
      {/* Back to Dashboard / Knighthoot Header */}
      <StudentHeader navigate={navigate} />
      <div className="reports-content-area">
          {renderContent()}
      </div>
    </div>
  );
}