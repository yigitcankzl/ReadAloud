<div align="center">

# ReadAloud

### Access Any Content. Just Listen.

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Gemini](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)

An AI-powered web accessibility tool that converts any webpage or PDF into natural-sounding audio.

**Built for MidNight Hackers 2026**

</div>

---

## The Problem

**1.3 billion** people worldwide live with visual impairments. **700 million** have dyslexia. Yet **96%** of web pages fail basic accessibility standards.

Most content on the internet is designed to be *read*, not *heard*. This creates a massive barrier for people who rely on audio to access information.

## Our Solution

ReadAloud bridges this gap. Paste any URL or upload a PDF — our AI extracts the content, optimizes it for listening, and generates natural speech. No accounts, no fees, no barriers.

## Features

- **URL & PDF Input** — Paste any link or drag & drop a PDF file
- **Full Read / Summary** — Listen to the complete content or just the key points
- **50+ Natural Voices** — Kokoro-82M (free, local) with ElevenLabs fallback
- **Waveform Visualizer** — Real-time audio visualization via Web Audio API
- **Smart AI Processing** — Adapts to news, blogs, docs, forums, papers
- **Playback Controls** — Speed, skip, volume, seek, MP3 download
- **100% Free** — Gemini AI + Kokoro TTS, zero API costs

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌───────────┐
│  URL / PDF  │────>│  Extraction  │────>│  Gemini AI  │────>│ Kokoro    │
│  Input      │     │  & Cleaning  │     │  Optimizer  │     │ TTS       │
└─────────────┘     └──────────────┘     └─────────────┘     └───────────┘
                     readability-lxml      Full / Summary       50+ voices
                     BeautifulSoup         Content-aware         24kHz audio
                     PyMuPDF (PDF)         optimization          MP3 export
```

## Tech Stack

<table>
<tr><td><b>Layer</b></td><td><b>Technology</b></td></tr>
<tr>
<td>Frontend</td>
<td>

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000?style=flat-square&logo=shadcnui&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)

</td>
</tr>
<tr>
<td>Backend</td>
<td>

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)

</td>
</tr>
<tr>
<td>AI & TTS</td>
<td>

![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)
![Kokoro](https://img.shields.io/badge/Kokoro--82M-FF6F00?style=flat-square&logo=huggingface&logoColor=white)
![ElevenLabs](https://img.shields.io/badge/ElevenLabs-000?style=flat-square&logoColor=white)

</td>
</tr>
<tr>
<td>Extraction</td>
<td>

![BeautifulSoup](https://img.shields.io/badge/BeautifulSoup-333?style=flat-square)
![PyMuPDF](https://img.shields.io/badge/PyMuPDF-333?style=flat-square)
![readability](https://img.shields.io/badge/readability--lxml-333?style=flat-square)

</td>
</tr>
</table>

## Quick Start

### Prerequisites

```bash
sudo apt install espeak-ng ffmpeg
```

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
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

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key ([free tier](https://ai.google.dev)) |
| `ELEVENLABS_API_KEY` | No | ElevenLabs key (optional, Kokoro is the free default) |
| `DEFAULT_VOICE_ID` | No | Default ElevenLabs voice ID |

## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/convert` | Convert URL to audio |
| `POST` | `/api/convert-pdf` | Convert PDF to audio |
| `GET` | `/api/audio/{job_id}` | Download generated MP3 |
| `GET` | `/api/voices` | List all available voices |

<details>
<summary><b>POST /api/convert</b></summary>

```json
{
  "url": "https://example.com/article",
  "mode": "full",
  "voice_id": "af_heart"
}
```

Mode options: `full` (complete content) or `summary` (key points only)
</details>

<details>
<summary><b>POST /api/convert-pdf</b></summary>

Multipart form data:
- `file` — PDF file (max 20MB)
- `mode` — `full` or `summary`
- `voice_id` — Voice identifier (optional)
</details>

## Future Scope

- [ ] Real-time text highlighting synced with audio playback
- [ ] Browser extension for one-click conversion
- [ ] Multi-language support
- [ ] Batch URL processing
- [ ] Podcast RSS feed generation

## License

MIT

---

<div align="center">

**MidNight Hackers 2026**

</div>
