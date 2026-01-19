import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DB_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://user:pass@localhost:5432/tracker")
    AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "")
    AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "")
    AUTH0_ISSUER = f"https://{AUTH0_DOMAIN}/" if os.getenv("AUTH0_DOMAIN") else ""
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    COMPARE_THRESHOLD = float(os.getenv("COMPARE_THRESHOLD", "0.80"))
    MAX_NOTES_PER_SESSION = int(os.getenv("MAX_NOTES_PER_SESSION", "200"))
    SOLO_HIGH_RETENTION_THRESHOLD = float(os.getenv("SOLO_HIGH_RETENTION_THRESHOLD", "85"))
    SOLO_LOW_RETENTION_THRESHOLD = float(os.getenv("SOLO_LOW_RETENTION_THRESHOLD", "60"))
    
    # Database connection pool settings
    DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "20"))
    DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "3600"))
    
    # Scheduler settings
    ENABLE_SCHEDULER = os.getenv("ENABLE_SCHEDULER", "true").lower() in ("true", "1", "yes")

settings = Settings()