import socket
from urllib.parse import urlparse

import requests
from readability import Document
from bs4 import BeautifulSoup

from utils.text_processing import clean_text, count_words, truncate_to_word_limit


class ScraperError(Exception):
    def __init__(self, message: str, error_code: str):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


def _is_private_ip(hostname: str) -> bool:
    """Block requests to private/internal IPs (SSRF protection)."""
    try:
        ip = socket.gethostbyname(hostname)
        import ipaddress
        addr = ipaddress.ip_address(ip)
        return addr.is_private or addr.is_loopback or addr.is_reserved
    except (socket.gaierror, ValueError):
        return False


def extract_article(url: str) -> dict:
    parsed = urlparse(url)
    if _is_private_ip(parsed.hostname or ""):
        raise ScraperError("Cannot fetch internal URLs", "FETCH_FAILED")

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; ReadAloud/1.0)"
    }

    try:
        response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
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

    return {
        "title": title,
        "text": text,
        "word_count": word_count,
        "truncated": truncated,
    }
