from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import date, datetime

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

class SessionReschedule(BaseModel):
    scheduled_for: date

class NotesIn(BaseModel):
    points: List[str] = Field(default_factory=list)

class CompareOut(BaseModel):
    recall_score: float
    missed_points: list

class ComparisonOut(BaseModel):
    recall_score: float
    missed_points: list
    created_at: datetime
    class Config: 
        from_attributes = True

class SoloIn(BaseModel):
    percent_covered: float
    percent_remembered: float

class SoloMetricOut(BaseModel):
    percent_covered: float
    percent_remembered: float
    created_at: datetime
    class Config: 
        from_attributes = True

class SoloTrendOut(BaseModel):
    metrics: List[SoloMetricOut]
    suggestion: str
