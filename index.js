import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(ROOT, ".env") });

const app = express();
const PORT = Number(process.env.PORT || 5173);
const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const PRODUCTION = process.env.NODE_ENV === "production";
const ALLOWED_STANDARDS = ["6-8", "9-10", "11-12", "Undergraduate", "Other"];
const ALLOWED_STREAMS = [
  "General Knowledge", "Science", "Mathematics", "Computer Science", "English",
  "Biology", "Physics", "Chemistry", "DBMS", "Operating Systems", "Data Structures",
  "Web Technologies", "Artificial Intelligence",
];
const ALLOWED_LEVELS = ["Easy", "Medium", "Hard"];
const ALLOWED_COUNTS = [5, 10, 20];

app.disable("x-powered-by");
app.use(express.json({ limit: "50kb" }));

const generationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many quiz-generation requests. Please wait a few minutes and try again." },
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "Quick Answer",
    configured: Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim()),
  });
});

function validateSettings(body) {
  return body &&
    ALLOWED_STANDARDS.includes(body.standard) &&
    ALLOWED_STREAMS.includes(body.stream) &&
    ALLOWED_LEVELS.includes(body.level) &&
    ALLOWED_COUNTS.includes(Number(body.count)) &&
    typeof (body.topic ?? "") === "string" &&
    (body.topic ?? "").length <= 100;
}

function validateQuestions(rawQuestions, expectedCount) {
  if (!Array.isArray(rawQuestions) || rawQuestions.length !== expectedCount) {
    throw new Error(`The AI did not return exactly ${expectedCount} questions. Please try again.`);
  }

  const seen = new Set();
  return rawQuestions.map((item, index) => {
    if (!item || typeof item.question !== "string" || item.question.trim().length < 5 ||
      item.question.length > 1200 || !Array.isArray(item.options) || item.options.length !== 4 ||
      !item.options.every((option) => typeof option === "string" && option.trim().length > 0 && option.length <= 350) ||
      new Set(item.options.map((option) => option.trim().toLowerCase())).size !== 4 ||
      !Number.isInteger(item.answerIndex) || item.answerIndex < 0 || item.answerIndex > 3 ||
      typeof item.explanation !== "string" || !item.explanation.trim() || item.explanation.length > 1500) {
      throw new Error(`Generated question ${index + 1} has an invalid format. Please try again.`);
    }
    const fingerprint = item.question.trim().toLowerCase();
    if (seen.has(fingerprint)) throw new Error("The AI generated duplicate questions. Please try again.");
    seen.add(fingerprint);
    return {
      id: crypto.randomUUID(),
      question: item.question.trim(),
      options: item.options.map((option) => option.trim()),
      answerIndex: item.answerIndex,
      explanation: item.explanation.trim(),
    };
  });
}

async function openRouterCompletion(settings) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey || apiKey === "PASTE_YOUR_OPENROUTER_API_KEY_HERE") {
    const error = new Error("OpenRouter API key is not configured. Add your key to the OPENROUTER_API_KEY entry in the root .env file, save it, then restart npm run dev.");
    error.status = 500;
    throw error;
  }

  const count = Number(settings.count);
  const topic = settings.topic?.trim()
    ? `Focus topic: ${settings.topic.trim()}.`
    : "Cover a balanced selection of topics within the selected subject.";
  const prompt = `Generate exactly ${count} original educational multiple-choice questions.\n\nLearner standard: ${settings.standard}\nSubject/stream: ${settings.stream}\nDifficulty: ${settings.level}\n${topic}\n\nRequirements:\n- Questions must be accurate, clear, and matched to the selected standard and difficulty.\n- Every question has exactly four distinct options and only one correct option.\n- answerIndex is the zero-based index (0-3) of the correct option.\n- Include a concise explanation of the answer.\n- Do not repeat questions.\n- Return a JSON object only in this shape: {"questions":[{"question":"Question text","options":["A","B","C","D"],"answerIndex":0,"explanation":"Why it is correct"}]}`;

  const body = {
    model: MODEL,
    temperature: 0.4,
    max_tokens: Math.min(12000, count * 350),
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You create educational MCQs. Follow the user's JSON format exactly and do not use markdown." },
      { role: "user", content: prompt },
    ],
  };

  const callOpenRouter = async (payload) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-OpenRouter-Title": "Quick Answer - AI Quiz Studio",
          "HTTP-Referer": process.env.OPENROUTER_SITE_URL || `http://localhost:${PORT}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      return { response, data };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  let result;
  try {
    result = await callOpenRouter(body);
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("OpenRouter took too long to respond. Try fewer questions or try again shortly.");
      timeoutError.status = 504;
      throw timeoutError;
    }
    const networkError = new Error("Quick Answer could not connect to OpenRouter. Check your internet connection and try again.");
    networkError.status = 502;
    throw networkError;
  }

  if (!result.response.ok && result.response.status === 400 && /response.?format|json.?object|unsupported|structured/i.test(result.data?.error?.message || "")) {
    const { response_format: _removed, ...fallbackBody } = body;
    try {
      result = await callOpenRouter(fallbackBody);
    } catch (error) {
      const networkError = new Error(error.name === "AbortError" ? "OpenRouter took too long to respond." : "Quick Answer could not connect to OpenRouter.");
      networkError.status = error.name === "AbortError" ? 504 : 502;
      throw networkError;
    }
  }

  if (!result.response.ok) {
    const upstreamStatus = result.response.status;
    const detail = result.data?.error?.message || result.data?.message || "";
    let message;
    if (upstreamStatus === 401) message = "OpenRouter rejected the API key (401). Check the OPENROUTER_API_KEY value in the root .env file.";
    else if (upstreamStatus === 402) message = "OpenRouter reports insufficient credits or a spending limit (402). Check your OpenRouter account and key limits.";
    else if (upstreamStatus === 403) message = `OpenRouter denied access (403). Check account restrictions and model access.${detail ? ` Details: ${detail}` : ""}`;
    else if (upstreamStatus === 404) message = `The OpenRouter model '${MODEL}' was not found or is unavailable (404). Update OPENROUTER_MODEL in the root .env file.${detail ? ` Details: ${detail}` : ""}`;
    else if (upstreamStatus === 429) message = "OpenRouter rate limit reached (429). Wait a little and try again.";
    else if (upstreamStatus === 400) message = `OpenRouter rejected the request (400). Check OPENROUTER_MODEL and request support.${detail ? ` Details: ${detail}` : ""}`;
    else message = `OpenRouter request failed (${upstreamStatus}).${detail ? ` Details: ${detail}` : " Check your model and account settings."}`;
    const error = new Error(message);
    error.status = [400, 401, 402, 403, 404, 429].includes(upstreamStatus) ? upstreamStatus : 502;
    throw error;
  }

  const content = result.data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    const error = new Error("OpenRouter returned an empty response. Try again or use another model in the root .env file.");
    error.status = 502;
    throw error;
  }
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const error = new Error("The AI model did not return valid JSON. Try again or select a model that supports JSON output.");
    error.status = 502;
    throw error;
  }
  return validateQuestions(parsed.questions, count);
}

app.post("/api/generate-questions", generationLimiter, async (req, res) => {
  if (!validateSettings(req.body)) {
    return res.status(400).json({ error: "Invalid quiz customisation. Check standard, subject, difficulty, topic and question count." });
  }
  try {
    const questions = await openRouterCompletion({
      standard: req.body.standard,
      stream: req.body.stream,
      level: req.body.level,
      count: Number(req.body.count),
      topic: String(req.body.topic || "").trim(),
    });
    return res.json({ questions, model: MODEL });
  } catch (error) {
    console.error("[Quick Answer] Question generation failed:", error.message);
    return res.status(error.status || 502).json({ error: error.message || "Unable to generate questions. Check the backend terminal." });
  }
});

if (!process.env.VERCEL) {
  if (PRODUCTION) {
    app.use(express.static(path.join(ROOT, "dist")));
    app.get("*", (_req, res) => res.sendFile(path.join(ROOT, "dist", "index.html")));
  } else {
    const vite = await createViteServer({
      root: ROOT,
      configFile: path.join(ROOT, "vite.config.js"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Quick Answer running at http://localhost:${PORT}`);
    console.log(`OpenRouter model: ${MODEL}`);
    console.log(`OpenRouter key configured: ${Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim() && process.env.OPENROUTER_API_KEY !== "PASTE_YOUR_OPENROUTER_API_KEY_HERE")}`);
  });
}

export default app;
