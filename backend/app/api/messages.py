from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.document import Document
from app.models.message import Message
from app.models.notebook import Notebook
from app.schemas.message import CitationItem, MessageCreateRequest, MessageResponse
from app.schemas.question import AnswerResponse
from app.services.llm_service import generate_answer
from app.services.retrieval_service import retrieve_chunks

router = APIRouter(tags=["messages"])


@router.get(
    "/notebooks/{notebook_id}/messages",
    response_model=List[MessageResponse],
)
def get_notebook_messages(notebook_id: int, db: Session = Depends(get_db)):
    notebook = db.get(Notebook, notebook_id)
    if not notebook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notebook with id {notebook_id} not found",
        )

    stmt = (
        select(Message)
        .where(Message.notebook_id == notebook_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
    )
    messages = db.scalars(stmt).all()

    response: List[MessageResponse] = []
    for msg in messages:
        citations = []
        if msg.citations and isinstance(msg.citations, list):
            for c in msg.citations:
                if isinstance(c, dict):
                    citations.append(CitationItem(**c))

        response.append(
            MessageResponse(
                id=msg.id,
                notebook_id=msg.notebook_id,
                sender=msg.sender,
                content=msg.content,
                citations=citations,
                created_at=msg.created_at,
            )
        )

    return response


@router.post(
    "/notebooks/{notebook_id}/messages",
    response_model=MessageResponse,
)
def create_notebook_message(
    notebook_id: int,
    request: MessageCreateRequest,
    db: Session = Depends(get_db),
):
    notebook = db.get(Notebook, notebook_id)
    if not notebook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notebook with id {notebook_id} not found",
        )

    question_text = request.content.strip()
    if not question_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty",
        )

    # 1. Save user question
    user_message = Message(
        notebook_id=notebook_id,
        sender="user",
        content=question_text,
        citations=[],
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # 2. Check if notebook has any documents
    doc_count_stmt = select(Document.id).where(Document.notebook_id == notebook_id)
    has_docs = db.scalars(doc_count_stmt).first() is not None

    if not has_docs:
        no_docs_reply = (
            "You haven't uploaded any study materials for this notebook yet. "
            "Please upload a PDF in the sidebar so I can answer questions about it!"
        )
        assistant_message = Message(
            notebook_id=notebook_id,
            sender="assistant",
            content=no_docs_reply,
            citations=[],
        )
        db.add(assistant_message)
        db.commit()
        db.refresh(assistant_message)

        return MessageResponse(
            id=assistant_message.id,
            notebook_id=assistant_message.notebook_id,
            sender=assistant_message.sender,
            content=assistant_message.content,
            citations=[],
            created_at=assistant_message.created_at,
        )

    # 3. Retrieve chunks scoped to this notebook
    chunks = retrieve_chunks(db, question_text, notebook_id=notebook_id, limit=5)

    if not chunks:
        no_chunks_reply = (
            "I couldn't find any relevant information in the uploaded materials "
            "for this notebook to answer your question."
        )
        assistant_message = Message(
            notebook_id=notebook_id,
            sender="assistant",
            content=no_chunks_reply,
            citations=[],
        )
        db.add(assistant_message)
        db.commit()
        db.refresh(assistant_message)

        return MessageResponse(
            id=assistant_message.id,
            notebook_id=assistant_message.notebook_id,
            sender=assistant_message.sender,
            content=assistant_message.content,
            citations=[],
            created_at=assistant_message.created_at,
        )

    # 4. Generate answer using LLM
    answer_raw = generate_answer(question_text, chunks)
    result = AnswerResponse.model_validate_json(answer_raw)

    # 5. Build rich citation items for cited chunk IDs
    chunk_map = {chunk.id: chunk for chunk in chunks}
    cited_chunk_ids = [cid for cid in result.citations if cid in chunk_map]

    # Pre-fetch document names
    doc_ids = {chunk_map[cid].document_id for cid in cited_chunk_ids}
    doc_map = {}
    if doc_ids:
        docs = db.scalars(select(Document).where(Document.id.in_(doc_ids))).all()
        doc_map = {doc.id: doc.file_name for doc in docs}

    citation_items: List[CitationItem] = []
    for cid in cited_chunk_ids:
        chunk = chunk_map[cid]
        snippet = chunk.text.strip().replace("\n", " ")
        if len(snippet) > 280:
            snippet = snippet[:280] + "…"

        citation_items.append(
            CitationItem(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                file_name=doc_map.get(chunk.document_id, "Document"),
                page_number=chunk.page_number,
                snippet=snippet,
            )
        )

    # 6. Save assistant message with citations
    citations_data = [c.model_dump() for c in citation_items]
    assistant_message = Message(
        notebook_id=notebook_id,
        sender="assistant",
        content=result.answer,
        citations=citations_data,
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    return MessageResponse(
        id=assistant_message.id,
        notebook_id=assistant_message.notebook_id,
        sender=assistant_message.sender,
        content=assistant_message.content,
        citations=citation_items,
        created_at=assistant_message.created_at,
    )
