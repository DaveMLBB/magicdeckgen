from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import cards, decks

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Magic Deck Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://magicdeckbuilder.app.cloudsw.site"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cards.router, prefix="/api/cards", tags=["cards"])
app.include_router(decks.router, prefix="/api/decks", tags=["decks"])

@app.get("/")
def root():
    return {"message": "Magic Deck Generator API"}
