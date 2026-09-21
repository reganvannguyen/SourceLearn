import io
from pathlib import Path
from unittest.mock import patch, AsyncMock, MagicMock
import pytest
from app.models.document import Document
from app.models.notebook import Notebook


def test_get_documents_notebook_not_found(client):
    res = client.get("/notebooks/999/documents")
    assert res.status_code == 404
    assert res.json()["detail"] == "Notebook not found"


def test_get_documents_empty_and_populated(client, db_session):
    # Create notebook
    nb = Notebook(name="Biology 101")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    # Empty
    res = client.get(f"/notebooks/{nb.id}/documents")
    assert res.status_code == 200
    assert res.json() == []

    # Add a document
    doc = Document(notebook_id=nb.id, file_name="mitosis.pdf", file_path="/fake/path/mitosis.pdf")
    db_session.add(doc)
    db_session.commit()

    res = client.get(f"/notebooks/{nb.id}/documents")
    assert res.status_code == 200
    docs = res.json()
    assert len(docs) == 1
    assert docs[0]["file_name"] == "mitosis.pdf"
    assert docs[0]["notebook_id"] == nb.id


def test_upload_document(client, db_session, tmp_path):
    nb = Notebook(name="Physics")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    mock_extract = AsyncMock(return_value=[{"page_number": 1, "text": "Quantum mechanics basics"}])
    mock_chunk = MagicMock(return_value=[{"page_number": 1, "text": "Quantum mechanics basics"}])
    mock_embed = MagicMock(return_value=[{"page_number": 1, "text": "Quantum mechanics basics", "embedding": [0.0] * 768}])

    fake_pdf = b"%PDF-1.4 test file content"

    with patch("app.api.documents.UPLOAD_DIR", tmp_path), \
         patch("app.api.documents.extract_pdf", mock_extract), \
         patch("app.api.documents.chunk_pages", mock_chunk), \
         patch("app.api.documents.embed_chunks", mock_embed):

        res = client.post(
            f"/notebooks/{nb.id}/documents",
            files={"file": ("quantum.pdf", io.BytesIO(fake_pdf), "application/pdf")},
        )

        assert res.status_code == 200
        data = res.json()
        assert data["file_name"] == "quantum.pdf"
        assert data["notebook_id"] == nb.id
        assert "document_id" in data

        # Check file was saved in tmp_path
        saved_files = list(tmp_path.glob("*quantum.pdf"))
        assert len(saved_files) == 1
        assert saved_files[0].read_bytes() == fake_pdf


def test_get_document_file(client, db_session, tmp_path):
    nb = Notebook(name="Chemistry")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    doc_file = tmp_path / "sample.pdf"
    doc_file.write_bytes(b"%PDF-1.4 chemistry text")

    doc = Document(notebook_id=nb.id, file_name="sample.pdf", file_path=str(doc_file))
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    res = client.get(f"/documents/{doc.id}/file")
    assert res.status_code == 200
    assert res.content == b"%PDF-1.4 chemistry text"


def test_delete_document(client, db_session, tmp_path):
    nb = Notebook(name="History")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    doc_file = tmp_path / "ancient.pdf"
    doc_file.write_bytes(b"%PDF-1.4 ancient history")

    doc = Document(notebook_id=nb.id, file_name="ancient.pdf", file_path=str(doc_file))
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    del_res = client.delete(f"/documents/{doc.id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Confirm file removed
    assert not doc_file.exists()

    # Confirm record removed
    assert db_session.get(Document, doc.id) is None

