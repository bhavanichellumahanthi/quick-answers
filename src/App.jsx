import { useCallback, useEffect, useRef, useState } from "react";
import SetupScreen from "./components/SetupScreen.jsx";
import QuizScreen from "./components/QuizScreen.jsx";
import ResultsScreen from "./components/ResultsScreen.jsx";
import HistoryScreen from "./components/HistoryScreen.jsx";
import QuestionManager from "./components/QuestionManager.jsx";
import { generateQuestions } from "./utils/openRouter.js";
import { STORAGE_KEYS, formatDuration, makeId, readStorage, shuffle, writeStorage } from "./utils/quizUtils.js";
import "./App.css";

const TIME_LIMIT = 60;
function normalizeQuestion(question, index = 0) {
  return {
    ...question,
    id: question.id || makeId(`question-${index}`),
    question: String(question.question || "").trim(),
    options: Array.isArray(question.options) ? question.options.map((option) => String(option)) : [],
    answerIndex: Number(question.answerIndex),
    explanation: String(question.explanation || ""),
  };
}

function scoreQuiz(quiz) {
  const review = quiz.questions.map((question, index) => {
    const savedAnswer = quiz.answers[index] || null;
    const selectedOption = savedAnswer?.selectedOption ?? null;
    return {
      question: question.question,
      options: question.options,
      selectedOption,
      correctOption: question.answerIndex,
      correct: selectedOption === question.answerIndex && !savedAnswer?.timedOut,
      timedOut: Boolean(savedAnswer?.timedOut),
      explanation: question.explanation,
    };
  });
  const correct = review.filter((item) => item.correct).length;
  const incorrect = review.filter((item) => item.selectedOption !== null && !item.correct).length;
  const unanswered = review.filter((item) => item.selectedOption === null).length;
  const total = review.length;
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - quiz.startedAt) / 1000));
  return {
    total,
    correct,
    incorrect,
    unanswered,
    percentage: total ? Math.round((correct / total) * 100) : 0,
    elapsedSeconds,
    averageSeconds: total ? Math.round(elapsedSeconds / total) : 0,
    review,
  };
}

function newQuizState(settings, rawQuestions) {
  const questions = rawQuestions.map((item, index) => normalizeQuestion(item, index));
  const now = Date.now();
  return {
    quizId: makeId("quiz"),
    settings: { ...settings },
    questions,
    question: questions[0],
    index: 0,
    total: questions.length,
    answers: Array(questions.length).fill(null),
    selectedOption: null,
    feedback: null,
    timeLeft: TIME_LIMIT,
    deadline: now + TIME_LIMIT * 1000,
    startedAt: now,
    questionStartedAt: now,
  };
}

export default function App() {
  const [screen, setScreen] = useState("setup");
  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(() => readStorage(STORAGE_KEYS.history, []));
  const [customQuestions, setCustomQuestions] = useState(() => readStorage(STORAGE_KEYS.custom, []));
  const submitAnswerRef = useRef(null);
  const submissionLockRef = useRef(null);
  const timeoutLockRef = useRef(null);

  const updateHistory = (next) => {
    setHistory(next);
    writeStorage(STORAGE_KEYS.history, next);
  };

  const updateCustomQuestions = (next) => {
    setCustomQuestions(next);
    writeStorage(STORAGE_KEYS.custom, next);
  };

  const startQuiz = async (formSettings) => {
    setError("");
    setBusy(true);
    try {
      const settings = {
        name: formSettings.name.trim(),
        standard: formSettings.standard,
        stream: formSettings.stream,
        level: formSettings.level,
        count: Number(formSettings.count),
        topic: formSettings.topic || "",
        source: formSettings.source || "ai",
      };

      let questions;
      if (formSettings.source === "custom") {
        const requestedTopic = settings.topic.toLowerCase();
        const matching = customQuestions.filter((question) => {
          const standardMatches = question.standard === settings.standard;
          const streamMatches = question.stream === settings.stream;
          const levelMatches = question.level === settings.level;
          const topicMatches = !requestedTopic ||
            String(question.topic || "").toLowerCase().includes(requestedTopic) ||
            String(question.question || "").toLowerCase().includes(requestedTopic);
          return standardMatches && streamMatches && levelMatches && topicMatches;
        });
        if (matching.length < settings.count) {
          throw new Error(`Your question bank has ${matching.length} matching questions, but you selected ${settings.count}. Add more questions with the same subject, difficulty and standard, or choose a smaller quiz.`);
        }
        questions = shuffle(matching).slice(0, settings.count);
      } else {
        questions = await generateQuestions({ settings });
      }

      const nextQuiz = newQuizState(settings, questions);
      writeStorage(STORAGE_KEYS.active, nextQuiz);
      submissionLockRef.current = null;
      timeoutLockRef.current = null;
      setQuiz(nextQuiz);
      setResult(null);
      setScreen("quiz");
    } catch (requestError) {
      setError(requestError.message || "Unable to start the quiz. Check the root .env configuration and try again.");
    } finally {
      setBusy(false);
    }
  };

  // Resume the current quiz after refresh. The stored deadline continues to count down.
  useEffect(() => {
    const saved = readStorage(STORAGE_KEYS.active, null);
    if (saved?.questions?.length && Number.isInteger(saved.index) && saved.index >= 0 && saved.index < saved.questions.length) {
      const resumed = { ...saved, question: saved.questions[saved.index] };
      setQuiz(resumed);
      setScreen("quiz");
    }
  }, []);

  const submitAnswer = useCallback((pickedOption) => {
    if (!quiz || quiz.feedback) return;
    const lockKey = `${quiz.quizId}:${quiz.index}`;
    if (submissionLockRef.current === lockKey) return;
    submissionLockRef.current = lockKey;

    const timedOut = pickedOption === null || pickedOption === undefined || Date.now() >= quiz.deadline;
    const selectedOption = timedOut ? null : pickedOption;
    const currentQuestion = quiz.questions[quiz.index];
    const feedback = {
      timedOut,
      selectedOption,
      correctOption: currentQuestion.answerIndex,
      correct: !timedOut && selectedOption === currentQuestion.answerIndex,
      explanation: currentQuestion.explanation,
    };
    const answers = [...quiz.answers];
    answers[quiz.index] = { selectedOption, timedOut };
    const nextQuiz = { ...quiz, answers, selectedOption, feedback, timeLeft: timedOut ? 0 : quiz.timeLeft };
    writeStorage(STORAGE_KEYS.active, nextQuiz);
    setQuiz(nextQuiz);
    setError("");
  }, [quiz]);
  submitAnswerRef.current = submitAnswer;

  // Browser-side timer. It is reliable for local practice, but is not a secure exam timer.
  useEffect(() => {
    if (screen !== "quiz" || !quiz || quiz.feedback) return undefined;
    const quizId = quiz.quizId;
    const index = quiz.index;
    const deadline = quiz.deadline;
    const timerKey = `${quizId}:${index}`;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setQuiz((current) => {
        if (!current || current.quizId !== quizId || current.index !== index || current.feedback) return current;
        if (current.timeLeft === remaining) return current;
        const updated = { ...current, timeLeft: remaining };
        writeStorage(STORAGE_KEYS.active, updated);
        return updated;
      });
      if (remaining === 0 && timeoutLockRef.current !== timerKey) {
        timeoutLockRef.current = timerKey;
        submitAnswerRef.current?.(null);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [screen, quiz?.quizId, quiz?.index, quiz?.feedback, quiz?.deadline]);

  const selectOption = (selectedOption) => {
    setQuiz((current) => {
      if (!current || current.feedback) return current;
      const updated = { ...current, selectedOption };
      writeStorage(STORAGE_KEYS.active, updated);
      return updated;
    });
  };

  const goNext = () => {
    if (!quiz || !quiz.feedback || busy) return;
    setError("");
    if (quiz.index === quiz.total - 1) {
      const completed = {
        id: makeId("attempt"),
        ...scoreQuiz(quiz),
        settings: quiz.settings,
        completedAt: new Date().toISOString(),
      };
      const nextHistory = [completed, ...readStorage(STORAGE_KEYS.history, [])].slice(0, 100);
      updateHistory(nextHistory);
      writeStorage(STORAGE_KEYS.active, null);
      setQuiz(null);
      setResult(completed);
      setScreen("results");
      return;
    }

    const nextIndex = quiz.index + 1;
    const now = Date.now();
    const updated = {
      ...quiz,
      index: nextIndex,
      question: quiz.questions[nextIndex],
      selectedOption: null,
      feedback: null,
      timeLeft: TIME_LIMIT,
      deadline: now + TIME_LIMIT * 1000,
      questionStartedAt: now,
    };
    submissionLockRef.current = null;
    timeoutLockRef.current = null;
    writeStorage(STORAGE_KEYS.active, updated);
    setQuiz(updated);
  };

  const saveCustomQuestion = (question, isEditing, isDelete = false) => {
    let next;
    if (isDelete) next = customQuestions.filter((item) => item.id !== question.id);
    else if (isEditing) next = customQuestions.map((item) => item.id === question.id ? question : item);
    else next = [question, ...customQuestions];
    updateCustomQuestions(next);
  };

  const reviewHistoryItem = (item) => {
    setResult({ ...item, readOnly: true });
    setScreen("results");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
  className="brand-mark"
  disabled={screen === "quiz"}
  onClick={() => {
    if (screen === "quiz") return;
    setError("");
    setScreen("setup");
  }}
  aria-label="Quick Answer home"
>
  <img className="brand-logo" src="/logo.png" alt="" />
  <span className="brand-copy">
    <strong>Quick answer</strong>
    <small>AI QUIZ STUDIO</small>
  </span>
</button>
        <div className="topbar-right"><span className="backend-status"><span className="status-dot" /> ROOT / SERVER MODE</span>{screen !== "quiz" && <><button type="button" className="topbar-link" onClick={() => setScreen("history")}>History</button><button type="button" className="topbar-link" onClick={() => setScreen("manage")}>Question lab</button></>}</div>
      </header>

      {screen === "setup" && <SetupScreen onStart={startQuiz} onOpenHistory={() => { setError(""); setScreen("history"); }} onOpenManager={() => { setError(""); setScreen("manage"); }} busy={busy} error={error} savedCount={customQuestions.length} />}
      {screen === "quiz" && quiz && <QuizScreen quiz={{ ...quiz, question: quiz.questions[quiz.index] }} selectedOption={quiz.selectedOption} onSelect={selectOption} onSubmit={() => submitAnswer(quiz.selectedOption)} onNext={goNext} busy={busy} error={error} />}
      {screen === "results" && result && <ResultsScreen result={result} onBack={() => { setScreen(result.readOnly ? "history" : "setup"); setResult(null); setError(""); }} onRestart={() => { setResult(null); setError(""); setScreen("setup"); }} />}
      {screen === "history" && <HistoryScreen history={history} onReview={reviewHistoryItem} onClear={() => { if (window.confirm("Clear all saved quiz history from this browser?")) updateHistory([]); }} onBack={() => { setError(""); setScreen("setup"); }} />}
      {screen === "manage" && <QuestionManager questions={customQuestions} onSave={saveCustomQuestion} onBack={() => { setError(""); setScreen("setup"); }} />}

      <footer className="footer"><span>QUICK ANSWER <span className="footer-dot">●</span> BUILT FOR BETTER THINKING</span><span>Practice with purpose · {formatDuration(60)} rounds</span></footer>
    </div>
  );
}
