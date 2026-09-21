from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.api.documents import router as documents_router
from app.api.notebooks import router as notebooks_router
from app.api.messages import router as messages_router
from app.db.base import Base
from app.db.database import engine
import app.models.document
import app.models.document_chunk
import app.models.notebook
import app.models.message


def init_db():
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE notebooks ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT '#aa3bff'")
        )
        connection.execute(
            text("ALTER TABLE notebooks ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'book'")
        ) 



@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://d3kmtqljhqewdz.cloudfront.net",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router)
app.include_router(notebooks_router)
app.include_router(messages_router)
