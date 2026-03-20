import fitz  # PyMuPDF

from utils.text_processing import clean_text, split_into_paragraphs, count_words, truncate_to_word_limit


class PDFExtractorError(Exception):
    def __init__(self, message: str, error_code: str = "PDF_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


def extract_pdf(file_bytes: bytes, filename: str = "document.pdf") -> dict:
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception:
        raise PDFExtractorError("Could not open this PDF file", "INVALID_PDF")

    if doc.page_count == 0:
        raise PDFExtractorError("This PDF has no pages", "CONTENT_TOO_SHORT")

    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()

    text = "\n\n".join(text_parts)
    text = clean_text(text)

    word_count = count_words(text)

    if word_count < 50:
        raise PDFExtractorError(
            "This PDF doesn't have enough text content to convert",
            "CONTENT_TOO_SHORT",
        )

    truncated = False
    if word_count > 5000:
        text, truncated = truncate_to_word_limit(text, 5000)
        word_count = count_words(text)

    title = filename.rsplit(".", 1)[0] if "." in filename else filename
    paragraphs = split_into_paragraphs(text)

    return {
        "title": title,
        "text": text,
        "paragraphs": paragraphs,
        "word_count": word_count,
        "truncated": truncated,
    }
