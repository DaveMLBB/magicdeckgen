from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

deck_cards = Table(
    'deck_cards',
    Base.metadata,
    Column('deck_id', Integer, ForeignKey('decks.id')),
    Column('card_id', Integer, ForeignKey('cards.id')),
    Column('quantity', Integer, default=1)
)

class Card(Base):
    __tablename__ = "cards"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    mana_cost = Column(String, nullable=True)
    card_type = Column(String)  # creature, instant, sorcery, etc.
    colors = Column(String)  # W, U, B, R, G o combinazioni
    rarity = Column(String, nullable=True)
    quantity_owned = Column(Integer, default=1)
    user_id = Column(String, index=True)  # per separare carte per utente

class Deck(Base):
    __tablename__ = "decks"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    archetype = Column(String)  # aggro, control, midrange, combo
    colors = Column(String)
    format = Column(String, default="standard")  # standard, modern, commander
    user_id = Column(String, index=True)

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
