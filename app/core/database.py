import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config.settings import settings
from app.db.models import Base

# Ensure DB folder exists
os.makedirs(os.path.dirname(settings.DB_PATH), exist_ok=True)

SQLALCHEMY_DATABASE_URL = f"sqlite:///{settings.DB_PATH}"

# Connect args for SQLite WAL (Write-Ahead Logging) mode & high concurrency
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    # Enable WAL mode for SQLite performance
    with engine.connect() as conn:
        conn.exec_driver_sql("PRAGMA journal_mode=WAL;")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
