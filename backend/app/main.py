from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import date
import logging
from contextlib import asynccontextmanager

from app.config import settings
from app.db import get_db, init_db
from app.auth import get_current_token
from app.models import User, Topic, Session as SessionModel, NotePoint
from app import schemas, crud
from app.ai.embeddings import get_embedding
from app.ai.compare import compare_notes
from app.scheduler import start_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Starting 123tracker API...")
    
    # Validate required environment variables
    if not settings.AUTH0_DOMAIN:
        logger.error("AUTH0_DOMAIN is not set")
        raise ValueError("AUTH0_DOMAIN environment variable is required")
    if not settings.AUTH0_AUDIENCE:
        logger.error("AUTH0_AUDIENCE is not set")
        raise ValueError("AUTH0_AUDIENCE environment variable is required")
    
    # Initialize database tables if needed
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    
    # Start the scheduler for notifications if enabled
    if settings.ENABLE_SCHEDULER:
        try:
            start_scheduler()
            logger.info("Scheduler started successfully")
        except Exception as e:
            logger.warning(f"Failed to start scheduler: {e}. Notifications will not be sent.")
    else:
        logger.info("Scheduler is disabled (ENABLE_SCHEDULER=false)")
    
    logger.info("123tracker API started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down 123tracker API...")

app = FastAPI(
    title="123tracker API",
    version="1.0.0",
    description="Study tracker with spaced repetition",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth dependency
def get_current_user(
    token: dict = Depends(get_current_token),
    db: Session = Depends(get_db)
) -> User:
    """Get or create user from Auth0 token."""
    auth0_sub = token.get("sub")
    email = token.get("email", "")
    if not auth0_sub:
        raise HTTPException(status_code=401, detail="Invalid token: missing sub")
    return crud.get_or_create_user(db, auth0_sub, email)

@app.get("/")
def root():
    return {"message": "123tracker API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    """Health check endpoint for deployment monitoring."""
    return {
        "status": "healthy",
        "service": "123tracker-api",
        "version": "1.0.0"
    }

# Topics endpoints
@app.post("/topics", response_model=schemas.TopicOut, status_code=status.HTTP_201_CREATED)
def create_topic(
    topic_in: schemas.TopicCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new topic with auto-generated sessions."""
    topic = crud.create_topic(
        db, user.id, topic_in.title, topic_in.description, topic_in.mode
    )
    return topic

@app.get("/topics", response_model=List[schemas.TopicOut])
def list_topics(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all topics for the current user."""
    topics = crud.get_user_topics(db, user.id)
    return topics

@app.get("/topics/{topic_id}", response_model=schemas.TopicOut)
def get_topic(
    topic_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get topic details."""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if topic.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return topic

# Sessions endpoints
@app.get("/topics/{topic_id}/sessions", response_model=List[schemas.SessionOut])
def list_sessions(
    topic_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all sessions for a topic."""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if topic.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    sessions = db.query(SessionModel).filter(SessionModel.topic_id == topic_id).all()
    return sessions

@app.patch("/sessions/{session_id}/reschedule", response_model=schemas.SessionOut)
def reschedule_session(
    session_id: int,
    reschedule_data: schemas.SessionReschedule,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reschedule a session."""
    session = crud.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check ownership
    topic = db.query(Topic).filter(Topic.id == session.topic_id).first()
    if not topic or topic.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Validate date
    if reschedule_data.scheduled_for < date.today():
        raise HTTPException(status_code=400, detail="Cannot schedule in the past")
    
    session = crud.reschedule_session(db, session_id, reschedule_data.scheduled_for)
    return session

@app.post("/sessions/{session_id}/complete", response_model=schemas.SessionOut)
def complete_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a session as completed."""
    session = crud.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check ownership
    topic = db.query(Topic).filter(Topic.id == session.topic_id).first()
    if not topic or topic.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    session = crud.complete_session(db, session_id)
    return session

@app.post("/sessions/{session_id}/skip", response_model=schemas.SessionOut)
def skip_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a session as skipped."""
    session = crud.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check ownership
    topic = db.query(Topic).filter(Topic.id == session.topic_id).first()
    if not topic or topic.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    session = crud.skip_session(db, session_id)
    return session

# Automated mode endpoints
@app.post("/sessions/{session_id}/notes", status_code=status.HTTP_201_CREATED)
def add_notes(
    session_id: int,
    notes_in: schemas.NotesIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add notes to a session with embeddings."""
    session = crud.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check ownership
    topic = db.query(Topic).filter(Topic.id == session.topic_id).first()
    if not topic or topic.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Validate max 200 points
    if len(notes_in.points) > settings.MAX_NOTES_PER_SESSION:
        raise HTTPException(
            status_code=400, 
            detail=f"Maximum {settings.MAX_NOTES_PER_SESSION} bullet points allowed"
        )
    
    # Generate embeddings
    points_with_embeddings = []
    for point_text in notes_in.points:
        embedding = get_embedding(point_text)
        points_with_embeddings.append({
            "text": point_text,
            "embedding": embedding
        })
    
    # Save to database
    crud.add_note_points(db, session_id, points_with_embeddings)
    
    return {"message": "Notes added successfully", "count": len(notes_in.points)}

@app.post("/sessions/{session_id}/compare", response_model=schemas.CompareOut)
def compare_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare current session with previous session."""
    session = crud.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check ownership
    topic = db.query(Topic).filter(Topic.id == session.topic_id).first()
    if not topic or topic.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get current session notes
    curr_notes = db.query(NotePoint).filter(NotePoint.session_id == session_id).all()
    if not curr_notes:
        raise HTTPException(status_code=400, detail="No notes found for current session")
    
    curr_points = [{"text": n.point_text, "embedding": n.embedding} for n in curr_notes]
    
    # Find previous session
    prev_session = db.query(SessionModel)\
        .filter(SessionModel.topic_id == session.topic_id)\
        .filter(SessionModel.day_index < session.day_index)\
        .order_by(SessionModel.day_index.desc())\
        .first()
    
    if not prev_session:
        raise HTTPException(status_code=400, detail="No previous session found")
    
    # Get previous session notes
    prev_notes = db.query(NotePoint).filter(NotePoint.session_id == prev_session.id).all()
    if not prev_notes:
        raise HTTPException(status_code=400, detail="No notes found for previous session")
    
    prev_points = [{"text": n.point_text, "embedding": n.embedding} for n in prev_notes]
    
    # Compare
    result = compare_notes(prev_points, curr_points, settings.COMPARE_THRESHOLD)
    
    # Save comparison
    crud.save_comparison(
        db, session_id, prev_session.id,
        result["recall_score"], result["missed_points"]
    )
    
    return result

@app.get("/sessions/{session_id}/comparison", response_model=schemas.ComparisonOut)
def get_comparison(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get latest comparison result for a session."""
    session = crud.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check ownership
    topic = db.query(Topic).filter(Topic.id == session.topic_id).first()
    if not topic or topic.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    comparison = crud.get_latest_comparison(db, session_id)
    if not comparison:
        raise HTTPException(status_code=404, detail="No comparison found")
    
    return comparison

# Solo mode endpoints
@app.post("/sessions/{session_id}/solo", status_code=status.HTTP_201_CREATED)
def add_solo_metrics(
    session_id: int,
    solo_in: schemas.SoloIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add solo mode metrics for a session."""
    session = crud.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check ownership
    topic = db.query(Topic).filter(Topic.id == session.topic_id).first()
    if not topic or topic.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    crud.add_solo_metric(
        db, session_id,
        solo_in.percent_covered,
        solo_in.percent_remembered
    )
    
    return {"message": "Solo metrics added successfully"}

@app.get("/topics/{topic_id}/solo/trend", response_model=schemas.SoloTrendOut)
def get_solo_trend(
    topic_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get solo mode trend with suggestion."""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if topic.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    metrics = crud.get_solo_metrics(db, topic_id, limit=10)
    
    # Calculate suggestion
    if not metrics:
        suggestion = "No data yet. Complete sessions to see trends."
    else:
        avg_remembered = sum(m.percent_remembered for m in metrics) / len(metrics)
        if avg_remembered >= settings.SOLO_HIGH_RETENTION_THRESHOLD:
            suggestion = "Great retention! Consider increasing intervals."
        elif avg_remembered < settings.SOLO_LOW_RETENTION_THRESHOLD:
            suggestion = "Low retention. Schedule sessions sooner."
        else:
            suggestion = "Keep up the current pace."
    
    return {
        "metrics": metrics,
        "suggestion": suggestion
    }
