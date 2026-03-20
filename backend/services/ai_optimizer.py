import os
import requests


class AIOptimizerError(Exception):
    def __init__(self, message: str, error_code: str = "AI_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


SYSTEM_PROMPT = """You are a content adapter that converts written articles into text optimized for audio listening. Rules:

1. Keep ALL factual content — do not remove or summarize information
2. Shorten sentences longer than 25 words into multiple shorter sentences
3. Remove visual-only references: "click here", "see image above", "as shown below", "[1]", "(source)", URLs
4. Convert bullet lists into flowing sentences with transitions
5. Add brief transitions between sections: "Moving on to...", "Now, regarding...", "Another key point is..."
6. Spell out abbreviations on first use
7. Convert "e.g." to "for example", "i.e." to "that is", "etc." to "and so on"
8. Remove URLs and email addresses from the text
9. Start with: "This article is titled: [TITLE]."
10. End with: "That concludes this article."
11. Output ONLY the optimized text — no explanations, no markdown formatting"""


def optimize_for_audio(title: str, text: str, language: str = "en") -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise AIOptimizerError("GEMINI_API_KEY not configured")

    system = SYSTEM_PROMPT.replace("[TITLE]", title)
    if language == "tr":
        system += "\n\nOutput the optimized text in Turkish."

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    payload = {
        "system_instruction": {
            "parts": [{"text": system}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": text}]
            }
        ],
        "generationConfig": {
            "maxOutputTokens": 4096,
            "temperature": 0.7,
        },
    }

    try:
        response = requests.post(url, json=payload, timeout=60)
    except requests.RequestException as e:
        raise AIOptimizerError(f"AI request failed: {e}")

    if response.status_code != 200:
        raise AIOptimizerError(f"Gemini API error: {response.status_code} - {response.text}")

    data = response.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise AIOptimizerError("Unexpected response from Gemini API")
