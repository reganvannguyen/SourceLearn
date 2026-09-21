import io
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
    doc = Document(notebook_id=nb.id, file_name="mitosis.pdf", s3_key="notebooks/1/documents/mitosis.pdf")
    db_session.add(doc)
    db_session.commit()

    res = client.get(f"/notebooks/{nb.id}/documents")
    assert res.status_code == 200
    docs = res.json()
    assert len(docs) == 1
    assert docs[0]["file_name"] == "mitosis.pdf"
    assert docs[0]["notebook_id"] == nb.id


def test_upload_document(client, db_session):
    nb = Notebook(name="Physics")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    mock_extract = AsyncMock(return_value=[{"page_number": 1, "text": "Quantum mechanics basics"}])
    mock_chunk = MagicMock(return_value=[{"page_number": 1, "text": "Quantum mechanics basics"}])
    mock_embed = MagicMock(return_value=[{"page_number": 1, "text": "Quantum mechanics basics", "embedding": [0.0] * 768}])
    mock_upload = MagicMock()

    fake_pdf = b"%PDF-1.4 test file content"

    with patch("app.api.documents.upload_file", mock_upload), \
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

        # Check S3 upload was invoked with file bytes and s3_key
        mock_upload.assert_called_once()
        args, kwargs = mock_upload.call_args
        assert args[0] == fake_pdf
        assert "notebooks/" in args[1]
        assert "quantum.pdf" in args[1]


def test_get_document_file(client, db_session):
    nb = Notebook(name="Chemistry")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    doc = Document(notebook_id=nb.id, file_name="sample.pdf", s3_key="notebooks/1/documents/sample.pdf")
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    fake_bytes = b"%PDF-1.4 chemistry text"
    with patch("app.api.documents.get_file", return_value=fake_bytes):
        res = client.get(f"/documents/{doc.id}/file")
        assert res.status_code == 200
        assert res.content == fake_bytes


def test_delete_document(client, db_session):
    nb = Notebook(name="History")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    doc = Document(notebook_id=nb.id, file_name="ancient.pdf", s3_key="notebooks/1/documents/ancient.pdf")
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    mock_delete = MagicMock()
    with patch("app.api.documents.delete_file", mock_delete):
        del_res = client.delete(f"/documents/{doc.id}")
        assert del_res.status_code == 200
        assert del_res.json()["success"] is True

        # Confirm S3 delete was called
        mock_delete.assert_called_once_with("notebooks/1/documents/ancient.pdf")

        # Confirm record removed from database
        assert db_session.get(Document, doc.id) is None


def test_upload_document_failure_cleans_up_s3(client, db_session):
    nb = Notebook(name="Art History")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    mock_upload = MagicMock()
    mock_delete = MagicMock()
    mock_extract = AsyncMock(return_value=[{"page_number": 1, "text": "Renaissance art"}])
    mock_chunk = MagicMock(return_value=[{"page_number": 1, "text": "Renaissance art"}])
    # Simulate an error during embedding generation
    mock_embed = MagicMock(side_effect=RuntimeError("Embedding service offline"))

    fake_pdf = b"%PDF-1.4 test failure content"

    with patch("app.api.documents.upload_file", mock_upload), \
         patch("app.api.documents.delete_file", mock_delete), \
         patch("app.api.documents.extract_pdf", mock_extract), \
         patch("app.api.documents.chunk_pages", mock_chunk), \
         patch("app.api.documents.embed_chunks", mock_embed):

        with pytest.raises(RuntimeError, match="Embedding service offline"):
            client.post(
                f"/notebooks/{nb.id}/documents",
                files={"file": ("renaissance.pdf", io.BytesIO(fake_pdf), "application/pdf")},
            )

        # S3 upload was attempted
        mock_upload.assert_called_once()
        # S3 delete cleanup was called to prevent orphan files
        mock_delete.assert_called_once()
        # Database has no orphaned document record
        assert db_session.query(Document).filter_by(notebook_id=nb.id).first() is None


def test_delete_document_s3_failure_preserves_db(client, db_session):
    nb = Notebook(name="Architecture")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    doc = Document(notebook_id=nb.id, file_name="blueprints.pdf", s3_key="notebooks/1/blueprints.pdf")
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    with patch("app.api.documents.delete_file", side_effect=Exception("S3 service unavailable")):
        del_res = client.delete(f"/documents/{doc.id}")
        assert del_res.status_code == 502
        assert "Failed to delete document from storage" in del_res.json()["detail"]

        # Ensure database row is NOT deleted when S3 delete fails
        assert db_session.get(Document, doc.id) is not None

