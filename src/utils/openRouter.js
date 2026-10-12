async function requestJson(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
  } catch {
    throw new Error("Could not connect to Quick Answer's local API. Start the project from the root using npm run dev.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Question generation failed (${response.status}). Check the root .env file and backend terminal.`);
  }
  return data;
}

export async function generateQuestions({ settings }) {
  const data = await requestJson("/api/generate-questions", {
    method: "POST",
    body: JSON.stringify({
      standard: settings.standard,
      stream: settings.stream,
      level: settings.level,
      count: Number(settings.count),
      topic: settings.topic || "",
    }),
  });
  if (!Array.isArray(data.questions) || data.questions.length !== Number(settings.count)) {
    throw new Error("The question service returned an unexpected number of questions. Please try again.");
  }
  return data.questions;
}
