import requests
from readability import Document
from bs4 import BeautifulSoup

from utils.text_processing import clean_text, split_into_paragraphs, count_words, truncate_to_word_limit


class ScraperError(Exception):
    def __init__(self, message: str, error_code: str):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


def extract_article(url: str) -> dict:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; ReadAloud/1.0)"
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)
    except requests.RequestException as e:
        raise ScraperError(f"Could not fetch the page: {e}", "FETCH_FAILED")

    if response.status_code != 200:
        raise ScraperError(
            f"Page returned status {response.status_code}",
            "FETCH_FAILED"
        )

    content_type = response.headers.get("Content-Type", "")
    if "text/html" not in content_type and "text/plain" not in content_type:
        raise ScraperError(
            "URL does not point to an HTML page",
            "INVALID_CONTENT"
        )

    doc = Document(response.text)
    title = doc.title()
    html_content = doc.summary()

    soup = BeautifulSoup(html_content, "lxml")

    for tag in soup.find_all(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    text = soup.get_text(separator='\n')
    text = clean_text(text)

    word_count = count_words(text)

    if word_count < 50:
        raise ScraperError(
            "This page doesn't have enough text content to convert",
            "CONTENT_TOO_SHORT"
        )

    truncated = False
    if word_count > 5000:
        text, truncated = truncate_to_word_limit(text, 5000)
        word_count = count_words(text)

    paragraphs = split_into_paragraphs(text)

    return {
        "title": title,
        "text": text,
        "paragraphs": paragraphs,
        "word_count": word_count,
        "truncated": truncated,
    }
