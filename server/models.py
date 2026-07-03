from pydantic import BaseModel, Field
from typing import Optional, Any


class CardDimension(BaseModel):
    question: str
    answer: Any  # str[] for cloze, int for choice
    options: Optional[list[str]] = None


class ClozeDimensions(BaseModel):
    formula: Optional[CardDimension] = None
    derive: Optional[CardDimension] = None


class ChoiceDimensions(BaseModel):
    trigger: Optional[CardDimension] = None
    geometry: Optional[CardDimension] = None
    trap: Optional[CardDimension] = None
    challenge: Optional[CardDimension] = None
    transform: Optional[CardDimension] = None


class CardDimensions(BaseModel):
    cloze: Optional[ClozeDimensions] = None
    choice: Optional[ChoiceDimensions] = None


class Card(BaseModel):
    id: str
    title: str
    category: Optional[str] = None
    motifIds: Optional[list[str]] = None
    dimensions: CardDimensions


class ReviewRequest(BaseModel):
    card_id: str
    dimension: str
    score: int = Field(ge=0, le=3)


class SRSState(BaseModel):
    card_id: str
    ease_factor: float
    interval: int
    due_date: str
    reps: int
    last_review: Optional[str] = None
