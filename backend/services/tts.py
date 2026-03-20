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


KOKORO_VOICES = {
    "af_heart": "Heart (Female)",
    "af_alloy": "Alloy (Female)",
    "af_bella": "Bella (Female)",
    "af_nova": "Nova (Female)",
    "af_sarah": "Sarah (Female)",
    "af_sky": "Sky (Female)",
    "am_adam": "Adam (Male)",
    "am_echo": "Echo (Male)",
    "am_eric": "Eric (Male)",
    "am_michael": "Michael (Male)",
    "am_liam": "Liam (Male)",
    "bf_alice": "Alice (British Female)",
    "bf_emma": "Emma (British Female)",
    "bm_daniel": "Daniel (British Male)",
    "bm_george": "George (British Male)",
}


def _kokoro_tts(text: str, voice: str = "af_heart", language: str = "en") -> bytes:
    from kokoro import KPipeline
    import soundfile as sf
    import numpy as np

    lang_code = "a" if language != "tr" else "a"
    pipeline = KPipeline(lang_code=lang_code)

    all_audio = []
    for _, _, audio in pipeline(text, voice=voice):
        all_audio.append(audio)

    if not all_audio:
        raise TTSError("Kokoro produced no audio output")

    combined = np.concatenate(all_audio)

    wav_buf = io.BytesIO()
    sf.write(wav_buf, combined, 24000, format="WAV")
    wav_buf.seek(0)

    segment = AudioSegment.from_wav(wav_buf)
    mp3_buf = io.BytesIO()
    segment.export(mp3_buf, format="mp3", bitrate="192k")
    return mp3_buf.getvalue()


def _elevenlabs_tts(text: str, voice_id: str, language: str = "en") -> bytes:
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
            print(f"[TTS] ElevenLabs error on chunk: {response.status_code} - {response.text[:300]}")
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


def text_to_speech(text: str, voice_id: str = None, language: str = "en") -> bytes:
    # Try ElevenLabs first, fallback to Kokoro
    try:
        return _elevenlabs_tts(text, voice_id, language)
    except TTSError as e:
        print(f"[TTS] ElevenLabs failed, falling back to Kokoro: {e.message}")
        kokoro_voice = voice_id if voice_id in KOKORO_VOICES else "af_heart"
        return _kokoro_tts(text, voice=kokoro_voice, language=language)


def get_available_voices() -> list[dict]:
    voices = []

    # Try ElevenLabs voices
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if api_key:
        try:
            url = "https://api.elevenlabs.io/v1/voices"
            headers = {"xi-api-key": api_key}
            response = requests.get(url, headers=headers, timeout=15)
            if response.status_code == 200:
                data = response.json()
                for voice in data.get("voices", []):
                    voices.append({
                        "voice_id": voice["voice_id"],
                        "name": voice["name"],
                        "category": voice.get("category", ""),
                    })
        except Exception:
            pass

    # Always add Kokoro voices
    for vid, name in KOKORO_VOICES.items():
        voices.append({
            "voice_id": vid,
            "name": f"Kokoro - {name}",
            "category": "kokoro",
        })

    return voices
