import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MyQuizzes.css";
import MyQuizzes from "../components/MyQuizzes";

type Quiz = { id: string; title: string; questions: number; createdAt: string };
type ApiTest = Record<string, any>;

// --- Helper: Auth headers ---
function getAuthHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
          "x-access-token": token,
        }
      : {}),
  };
}

// --- Helper: Numeric TID (matches backend) ---
function getTeacherId(): string {
  const stored =
    localStorage.getItem("TID") ||
    localStorage.getItem("teacherId") ||
    localStorage.getItem("userId");
  if (stored && !isNaN(Number(stored))) return stored;
  return "1";
}

// --- Map backend tests into frontend quizzes ---
function mapTests(raw: ApiTest[]): Quiz[] {
  return (raw || []).map((t) => {
    const id = String(t.ID ?? t._id ?? crypto.randomUUID());

    // Clean display name: remove timestamp and format nicely
    const rawTitle = String(t.ID ?? "Untitled Quiz");
    const cleanTitle = rawTitle
      .replace(/[-_][0-9]{10,20}$/, "") // remove trailing timestamp
      .replace(/[-_]+$/, "") // remove trailing dashes
      .replace(/[-_]+/g, " ") // replace dashes with spaces
      .replace(/\b\w/g, (c) => c.toUpperCase()) // capitalize each word
      .trim();

    const qArr =
      Array.isArray(t.questions) ? t.questions :
      Array.isArray(t.Questions) ? t.Questions : [];
    const qCount =
      Number.isFinite(t.questionCount) ? Number(t.questionCount) : qArr.length;

    const created =
      t.createdAt || t.created_at || t.date || new Date().toISOString();

    return {
      id,
      title: cleanTitle,
      questions: qCount,
      createdAt: new Date(created).toISOString(),
    };
  });
}

export default function MyQuizzesPage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<{ used?: string; count?: number; sample?: any }>({});

  // --- Load quizzes ---
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      try {
        const tid = getTeacherId();
        const isNumeric = !isNaN(Number(tid));
        const url = isNumeric
          ? `/api/test?TID=${encodeURIComponent(tid)}`
          : `/api/test?search=.`; // fallback safe regex

        const res = await fetch(url, { method: "GET", headers: getAuthHeaders() });
        const text = await res.text();
        let json: any = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {}

        if (!res.ok) {
          const detail =
            (json && (json.message || json.error)) ||
            text ||
            `${res.status} ${res.statusText}`;
          throw new Error(detail);
        }

        const arr: ApiTest[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.items)
          ? json.items
          : json
          ? [json]
          : [];

        const mapped = mapTests(arr);
        setQuizzes(mapped);
        setDebug({ used: url, count: mapped.length, sample: arr[0] || null });
      } catch (e: any) {
        setError(e?.message || "Error fetching quizzes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Render states ---
  if (loading) return <p style={{ padding: 16 }}>Loading quizzes…</p>;
  if (error)
    return (
      <div style={{ padding: 16, color: "crimson", whiteSpace: "pre-wrap" }}>
        {error}
      </div>
    );

  // --- Main UI ---
  return (
    <>
      {/* Debug info */}
      <div
        style={{
          padding: 10,
          margin: "8px 16px",
          background: "#f6f6f6",
          borderRadius: 8,
          fontSize: 12,
        }}
      >
        <div>
          <b>Endpoint:</b> <code>{debug.used}</code>
        </div>
        <div>
          <b>Items:</b> {debug.count ?? 0}
        </div>
        {debug.sample && (
          <details style={{ marginTop: 4 }}>
            <summary>Show first raw item keys</summary>
            <code style={{ display: "block", whiteSpace: "pre-wrap" }}>
              {JSON.stringify(Object.keys(debug.sample), null, 2)}
            </code>
          </details>
        )}
      </div>

      <MyQuizzes
        quizzes={quizzes}
        onCreate={() => navigate("/dashboard/teacher/create-quiz")}
        // --- View Quiz ---
        onView={(id) => navigate(`/dashboard/teacher/quiz/${id}`)} 
        // --- Edit Quiz ---
        onEdit={(id) => navigate(`/dashboard/teacher/edit/${id}`)}
        // --- Duplicate Quiz ---
        onDuplicate={async (originalId) => {
          try {
            const baseName = prompt(
              "Enter a name for the duplicated test:",
              `${originalId}-copy`
            );
            if (!baseName) return;

            const newTestID = `${baseName}-${Date.now()}`;
            const newPIN = Math.floor(1000 + Math.random() * 9000).toString();

            const res = await fetch("/api/test/duplicate", {
              method: "POST",
              headers: getAuthHeaders(),
              body: JSON.stringify({
                TID: 1,
                originalTestID: originalId,
                newTestID,
                newPIN,
              }),
            });

            const text = await res.text();
            let json: any = null;
            try {
              json = text ? JSON.parse(text) : null;
            } catch {}

            if (!res.ok) {
              const msg =
                (json && (json.error || json.message)) ||
                text ||
                `Failed (${res.status})`;
              alert(msg);
              return;
            }

            alert(json?.message || "Test duplicated successfully!");

            // Update UI
            if (json?.test) {
              setQuizzes((prev) => [
                ...prev,
                {
                  id: json.test.ID,
                  title: json.test.ID
                    .replace(/[-_][0-9]{10,20}$/, "")
                    .replace(/[-_]+/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase()),
                  questions: json.test.questions?.length ?? 0,
                  createdAt: new Date().toISOString(),
                },
              ]);
            }
          } catch (e: any) {
            alert(e?.message || "Error duplicating test");
          }
        }}
        // --- Delete Quiz ---
        onDelete={async (id) => {
          if (!window.confirm("Are you sure you want to delete this test?")) return;

          try {
            const res = await fetch(`/api/test/${encodeURIComponent(id)}`, {
              method: "DELETE",
              headers: getAuthHeaders(),
              body: JSON.stringify({ TID: 1 }),
            });

            const text = await res.text();
            let json: any = null;
            try {
              json = text ? JSON.parse(text) : null;
            } catch {}

            if (!res.ok) {
              const msg =
                (json && (json.error || json.message)) ||
                text ||
                `Failed to delete (${res.status})`;
              alert(msg);
              return;
            }

            alert(json?.message || "Test deleted successfully!");
            setQuizzes((prev) => prev.filter((q) => q.id !== id));
          } catch (e: any) {
            alert(e?.message || "Error deleting test");
          }
        }}
      />
    </>
  );
}
