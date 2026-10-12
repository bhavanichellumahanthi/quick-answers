import { useState } from "react";
import { LEVELS, QUESTION_COUNTS, STANDARDS, STREAMS } from "../data/quizConfig.js";

export default function SetupScreen({
  onStart, onOpenHistory, onOpenManager, busy, error, savedCount,
}) {
  const [form, setForm] = useState({
    name: "",
    standard: "Undergraduate",
    stream: "Computer Science",
    level: "Medium",
    count: 5,
    topic: "",
    source: "ai",
  });

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === "count" ? Number(value) : value }));
  };

  const submit = (event) => {
    event.preventDefault();
    onStart({ ...form, name: form.name.trim(), topic: form.topic.trim() });
  };



  return (
    <main className="page-wrap">
      <section className="hero-block">
        <div className="eyebrow"><span className="pulse-dot" /> YOUR PERSONAL AI QUIZ STUDIO</div>
        <h1>Knowledge, <span>in motion.</span></h1>
        <p className="hero-copy">Build a focused quiz, challenge yourself one question at a time, and turn every attempt into progress.</p>
        <div className="hero-pills"><span>✦ AI-generated MCQs</span><span>◷ 60-second rounds</span><span>↗ Performance insights</span></div>
      </section>

      <div className="setup-grid">
        <section className="panel setup-panel">
          <div className="section-head"><div><span className="section-kicker">01 / CONFIGURE</span><h2>Design your challenge</h2></div><span className="icon-tile">✳</span></div>
          <form onSubmit={submit} className="setup-form">
            <label className="field-label">Your name
              <input name="name" value={form.name} onChange={update} maxLength={60} placeholder="Enter your name" required />
            </label>
            <div className="field-row">
              <label className="field-label">Standard
                <select name="standard" value={form.standard} onChange={update}>{STANDARDS.map((item) => <option key={item}>{item}</option>)}</select>
              </label>
              <label className="field-label">Difficulty
                <select name="level" value={form.level} onChange={update}>{LEVELS.map((item) => <option key={item}>{item}</option>)}</select>
              </label>
            </div>
            <label className="field-label">Subject / stream
              <select name="stream" value={form.stream} onChange={update}>{STREAMS.map((item) => <option key={item}>{item}</option>)}</select>
            </label>
            <label className="field-label">Topic focus <span className="optional-label">OPTIONAL</span>
              <input name="topic" value={form.topic} onChange={update} maxLength={100} placeholder="e.g. React hooks, normalization, photosynthesis" />
              <span className="field-hint">Leave blank for a balanced mix within your selected subject.</span>
            </label>

            <div className="field-label">Number of questions</div>
            <div className="count-options" role="radiogroup" aria-label="Number of questions">
              {QUESTION_COUNTS.map((count) => <button type="button" key={count} className={`count-option ${form.count === count ? "selected" : ""}`} onClick={() => setForm((current) => ({ ...current, count }))} aria-pressed={form.count === count}><strong>{count}</strong><span>{count === 5 ? "Quick" : count === 10 ? "Standard" : "Deep dive"}</span></button>)}
            </div>

            <div className="field-label">Question source</div>
            <div className="source-options">
              <button type="button" className={`source-option ${form.source === "ai" ? "selected" : ""}`} onClick={() => setForm((current) => ({ ...current, source: "ai" }))} aria-pressed={form.source === "ai"}><span className="source-symbol">✦</span><span><strong>Generate with AI</strong><small>Fresh questions via OpenRouter</small></span><span className="source-check">{form.source === "ai" ? "●" : "○"}</span></button>
              <button type="button" className={`source-option ${form.source === "custom" ? "selected" : ""}`} onClick={() => setForm((current) => ({ ...current, source: "custom" }))} aria-pressed={form.source === "custom"}><span className="source-symbol">▤</span><span><strong>My question bank</strong><small>{savedCount} saved custom questions</small></span><span className="source-check">{form.source === "custom" ? "●" : "○"}</span></button>
            </div>

           
            {error && <div className="error-banner" role="alert">⚠ {error}</div>}
            <button className="primary-button start-button" type="submit" disabled={busy}>{busy ? <><span className="spinner" /> Preparing your quiz…</> : <>Start your quiz <span>↗</span></>}</button>
            <p className="micro-copy">Each question has 60 seconds. Answers lock when submitted, and feedback appears before you continue.</p>
          </form>
        </section>
      </div>
    </main>
  );
}
