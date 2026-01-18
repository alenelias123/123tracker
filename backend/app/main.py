from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(title="123tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "123tracker API"}

# Route structure for future implementation:
# @app.include_router(topics.router, prefix="/api/topics", tags=["topics"])
# @app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
# @app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
