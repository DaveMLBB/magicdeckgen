from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import Feedback, User

router = APIRouter()

class FeedbackCreate(BaseModel):
    user_id: Optional[int] = None
    rating: Optional[int] = None  # 1-5
    message: str
    feature: Optional[str] = None  # e.g. "AI Deck Builder", "AI Synergy", etc.

@router.post("/submit")
def submit_feedback(data: FeedbackCreate, db: Session = Depends(get_db)):
    if not data.message or len(data.message.strip()) < 5:
        raise HTTPException(status_code=400, detail="Message too short (min 5 characters)")
    if len(data.message) > 2000:
        raise HTTPException(status_code=400, detail="Message too long (max 2000 characters)")
    if data.rating is not None and data.rating not in range(1, 6):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    user_email = None
    if data.user_id:
        user = db.query(User).filter(User.id == data.user_id).first()
        if user:
            user_email = user.email

    fb = Feedback(
        user_id=data.user_id,
        user_email=user_email,
        rating=data.rating,
        message=data.message.strip(),
        feature=data.feature,
    )
    db.add(fb)
    db.commit()
    return {"ok": True, "message": "Feedback received, thank you!"}
