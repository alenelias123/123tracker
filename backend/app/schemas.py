from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class TopicCreate(BaseModel):
    title: str
    description: str = ""
    mode: Literal["automated", "solo"]

class TopicOut(BaseModel):
    id: int
    title: str
    description: str
    mode: str
    class Config: 
        from_attributes = True

class SessionOut(BaseModel):
    id: int
    day_index: int
    scheduled_for: str
    status: str
    class Config: 
        from_attributes = True

class NotesIn(BaseModel):
    points: List[str] = Field(default_factory=list)

class CompareOut(BaseModel):
    recall_score: float
    missed_points: list

class SoloIn(BaseModel):
    percent_covered: float
    percent_remembered: float
