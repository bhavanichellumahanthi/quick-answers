import { useState } from "react";
import { LEVELS, STANDARDS, STREAMS } from "../data/quizConfig.js";

const emptyForm = () => ({
  question: "", options: ["", "", "", ""], answerIndex: 0, explanation: "",
  stream: "Computer Science", level: "Medium", standard: "Undergraduate", topic: "",
});

export default function QuestionManager({ questions, onSave, onBack }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("All subjects");
  const [error, setError] = useState("");

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const updateOption = (index, value) => setForm((current) => ({ ...current, options: current.options.map((option, i) => i === index ? value : option) }));

  const resetForm = () => { setForm(emptyForm()); setEditingId(null); setError(""); };

  const submit = (event) => {
    event.preventDefault();
    if (!form.question.trim()) return setError("Enter the question text.");
    if (form.options.some((option) => !option.trim())) return setError("Fill in all four answer options.");
    if (new Set(form.options.map((option) => option.trim().toLowerCase())).size !== 4) return setError("Each answer option must be different.");
    if (!form.explanation.trim()) return setError("Add a short explanation so you can learn from the answer review.");
    const entry = {
      ...form,
      id: editingId || (globalThis.crypto?.randomUUID?.() ?? `q-${Date.now()}`),
      question: form.question.trim(),
      options: form.options.map((option) => option.trim()),
      answerIndex: Number(form.answerIndex),
      explanation: form.explanation.trim(),
      topic: form.topic.trim(),
    };
    onSave(entry, Boolean(editingId));
    resetForm();
  };

  const edit = (question) => {
    setForm({ ...question, options: [...question.options] });
    setEditingId(question.id);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const displayedQuestions = questions.filter((question) => filter === "All subjects" || question.stream === filter);

  return (
    <main className="page-wrap subpage-wrap">
      <div className="subpage-head"><div><span className="section-kicker">YOUR PERSONAL QUESTION BANK</span><h1>Question <span>lab.</span></h1><p>Create reusable MCQs for custom-source quizzes. Questions stay in this browser.</p></div><button className="secondary-button" onClick={onBack}>← Back to setup</button></div>
      <div className="manager-grid">
        <section className="panel manager-form-panel">
          <div className="section-head"><div><span className="section-kicker">{editingId ? "EDIT QUESTION" : "CREATE QUESTION"}</span><h2>{editingId ? "Tune your MCQ" : "Add a new MCQ"}</h2></div><span className="icon-tile">＋</span></div>
          <form className="manager-form" onSubmit={submit}>
            <label className="field-label">Question text<textarea rows="3" name="question" value={form.question} onChange={update} maxLength={1000} placeholder="Write a clear question…" required /></label>
            <div className="field-label">Answer options</div>
            {form.options.map((option, index) => <label className="option-edit-row" key={index}><span className="option-letter">{String.fromCharCode(65 + index)}</span><input value={option} onChange={(event) => updateOption(index, event.target.value)} maxLength={300} placeholder={`Option ${String.fromCharCode(65 + index)}`} required /></label>)}
            <label className="field-label">Correct answer
              <select name="answerIndex" value={form.answerIndex} onChange={update}>{form.options.map((option, index) => <option value={index} key={index}>{String.fromCharCode(65 + index)} — {option.trim() || `Option ${String.fromCharCode(65 + index)}`}</option>)}</select>
            </label>
            <label className="field-label">Explanation<textarea rows="2" name="explanation" value={form.explanation} onChange={update} maxLength={1500} placeholder="Why is this the correct answer?" required /></label>
            <div className="field-row"><label className="field-label">Subject / stream<select name="stream" value={form.stream} onChange={update}>{STREAMS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field-label">Difficulty<select name="level" value={form.level} onChange={update}>{LEVELS.map((item) => <option key={item}>{item}</option>)}</select></label></div>
            <div className="field-row"><label className="field-label">Standard<select name="standard" value={form.standard} onChange={update}>{STANDARDS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field-label">Topic<input name="topic" value={form.topic} onChange={update} maxLength={100} placeholder="e.g. SQL joins" /></label></div>
            {error && <div className="error-banner" role="alert">⚠ {error}</div>}
            <div className="manager-form-actions"><button type="submit" className="primary-button">{editingId ? "Save changes" : "Add to question bank"} <span>↗</span></button>{editingId && <button type="button" className="secondary-button" onClick={resetForm}>Cancel edit</button>}</div>
          </form>
        </section>
        <section className="panel manager-list-panel">
          <div className="section-head"><div><span className="section-kicker">YOUR LIBRARY</span><h2>Saved questions <span className="count-badge">{questions.length}</span></h2></div></div>
          <label className="field-label">Filter by subject<select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All subjects</option>{STREAMS.map((item) => <option key={item}>{item}</option>)}</select></label>
          {displayedQuestions.length === 0 ? <div className="empty-state compact-empty"><span className="empty-icon">＋</span><h3>Your bank starts here</h3><p>Add a question using the form. For a custom quiz, add at least as many matching questions as the chosen quiz length.</p></div> : <div className="custom-question-list">
            {displayedQuestions.map((question) => <article className="custom-question-item" key={question.id}><div className="custom-question-head"><span className="tag-pill">{question.stream}</span><span className="tag-pill muted-tag">{question.level}</span></div><h3>{question.question}</h3><p className="custom-question-answer">Correct: {question.options[question.answerIndex]}</p><div className="custom-question-actions"><button className="text-button" onClick={() => edit(question)}>Edit</button><button className="text-button danger-text" onClick={() => { if (window.confirm("Delete this question from your local bank?")) onSave(question, false, true); if (editingId === question.id) resetForm(); }}>Delete</button></div></article>)}
          </div>}
          <p className="page-disclaimer">This is a local question editor, not a secured multi-user admin panel.</p>
        </section>
      </div>
    </main>
  );
}
