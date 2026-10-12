// Shared quiz settings used by SetupScreen and QuestionManager.
// Kept separate from questions.js so an existing local MCQ bank is not overwritten.
export const STREAMS = [
  "General Knowledge",
  "Science",
  "Mathematics",
  "Computer Science",
  "English",
  "Biology",
  "Physics",
  "Chemistry",
  "DBMS",
  "Operating Systems",
  "Data Structures",
  "Web Technologies",
  "Artificial Intelligence",
];

export const LEVELS = ["Easy", "Medium", "Hard"];
export const STANDARDS = ["6-8", "9-10", "11-12", "Undergraduate", "Other"];
export const QUESTION_COUNTS = [5, 10, 20];
