import React, { useMemo, useState } from "react";
import "../styles/CreateQuiz.css";
import picture from "../assets/picture.png";

function getTokenFromStorage(): string | null {
  // try user_data first (since you already use it for TID)
  try {
    const raw = localStorage.getItem("user_data");
    if (raw) {
      const u = JSON.parse(raw);
      return u.token || u.jwt || u.accessToken || u.authToken || null;
    }
  } catch {}
  // fallbacks (in case login stored token separately)
  return (
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    null
  );
}

function buildAuthHeaders(init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  const token = getTokenFromStorage();
  if (token) {
    // cover common backends without changing server code
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("x-auth-token", token);
    headers.set("x-access-token", token);
  }
  return headers;
}

async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const headers = buildAuthHeaders(init);
  return fetch(input, { ...init, headers, credentials: "include" });
}


type Option = { text?: string; imageUrl?: string };
type Question = { question?: string; imageUrl?: string; options: Option[]; answer: number };

export default function CreateQuizPage() {
  const [testId, setTestId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", imageUrl: "", options: [{ text: "" }, { text: "" }], answer: 0 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const teacherId = useMemo(() => {
    const raw = localStorage.getItem("user_data");
    try { return raw ? JSON.parse(raw).id ?? JSON.parse(raw).TID ?? 0 : 0; } catch { return 0; }
  }, []);

  /* ---------- helpers ---------- */

  // common: read file -> dataURL -> set into state (so backend can store it;
  // you can later swap to uploading to S3 and storing a URL instead)
  async function fileToDataUrl(file: File): Promise<string> {
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  function setQuestionField(qIdx: number, field: "question"|"imageUrl", value: string) {
    setQuestions(prev => prev.map((q,i) => {
      if (i !== qIdx) return q;
      if (field === "question" && value) return { ...q, question: value, imageUrl: "" };
      if (field === "imageUrl" && value) return { ...q, imageUrl: value, question: "" };
      return { ...q, [field]: value };
    }));
  }

  async function setQuestionImageFromFile(qIdx: number, file: File | null) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setQuestionField(qIdx, "imageUrl", dataUrl);     // sets image and clears text
  }

  function setOptionField(qIdx:number,oIdx:number,field:"text"|"imageUrl",value:string){
    setQuestions(prev => prev.map((q,i)=>{
      if(i!==qIdx) return q;
      const options = q.options.map((opt,j)=>{
        if(j!==oIdx) return opt;
        if(field==="text" && value) return { text:value, imageUrl:"" };
        if(field==="imageUrl" && value) return { imageUrl:value, text:"" };
        return { ...opt, [field]: value };
      });
      return { ...q, options };
    }));
  }

  async function setOptionImageFromFile(qIdx: number, oIdx: number, file: File | null) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setOptionField(qIdx, oIdx, "imageUrl", dataUrl); // sets image and clears text
  }

  function setAnswer(qIdx: number, aIdx: number) {
    setQuestions(prev => prev.map((q,i) => i === qIdx ? { ...q, answer: aIdx } : q));
  }

  function toggleOptionCount(qIdx: number, count: 2|4) {
    setQuestions(prev => prev.map((q,i) => {
      if (i !== qIdx) return q;
      let next = q.options.slice(0, count);
      while (next.length < count) next.push({ text: "" });
      const nextAnswer = Math.min(q.answer ?? 0, count - 1);
      return { ...q, options: next, answer: nextAnswer };
    }));
  }

  function addQuestion() {
    setQuestions(prev => [...prev, { question: "", imageUrl: "", options: [{ text: "" }, { text: "" }], answer: 0 }]);
  }

  function removeQuestion(idx: number) {
    setQuestions(prev => prev.length > 1 ? prev.filter((_,i) => i !== idx) : prev);
  }

  function validate(): string | null {
    if (!testId.trim()) return "Please enter a Quiz/Test ID.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const hasQ = (q.question?.trim() ?? "") !== "" || (q.imageUrl?.trim() ?? "") !== "";
      if (!hasQ) return `Question ${i+1}: enter text or choose an image.`;
      if (q.question && q.imageUrl) return `Question ${i+1}: choose text OR image (not both).`;
      if (!q.options || q.options.length < 2) return `Question ${i+1}: must have 2 or 4 options.`;
      for (let j = 0; j < q.options.length; j++) {
        const o = q.options[j];
        const hasO = (o.text?.trim() ?? "") !== "" || (o.imageUrl?.trim() ?? "") !== "";
        if (!hasO) return `Question ${i+1}, option ${j+1}: enter text or choose an image.`;
        if (o.text && o.imageUrl) return `Question ${i+1}, option ${j+1}: choose text OR image (not both).`;
      }
      if (q.answer == null || q.answer < 0 || q.answer >= q.options.length)
        return `Question ${i+1}: pick a correct option.`;
    }
    return null;
  }


  async function saveQuiz() {
    const err = validate();
    if (err) { setMessage(err); return; }

    const payload = {
      TID: Number(teacherId) || 0,
      ID: testId.trim(),
      questions: questions.map(q => ({
        question: q.question?.trim() || undefined,
        imageUrl: q.imageUrl?.trim() || undefined,   // dataURL if chosen via file
        options: q.options.map(o => ({
          text: o.text?.trim() || undefined,
          imageUrl: o.imageUrl?.trim() || undefined, // dataURL if chosen via file
        })),
        answer: q.answer
      }))
    };

    try {
      setSubmitting(true);
      setMessage("");
      const res = await authFetch("http://174.138.73.101:5173/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || "Failed to create quiz.");
        return;
      }
      setMessage(data?.message || "Quiz created successfully.");
    } catch {
      setMessage("Network error creating quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="cq__wrap">
        <h1 className="cq__title">Create New Quiz</h1>
        <p className="cq__subtitle">Design your quiz with multiple choice questions</p>

        {/* Quiz title card */}
        <div className="cq__card">
        <label className="cq__label">Quiz Title</label>
        <input
            className="cq__input"
            placeholder="Enter quiz title..."
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
        />
        </div>

        {/* Questions */}
        {questions.map((q, qIdx) => (
        <div key={qIdx} className="cq__card">
            <div className="cq__cardHead">
            <h3>Question {qIdx + 1}</h3>
            <button
                type="button"
                className="cq__trash"
                title="Remove question"
                onClick={() => removeQuestion(qIdx)}
            >
                🗑
            </button>
            </div>

            {/* Question text / image */}
            <label className="cq__label">Question Text</label>
            <input
            className="cq__input"
            placeholder="Enter your question..."
            value={q.question ?? ""}
            onChange={(e) => setQuestionField(qIdx, "question", e.target.value)}
            />

            <label className="cq__label">Question Image (Optional)</label>
            <input
              className="cq__input"
              placeholder="Paste image URL here..."
              value={q.imageUrl ?? ""}
              onChange={(e) => setQuestionField(qIdx, "imageUrl", e.target.value)}
            />

            <div className="cq__orRow">
              <span className="cq__orLine" />
              <span className="cq__orText">or</span>
              <span className="cq__orLine" />
            </div>

            <label className="cq__fileBtn">
              <img src={picture} alt="" />
              <span>Choose from files</span>
              <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setQuestionImageFromFile(qIdx, e.target.files?.[0] || null)}
              />
            </label>

            {/* Options count */}
            <div className="cq__label block">Number of Answer Options</div>
            <div className="cq__row">
              <button
                type="button"
                className={`cq__pill ${q.options.length === 2 ? "is-active" : ""}`}
                onClick={() => toggleOptionCount(qIdx, 2)}
              >
                2 Options
              </button>
              <button
                type="button"
                className={`cq__pill ${q.options.length === 4 ? "is-active" : ""}`}
                onClick={() => toggleOptionCount(qIdx, 4)}
              >
                4 Options
              </button>
            </div>


            {/* Options list */}
            <div className="cq__label block">Answer Options</div>
            <div className="cq__options">
            {q.options.map((o, oIdx) => (
                <div className="cq__optionRow">
                  <input
                    type="radio"
                    name={`ans-${qIdx}`}
                    checked={q.answer === oIdx}
                    onChange={() => setAnswer(qIdx, oIdx)}
                  />
                  <input
                    className="cq__input opt"
                    placeholder={`Option ${oIdx + 1} text…`}
                    value={o.text ?? ""}
                    onChange={(e) => setOptionField(qIdx, oIdx, "text", e.target.value)}
                  />
                  <input
                    className="cq__input opt"
                    placeholder="Image URL (optional)…"
                    value={o.imageUrl ?? ""}
                    onChange={(e) => setOptionField(qIdx, oIdx, "imageUrl", e.target.value)}
                  />
                  <label className="cq__fileBtn cq__fileBtn--small">
                    <img src={picture} alt="" />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => setOptionImageFromFile(qIdx, oIdx, e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

              ))}
            </div>

            <p className="cq__hint">
            Click the radio next to the correct answer • Provide <b>text OR image</b> for each field
            </p>
        </div>
        ))}

        {/* Add question */}
        <div className="cq__footerRow">
        <button type="button" className="cq__addBtn" onClick={addQuestion}>
            + Add Question
        </button>
        </div>

        {/* Message */}
        {message && <div className="cq__msg">{message}</div>}

        {/* Actions */}
        <div className="cq__actions">
        <button type="button" className="cq__btnGhost" disabled={submitting}>
            Cancel
        </button>
        <button
            type="button"
            className="cq__btnPrimary"
            disabled={submitting}
            onClick={saveQuiz}
        >
            {submitting ? "Saving…" : "Save Quiz"}
        </button>
        </div>
    </div>
    );
}
