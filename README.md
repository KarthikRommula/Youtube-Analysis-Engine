# YouTube Analysis Engine

A single-page React dashboard that fetches the comment threads of any public YouTube video and turns them into actionable insights — sentiment breakdowns, topic distribution, engagement stats, and AI-style content recommendations mined directly from viewer requests.

Paste a YouTube URL, click **Analyze Video**, and the app pulls up to 100 top-level comments via the YouTube Data API v3 and renders interactive charts and summaries in the browser. All analysis runs client-side; no backend is required.

## Features

- **URL parsing** — extracts the 11-character video ID from a wide range of YouTube URL formats (`watch?v=`, `youtu.be/`, `/embed/`, `/v/`, etc.).
- **Comment ingestion** — retrieves up to 100 top-level comment threads (author, text, likes, publish date, reply count) from the YouTube Data API v3.
- **Sentiment analysis** — a lightweight keyword-based classifier labels each comment as positive, neutral, or negative and aggregates the totals.
- **Topic detection** — buckets comments into Tutorial, Review, Question, Suggestion, and Technical categories using keyword matching.
- **Content recommendations** — scans comments for request patterns (e.g. "can you make", "tutorial on", "review of") and surfaces the most-liked, de-duplicated content ideas.
- **Engagement metrics** — total comments, total likes, total replies, and a derived engagement rate (likes per comment).
- **Interactive dashboard** — tabbed UI (Overview, Sentiment Analysis, Topic Analysis, Comments) with pie and bar charts powered by Recharts, plus "most engaging" and per-sentiment comment highlights.
- **Responsive design** — styled with Tailwind CSS and Lucide icons; the Vite dev server is exposed on the local network for testing on other devices.

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Framework    | React 19                            |
| Build tool   | Vite 6                              |
| Charts       | Recharts                            |
| Icons        | lucide-react                        |
| Styling      | Tailwind CSS 3 + PostCSS + Autoprefixer |
| Linting      | ESLint 9 (flat config)              |
| Data source  | YouTube Data API v3 (`commentThreads`) |

## How It Works

1. The user submits a YouTube video URL through the search form.
2. `extractVideoId` validates the URL and pulls out the video ID.
3. `fetchComments` calls the YouTube Data API v3 `commentThreads` endpoint (`maxResults=100`) and maps each thread into a normalized comment object.
4. Each comment is scored by `simpleSentimentAnalysis` (positive/negative keyword counting).
5. `analyzeComments` aggregates the results into:
   - basic stats (comments, likes, replies, engagement rate),
   - sentiment distribution,
   - topic distribution (`extractTopics`),
   - content ideas (`generateContentIdeas`),
   - recent and top comments.
6. The computed `dashboardData` drives the tabbed dashboard views, rendered with Recharts and Tailwind components.

All processing happens in the browser within a single component — there is no server, database, or persistence layer.

## Project Structure

```
Youtube-Analysis-Engine/
├── index.html                 # Vite HTML entry point
├── package.json               # Dependencies and scripts
├── vite.config.js             # Vite + React plugin config (host: 0.0.0.0)
├── tailwind.config.js         # Tailwind content paths
├── postcss.config.js          # PostCSS plugins
├── eslint.config.js           # ESLint flat config
├── public/                    # Static assets
└── src/
    ├── main.jsx               # React root / app bootstrap
    ├── App.jsx                # Renders YouTubeDashboard
    ├── index.css              # Global styles (Tailwind)
    ├── App.css                # Component styles
    ├── assets/                # Local assets
    └── components/
        └── YouTubeDashboard.jsx  # Core: fetching, analysis, and UI
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- A **YouTube Data API v3** key from the [Google Cloud Console](https://console.cloud.google.com/) (enable the *YouTube Data API v3* and create an API key)

## Installation

```bash
git clone https://github.com/<your-username>/Youtube-Analysis-Engine.git
cd Youtube-Analysis-Engine
npm install
```

## Configuration

The application calls the YouTube Data API v3 and requires an API key.

> **Security note:** the API key is currently hard-coded in `src/components/YouTubeDashboard.jsx` (the `apiKey` constant inside `fetchComments`). Replace it with your own key before use. Because this is a client-side app, any key shipped to the browser is publicly visible — restrict the key in the Google Cloud Console (by HTTP referrer and to the YouTube Data API) and consider moving it to a Vite environment variable, e.g.:

```js
const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
```

Then create a `.env` file in the project root:

```env
VITE_YOUTUBE_API_KEY=your_youtube_data_api_v3_key
```

## Usage

Start the development server:

```bash
npm run dev
```

Open the URL printed in the terminal (Vite is configured with `host: 0.0.0.0`, so the dev server is also reachable from other devices on your network). Paste a YouTube video URL into the search box and click **Analyze Video** to view the dashboard.

## Available Scripts

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the Vite development server (HMR)  |
| `npm run build`   | Build the production bundle              |
| `npm run preview` | Preview the production build locally     |
| `npm run lint`    | Run ESLint over the project              |

## Limitations

- Only **top-level comments** are analyzed (replies are counted but not classified).
- Sentiment and topic detection use simple keyword matching, not a trained model — results are approximate.
- A maximum of 100 comments is fetched per video (no pagination).
- The app does not fetch video-level statistics (views, video likes); metrics are derived from comment data only.
