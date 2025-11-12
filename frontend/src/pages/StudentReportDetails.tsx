// File: src/pages/StudentReportDetailsPage.tsx

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SiteBackground from '../components/SiteBackground';
import "../styles/StudentJoin.css"; 
import "../styles/StudentReportDetails.css"; 

// --- Re-use necessary helpers ---

function guessSID(): string | null {
  const sid = localStorage.getItem("sid") || sessionStorage.getItem("sid");
  return sid && sid !== "null" ? sid : null;
}
function scoresCacheKey(sid: string | number | null) {
  return `scores-cache:v1:${sid ?? "anon"}`;
}
function formatDate(d?: Date | null) {
  return d ? d.toLocaleString() : "—";
}

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

// --- Types ---
type AnswerRecord = {
  qIndex: number;
  question: string;
  choices: string[];
  selected: number | null;
  correct: number | null;
  wasCorrect: boolean | null;
  testID: string;
  createdAt: string; 
};

type LocationState = {
    testID: string;
    latestDateKey: string; 
    title: string;
    total: number;
    score: number;
};

// --- Shared Header Component ---
function StudentHeader({ navigate }: { navigate: any }) {
    return (
        <header className="student-live-header">
            <div className="student-live-header__left">
                <button className="back-btn" onClick={() => navigate("/student/reports")}> 
                    &larr; Back to Reports
                </button>
            </div>
            <div className="student-live-header__right">
                <span className="student-live-header__brand">Knighthoot</span>
            </div>
        </header>
    );
}

// --- Component ---
export default function StudentReportDetailsPage() {
    const navigate = useNavigate();
    const loc = useLocation();
    const state = (loc.state || {}) as LocationState;

    const [error, setError] = useState<string | null>(null);
    const [answers, setAnswers] = useState<AnswerRecord[]>([]);

    const total = state.total ?? 0;
    const score = state.score ?? 0;
    const incorrect = total - score;
    const unanswered = answers.filter(a => a.selected == null).length;
    const percent = total > 0 ? ((score / total) * 100).toFixed(1) : "—";

    useEffect(() => {
        if (!state.testID || !state.latestDateKey) {
            return setError("Missing quiz context. Please access the report from the list.");
        }

        const sid = guessSID();
        if (!sid) {
            return setError("Could not find Student ID. Please log in again.");
        }

        try {
            const localScores = readLocalScoresCacheAllVariants();
            
            const attemptSpecificAnswers: AnswerRecord[] = [];
            
            for (const doc of localScores) {
                const testID = doc.testID ?? doc.code ?? 'unknown';
                const dateObj = doc.createdAt ? new Date(doc.createdAt) : null;
                const dateKey = dateObj ? formatDate(dateObj).substring(0, 19) : 'unknown';
                const compositeKey = `${testID}|${dateKey}`;
                
                // Filter for the specific attempt and ensure it's a per-question record
                if (compositeKey === `${state.testID}|${state.latestDateKey}` && doc.kind === 'per-question') {
                    attemptSpecificAnswers.push({
                        qIndex: doc.qIndex,
                        question: doc.question || 'Question text unavailable', // Use available text
                        choices: doc.options || doc.choices || [], // Use available choices
                        selected: doc.pickedIndex,
                        correct: doc.correctIndex,
                        wasCorrect: doc.isCorrect,
                        testID: doc.testID,
                        createdAt: doc.createdAt,
                    });
                }
            }

            if (attemptSpecificAnswers.length === 0) {
                setError("Detailed answers for this attempt could not be found in local storage.");
            } else {
                attemptSpecificAnswers.sort((a, b) => (a.qIndex ?? 0) - (b.qIndex ?? 0));
                setAnswers(attemptSpecificAnswers);
            }

        } catch (e: any) {
            setError(e?.message || "Error reading local results cache.");
        }
    }, [state.testID, state.latestDateKey]);

    if (error) {
        return (
            <div className="reports-detail-page" style={{ background: '#0a0a0a', color: '#fff' }}>
                <StudentHeader navigate={navigate} />
                <div style={{ marginTop: '100px', padding: '20px', background: '#3a0d0d', borderRadius: '8px' }}>
                    <h2 style={{ color: '#ffb3b3' }}>Error Loading Details</h2>
                    <p>{error}</p>
                    <button className="back-btn" onClick={() => navigate("/student/reports")} style={{ color: '#000', marginTop: '15px' }}>
                        Back to Reports
                    </button>
                </div>
            </div>
        );
    }
    
    if (answers.length === 0 && !error) {
        return (
            <div className="reports-detail-page" style={{ background: '#0a0a0a', color: '#fff' }}>
                <StudentHeader navigate={navigate} />
                <div style={{ marginTop: '100px', color: '#fff' }}>Loading detailed results...</div>
            </div>
        );
    }


    return (
        <div className="reports-detail-page" style={{ background: '#0a0a0a', color: '#fff', alignItems: 'flex-start', padding: '0' }}>
            <SiteBackground />
            <StudentHeader navigate={navigate} />
            
            <div style={{ width: '100%', maxWidth: '800px', margin: '77px auto 0', padding: '24px' }}>
                
                {/* Main Summary Card */}
                <section style={{ 
                    background: '#232323', 
                    borderRadius: '12px', 
                    padding: '24px', 
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                }}>
                    <h2 style={{ margin: '0 0 8px', fontSize: '2rem', color: '#e9e9ec' }}>{state.title || "Quiz Report"}</h2>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: '#9be28a' }}>{percent}%</div>
                    
                    <div style={{ margin: '12px 0', fontSize: '1.2rem', color: '#aaa' }}>
                        {score} out of {total} correct
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ color: '#9be28a', fontWeight: 700, fontSize: '1.5rem' }}>{score}</span>
                            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Correct</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.5rem' }}>{incorrect}</span>
                            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Incorrect</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ color: '#aaa', fontWeight: 700, fontSize: '1.5rem' }}>{unanswered}</span>
                            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Unanswered</span>
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#bbb' }}>
                        Student: John Smith • Taken: {formatDate(new Date(state.latestDateKey))}
                    </div>

                </section>
                
                {/* Question Review */}
                <h3 style={{ marginTop: '30px', color: '#e9e9ec', fontSize: '1.5rem' }}>Question Review</h3>
                
                <ul className="results-list" style={{ paddingBottom: '30px' }}>
                    {answers.map((a, index) => {
                        const isCorrect = a.wasCorrect === true;
                        const resultText = isCorrect ? '✓ Correct' : '✗ Incorrect';

                        return (
                            <li key={a.qIndex ?? index} className={`result-item`} style={{ 
                                background: '#1f1f22',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                padding: '16px'
                            }}>
                                <div className="result-qtext" style={{ 
                                    color: '#e9e9ec', 
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    paddingBottom: '10px'
                                }}>
                                    <span style={{ 
                                        color: isCorrect ? '#9be28a' : '#ef4444', 
                                        fontWeight: 700,
                                        marginRight: '10px'
                                    }}>
                                        {resultText}
                                    </span>
                                    {a.question || `Question ${a.qIndex + 1} (Text Unavailable)`}
                                </div>
                                <ul className="result-choices" style={{ marginTop: '15px' }}>
                                    {Array.isArray(a.choices) && a.choices.map((choice, i) => {
                                        const isAnswer = a.correct === i;
                                        const isPicked = a.selected === i;
                                        const choiceClass = isAnswer ? 'is-correct' : isPicked ? 'is-wrong' : '';

                                        return (
                                            <li key={i} className={`result-choice ${choiceClass}`} style={{ 
                                                borderColor: isAnswer ? '#9be28a' : isPicked ? '#ef4444' : '#444', 
                                                backgroundColor: isAnswer ? '#16653440' : isPicked ? '#991b1b40' : 'transparent',
                                                color: '#bbb',
                                                marginTop: '8px',
                                                padding: '10px 15px',
                                                borderRadius: '6px'
                                            }}>
                                                <span className="choice-index">{String.fromCharCode(65 + i)}</span> 
                                                <span className="choice-text">{choice}</span>
                                                <span className="choice-icon" style={{ marginLeft: 'auto', fontWeight: 600 }}>
                                                    {isAnswer && "Correct Answer"} 
                                                    {isPicked && "Your Answer"}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </li>
                        );
                    })}
                </ul>
                
                <button 
                    className="reports-cta-button" 
                    onClick={() => navigate("/student/reports")}
                    style={{ marginTop: '30px', alignSelf: 'center', width: 'auto', padding: '12px 24px' }}
                >
                    Back to Reports
                </button>
            </div>
        </div>
    );
}