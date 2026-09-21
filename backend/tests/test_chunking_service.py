import pytest
from app.services.chunking_service import chunk_pages


def test_chunk_pages_basic():
    pages = [
        {"page_number": 1, "text": "This is page one content about machine learning."},
        {"page_number": 2, "text": "This is page two content about deep neural networks."},
    ]
    chunks = chunk_pages(pages)
    assert len(chunks) == 2
    assert chunks[0]["page_number"] == 1
    assert "machine learning" in chunks[0]["text"]
    assert chunks[1]["page_number"] == 2
    assert "neural networks" in chunks[1]["text"]


def test_chunk_pages_large_text():
    # Long text over 500 chars should be split into multiple chunks
    paragraph = "SourceLearn provides intelligent document understanding. " * 30
    assert len(paragraph) > 1000

    pages = [{"page_number": 1, "text": paragraph}]
    chunks = chunk_pages(pages)

    assert len(chunks) > 1
    for chunk in chunks:
        assert chunk["page_number"] == 1
        assert len(chunk["text"]) <= 550  # 500 chunk_size + reasonable boundary


def test_chunk_pages_empty_or_whitespace():
    pages = [
        {"page_number": 1, "text": ""},
        {"page_number": 2, "text": "   \n\n   "},
    ]
    chunks = chunk_pages(pages)
    assert chunks == []


def test_chunk_pages_mixed():
    pages = [
        {"page_number": 1, "text": "Short intro on page one."},
        {"page_number": 2, "text": ""},
        {"page_number": 3, "text": "Detailed conclusions on page three."},
    ]
    chunks = chunk_pages(pages)
    assert len(chunks) == 2
    assert chunks[0]["page_number"] == 1
    assert chunks[1]["page_number"] == 3

