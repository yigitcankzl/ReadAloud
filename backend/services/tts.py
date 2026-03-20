import os
import io
import requests
from pydub import AudioSegment

from utils.text_processing import chunk_text


class TTSError(Exception):
    def __init__(self, message: str, error_code: str = "TTS_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


def text_to_speech(text: str, voice_id: str = None, language: str = "en") -> bytes:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise TTSError("ELEVENLABS_API_KEY not configured")

    if not voice_id:
        voice_id = os.getenv("DEFAULT_VOICE_ID", "rachel")

    chunks = chunk_text(text, max_chars=4500)
    audio_segments = []

    for chunk in chunks:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        payload = {
            "text": chunk,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True,
            },
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=60)
        except requests.RequestException as e:
            raise TTSError(f"TTS request failed: {e}")

        if response.status_code != 200:
            raise TTSError(f"ElevenLabs API error: {response.status_code} - {response.text}")

        audio_segments.append(response.content)

    if len(audio_segments) == 1:
        return audio_segments[0]

    combined = AudioSegment.empty()
    for audio_bytes in audio_segments:
        segment = AudioSegment.from_mp3(io.BytesIO(audio_bytes))
        combined += segment

    output = io.BytesIO()
    combined.export(output, format="mp3")
    return output.getvalue()


def get_available_voices() -> list[dict]:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise TTSError("ELEVENLABS_API_KEY not configured")

    url = "https://api.elevenlabs.io/v1/voices"
    headers = {"xi-api-key": api_key}

    try:
        response = requests.get(url, headers=headers, timeout=15)
    except requests.RequestException as e:
        raise TTSError(f"Could not fetch voices: {e}")

    if response.status_code != 200:
        raise TTSError(f"ElevenLabs API error: {response.status_code}")

    data = response.json()
    voices = []
    for voice in data.get("voices", []):
        voices.append({
            "voice_id": voice["voice_id"],
            "name": voice["name"],
            "category": voice.get("category", ""),
        })

    return voices
