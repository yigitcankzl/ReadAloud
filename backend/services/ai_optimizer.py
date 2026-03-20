import os
import anthropic


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
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise AIOptimizerError("ANTHROPIC_API_KEY not configured")

    client = anthropic.Anthropic(api_key=api_key)

    system = SYSTEM_PROMPT.replace("[TITLE]", title)
    if language == "tr":
        system += "\n\nOutput the optimized text in Turkish."

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=system,
            messages=[
                {"role": "user", "content": text}
            ],
        )
        return message.content[0].text
    except Exception as e:
        raise AIOptimizerError(f"AI processing failed: {e}")
