import React, { useMemo, useState } from "react";
import "../styles/MyQuizzes.css";

type Quiz = {
  id: string;
  title: string;
  questions: number;
  createdAt: string; // ISO
};

type Props = {
  quizzes: Quiz[]; // feed from API
  onCreate?: () => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export default function MyQuizzes({
  quizzes,
  onCreate,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: Props) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"new" | "old" | "a" | "z">("new");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = q
      ? quizzes.filter((x) => x.title.toLowerCase().includes(q))
      : quizzes.slice();

    filtered.sort((a, b) => {
      if (sort === "new") return +new Date(b.createdAt) - +new Date(a.createdAt);
      if (sort === "old") return +new Date(a.createdAt) - +new Date(b.createdAt);
      if (sort === "a") return a.title.localeCompare(b.title);
      return b.title.localeCompare(a.title);
    });
    return filtered;
  }, [quizzes, query, sort]);

  const Empty = (
    <div className="qz-empty">
      <div className="qz-empty__icon" aria-hidden />
      <h2>No quizzes yet</h2> 
      <p>Get started by creating your first quiz</p>
      <button className="btn btn-gold" onClick={onCreate}>
        + Create New Quiz 
      </button>
    </div>
  );

  return (
    <main className="qz-wrap">
      {/* 1. Header (Simplified) */}
      <div className="qz-head" style={{ marginBottom: '16px', alignItems: 'flex-start' }}>
        {/* Title and Subtitle Block (Left Side - No button here anymore) */}
        <div>
          <h1 style={{ marginBottom: '4px' }}>My Quizzes</h1>
          <p style={{ fontSize: '16px', color: '#a0a0a0', margin: '0' }}>
            Manage and organize your quizzes
          </p>
        </div>
        {/* The button has been moved into the toolbar below */}
      </div>

      {/* 2. Toolbar (New Two-Row Structure) */}
      <div className="qz-toolbar">
        
        {/* TOP ROW: Search + Create Button */}
        <div className="qz-toolbar__top-row">
          <div className="qz-search">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search quizzes..."
              aria-label="Search quizzes"
            />
          </div>
          {/* ⬅️ CREATE BUTTON MOVED HERE, next to Search */}
          <button className="btn btn-gold qz-create-btn" onClick={onCreate}>
            + Create New Quiz
          </button>
        </div>

        {/* BOTTOM ROW: Sort + View Controls */}
        <div className="qz-toolbar__bottom-row">
          
          {/* SORT BY (Left) */}
          <div className="qz-sort">
            {/* ⬅️ Adding visual icon/picture next to Sort Label */}
            <label style={{ marginRight: '6px' }}>
              Sort by: <span style={{ marginRight: '2px' }}></span>
            </label>
            <select value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="new">Date (Newest First)</option>
              <option value="old">Date (Oldest First)</option>
              <option value="a">Title (A–Z)</option>
              <option value="z">Title (Z–A)</option>
            </select>
          </div>
          
          {/* VIEW CONTROLS (Right - in a box) */}
          <div className="qz-view">
            <span>View:</span>
            {/* ⬅️ New Box Wrapper for Icons */}
            <div className="qz-view__box">
              <button
                className={`icon-btn ${view === "grid" ? "is-active" : ""}`}
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                title="Grid view"
              >
                {/* <IconGrid /> */}▦
              </button>
              <button
                className={`icon-btn ${view === "list" ? "is-active" : ""}`}
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                title="List view"
              >
                {/* <IconList /> */}≣
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {shown.length === 0 ? (
        Empty
      ) : view === "grid" ? (
        <section className="qz-grid">
          {shown.map((q) => (
            <article
              key={q.id}
              className="qz-card hover:opacity-90 cursor-pointer"
              onClick={() => onView?.(q.id)} 
            >
              <header className="qz-card__title">{q.title}</header>
              <div className="qz-card__meta">
                <span>
                  {q.questions} {q.questions === 1 ? "question" : "questions"}
                </span>
                <span>Created {new Date(q.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="qz-card__actions">
                <button
                  className="btn btn-gold btn-sm"
                  onClick={(e) => {
                    e.stopPropagation(); 
                    onEdit?.(q.id);
                  }}
                >
                  Edit
                </button>
                <div className="qz-card__icons">
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate?.(q.id);
                    }}
                    title="Duplicate"
                  >
                    ⧉
                  </button>
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(q.id);
                    }}
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

      ) : (
        <section className="qz-list">
          {shown.map((q) => (
            <div
              key={q.id}
              className="qz-row hover:opacity-90 cursor-pointer"
              onClick={() => onView?.(q.id)} 
            >
              <div className="qz-row__main">
                <div className="qz-row__title">{q.title}</div>
                <div className="qz-row__meta">
                  <span>
                    {q.questions} {q.questions === 1 ? "question" : "questions"}
                  </span>
                  <span>Created {new Date(q.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="qz-row__actions">
                <button
                  className="btn btn-gold btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(q.id);
                  }}
                >
                  Edit
                </button>
                <button
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate?.(q.id);
                  }}
                  title="Duplicate"
                >
                  ⧉
                </button>
                <button
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(q.id);
                  }}
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </section>

      )}
    </main>
  );
}
