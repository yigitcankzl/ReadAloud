import re


def clean_text(text: str) -> str:
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    lines = []
    for line in text.split('\n'):
        stripped = line.strip()
        if stripped:
            lines.append(stripped)
        else:
            lines.append('')
    return '\n'.join(lines).strip()


def split_into_paragraphs(text: str) -> list[str]:
    paragraphs = re.split(r'\n\s*\n', text)
    return [p.strip() for p in paragraphs if p.strip()]


def count_words(text: str) -> int:
    return len(text.split())


def truncate_to_word_limit(text: str, limit: int = 5000) -> tuple[str, bool]:
    words = text.split()
    if len(words) <= limit:
        return text, False
    truncated = ' '.join(words[:limit])
    last_period = truncated.rfind('.')
    if last_period > len(truncated) * 0.8:
        truncated = truncated[:last_period + 1]
    return truncated, True


def chunk_text(text: str, max_chars: int = 4500) -> list[str]:
    if len(text) <= max_chars:
        return [text]

    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = ""

    for para in paragraphs:
        if len(current_chunk) + len(para) + 2 <= max_chars:
            current_chunk = current_chunk + '\n\n' + para if current_chunk else para
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            if len(para) <= max_chars:
                current_chunk = para
            else:
                sentences = re.split(r'(?<=[.!?])\s+', para)
                current_chunk = ""
                for sentence in sentences:
                    if len(current_chunk) + len(sentence) + 1 <= max_chars:
                        current_chunk = current_chunk + ' ' + sentence if current_chunk else sentence
                    else:
                        if current_chunk:
                            chunks.append(current_chunk.strip())
                        current_chunk = sentence

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks
