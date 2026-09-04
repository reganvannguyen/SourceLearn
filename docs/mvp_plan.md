# Study Assistant MVP Plan

## 1. Define the Problem

Users upload study materials and ask questions that are answered only from those sources, with citations to the supporting material.

If the uploaded sources do not contain enough information to answer the question, the system should clearly say that there is not enough information in the provided sources.

---

## 2. Define the MVP

1. Upload one or more PDFs
2. Extract text from the PDFs
3. Split the extracted text into chunks
4. Generate embeddings for each chunk
5. Store the chunks and embeddings
6. Ask a question
7. Retrieve the most relevant chunks using vector similarity search
8. Generate an answer grounded only in the retrieved source material
9. Show citations for the supporting material
10. If the sources do not contain enough evidence, respond that there is not enough information in the uploaded material

---

## 3. User Flow

1. Create a notebook
2. Upload one or more PDFs
3. Wait for the documents to finish processing
4. Ask a question
5. Receive an answer based only on the uploaded sources
6. View citations associated with the answer
7. View the relevant source passage used for each citation

### Citation UX

For the MVP, a citation should include:

- Document filename
- Page number
- Relevant source passage

Example:

> Horizontal scaling distributes workloads across multiple servers. [1]

**[1] Lecture4.pdf — Page 12**

> "Horizontal scaling involves adding additional machines to distribute workload..."

Opening the original PDF at the correct page and highlighting the exact passage can be added later as a V2 feature.

---

## 4. Architecture

### Frontend

- React
- TypeScript
- Tailwind CSS

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- REST API

### Database

- PostgreSQL
- pgvector

### AI

- Embedding API
- LLM API

### Document Processing

- PDF text extraction
- Text chunking
- Embedding generation
- Vector similarity search

### High-Level Flow

    React + TypeScript
            |
            | REST API
            v
         FastAPI
            |
            +-------------------+
            |                   |
            v                   v
     PostgreSQL             LLM API
     + pgvector          Embedding API
            |
            v
    Document Chunks

---

## 5. Data Model

### Notebook

- `id`
- `title`
- `created_at`

### Document

- `id`
- `notebook_id`
- `filename`
- `status`

Possible document statuses:

- `processing`
- `ready`
- `failed`

### DocumentChunk

- `id`
- `document_id`
- `page_number`
- `text`
- `embedding`

### Message

- `id`
- `notebook_id`
- `role`
- `content`
- `created_at`

Possible roles:

- `user`
- `assistant`

### Citations

For the MVP, citations do not need their own database table.

Citations can be generated when an answer is created and returned as part of the API response.

Example response:

    {
      "answer": "Horizontal scaling adds additional machines to distribute workload.",
      "citations": [
        {
          "document_id": 4,
          "document_chunk_id": 27,
          "filename": "lecture4.pdf",
          "page_number": 12,
          "text": "Horizontal scaling involves adding additional machines..."
        }
      ]
    }

If citations need to be permanently associated with stored messages later, a `MessageCitation` table can be added.

### MessageCitation

- `message_id`
- `document_chunk_id`

This is not required for the initial MVP.

---

## 6. API Endpoints

### Notebooks

Create a notebook:

    POST /notebooks

Get a notebook:

    GET /notebooks/{notebook_id}

Optional later:

    GET /notebooks

### Documents

Upload a document to a notebook:

    POST /notebooks/{notebook_id}/documents

Get document information and processing status:

    GET /documents/{document_id}

### Questions

Ask a question about the contents of a notebook:

    POST /notebooks/{notebook_id}/questions

Example response:

    {
      "answer": "The answer generated from the uploaded material.",
      "citations": [
        {
          "document_id": 1,
          "document_chunk_id": 5,
          "filename": "lecture1.pdf",
          "page_number": 7,
          "text": "Relevant supporting source text..."
        }
      ]
    }

### Messages

Get conversation history for a notebook:

    GET /notebooks/{notebook_id}/messages
