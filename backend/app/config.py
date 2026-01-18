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

settings = Settings()