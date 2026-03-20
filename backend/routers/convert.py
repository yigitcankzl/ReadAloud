import os
import uuid
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from services.scraper import extract_article, ScraperError
from services.ai_optimizer import optimize_for_audio, AIOptimizerError
from services.tts import text_to_speech, get_available_voices, TTSError

router = APIRouter(prefix="/api")

AUDIO_DIR = "/tmp"


class ConvertRequest(BaseModel):
    url: str
    language: str = "en"
    voice_id: str = None


@router.post("/convert")
async def convert_url(req: ConvertRequest):
    parsed = urlparse(req.url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return {
            "success": False,
            "error": "Please enter a valid URL starting with http:// or https://",
            "error_code": "INVALID_URL",
        }

    try:
        article = extract_article(req.url)
    except ScraperError as e:
        return {"success": False, "error": e.message, "error_code": e.error_code}

    try:
        optimized_text = optimize_for_audio(
            article["title"], article["text"], req.language
        )
    except AIOptimizerError as e:
        return {"success": False, "error": e.message, "error_code": e.error_code}

    try:
        audio_bytes = text_to_speech(optimized_text, req.voice_id, req.language)
    except TTSError as e:
        return {"success": False, "error": e.message, "error_code": e.error_code}

    job_id = str(uuid.uuid4())
    audio_path = os.path.join(AUDIO_DIR, f"readaloud_{job_id}.mp3")
    with open(audio_path, "wb") as f:
        f.write(audio_bytes)

    return {
        "success": True,
        "job_id": job_id,
        "title": article["title"],
        "original_text": article["text"],
        "optimized_text": optimized_text,
        "audio_url": f"/api/audio/{job_id}",
        "word_count": article["word_count"],
        "truncated": article.get("truncated", False),
    }


@router.get("/audio/{job_id}")
async def get_audio(job_id: str):
    audio_path = os.path.join(AUDIO_DIR, f"readaloud_{job_id}.mp3")
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio not found")
    return FileResponse(audio_path, media_type="audio/mpeg", filename=f"readaloud_{job_id}.mp3")


@router.get("/voices")
async def list_voices():
    try:
        voices = get_available_voices()
        return {"success": True, "voices": voices}
    except TTSError as e:
        return {"success": False, "error": e.message, "error_code": e.error_code}
