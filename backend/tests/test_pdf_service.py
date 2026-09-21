import pytest
import fitz
from app.services.pdf_service import hex_to_rgb, extract_pdf, highlight_pdf_snippet


def test_hex_to_rgb():
    # 6-digit hex
    assert hex_to_rgb("#ff0000") == (1.0, 0.0, 0.0)
    assert hex_to_rgb("00ff00") == (0.0, 1.0, 0.0)
    assert hex_to_rgb("#0000ff") == (0.0, 0.0, 1.0)

    # 3-digit hex
    r, g, b = hex_to_rgb("#f00")
    assert pytest.approx(r, 0.01) == 1.0
    assert pytest.approx(g, 0.01) == 0.0
    assert pytest.approx(b, 0.01) == 0.0

    # Invalid fallback
    assert hex_to_rgb("invalid") == (1.0, 0.9, 0.25)
    assert hex_to_rgb("") == (1.0, 0.9, 0.25)


@pytest.fixture
def sample_pdf_bytes():
    """Create a minimal 2-page in-memory PDF using PyMuPDF."""
    doc = fitz.open()
    page1 = doc.new_page()
    page1.insert_text((50, 100), "Welcome to SourceLearn. Fast RAG assistant for students.")
    page2 = doc.new_page()
    page2.insert_text((50, 100), "Second page discusses operating system kernels and virtual memory.")
    pdf_data = doc.tobytes()
    doc.close()
    return pdf_data


@pytest.mark.asyncio
async def test_extract_pdf_from_bytes(sample_pdf_bytes):
    pages = await extract_pdf(sample_pdf_bytes)
    assert len(pages) == 2
    assert pages[0]["page_number"] == 1
    assert "Welcome to SourceLearn" in pages[0]["text"]
    assert pages[1]["page_number"] == 2
    assert "virtual memory" in pages[1]["text"]


def test_highlight_pdf_snippet_exact(sample_pdf_bytes):
    highlighted = highlight_pdf_snippet(
        file_path=sample_pdf_bytes,
        page_number=1,
        snippet="Fast RAG assistant",
        color_hex="#ff0000",
    )
    assert isinstance(highlighted, bytes)
    assert len(highlighted) > 0

    # Verify highlight annotation was actually added
    doc = fitz.open(stream=highlighted, filetype="pdf")
    page = doc[0]
    annots = list(page.annots())
    assert len(annots) >= 1
    assert annots[0].type[0] == fitz.PDF_ANNOT_HIGHLIGHT
    doc.close()


def test_highlight_pdf_snippet_invalid_page(sample_pdf_bytes):
    # Page 0 is invalid (1-indexed)
    out = highlight_pdf_snippet(sample_pdf_bytes, page_number=0, snippet="SourceLearn")
    assert isinstance(out, bytes)

    # Page 99 out of range
    out_oor = highlight_pdf_snippet(sample_pdf_bytes, page_number=99, snippet="SourceLearn")
    assert isinstance(out_oor, bytes)


def test_highlight_pdf_snippet_empty(sample_pdf_bytes):
    out = highlight_pdf_snippet(sample_pdf_bytes, page_number=1, snippet="")
    assert isinstance(out, bytes)
    assert len(out) > 0
    doc = fitz.open(stream=out, filetype="pdf")
    page = doc[0]
    assert list(page.annots()) == []
    doc.close()
