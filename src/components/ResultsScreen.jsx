import { formatDuration } from "../utils/quizUtils.js";

export default function ResultsScreen({ result, onBack, onRestart }) {
  const readOnly = Boolean(result.readOnly);
  const accuracy = Number(result.percentage || 0);
  return (
    <main className="page-wrap results-wrap">
      <section className="results-hero">
        <div className="eyebrow"><span className="pulse-dot" /> {readOnly ? "PAST ATTEMPT / REVIEW" : "SESSION COMPLETE"}</div>
        <h1>{accuracy >= 80 ? "Brilliant work." : accuracy >= 50 ? "Good momentum." : "Every attempt teaches."}</h1>
        <p>{readOnly ? "Review your previous answers and explanations." : `Nice effort, ${result.settings?.name || "learner"}. Here's the story behind your score.`}</p>
      </section>
      <div className="results-layout">
        <section className="panel score-panel">
          <div className="score-ring" style={{ "--score": `${accuracy}%` }}><div><strong>{accuracy}%</strong><span>ACCURACY</span></div></div>
          <div className="score-copy"><span className="section-kicker">YOUR RESULT</span><h2>{result.correct} <span>/ {result.total}</span></h2><p>questions answered correctly</p><div className="score-tags"><span>{result.settings?.stream || "Quiz"}</span><span>{result.settings?.level || "Mixed"}</span>{result.settings?.source && <span>{result.settings.source === "ai" ? "AI generated" : "Custom bank"}</span>}</div></div>
        </section>
        <section className="results-stat-grid">
          <div className="panel metric-card"><span className="metric-label">CORRECT</span><strong className="metric-green">{result.correct}</strong><span className="metric-foot">Strong answers</span></div>
          <div className="panel metric-card"><span className="metric-label">INCORRECT</span><strong className="metric-red">{result.incorrect}</strong><span className="metric-foot">Worth reviewing</span></div>
          <div className="panel metric-card"><span className="metric-label">UNANSWERED</span><strong>{result.unanswered}</strong><span className="metric-foot">Time ran out / skipped</span></div>
          <div className="panel metric-card"><span className="metric-label">TOTAL TIME</span><strong className="metric-time">{formatDuration(result.elapsedSeconds)}</strong><span className="metric-foot">~{formatDuration(result.averageSeconds)} per question</span></div>
        </section>
      </div>

      <section className="panel review-panel">
        <div className="section-head review-heading"><div><span className="section-kicker">LEARN FROM THE ROUND</span><h2>Answer review</h2></div><span className="review-count">{result.review?.length || 0} QUESTIONS</span></div>
        <div className="review-list">
          {(result.review || []).map((item, index) => (
            <article className="review-row" key={`${index}-${item.question}`}>
              <div className={`review-status ${item.correct ? "status-good" : "status-bad"}`}>{item.correct ? "✓" : item.timedOut ? "◷" : "×"}</div>
              <div className="review-content"><div className="review-q-top"><span>QUESTION {String(index + 1).padStart(2, "0")}</span><span className={item.correct ? "review-correct-label" : "review-wrong-label"}>{item.correct ? "CORRECT" : item.timedOut ? "TIME OUT" : "REVIEW"}</span></div><h3>{item.question}</h3>
                <div className="review-answer"><span>Your answer</span><strong>{item.selectedOption === null || item.selectedOption === undefined ? "No answer" : item.options[item.selectedOption]}</strong></div>
                <div className="review-answer correct-answer-line"><span>Correct answer</span><strong>{item.options[item.correctOption]}</strong></div>
                {item.explanation && <p className="review-explanation">{item.explanation}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
      <div className="results-actions"><button className="secondary-button" onClick={onBack}>{readOnly ? "← Back to history" : "← Back to setup"}</button>{!readOnly && <button className="primary-button" onClick={onRestart}>Create another quiz <span>↗</span></button>}</div>
    </main>
  );
}
