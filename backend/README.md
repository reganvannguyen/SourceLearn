# SourceLearn Backend

The backend for SourceLearn is an asynchronous **FastAPI** service coordinating document ingestion, text chunking, vector embedding generation, pgvector similarity search, and conversational LLM response generation with Google Gemini 2.5 Flash.

---

## Tech Stack
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with `pgvector`
- **ORM / Engine**: SQLAlchemy 2.0 with `psycopg3`
- **PDF Extraction**: PyMuPDF (`fitz`)
- **Text Chunking**: LangChain `RecursiveCharacterTextSplitter`
- **Vector Embeddings & LLM**: Google Gemini 2.5 Flash (`google-genai`)
- **Data Validation**: Pydantic v2

---

## Directory Structure
```
backend/
├── app/
│   ├── api/             # REST Route handlers
│   │   ├── notebooks.py # Notebook CRUD
│   │   ├── documents.py # PDF upload, streaming, delete
│   │   └── messages.py  # Chat history, RAG synthesis
│   ├── db/              # Database engine & session maker
│   ├── models/          # SQLAlchemy ORM models
│   ├── schemas/         # Pydantic request/response models
│   ├── services/        # Business logic & AI pipelines
│   │   ├── pdf_service.py        # PyMuPDF text extraction
│   │   ├── chunking_service.py   # Recursive text chunking
│   │   ├── embedding_service.py  # Vector generation
│   │   ├── retrieval_service.py  # Cosine similarity search
│   │   └── llm_service.py        # Query condensation & answer synthesis
│   └── main.py          # FastAPI application entrypoint
├── docker-compose.yml   # PostgreSQL + pgvector container definition
├── requirements.txt     # Python package dependencies
└── .env.example         # Environment template
```

---

## Local Development
Refer to the [Root Setup Guide](../docs/setup-guide.md) for full instructions.

### Start with Docker Compose
Start PostgreSQL and the FastAPI backend together:
```bash
docker compose up -d --build
```
- Interactive Swagger documentation: `http://localhost:8082/docs`
- Adminer Database GUI: `http://localhost:8080`

### Running Tests
Run the automated pytest suite (using in-memory SQLite and offline mocks):
```bash
source .venv/bin/activate
pytest tests -v
```


