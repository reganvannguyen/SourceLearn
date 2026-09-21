import json
from unittest.mock import patch, MagicMock
import pytest
from app.models.document import Document
from app.models.message import Message
from app.models.notebook import Notebook
from app.schemas.question import AnswerResponse


def test_get_messages_notebook_not_found(client):
    res = client.get("/notebooks/9999/messages")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"]


def test_get_messages_with_citations(client, db_session):
    nb = Notebook(name="AI History")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    msg = Message(
        notebook_id=nb.id,
        sender="assistant",
        content="Deep learning started gaining traction around 2012 [1].",
        citations=[
            {
                "chunk_id": 1,
                "document_id": 10,
                "file_name": "ai_history.pdf",
                "page_number": 5,
                "snippet": "AlexNet won ImageNet in 2012.",
            }
        ],
    )
    db_session.add(msg)
    db_session.commit()

    res = client.get(f"/notebooks/{nb.id}/messages")
    assert res.status_code == 200
    messages = res.json()
    assert len(messages) == 1
    assert messages[0]["content"] == msg.content
    assert len(messages[0]["citations"]) == 1
    assert messages[0]["citations"][0]["chunk_id"] == 1
    assert messages[0]["citations"][0]["file_name"] == "ai_history.pdf"


def test_post_message_empty_content(client, db_session):
    nb = Notebook(name="Empty Test")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    res = client.post(f"/notebooks/{nb.id}/messages", json={"content": "   "})
    assert res.status_code == 400
    assert "cannot be empty" in res.json()["detail"]


def test_post_message_no_documents_reply(client, db_session):
    nb = Notebook(name="No Docs Notebook")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    res = client.post(f"/notebooks/{nb.id}/messages", json={"content": "What is machine learning?"})
    assert res.status_code == 200
    data = res.json()
    assert data["sender"] == "assistant"
    assert "haven't uploaded any study materials" in data["content"]
    assert data["citations"] == []

    # Check both user question and assistant answer are saved in DB
    history = db_session.query(Message).filter_by(notebook_id=nb.id).all()
    assert len(history) == 2
    assert history[0].sender == "user"
    assert history[1].sender == "assistant"


def test_post_message_no_relevant_chunks(client, db_session):
    nb = Notebook(name="Docs Notebook")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    # Add a document so has_docs is True
    doc = Document(notebook_id=nb.id, file_name="notes.pdf", file_path="/fake/notes.pdf")
    db_session.add(doc)
    db_session.commit()

    with patch("app.api.messages.condense_query", side_effect=lambda q, **kw: q), \
         patch("app.api.messages.retrieve_chunks", return_value=[]):

        res = client.post(f"/notebooks/{nb.id}/messages", json={"content": "Something unrelated"})
        assert res.status_code == 200
        data = res.json()
        assert data["sender"] == "assistant"
        assert "couldn't find any relevant information" in data["content"]


def test_post_message_success_with_citations(client, db_session):
    nb = Notebook(name="OS Notebook")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    doc = Document(notebook_id=nb.id, file_name="os_lecture.pdf", file_path="/fake/os.pdf")
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    fake_chunk = MagicMock()
    fake_chunk.id = 101
    fake_chunk.document_id = doc.id
    fake_chunk.page_number = 4
    fake_chunk.text = "A process is a program in execution with its own virtual address space."

    mock_answer_json = json.dumps({
        "answer": "A process has its own virtual address space [101].",
        "citations": [101],
    })

    with patch("app.api.messages.condense_query", side_effect=lambda q, **kw: q), \
         patch("app.api.messages.retrieve_chunks", return_value=[fake_chunk]), \
         patch("app.api.messages.generate_answer", return_value=mock_answer_json):

        res = client.post(f"/notebooks/{nb.id}/messages", json={"content": "What is a process?"})
        assert res.status_code == 200
        data = res.json()
        assert data["sender"] == "assistant"
        assert "[101]" in data["content"]
        assert len(data["citations"]) == 1
        citation = data["citations"][0]
        assert citation["chunk_id"] == 101
        assert citation["document_id"] == doc.id
        assert citation["file_name"] == "os_lecture.pdf"
        assert citation["page_number"] == 4


def test_post_message_rate_limit_error(client, db_session):
    nb = Notebook(name="Rate Limit NB")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    doc = Document(notebook_id=nb.id, file_name="notes.pdf", file_path="/fake.pdf")
    db_session.add(doc)
    db_session.commit()

    fake_chunk = MagicMock(id=1, document_id=doc.id, page_number=1, text="Text")

    with patch("app.api.messages.condense_query", side_effect=lambda q, **kw: q), \
         patch("app.api.messages.retrieve_chunks", return_value=[fake_chunk]), \
         patch("app.api.messages.generate_answer", side_effect=Exception("429 RESOURCE_EXHAUSTED")):

        res = client.post(f"/notebooks/{nb.id}/messages", json={"content": "Explain again"})
        assert res.status_code == 429
        assert "rate limit reached" in res.json()["detail"]


def test_delete_notebook_messages(client, db_session):
    nb = Notebook(name="Chat NB")
    db_session.add(nb)
    db_session.commit()
    db_session.refresh(nb)

    m1 = Message(notebook_id=nb.id, sender="user", content="Hi")
    m2 = Message(notebook_id=nb.id, sender="assistant", content="Hello")
    db_session.add_all([m1, m2])
    db_session.commit()

    del_res = client.delete(f"/notebooks/{nb.id}/messages")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
    assert del_res.json()["deleted_count"] == 2

    # Check messages are gone
    remaining = db_session.query(Message).filter_by(notebook_id=nb.id).all()
    assert len(remaining) == 0

