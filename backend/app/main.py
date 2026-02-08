from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import cards, decks, auth, subscriptions, collections, mtg_cards

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

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["subscriptions"])
app.include_router(collections.router, prefix="/api/collections", tags=["collections"])
app.include_router(cards.router, prefix="/api/cards", tags=["cards"])
app.include_router(decks.router, prefix="/api/decks", tags=["decks"])
app.include_router(mtg_cards.router, prefix="/api/mtg-cards", tags=["mtg-cards"])

@app.get("/")
def root():
    return {"message": "Magic Deck Generator API"}
