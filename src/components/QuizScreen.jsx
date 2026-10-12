import { formatDuration } from "../utils/quizUtils.js";

export default function QuizScreen({ quiz, selectedOption, onSelect, onSubmit, onNext, busy, error }) {
  const { question, index, total, timeLeft, feedback, settings } = quiz;
  const progress = ((index + (feedback ? 1 : 0)) / total) * 100;
  const timerClass = timeLeft <= 10 ? "timer-urgent" : timeLeft <= 25 ? "timer-warn" : "";

  return (
    <main className="page-wrap quiz-wrap">
      <div className="quiz-topline">
        <div><span className="section-kicker">LIVE SESSION / {settings.stream.toUpperCase()}</span><h1 className="quiz-heading">Stay in the <span>zone.</span></h1></div>
        <div className={`timer-box ${timerClass}`}><span className="timer-label">TIME LEFT</span><strong>◷ {formatDuration(timeLeft)}</strong><div className="timer-track"><span style={{ width: `${Math.min(100, (timeLeft / 60) * 100)}%` }} /></div></div>
      </div>
      <div className="quiz-progress-line"><span>Question <strong>{index + 1}</strong> of {total}</span><span>{Math.round((index / total) * 100)}% completed</span></div>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>

      <section className="panel question-panel">
        <div className="question-meta"><span className="question-number">Q{String(index + 1).padStart(2, "0")}</span><div><span className="tag-pill">{settings.level}</span>{settings.topic && <span className="tag-pill muted-tag">{settings.topic}</span>}</div><span className="question-points">1 POINT</span></div>
        <h2 className="question-text">{question.question}</h2>
        <p className="select-hint">Select one answer, then submit to lock it in.</p>
        <div className="answer-grid">
          {question.options.map((option, optionIndex) => {
            const picked = selectedOption === optionIndex;
            let stateClass = picked ? "chosen" : "";
            if (feedback && feedback.correctOption === optionIndex) stateClass = "answer-correct";
            else if (feedback && picked && !feedback.correct) stateClass = "answer-incorrect";
            return (
              <button key={`${question.id}-${optionIndex}`} className={`answer-option ${stateClass}`} onClick={() => onSelect(optionIndex)} disabled={Boolean(feedback) || busy}>
                <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span><span className="option-text">{option}</span><span className="option-indicator">{feedback && feedback.correctOption === optionIndex ? "✓" : picked ? "●" : "↗"}</span>
              </button>
            );
          })}
        </div>

        {feedback && <div className={`feedback-box ${feedback.correct ? "feedback-good" : "feedback-bad"}`} role="status">
          <div className="feedback-icon">{feedback.timedOut ? "◷" : feedback.correct ? "✓" : "!"}</div>
          <div><strong>{feedback.timedOut ? "Time is up" : feedback.correct ? "Correct answer" : "Not quite — keep learning"}</strong><p>{feedback.explanation || "Review the highlighted correct answer."}</p>{feedback.timedOut && <small>This question was recorded as unanswered.</small>}</div>
        </div>}
        {error && <div className="error-banner" role="alert">⚠ {error}</div>}
        <div className="question-actions">
          {!feedback ? <button className="primary-button" onClick={onSubmit} disabled={selectedOption === null || selectedOption === undefined || busy}>{busy ? <><span className="spinner" /> Checking…</> : <>Submit answer <span>↗</span></>}</button> : <button className="primary-button" onClick={onNext} disabled={busy}>{busy ? <><span className="spinner" /> Loading…</> : index === total - 1 ? <>View results <span>✦</span></> : <>Next question <span>→</span></>}</button>}
          <span className="locked-note">{feedback ? "ANSWER LOCKED" : "ONE ATTEMPT PER QUESTION"}</span>
        </div>
      </section>
      <p className="quiz-footnote">Your answer is checked in this browser. You cannot return to earlier questions after moving forward.</p>
    </main>
  );
}
