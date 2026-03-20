import os
import io
import requests
from pydub import AudioSegment

# Force pydub to use imageio-ffmpeg's bundled ffmpeg (snap ffmpeg can't access /tmp)
try:
    import imageio_ffmpeg
    AudioSegment.converter = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    pass

from utils.text_processing import chunk_text


class TTSError(Exception):
    def __init__(self, message: str, error_code: str = "TTS_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


KOKORO_VOICES = {
    # American English - Female
    "af_alloy": "Alloy (US Female)",
    "af_aoede": "Aoede (US Female)",
    "af_bella": "Bella (US Female)",
    "af_heart": "Heart (US Female)",
    "af_jessica": "Jessica (US Female)",
    "af_kore": "Kore (US Female)",
    "af_nicole": "Nicole (US Female)",
    "af_nova": "Nova (US Female)",
    "af_river": "River (US Female)",
    "af_sarah": "Sarah (US Female)",
    "af_sky": "Sky (US Female)",
    # American English - Male
    "am_adam": "Adam (US Male)",
    "am_echo": "Echo (US Male)",
    "am_eric": "Eric (US Male)",
    "am_fenrir": "Fenrir (US Male)",
    "am_liam": "Liam (US Male)",
    "am_michael": "Michael (US Male)",
    "am_onyx": "Onyx (US Male)",
    "am_puck": "Puck (US Male)",
    "am_santa": "Santa (US Male)",
    # British English - Female
    "bf_alice": "Alice (British Female)",
    "bf_emma": "Emma (British Female)",
    "bf_isabella": "Isabella (British Female)",
    "bf_lily": "Lily (British Female)",
    # British English - Male
    "bm_daniel": "Daniel (British Male)",
    "bm_fable": "Fable (British Male)",
    "bm_george": "George (British Male)",
    "bm_lewis": "Lewis (British Male)",
    # Spanish
    "ef_dora": "Dora (Spanish Female)",
    "em_alex": "Alex (Spanish Male)",
    "em_santa": "Santa (Spanish Male)",
    # French
    "ff_siwis": "Siwis (French Female)",
    # Hindi
    "hf_alpha": "Alpha (Hindi Female)",
    "hf_beta": "Beta (Hindi Female)",
    "hm_omega": "Omega (Hindi Male)",
    "hm_psi": "Psi (Hindi Male)",
    # Italian
    "if_sara": "Sara (Italian Female)",
    "im_nicola": "Nicola (Italian Male)",
    # Japanese
    "jf_alpha": "Alpha (Japanese Female)",
    "jf_gongitsune": "Gongitsune (Japanese Female)",
    "jf_nezumi": "Nezumi (Japanese Female)",
    "jf_tebukuro": "Tebukuro (Japanese Female)",
    "jm_kumo": "Kumo (Japanese Male)",
    # Portuguese
    "pf_dora": "Dora (Portuguese Female)",
    "pm_alex": "Alex (Portuguese Male)",
    "pm_santa": "Santa (Portuguese Male)",
    # Chinese
    "zf_xiaobei": "Xiaobei (Chinese Female)",
    "zf_xiaoni": "Xiaoni (Chinese Female)",
    "zf_xiaoxiao": "Xiaoxiao (Chinese Female)",
    "zf_xiaoyi": "Xiaoyi (Chinese Female)",
    "zm_yunjian": "Yunjian (Chinese Male)",
    "zm_yunxi": "Yunxi (Chinese Male)",
    "zm_yunxia": "Yunxia (Chinese Male)",
    "zm_yunyang": "Yunyang (Chinese Male)",
}


_kokoro_pipelines = {}


def _get_kokoro_pipeline(lang_code):
    """Cache KPipeline instances to avoid reloading the model on every call."""
    if lang_code not in _kokoro_pipelines:
        from kokoro import KPipeline
        _kokoro_pipelines[lang_code] = KPipeline(lang_code=lang_code)
    return _kokoro_pipelines[lang_code]


def _kokoro_tts(text: str, voice: str = "af_heart") -> bytes:
    import soundfile as sf
    import numpy as np

    voice_prefix = voice[:2] if voice else "af"
    lang_code = voice_prefix[0] if voice_prefix else "a"
    pipeline = _get_kokoro_pipeline(lang_code)

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
    # If a Kokoro voice is selected or no voice specified, use Kokoro directly
    if not voice_id or voice_id in KOKORO_VOICES:
        return _kokoro_tts(text, voice=voice_id if voice_id in KOKORO_VOICES else "af_heart")

    # ElevenLabs voice selected, try it with Kokoro fallback
    try:
        return _elevenlabs_tts(text, voice_id, language)
    except TTSError as e:
        print(f"[TTS] ElevenLabs failed, falling back to Kokoro: {e.message}")
        return _kokoro_tts(text, voice="af_heart")


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
