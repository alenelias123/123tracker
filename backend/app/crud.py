from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from app.models import User, Topic, Session as SessionModel, NotePoint, Comparison, SoloMetric, ModeEnum
from app.ai.embeddings import get_embedding

def get_or_create_user(db: Session, auth0_sub: str, email: str) -> User:
    """Get existing user or create new one."""
    user = db.query(User).filter(User.auth0_sub == auth0_sub).first()
    if not user:
        user = User(auth0_sub=auth0_sub, email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def create_topic(db: Session, user_id: int, title: str, description: str, mode: str) -> Topic:
    """Create topic and auto-create 3 sessions for days 1, 3, 7."""
    mode_enum = ModeEnum.automated if mode == "automated" else ModeEnum.solo
    topic = Topic(
        user_id=user_id,
        title=title,
        description=description,
        mode=mode_enum
    )
    db.add(topic)
    db.flush()  # Get topic.id
    
    # Auto-create 3 sessions
    today = date.today()
    sessions_data = [
        (1, today + timedelta(days=1)),
        (3, today + timedelta(days=3)),
        (7, today + timedelta(days=7))
    ]
    
    for day_index, scheduled_for in sessions_data:
        session = SessionModel(
            topic_id=topic.id,
            day_index=day_index,
            scheduled_for=scheduled_for,
            status="scheduled"
        )
        db.add(session)
    
    db.commit()
    db.refresh(topic)
    return topic

def get_user_topics(db: Session, user_id: int) -> List[Topic]:
    """Get all topics for a user."""
    return db.query(Topic).filter(Topic.user_id == user_id).all()

def get_session_by_id(db: Session, session_id: int) -> Optional[SessionModel]:
    """Get session by ID."""
    return db.query(SessionModel).filter(SessionModel.id == session_id).first()

def reschedule_session(db: Session, session_id: int, new_date: date):
    """Reschedule a session to a new date."""
    session = get_session_by_id(db, session_id)
    if session:
        session.scheduled_for = new_date
        db.commit()
        db.refresh(session)
    return session

def complete_session(db: Session, session_id: int):
    """Mark session as completed."""
    session = get_session_by_id(db, session_id)
    if session:
        session.status = "completed"
        session.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(session)
    return session

def skip_session(db: Session, session_id: int):
    """Mark session as skipped."""
    session = get_session_by_id(db, session_id)
    if session:
        session.status = "skipped"
        db.commit()
        db.refresh(session)
    return session

def add_note_points(db: Session, session_id: int, points_with_embeddings: List[dict]):
    """Add note points with embeddings to a session."""
    for point_data in points_with_embeddings:
        note_point = NotePoint(
            session_id=session_id,
            point_text=point_data["text"],
            embedding=point_data["embedding"]
        )
        db.add(note_point)
    db.commit()

def get_latest_comparison(db: Session, session_id: int) -> Optional[Comparison]:
    """Get the latest comparison for a session."""
    return db.query(Comparison)\
        .filter(Comparison.session_id == session_id)\
        .order_by(Comparison.created_at.desc())\
        .first()

def save_comparison(db: Session, session_id: int, compared_to_session_id: int, 
                   recall_score: float, missed_points: list) -> Comparison:
    """Save a comparison result."""
    comparison = Comparison(
        session_id=session_id,
        compared_to_session_id=compared_to_session_id,
        recall_score=recall_score,
        missed_points=missed_points
    )
    db.add(comparison)
    db.commit()
    db.refresh(comparison)
    return comparison

def add_solo_metric(db: Session, session_id: int, percent_covered: float, 
                   percent_remembered: float):
    """Add solo mode metrics for a session."""
    metric = SoloMetric(
        session_id=session_id,
        percent_covered=percent_covered,
        percent_remembered=percent_remembered
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric

def get_solo_metrics(db: Session, topic_id: int, limit: int = 10) -> List[SoloMetric]:
    """Get solo metrics for a topic, most recent first."""
    return db.query(SoloMetric)\
        .join(SessionModel, SoloMetric.session_id == SessionModel.id)\
        .filter(SessionModel.topic_id == topic_id)\
        .order_by(SoloMetric.created_at.desc())\
        .limit(limit)\
        .all()
