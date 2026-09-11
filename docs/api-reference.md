# REST API Reference

Complete specification for the SourceLearn REST API powered by FastAPI.

**Base URL**: `http://localhost:8082`  
**Interactive Swagger UI**: `http://localhost:8082/docs`  
**ReDoc Specification**: `http://localhost:8082/redoc`  

---

## 1. Notebooks API (`/notebooks`)

### List All Notebooks
Retrieves all notebooks ordered by creation date descending.

- **Method**: `GET /notebooks/`
- **Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Operating Systems",
    "color": "#7eaed7",
    "icon": "code",
    "created_at": "2026-09-11T12:00:00Z"
  }
]
```

---

### Get Notebook Details
Retrieves metadata for a specific notebook.

- **Method**: `GET /notebooks/{notebook_id}`
- **Response**: `200 OK`
```json
{
  "id": 1,
  "name": "Operating Systems",
  "color": "#7eaed7",
  "icon": "code",
  "created_at": "2026-09-11T12:00:00Z"
}
```
- **Errors**: `404 Not Found` if the notebook does not exist.

---

### Create Notebook
Creates a new notebook workspace.

- **Method**: `POST /notebooks/`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "name": "Discrete Mathematics",
  "color": "#fbc02d",
  "icon": "math"
}
```
- **Response**: `201 Created` / `200 OK`

---

### Update Notebook
Updates details (name, color, icon) for an existing notebook.

- **Method**: `PATCH /notebooks/{notebook_id}`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "name": "CS300 - Advanced Operating Systems",
  "color": "#4caf50"
}
```
- **Response**: `200 OK`
- **Errors**: `400 Bad Request` if name is empty; `404 Not Found` if notebook does not exist.

---

### Delete Notebook
Deletes a notebook, all associated PDF files from disk, vector embeddings, chunks, and message history.

- **Method**: `DELETE /notebooks/{notebook_id}`
- **Response**: `200 OK`
```json
{
  "success": true,
  "deleted_notebook_id": 1
}
```

---

## 2. Documents API (`/notebooks/{id}/documents` & `/documents`)

### List Documents in Notebook
Retrieves all uploaded documents belonging to a notebook.

- **Method**: `GET /notebooks/{notebook_id}/documents/`
- **Response**: `200 OK`
```json
[
  {
    "document_id": 10,
    "file_name": "Lecture1_Introduction.pdf",
    "notebook_id": 1,
    "upload_date": "2026-09-11T12:15:00Z"
  }
]
```

---

### Upload & Index Document
Uploads a PDF file, extracts page-by-page text with PyMuPDF, chunks the text, computes embeddings, and stores vectors in PostgreSQL.

- **Method**: `POST /notebooks/{notebook_id}/documents/`
- **Headers**: `Content-Type: multipart/form-data`
- **Form Data**:
  - `file`: PDF file binary
- **Response**: `200 OK`
```json
{
  "document_id": 11,
  "file_name": "Operating_Systems_Chapter2.pdf",
  "notebook_id": 1,
  "upload_date": "2026-09-11T12:20:00Z"
}
```
- **Errors**: `400 Bad Request` if file is not a valid PDF.

---

### Stream / Download Document File
Serves the raw PDF file for rendering in the client's split-screen canvas viewer.

- **Method**: `GET /documents/{document_id}/file`
- **Response**: `200 OK` with `Content-Type: application/pdf`
- **Errors**: `404 Not Found` if document or file on disk does not exist.

---

### Delete Document
Deletes a document, removes the PDF file from disk, and cascades vector chunk deletions.

- **Method**: `DELETE /documents/{document_id}`
- **Response**: `200 OK`
```json
{
  "success": true,
  "deleted_document_id": 11
}
```

---

## 3. Messages & AI Assistant API (`/notebooks/{id}/messages`)

### Get Chat History
Fetches chronological conversation history for a notebook.

- **Method**: `GET /notebooks/{notebook_id}/messages/`
- **Response**: `200 OK`
```json
[
  {
    "id": "1",
    "sender": "user",
    "content": "What is an operating system?",
    "citations": []
  },
  {
    "id": "2",
    "sender": "assistant",
    "content": "An operating system manages computer hardware and provides common services [10].",
    "citations": [
      {
        "document_id": 10,
        "file_name": "Lecture1_Introduction.pdf",
        "page_number": 3,
        "snippet": "An operating system acts an intermediary between the user and computer hardware..."
      }
    ]
  }
]
```

---

### Send Question (Grounded RAG)
Processes a user query with conversational context, performs vector similarity retrieval over the notebook's documents, and synthesizes a grounded answer with inline citations.

- **Method**: `POST /notebooks/{notebook_id}/messages/`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "content": "How does context switching work in this architecture?"
}
```
- **Response**: `200 OK`
```json
{
  "id": "3",
  "sender": "assistant",
  "content": "Context switching saves the execution state of the active process and restores the state of the scheduled process [12].",
  "citations": [
    {
      "document_id": 10,
      "file_name": "Lecture1_Introduction.pdf",
      "page_number": 7,
      "snippet": "When a context switch occurs, the kernel saves the context of the old process in its PCB..."
    }
  ]
}
```

---

### Clear Chat History
Purges conversation history for a specific notebook while preserving uploaded documents and embeddings.

- **Method**: `DELETE /notebooks/{notebook_id}/messages/`
- **Response**: `200 OK`
```json
{
  "success": true,
  "notebook_id": 1
}
```
