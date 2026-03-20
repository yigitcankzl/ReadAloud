# ReadAloud — Turn Any Web Page Into a Podcast

> An AI-powered web accessibility tool that converts any web page into natural-sounding audio.

## Problem

1.3 billion people worldwide live with visual impairments. 700 million have dyslexia. Yet 96% of web pages fail basic accessibility standards. ReadAloud bridges this gap by turning any URL into a natural, listenable audio experience.

## How It Works

1. Paste any article URL
2. AI extracts and cleans the content (removes ads, menus, visual clutter)
3. AI optimizes the text for listening (shorter sentences, natural transitions)
4. ElevenLabs generates natural human-like speech
5. Listen in-browser or download as MP3

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Vite |
| Backend | Python, FastAPI |
| Content Extraction | readability-lxml, BeautifulSoup |
| AI Processing | Google Gemini API |
| Text-to-Speech | ElevenLabs API |

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your API keys
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `DEFAULT_VOICE_ID` | Default ElevenLabs voice ID |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/convert` | Convert a URL to audio |
| `GET` | `/api/audio/{job_id}` | Get generated audio file |
| `GET` | `/api/voices` | List available voices |

### POST /api/convert

```json
{
  "url": "https://example.com/article",
  "language": "en",
  "voice_id": "rachel"
}
```

## Built For

MidNight Hackers 2026 — Devpost Hackathon

## License

MIT
