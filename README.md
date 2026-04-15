# Workloop

Workloop is a runnable Web prototype for an AI-powered personal focus dashboard. It turns the PRD flow into a single-page experience covering goals, pomodoro focus, lightweight review, AI session organization, timeline tracking, and daily summary generation.

## Stack

- Next.js 16
- TypeScript
- DeepSeek API

## Features

- Manage 1-3 goals for the day
- Set the current task and clarify it with AI before starting
- Run a 25-minute focus timer with pause, stop, and interruption logging
- Complete a lightweight review at the end of each session
- Generate an AI digest for every pomodoro record
- Build a same-day timeline and AI daily summary
- Persist local prototype state in the browser
- Load sample data for demos or clear the workspace to start fresh

## Local Setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Create a local environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Fill in the DeepSeek settings inside `.env.local`:

   ```env
   DEEPSEEK_API_KEY=your_deepseek_api_key
   DEEPSEEK_BASE_URL=https://api.deepseek.com
   DEEPSEEK_MODEL=deepseek-chat
   ```

   If you need compatibility, the code still accepts `OPENAI_API_KEY` as a fallback, but DeepSeek is now the default setup.

4. Start the app:

   ```powershell
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## AI Routes

- `POST /api/clarify-task`
- `POST /api/session-digest`
- `POST /api/daily-summary`

All three routes use the OpenAI-compatible SDK pointed at DeepSeek by default, so they require `DEEPSEEK_API_KEY`. If the key is missing or invalid, the UI keeps the workflow usable and surfaces readable error messages.

## Validation

The project currently passes:

- `npm run lint`
- `npm run build`
