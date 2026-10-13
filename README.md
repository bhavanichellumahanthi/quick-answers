# ⚡ Quick Answer — AI Quiz Studio

> A browser-based AI quiz studio that generates educational MCQs on demand, tracks your performance, and lets you build your own question bank — all wrapped in a premium dark-themed UI.

🔗 **Live Demo** → [quick-answers-bhavani.vercel.app](https://quick-answers-bhavani.vercel.app)

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Question Generation** | Generates original MCQs using OpenRouter (GPT-4o-mini or any supported model) |
| 📚 **13 Subjects** | General Knowledge, Science, Mathematics, Computer Science, English, Biology, Physics, Chemistry, DBMS, Operating Systems, Data Structures, Web Technologies, AI |
| 🎯 **3 Difficulty Levels** | Easy, Medium, Hard — matched to the selected standard |
| 🏫 **5 Academic Standards** | Classes 6–8, 9–10, 11–12, Undergraduate, Other |
| ⏱ **60-Second Timer** | Per-question countdown with visual progress bar |
| 🔒 **Answer Locking** | One attempt per question — feedback appears immediately after submission |
| 📊 **Performance Analytics** | Score ring, accuracy %, correct/incorrect/unanswered breakdown, total time, average per question |
| 📝 **Detailed Answer Review** | Full question review with your answer, correct answer, and explanation |
| 📜 **Quiz History** | Saved in browser storage — review any past attempt anytime |
| 🧪 **Question Lab** | Create, edit, delete your own custom MCQs for offline practice |
| 🔄 **Resume After Refresh** | Active quiz state persists across page reloads |
| 🌙 **Premium Dark UI** | Animated aurora gradient, glassmorphism panels, smooth micro-animations |
| 📱 **Fully Responsive** | Optimized for desktop, tablet, and mobile screens |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  React 19 + Vite (SPA)                          │
│  ┌───────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ SetupScreen│ │QuizScreen│ │ ResultsScreen  │  │
│  └───────────┘ └──────────┘ └────────────────┘  │
│  ┌───────────┐ ┌──────────────────────────────┐  │
│  │HistoryScr │ │ QuestionManager (Lab)        │  │
│  └───────────┘ └──────────────────────────────┘  │
│                    │ fetch /api/*                 │
└────────────────────┼─────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│              Node.js / Express API               │
│              (index.js — root)                   │
│                                                  │
│  POST /api/generate-questions                    │
│   → validates settings                           │
│   → calls OpenRouter API                         │
│   → validates AI response                        │
│   → returns sanitised questions                  │
│                                                  │
│  GET /api/health                                 │
│   → returns service status                       │
└─────────────────────┬───────────────────────────┘
                      ▼
            ┌──────────────────┐
            │  OpenRouter API   │
            │  (GPT-4o-mini)    │
            └──────────────────┘
```

---

## 📂 Project Structure

```text
quick-answer/
├── index.html              # Vite entry HTML
├── index.js                # Express API + Vite dev server (single root process)
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite + React plugin config
├── vercel.json             # Vercel routing (API rewrites + SPA fallback)
├── .env                    # Local env vars (never committed)
├── .env.example            # Template for .env
├── .gitignore
├── api/
│   └── [...path].js        # Vercel serverless function entry point
├── public/
│   └── logo.png            # App favicon and brand logo
└── src/
    ├── main.jsx             # React entry point
    ├── App.jsx              # Root component — routing, quiz state, timer logic
    ├── App.css              # All component styles (single file)
    ├── index.css            # Global resets, fonts, CSS variables, animations
    ├── components/
    │   ├── SetupScreen.jsx   # Quiz configuration form
    │   ├── QuizScreen.jsx    # Live quiz with timer, options, feedback
    │   ├── ResultsScreen.jsx # Score ring, stats, full answer review
    │   ├── HistoryScreen.jsx # Past attempts timeline
    │   └── QuestionManager.jsx # Custom question CRUD
    ├── data/
    │   └── quizConfig.js    # Shared constants (subjects, levels, standards)
    └── utils/
        ├── openRouter.js    # Frontend API client for /api/generate-questions
        └── quizUtils.js     # localStorage helpers, formatting, shuffle, IDs
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, Vanilla CSS |
| Backend | Node.js 20+, Express 4 |
| AI Provider | [OpenRouter](https://openrouter.ai) (GPT-4o-mini default) |
| Fonts | Space Grotesk, DM Sans (Google Fonts) |
| Storage | Browser localStorage |
| Rate Limiting | express-rate-limit (12 requests / 15 min) |
| Deployment | Vercel (serverless functions + static hosting) |

---

## 🚀 Local Development Setup

### Prerequisites

- **Node.js 20+** — [download here](https://nodejs.org)
- **OpenRouter API key** — [get one free](https://openrouter.ai/keys)

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/bhavanichellumahanthi/quick-answers.git
   cd quick-answers
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create your `.env` file**

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your API key:

   ```env
   PORT=5173
   OPENROUTER_API_KEY=your_real_openrouter_api_key_here
   OPENROUTER_MODEL=openai/gpt-4o-mini
   OPENROUTER_SITE_URL=http://localhost:5173
   ```

   > ⚠️ Do **not** prefix the key with `VITE_`. It stays server-side only.

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open the app** → [http://localhost:5173](http://localhost:5173)

### Verify Configuration

Visit [http://localhost:5173/api/health](http://localhost:5173/api/health):

```json
{
  "ok": true,
  "service": "Quick Answer",
  "configured": true
}
```

`"configured": true` means the API key is detected. If generation fails, check the terminal for detailed error messages.

---

## 🌐 Vercel Deployment

This project is pre-configured for one-click Vercel deployment.

### How It Works

- **Frontend**: Vite builds static assets into `dist/` → served by Vercel CDN
- **Backend**: `api/[...path].js` imports the Express app → runs as a Vercel serverless function
- **Routing**: `vercel.json` routes `/api/*` to the serverless function and everything else to the SPA

### Deploy Steps

1. Go to [vercel.com/new](https://vercel.com/new) and import `bhavanichellumahanthi/quick-answers`
2. Vercel auto-detects **Vite** — keep the default settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add **environment variables** before deploying:

   | Variable | Value |
   |---|---|
   | `OPENROUTER_API_KEY` | Your real OpenRouter API key |
   | `OPENROUTER_MODEL` | `openai/gpt-4o-mini` |
   | `OPENROUTER_SITE_URL` | `https://your-project.vercel.app` |

4. Click **Deploy** — takes ~1–2 minutes
5. Verify at `https://your-domain.vercel.app/api/health`

> Every `git push` to `main` triggers an automatic redeployment.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Express API + Vite dev server (hot reload) |
| `npm run build` | Build production React assets into `dist/` |
| `npm run preview` | Build + run in production mode locally |
| `npm start` | Alias for `npm run dev` |

---

## 🔐 Security & Privacy

- **API key is server-side only** — the OpenRouter key lives in `.env` (local) or Vercel environment variables (deployed). It is **never** exposed in the browser bundle.
- **No database** — all quiz history, custom questions, and active quiz state are stored in the browser's `localStorage`. Nothing syncs across devices.
- **Rate limiting** — the `/api/generate-questions` endpoint allows 12 requests per 15 minutes to prevent abuse.
- **Input validation** — both client and server validate quiz settings. The server also validates AI-generated question format before returning it.

---

## ⚠️ Limitations

- **Practice tool, not an exam platform** — the timer and answer evaluation run in the browser. Motivated users could manipulate them via DevTools.
- **AI accuracy** — AI-generated questions may contain errors. Always verify questions before using them in formal assessments.
- **Browser storage** — clearing browser data erases all saved history and custom questions.
- **Single model** — the app uses one OpenRouter model at a time (configured via `.env`). To change it, update `OPENROUTER_MODEL` and restart/redeploy.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available for educational purposes.

---

<p align="center">
  <strong>QUICK ANSWER</strong> · Built for better thinking 🧠
</p>
