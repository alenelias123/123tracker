from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float, JSON, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.db import Base
import enum

class ModeEnum(enum.Enum):
    automated = "automated"
    solo = "solo"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    auth0_sub = Column(String, unique=True, index=True)  # sub from Auth0
    email = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    mode = Column(Enum(ModeEnum), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", backref="topics")

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"))
    scheduled_for = Column(Date, nullable=False)
    day_index = Column(Integer)  # 1, 3, 7
    status = Column(String, default="scheduled")  # scheduled, completed, skipped
    completed_at = Column(DateTime(timezone=True), nullable=True)
    topic = relationship("Topic", backref="sessions")

class NotePoint(Base):
    __tablename__ = "note_points"
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"))
    point_text = Column(Text, nullable=False)
    embedding = Column(Vector(384))  # adjust dim to model
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Comparison(Base):
    __tablename__ = "comparisons"
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"))
    compared_to_session_id = Column(Integer, ForeignKey("sessions.id", ondelete="SET NULL"))
    recall_score = Column(Float)
    missed_points = Column(JSON)  # [{text, prev_point_id}]
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SoloMetric(Base):
    __tablename__ = "solo_metrics"
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"))
    percent_covered = Column(Float)
    percent_remembered = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"))
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"))
    method = Column(String, default="email")
    sent_at = Column(DateTime(timezone=True))