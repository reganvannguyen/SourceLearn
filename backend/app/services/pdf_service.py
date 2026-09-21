import re
from typing import Optional, Union
import fitz
from fastapi import UploadFile

def hex_to_rgb(hex_str: str) -> tuple[float, float, float]:
    """Convert hex color string to normalized RGB float tuple (0.0 - 1.0)."""
    try:
        clean_hex = hex_str.lstrip("#")
        if len(clean_hex) == 3:
            clean_hex = "".join(c * 2 for c in clean_hex)
        if len(clean_hex) == 6:
            r = int(clean_hex[0:2], 16) / 255.0
            g = int(clean_hex[2:4], 16) / 255.0
            b = int(clean_hex[4:6], 16) / 255.0
            return (r, g, b)
    except Exception:
        pass
    return (1.0, 0.9, 0.25)


# extracting text from pdf and text from image inside pdf
async def extract_pdf(file: Union[UploadFile, bytes]) -> list[dict]:
    if isinstance(file, bytes):
        file_bytes = file
    else:
        file_bytes = await file.read()

    doc = fitz.open(
        stream=file_bytes,
        filetype="pdf"
    )
    try:
        pages = []
        for page_number, page in enumerate(doc, start=1):
            text = page.get_text()

            if not text.strip():
                text_page = page.get_textpage_ocr()
                text = page.get_text(textpage=text_page)

            pages.append({"page_number": page_number, "text": text})

        return pages
    finally:
        doc.close()


def highlight_pdf_snippet(
    pdf_source: Union[str, bytes],
    page_number: int,
    snippet: str,
    color_hex: Optional[str] = "#fde047",
) -> bytes:
    """Highlight the cited snippet on the specified page of the PDF in memory."""
    if isinstance(pdf_source, bytes):
        doc = fitz.open(stream=pdf_source, filetype="pdf")
    else:
        doc = fitz.open(pdf_source)

    try:
        if page_number < 1 or page_number > len(doc):
            return doc.tobytes()

        page = doc[page_number - 1]
        rgb = hex_to_rgb(color_hex or "#fde047")

        clean_snippet = snippet.strip().strip('"\'“”')
        if not clean_snippet:
            return doc.tobytes()

        rects: list[fitz.Rect] = []

        # 1. Direct exact search
        found = page.search_for(clean_snippet)
        if found:
            rects.extend(found)

        # 2. Search with collapsed whitespace
        if not rects:
            norm_snippet = re.sub(r"\s+", " ", clean_snippet)
            found = page.search_for(norm_snippet)
            if found:
                rects.extend(found)

        # 3. Search sentence by sentence
        if not rects:
            sentences = re.split(r"[.\n\r]+", clean_snippet)
            for s in sentences:
                s_clean = s.strip()
                if len(s_clean) > 15:
                    found = page.search_for(s_clean)
                    if found:
                        rects.extend(found)

        # 4. Search sliding word windows to handle line-wrap boundaries
        if not rects:
            words = clean_snippet.split()
            if len(words) >= 4:
                window_size = min(6, len(words))
                step = max(2, window_size // 2)
                for i in range(0, len(words) - window_size + 1, step):
                    phrase = " ".join(words[i : i + window_size])
                    found = page.search_for(phrase)
                    if found:
                        rects.extend(found)

        # Apply native PDF highlight annotations
        if rects:
            for r in rects:
                annot = page.add_highlight_annot(r)
                annot.set_colors(stroke=rgb)
                annot.update()

        return doc.tobytes(deflate=True)
    finally:
        doc.close()
