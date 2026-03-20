import os
import re
import uuid
import asyncio
from urllib.parse import urlparse
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

from services.scraper import extract_article, ScraperError
from services.ai_optimizer import optimize_for_audio, AIOptimizerError
from services.tts import text_to_speech, get_available_voices, TTSError
from services.pdf_extractor import extract_pdf, PDFExtractorError

router = APIRouter(prefix="/api")

AUDIO_DIR = "/tmp"
UUID_PATTERN = re.compile(r'^[a-f0-9\-]{36}$')


class ConvertRequest(BaseModel):
    url: str
    language: str = "en"
    voice_id: Optional[str] = None
    mode: str = "full"


async def _process_and_respond(title, text, word_count, truncated, language, mode, voice_id):
    """Shared logic for URL and PDF conversion."""
    try:
        optimized_text = await asyncio.to_thread(
            optimize_for_audio, title, text, language, mode
        )
    except AIOptimizerError as e:
        return {"success": False, "error": e.message, "error_code": e.error_code}

    try:
        audio_bytes = await asyncio.to_thread(
            text_to_speech, optimized_text, voice_id, language
        )
    except TTSError as e:
        return {"success": False, "error": e.message, "error_code": e.error_code}

    job_id = str(uuid.uuid4())
    audio_path = os.path.join(AUDIO_DIR, f"readaloud_{job_id}.mp3")
    with open(audio_path, "wb") as f:
        f.write(audio_bytes)

    return {
        "success": True,
        "job_id": job_id,
        "title": title,
        "optimized_text": optimized_text,
        "audio_url": f"/api/audio/{job_id}",
        "word_count": word_count,
        "truncated": truncated,
    }


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
        article = await asyncio.to_thread(extract_article, req.url)
    except ScraperError as e:
        return {"success": False, "error": e.message, "error_code": e.error_code}

    return await _process_and_respond(
        article["title"], article["text"], article["word_count"],
        article.get("truncated", False), req.language, req.mode, req.voice_id,
    )


@router.post("/convert-pdf")
async def convert_pdf(
    file: UploadFile = File(...),
    language: str = Form("en"),
    voice_id: Optional[str] = Form(None),
    mode: str = Form("full"),
):
    filename = file.filename or "document.pdf"
    if not filename.lower().endswith(".pdf"):
        return {
            "success": False,
            "error": "Please upload a PDF file",
            "error_code": "INVALID_PDF",
        }

    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:
        return {
            "success": False,
            "error": "PDF file is too large (max 20MB)",
            "error_code": "PDF_TOO_LARGE",
        }

    try:
        article = await asyncio.to_thread(extract_pdf, file_bytes, filename)
    except PDFExtractorError as e:
        return {"success": False, "error": e.message, "error_code": e.error_code}

    return await _process_and_respond(
        article["title"], article["text"], article["word_count"],
        article.get("truncated", False), language, mode, voice_id,
    )


@router.get("/audio/{job_id}")
async def get_audio(job_id: str, request: Request):
    if not UUID_PATTERN.match(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    audio_path = os.path.join(AUDIO_DIR, f"readaloud_{job_id}.mp3")
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio not found")

    file_size = os.path.getsize(audio_path)
    range_header = request.headers.get("range")

    if range_header:
        # Parse "bytes=START-END"
        range_val = range_header.replace("bytes=", "")
        parts = range_val.split("-")
        start = int(parts[0])
        end = int(parts[1]) if parts[1] else file_size - 1
        end = min(end, file_size - 1)
        length = end - start + 1

        with open(audio_path, "rb") as f:
            f.seek(start)
            data = f.read(length)

        return Response(
            content=data,
            status_code=206,
            media_type="audio/mpeg",
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(length),
            },
        )

    return FileResponse(
        audio_path,
        media_type="audio/mpeg",
        filename=f"readaloud_{job_id}.mp3",
        headers={"Accept-Ranges": "bytes", "Content-Length": str(file_size)},
    )


@router.get("/voices")
async def list_voices():
    try:
        voices = await asyncio.to_thread(get_available_voices)
        return {"success": True, "voices": voices}
    except TTSError as e:
        return {"success": False, "error": e.message, "error_code": e.error_code}
