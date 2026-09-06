from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

#make engine object. Knows how and manages db connections 
engine = create_engine(
    "postgresql+psycopg://myuser:mysecurepassword@localhost:5432/vectordb",
    echo=True
)


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
