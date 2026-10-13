# Quick Answer — root `.env` edition

Quick Answer is a React + Vite quiz app with OpenRouter-generated MCQs, a timed quiz experience, results analytics, saved history, and a custom question manager. This edition removes the `server/` folder and runs the frontend and API from a **single root command**.

## Project structure

```text
quick-answer/
├── index.html
├── index.js                  # Root Node/Express API + Vite dev server
├── package.json
├── .env.example
├── .env                      # Create this locally; never commit it
├── .gitignore
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── App.css
    ├── index.css
    ├── components/
    │   ├── SetupScreen.jsx
    │   ├── QuizScreen.jsx
    │   ├── ResultsScreen.jsx
    │   ├── HistoryScreen.jsx
    │   └── QuestionManager.jsx
    ├── data/
    │   └── quizConfig.js
    └── utils/
        ├── openRouter.js
        └── quizUtils.js
```

## Requirements

- Node.js 20 or newer recommended
- An OpenRouter account and API key
- Internet access for generating questions

## Setup on Windows / VS Code

1. Extract the project ZIP and open its root folder in VS Code. The root folder is the one containing `package.json` and `index.js`.
2. In the VS Code terminal, install the dependencies:

   ```powershell
   npm install
   ```

3. Create your `.env` file from the example:

   ```powershell
   Copy-Item .env.example .env
   ```

   Then open the **root** `.env` and enter your own OpenRouter key and preferred model:

   ```env
   PORT=5173
   OPENROUTER_API_KEY=PASTE_YOUR_REAL_OPENROUTER_API_KEY_HERE
   OPENROUTER_MODEL=openai/gpt-4o-mini
   OPENROUTER_SITE_URL=http://localhost:5173
   ```

   Replace the placeholder on `OPENROUTER_API_KEY`. Do not put the key in React files or use a `VITE_` prefix. `.env` is ignored by Git.

4. Start the entire project with one command from the root folder:

   ```powershell
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173). Choose a standard, subject, difficulty, topic, and question count. When you press **Start your quiz**, the app requests MCQs from the root API, which reads the credentials from `.env`. The interface does not ask quiz users to paste an API key or choose a model.

Keep the terminal open while using the app. After changing `.env`, stop the app with `Ctrl+C` and rerun `npm run dev`.

## Check the configuration

Open [http://localhost:5173/api/health](http://localhost:5173/api/health). Expected output resembles:

```json
{
  "ok": true,
  "service": "Quick Answer",
  "configured": true
}
```

`configured: true` only indicates a non-placeholder key exists. It does not prove the key has credits or permission to use the selected model. When generation fails, read the error shown in the app and the details printed in the VS Code terminal. The app includes clearer messages for invalid keys, insufficient credits, model errors, rate limits, timeouts, and invalid AI JSON.

## Features

- OpenRouter MCQ generation based on user customisation
- Supported question counts: 5, 10, and 20
- Difficulty, standard, subject/stream, and optional topic controls
- 60-second per-question browser timer and answer locking
- Immediate answer feedback and explanations
- Score, accuracy, answer review, and timing analytics
- Resume after refresh using local browser storage
- Browser-saved quiz history
- Custom Question Lab with create/edit/delete
- Dark animated gradient and responsive glassmorphism UI

## Build / production preview

Build the React assets:

```powershell
npm run build
```

To build and run the app as a production-style preview on the same root Node process:

```powershell
npm run preview
```

Keep `.env` on the machine running the Node app; never upload it to a static hosting provider or commit it to source control. A production deployment needs a server or serverless function to protect the key.

## Deploy to Vercel

The Vercel function in `api/[...path].js` serves the Express API while Vercel serves the built Vite frontend. The OpenRouter key stays in Vercel's server-side environment variables.

1. In the [Vercel dashboard](https://vercel.com/), choose **Add New → Project** and import `bhavanichellumahanthi/quick-answers` from GitHub.
2. Keep the detected Vite framework settings, with `npm run build` as the build command and `dist` as the output directory.
3. Before deploying, add these environment variables in the project settings. Select every environment where you want the app available:

   ```env
   OPENROUTER_API_KEY=your_real_openrouter_api_key
   OPENROUTER_MODEL=openai/gpt-4o-mini
   OPENROUTER_SITE_URL=https://your-project.vercel.app
   ```

   Do not add the key to frontend settings prefixed with `VITE_`, commit it to GitHub, or set it in `.env.example`.
4. Click **Deploy**. Vercel will also redeploy automatically when you push changes to the connected GitHub repository.
5. After deployment, visit `https://your-project.vercel.app/api/health`. The response should include `"ok": true` and `"configured": true`.

If you add or change an environment variable later, redeploy the project for it to take effect. Keep the OpenRouter key private.

## Security and limitations

- This project sends only quiz configuration to the local API; the OpenRouter key is not exposed in the browser bundle. The key is held server-side by the Node process.
- This all-in-one root setup still uses a small Node/Express API in `index.js`; no separate `server/` directory or second terminal is needed. A frontend-only app cannot safely hide an API key stored in `.env`, because Vite client environment variables are bundled for browsers.
- Quiz answers, active attempts, custom questions, and history are stored in browser storage. They do not sync across devices. The quiz timer and answer evaluation happen in the browser, so this should be treated as a practice app rather than a secure high-stakes exam platform.
- AI generated questions can be inaccurate. Verify questions before using them for formal assessments.
