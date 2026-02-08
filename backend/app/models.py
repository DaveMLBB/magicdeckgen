from sqlalchemy import Column, Integer, String, Table, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

deck_cards = Table(
    'deck_cards',
    Base.metadata,
    Column('deck_id', Integer, ForeignKey('decks.id')),
    Column('card_id', Integer, ForeignKey('cards.id')),
    Column('quantity', Integer, default=1)
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Subscription
    subscription_type = Column(String, default='free')  # free, monthly_10, monthly_30, yearly, lifetime
    subscription_expires_at = Column(DateTime, nullable=True)
    uploads_count = Column(Integer, default=0)  # Upload counter
    uploads_limit = Column(Integer, default=3)  # Upload limit (3 for free)

class CardCollection(Base):
    __tablename__ = "card_collections"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Card(Base):
    __tablename__ = "cards"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    mana_cost = Column(String, nullable=True)
    card_type = Column(String)  # creature, instant, sorcery, etc.
    colors = Column(String)  # W, U, B, R, G or combinations
    rarity = Column(String, nullable=True)
    quantity_owned = Column(Integer, default=1)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)  # FK to User
    collection_id = Column(Integer, ForeignKey('card_collections.id'), index=True, nullable=True)  # FK to Collection

class Deck(Base):
    __tablename__ = "decks"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    archetype = Column(String)  # aggro, control, midrange, combo
    colors = Column(String)
    format = Column(String, default="standard")  # standard, modern, commander
    user_id = Column(Integer, ForeignKey('users.id'), index=True)  # FK verso User

class DeckTemplate(Base):
    __tablename__ = "deck_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    source = Column(String)  # MTGJson, MTGTop8, etc.
    format = Column(String)  # standard, modern, commander, etc.

class DeckTemplateCard(Base):
    __tablename__ = "deck_template_cards"
    
    id = Column(Integer, primary_key=True, index=True)
    deck_template_id = Column(Integer, ForeignKey('deck_templates.id'))
    card_name = Column(String, index=True)
    quantity = Column(Integer, default=1)
    card_type = Column(String, nullable=True)
    colors = Column(String, nullable=True)
    mana_cost = Column(String, nullable=True)
