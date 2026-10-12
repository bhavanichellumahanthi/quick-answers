import { formatDuration } from "../utils/quizUtils.js";

export default function HistoryScreen({ history, onReview, onClear, onBack }) {
  const attempts = history.length;
  const average = attempts ? Math.round(history.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / attempts) : 0;
  const best = attempts ? Math.max(...history.map((item) => Number(item.percentage || 0))) : 0;

  return (
    <main className="page-wrap subpage-wrap">
      <div className="subpage-head"><div><span className="section-kicker">YOUR LEARNING TIMELINE</span><h1>Attempt <span>history.</span></h1><p>Look back, find patterns, and keep building consistency.</p></div><button className="secondary-button" onClick={onBack}>← Back to setup</button></div>
      <div className="history-metrics">
        <div className="panel history-metric"><span>COMPLETED QUIZZES</span><strong>{attempts}</strong></div>
        <div className="panel history-metric"><span>AVERAGE SCORE</span><strong>{average}%</strong></div>
        <div className="panel history-metric"><span>PERSONAL BEST</span><strong>{best}%</strong></div>
      </div>
      <section className="panel history-panel">
        <div className="section-head"><div><span className="section-kicker">SAVED IN THIS BROWSER</span><h2>Recent attempts</h2></div>{attempts > 0 && <button className="text-button danger-text" onClick={onClear}>Clear history</button>}</div>
        {!attempts ? <div className="empty-state"><span className="empty-icon">◷</span><h3>No attempts yet</h3><p>Complete your first quiz and your results will appear here.</p><button className="primary-button" onClick={onBack}>Start a quiz <span>↗</span></button></div> : <div className="history-list">
          {[...history].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)).map((item) => (
            <article className="history-item" key={item.id}>
              <div className="history-score-bubble">{item.percentage}%</div>
              <div className="history-main"><h3>{item.settings?.stream || "Quiz attempt"}</h3><p>{item.settings?.name || "Learner"} · {item.settings?.level || "Mixed"} · {item.total} questions</p><div className="history-detail-line"><span>{item.completedAt ? new Date(item.completedAt).toLocaleString() : "Saved attempt"}</span><span>{formatDuration(item.elapsedSeconds)}</span><span>{item.correct}/{item.total} correct</span></div></div>
              <button className="secondary-button small-button" onClick={() => onReview(item)}>Review ↗</button>
            </article>
          ))}
        </div>}
      </section>
      <p className="page-disclaimer">History is saved to your browser's local storage. It does not automatically sync to another device.</p>
    </main>
  );
}
