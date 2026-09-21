import pytest


def test_create_and_get_notebook(client):
    # 1. Create a new notebook
    response = client.post(
        "/notebooks/",
        json={"name": "Operating Systems", "color": "#3b82f6", "icon": "cpu"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Operating Systems"
    assert data["color"] == "#3b82f6"
    assert data["icon"] == "cpu"
    assert "id" in data
    notebook_id = data["id"]

    # 2. Get specific notebook
    get_res = client.get(f"/notebooks/{notebook_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == notebook_id
    assert get_res.json()["name"] == "Operating Systems"

    # 3. List notebooks
    list_res = client.get("/notebooks/")
    assert list_res.status_code == 200
    notebooks = list_res.json()
    assert len(notebooks) >= 1
    assert any(nb["id"] == notebook_id for nb in notebooks)


def test_get_notebook_not_found(client):
    response = client.get("/notebooks/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Notebook not found"


def test_update_notebook(client):
    # Create notebook
    res = client.post("/notebooks/", json={"name": "Math 101"})
    notebook_id = res.json()["id"]

    # Update name and color
    patch_res = client.patch(
        f"/notebooks/{notebook_id}",
        json={"name": "Advanced Calculus", "color": "#10b981"},
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["name"] == "Advanced Calculus"
    assert updated["color"] == "#10b981"

    # Try updating with empty name -> should 400
    err_res = client.patch(f"/notebooks/{notebook_id}", json={"name": "   "})
    assert err_res.status_code == 400
    assert "cannot be empty" in err_res.json()["detail"]


def test_delete_notebook(client):
    res = client.post("/notebooks/", json={"name": "To Delete"})
    notebook_id = res.json()["id"]

    del_res = client.delete(f"/notebooks/{notebook_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
    assert del_res.json()["deleted_notebook_id"] == notebook_id

    # Confirm it is no longer found
    check_res = client.get(f"/notebooks/{notebook_id}")
    assert check_res.status_code == 404


def test_delete_notebook_with_documents(client, db_session):
    from unittest.mock import patch, MagicMock
    from app.models.document import Document

    res = client.post("/notebooks/", json={"name": "Notebook With Docs"})
    notebook_id = res.json()["id"]

    doc = Document(notebook_id=notebook_id, file_name="sample.pdf", s3_key="notebooks/1/sample.pdf")
    db_session.add(doc)
    db_session.commit()

    mock_delete = MagicMock()
    with patch("app.api.notebooks.delete_file", mock_delete):
        del_res = client.delete(f"/notebooks/{notebook_id}")
        assert del_res.status_code == 200
        assert del_res.json()["success"] is True
        mock_delete.assert_called_once_with("notebooks/1/sample.pdf")


def test_delete_notebook_s3_failure_preserves_db(client, db_session):
    from unittest.mock import patch
    from app.models.document import Document
    from app.models.notebook import Notebook

    res = client.post("/notebooks/", json={"name": "Protected Notebook"})
    notebook_id = res.json()["id"]

    doc = Document(notebook_id=notebook_id, file_name="lecture.pdf", s3_key="notebooks/1/lecture.pdf")
    db_session.add(doc)
    db_session.commit()

    with patch("app.api.notebooks.delete_file", side_effect=Exception("S3 connection error")):
        del_res = client.delete(f"/notebooks/{notebook_id}")
        assert del_res.status_code == 502
        assert "Failed to delete document 'lecture.pdf' from storage" in del_res.json()["detail"]

        # Ensure notebook and documents remain intact
        assert db_session.get(Notebook, notebook_id) is not None
        assert db_session.get(Document, doc.id) is not None

