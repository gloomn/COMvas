import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, Integer, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class TokenStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    USED = "USED"
    EXPIRED = "EXPIRED"

class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    value = Column(String(64), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    status = Column(Enum(TokenStatus), default=TokenStatus.ACTIVE, nullable=False)

class ProcessingTask(Base):
    __tablename__ = "processing_tasks"

    task_id = Column(String(64), primary_key=True)
    token_value = Column(String(64), nullable=False)
    status = Column(String(32), default="QUEUED", nullable=False) # QUEUED, PROCESSING, COMPLETED, FAILED
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

class ArchiveImage(Base):
    __tablename__ = "archive_images"
    id = Column(Integer, primary_key=True, autoincrement=True)
    image_type = Column(String(32), nullable=False) # "CHARACTER" or "STATIC"
    image_base64 = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
