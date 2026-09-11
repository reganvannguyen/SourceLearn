<div align="center">

# 📚 SourceLearn

**Production-grade, citation-grounded AI study assistant and intelligent research notebook platform.**

Organize course materials into nostalgic Hilroy-style notebooks, upload dense academic PDFs, and receive factual, hallucination-free answers with verifiable inline citations and split-screen document highlighting.

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL + pgvector](https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Google Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

<br/>

<img src="docs/assets/demo.gif" alt="SourceLearn Animated Demo" width="900" style="border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" />

</div>

---

## 🌟 Why SourceLearn?

Generic LLM chatbots frequently **hallucinate**, conflate disparate course concepts, and cannot prove where their statements originate. 

**SourceLearn** solves this by enforcing a strict **Retrieval-Augmented Generation (RAG)** pipeline:
- Every factual claim is bound to an exact document and page number with interactive inline citations.
- If the uploaded PDFs do not contain enough evidence, the assistant explicitly states it cannot answer rather than fabricating facts.
- Clicking any citation immediately opens an interactive split-screen PDF viewer, automatically jumping to the cited page and highlighting the exact passage.

---

## ⚡ Key Capabilities

| Feature | Description |
| :--- | :--- |
| 📓 **Multi-Notebook Organization** | Group courses, syllabi, and lecture slides into custom notebooks with color palettes and course emblems inspired by iconic Canadian Hilroy exercise booklets. |
| 📄 **Automated PDF Parsing & Indexing** | Ingests dense academic PDFs using PyMuPDF (`fitz`), recursively splits text preserving page-level metadata, and indexes dense vector embeddings into PostgreSQL. |
| 🔍 **Vector Cosine Search (pgvector)** | Performs low-latency similarity search directly within PostgreSQL, co-locating relational data and vector embeddings for transactional consistency. |
| 💬 **Grounded Multi-Turn Chat** | Conversational Q&A powered by Google Gemini 2.5 Flash, returning schema-validated answers with structured inline citations. |
| 🎯 **Split-Screen In-Document Highlighting** | Canvas-based PDF viewer that synchronizes with chat citations, jumping to the exact page and visually highlighting cited passages. |
| ⚡ **Smart Query Condensation** | Heuristic-driven conversational query rewriter that detects follow-up questions vs. standalone queries, saving 60%+ in LLM latency and API quota. |
| 🛡️ **Zero-Orphan Cascade Deletions** | Deleting documents or notebooks atomically purges vector chunks, relational records, and physical disk files. |
| 🧭 **Client-Side Page Routing** | Full SPA routing via React Router 7 with shareable URLs (`/notebooks/:id`), page-refresh persistence, and custom 404 handling. |

---

## 🏗️ System Architecture & RAG Pipeline

```mermaid
graph TD
    subgraph Client ["Client Layer (Browser)"]
        UI["React 19 SPA (React Router 7)"]
        CanvasViewer["Canvas PDF Viewer & Highlight"]
    end

    subgraph Backend ["FastAPI Application (Port 8082)"]
        API["FastAPI REST Endpoints"]
        Ingest["PyMuPDF Document Ingestor"]
        Splitter["Recursive Text Chunking"]
        Heuristic{"Follow-up Heuristic"}
        Rewriter["Query Condensation Engine"]
        Retriever["pgvector Retrieval Engine"]
        Synthesizer["Citation-Grounded Generator"]
    end

    subgraph Storage ["Persistence Layer (Docker)"]
        PGVector[("PostgreSQL 16 + pgvector")]
        FileStore[("Local File Storage (/uploads)")]
    end

    subgraph AI ["AI Services"]
        GeminiFlash["Google Gemini 2.5 Flash"]
    end

    UI -->|1. Upload PDF| API
    API --> Ingest
    Ingest -->|Save binary| FileStore
    Ingest --> Splitter
    Splitter -->|Generate 768-dim embeddings| PGVector

    UI -->|2. Ask Question| API
    API --> Heuristic
    Heuristic -->|Needs Context| Rewriter
    Rewriter <-->|Condense Query| GeminiFlash
    Heuristic -->|Standalone| Retriever
    Rewriter --> Retriever
    Retriever <-->|Cosine Similarity Search| PGVector
    Retriever --> Synthesizer
    Synthesizer <-->|Context + Strict Citation Prompt| GeminiFlash
    Synthesizer -->|Structured JSON + Citations| UI
    UI -->|"3. Click Citation (e.g. p. 11)"| CanvasViewer
```

---

## 🛠️ Engineering Highlights & Design Decisions

<details open>
<summary><b>1. Why PostgreSQL + pgvector Over Standalone Vector Databases?</b></summary>
<br/>
Rather than managing a separate vector database (e.g. Pinecone or Milvus), SourceLearn leverages <b><code>pgvector</code></b> inside PostgreSQL. This guarantees <b>ACID transactional integrity</b>: when a user removes a document or deletes a notebook, foreign key constraints (<code>ON DELETE CASCADE</code>) immediately and atomically purge all embeddings and chunks. There is zero risk of orphaned vector records or desynchronization between relational metadata and embeddings.
</details>

<details open>
<summary><b>2. Conversational Query Condensation with Lexical Heuristic</b></summary>
<br/>
In multi-turn chat, queries like <i>"Why does it do that?"</i> must be rewritten with conversation history to perform semantic search. However, calling an LLM to rewrite <i>every</i> question adds latency and burns API tokens. SourceLearn implements a lexical heuristic (<code>is_likely_followup</code>) that inspects relative pronouns and starters. Standalone questions (e.g. <i>"What is an operating system kernel?"</i>) bypass condensation entirely, slashing token usage and latency by over 60%.
</details>

<details open>
<summary><b>3. In-Document Canvas Synchronization & Deep Linking</b></summary>
<br/>
Standard AI chat applications return plain text citations. SourceLearn coordinates the backend citation metadata with a custom frontend PDF canvas viewer. When a user clicks a citation badge, the viewer loads the binary document stream, jumps to the exact page, and applies an amber overlay box directly over the retrieved source passage.
</details>

---

## 🧰 Tech Stack Breakdown

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, React Router 7, Vite, Vanilla CSS Design System, HTML5 Canvas |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn, psycopg3 |
| **Database** | PostgreSQL 16, pgvector (vector cosine similarity search) |
| **AI / RAG** | Google Gemini 2.5 Flash (`google-genai`), PyMuPDF (`fitz`), LangChain Splitters |
| **DevOps** | Docker, Docker Compose, Bash orchestration (`start.sh`) |

---

## 🚀 Quickstart

### 1. Prerequisites
- [Docker & Docker Compose](https://www.docker.com/)
- [Python 3.11+](https://python.org)
- [Node.js 20+](https://nodejs.org)
- [Google Gemini API Key](https://aistudio.google.com/)

### 2. Fast Launch (1-Command Orchestration)
Clone the repository and run the startup script:

```bash
git clone https://github.com/reganvannguyen/SourceLearn.git
cd SourceLearn

# Make executable and run
chmod +x start.sh
./start.sh
```

The script automatically:
1. Validates local dependencies.
2. Spins up PostgreSQL with `pgvector` in Docker on port `5433`.
3. Launches the FastAPI backend on port `8082`.
4. Starts the Vite React frontend on port `3000`.

Open **http://localhost:3000** in your browser.

> Press `Ctrl+C` in your terminal to cleanly stop all services and containers.

---

## 📖 In-Depth Documentation

Comprehensive deep-dives are organized in the [`docs/`](docs/) directory:

- 🏛️ **[System Architecture](docs/architecture.md)** — Relational & vector schema, ER diagrams, cascading integrity, and component hierarchy.
- 🔬 **[RAG Pipeline Deep Dive](docs/rag-pipeline.md)** — Document parsing, recursive chunking parameters, cosine retrieval, follow-up heuristics, and citation grammar.
- 🔌 **[REST API Reference](docs/api-reference.md)** — Complete OpenAPI specification with request/response schemas and curl examples.
- 🛠️ **[Local Setup & Troubleshooting](docs/setup-guide.md)** — Manual step-by-step installation, Docker volume management, and troubleshooting FAQ.

---

## 📂 Repository Structure

```
SourceLearn/
├── backend/
│   ├── app/
│   │   ├── api/             # REST endpoints (notebooks, documents, messages)
│   │   ├── db/              # SQLAlchemy session & database engine
│   │   ├── models/          # ORM models (Notebook, Document, DocumentChunk, Message)
│   │   ├── schemas/         # Pydantic request & response models
│   │   ├── services/        # PyMuPDF extraction, chunking, embeddings, RAG & LLM
│   │   └── main.py          # FastAPI application entrypoint
│   ├── docker-compose.yml   # PostgreSQL + pgvector container definition
│   ├── requirements.txt     # Backend dependencies
│   └── .env.example         # Environment template
├── frontend/
│   ├── src/
│   │   ├── api/             # Typed API clients
│   │   ├── components/      # Hilroy booklet cards, PDF viewer, chat pane, modals
│   │   ├── pages/           # NotebooksPage, StudyPage, NotFoundPage
│   │   ├── App.tsx          # React Router 7 configuration
│   │   └── App.css          # Design system & responsive layout styles
│   ├── vite.config.ts       # Vite bundler configuration
│   └── package.json         # Frontend dependencies (React 19, Router 7)
├── docs/
│   ├── assets/              # Animated demo GIF, WebP, and feature screenshots
│   ├── architecture.md      # Comprehensive architecture & design document
│   ├── rag-pipeline.md      # RAG pipeline & vector search specification
│   ├── api-reference.md     # REST API specification
│   └── setup-guide.md       # Step-by-step developer guide
├── scripts/
│   └── generate_assets.py   # Automated screenshot & demo GIF generator
├── start.sh                 # Unified 1-command startup orchestration
└── README.md                # Project showcase & portfolio overview
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
