from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Configure connection pool for production
engine = create_engine(
    settings.DB_URL,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=settings.DB_POOL_SIZE,  # Maximum number of connections to keep open
    max_overflow=settings.DB_MAX_OVERFLOW,  # Maximum overflow connections
    pool_recycle=settings.DB_POOL_RECYCLE,  # Recycle connections after N seconds
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
        raise
