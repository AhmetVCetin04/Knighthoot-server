import { useLocation, useNavigate } from "react-router-dom";

type WaitingState = {
  quizId: string;
  title: string;
  timeLimit: number;
  pin?: string;
};
function getTIDRobust(stateTid?: number): number | undefined {
  // 1) Use provided stateTid if available
  if (typeof stateTid === "number" && !Number.isNaN(stateTid)) return stateTid;

  // 2) Try common localStorage keys
  for (const k of ["TID", "teacherId", "ID", "id"]) {
    const v = localStorage.getItem(k);
    if (v && !Number.isNaN(Number(v))) return Number(v);
  }

  // 3) Try decoding JWT if you store a token
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const claim = (import.meta as any).env?.VITE_JWT_USERID_CLAIM || "id";
      const val = payload?.[claim] ?? payload?.teacherId ?? payload?.ID;
      if (val !== undefined && !Number.isNaN(Number(val))) return Number(val);
    }
  } catch {
    /* ignore */
  }

  return undefined;
}

function getTeacherIdFromToken(): number | undefined {
  try {
    const token = localStorage.getItem("token");
    if (!token) return undefined;
    const payload = JSON.parse(atob(token.split(".")[1]));
    // env override if your claim name is custom (e.g., "teacherId")
    const claim = import.meta.env.VITE_JWT_USERID_CLAIM || "id";
    const v = payload?.[claim] ?? payload?.teacherId ?? payload?.ID;
    return v !== undefined ? Number(v) : undefined;
  } catch {
    return undefined;
  }
}

export default function WaitingRoom() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const data = (state ?? {}) as Partial<WaitingState>;

  if (!data.quizId) {
    return (
      <main className="waiting-room">
        <div className="kh-center">
          <p>Missing game details. Returning to Start Test…</p>
          <button className="btn btn--gold" onClick={() => navigate("..", { relative: "path" })}>
            Back to Start
          </button>
        </div>
      </main>
    );
  }

  const pin = data.pin ? String(data.pin) : "------";

  return (
    <main className="waiting-room">
      <header className="wr-topbar">
        <div className="wr-title">
          Knighthoot <span className="wr-sub">| {data.title}</span>
        </div>
        <button className="btn btn--ghost" onClick={() => document.documentElement.requestFullscreen?.()}>
          Fullscreen
        </button>
      </header>

      <section className="wr-stage">
        <h2 className="wr-label">Game PIN</h2>
        <div className="wr-pin">
          {pin.split("").map((ch, i) => (
            <span key={i} className="wr-pin__ch">{ch}</span>
          ))}
        </div>

        <p className="wr-hint" style={{ marginTop: 16 }}>
          Ask students to enter this code on their devices.
        </p>

        <div className="wr-actions" style={{ marginTop: 26 }}>
          <button
            className="btn btn--gold"
            onClick={() =>
              navigate("/dashboard/teacher/live", {
                state: {
                  quizId: data.quizId,
                  title: data.title,
                  timeLimit: data.timeLimit,
                  pin: data.pin,
                  TID: getTIDRobust(),
                  autoStart: true,              // ← add this line
                },
              })
            }
          >
            Start Quiz
          </button>
        </div>
      </section>
    </main>
  );
}

