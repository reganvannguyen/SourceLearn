import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://myuser:mysecurepassword@localhost:5432/vectordb",
)

# Normalize postgresql:// to postgresql+psycopg:// if needed
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# make engine object. Knows how and manages db connections
engine = create_engine(DATABASE_URL, echo=True)



Session_local = sessionmaker(
    bind = engine,
    autoflush = False,
    autocommit = False
)


def get_db():
    db = Session_local()
    try:
        yield db
    finally:
        db.close()
