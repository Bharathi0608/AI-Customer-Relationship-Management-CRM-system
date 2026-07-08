# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, Date, Time, DateTime
from datetime import datetime

from app.database.database import Base


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)

    hcp_name = Column(String, nullable=False)

    interaction_type = Column(String, nullable=False)

    interaction_date = Column(Date, nullable=False)

    interaction_time = Column(Time, nullable=False)

    attendees = Column(String)

    topics_discussed = Column(String)

    materials_shared = Column(String)

    samples_distributed = Column(String)

    sentiment = Column(String)

    outcomes = Column(String)

    follow_up_actions = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False) # 'user' or 'ai'
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)