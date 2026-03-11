from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base, get_db
from app.routers import cards, decks, auth, subscriptions, collections, mtg_cards, saved_decks, gdpr, tokens, ai_builder, ai_boost, feedback, chat, arena_import
from app.models import SiteVisit
from app.services.scheduler import start_scheduler, stop_scheduler
from sqlalchemy.orm import Session
from datetime import datetime
import os

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()

app = FastAPI(title="Magic Deck Generator API", lifespan=lifespan)

# CORS Configuration - supports both development and production
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:8000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
    "https://magicdeckbuilder.app.cloudsw.site"
]

# Add production frontend URL from environment if set
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],  # For file downloads
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["subscriptions"])
app.include_router(tokens.router, prefix="/api/tokens", tags=["tokens"])
app.include_router(collections.router, prefix="/api/collections", tags=["collections"])
app.include_router(cards.router, prefix="/api/cards", tags=["cards"])
app.include_router(decks.router, prefix="/api/decks", tags=["decks"])
app.include_router(mtg_cards.router, prefix="/api/mtg-cards", tags=["mtg-cards"])
app.include_router(saved_decks.router, prefix="/api/saved-decks", tags=["saved-decks"])
app.include_router(gdpr.router, prefix="/api/gdpr", tags=["gdpr"])
app.include_router(ai_builder.router, prefix="/api/ai", tags=["ai"])
app.include_router(ai_boost.router, prefix="/api/ai", tags=["ai"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(arena_import.router, prefix="/api/arena", tags=["arena"])

@app.get("/")
def root():
    return {"message": "Magic Deck Generator API"}


@app.post("/api/visit")
def record_visit(db: Session = Depends(get_db)):
    row = db.query(SiteVisit).filter(SiteVisit.id == 1).first()
    if row is None:
        row = SiteVisit(id=1, count=1, last_visit=datetime.utcnow())
        db.add(row)
    else:
        row.count += 1
        row.last_visit = datetime.utcnow()
    db.commit()
    return {"count": row.count}
