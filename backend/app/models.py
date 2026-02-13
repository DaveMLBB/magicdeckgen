from sqlalchemy import Column, Integer, String, Table, ForeignKey, Boolean, DateTime, Index
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
    searches_count = Column(Integer, default=0)  # Deck search counter
    searches_limit = Column(Integer, default=10)  # Deck search limit (10 for free)
    
    # Stripe
    stripe_customer_id = Column(String, nullable=True, unique=True)
    
    # GDPR-related fields
    last_login_at = Column(DateTime, nullable=True)
    inactive_warning_sent_at = Column(DateTime, nullable=True)
    privacy_policy_version = Column(String, nullable=True)
    terms_version = Column(String, nullable=True)
    marketing_emails_enabled = Column(Boolean, default=True)

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
    name_it = Column(String, nullable=True)  # Nome italiano
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

class SavedDeck(Base):
    """Mazzi salvati dall'utente con tutte le carte"""
    __tablename__ = "saved_decks"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    format = Column(String, nullable=True)  # standard, modern, commander, etc.
    colors = Column(String, nullable=True)  # W,U,B,R,G
    archetype = Column(String, nullable=True)  # aggro, control, midrange, combo
    source = Column(String, nullable=True)  # "imported", "manual", "from_search"
    completion_percentage = Column(Integer, default=0)  # % di carte possedute
    is_public = Column(Boolean, default=False)  # Se il mazzo è pubblico e ricercabile
    user_id = Column(Integer, ForeignKey('users.id'), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Tabella di associazione many-to-many tra SavedDeck e CardCollection
saved_deck_collections = Table(
    'saved_deck_collections',
    Base.metadata,
    Column('deck_id', Integer, ForeignKey('saved_decks.id'), primary_key=True),
    Column('collection_id', Integer, ForeignKey('card_collections.id'), primary_key=True)
)

class SavedDeckCard(Base):
    """Carte in un mazzo salvato"""
    __tablename__ = "saved_deck_cards"
    
    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey('saved_decks.id'), index=True, nullable=False)
    card_name = Column(String, nullable=False, index=True)
    quantity = Column(Integer, default=1)
    card_type = Column(String, nullable=True)  # Creature, Instant, etc
    colors = Column(String, nullable=True)
    mana_cost = Column(String, nullable=True)
    rarity = Column(String, nullable=True)
    is_owned = Column(Boolean, default=False)  # Se l'utente possiede questa carta
    quantity_owned = Column(Integer, default=0)  # Quante ne possiede

class DeckTemplate(Base):
    __tablename__ = "deck_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    source = Column(String)  # MTGJson, MTGTop8, etc.
    format = Column(String)  # standard, modern, commander, etc.
    colors = Column(String, nullable=True)  # W,U,B,R,G

class DeckTemplateCard(Base):
    __tablename__ = "deck_template_cards"
    
    id = Column(Integer, primary_key=True, index=True)
    deck_template_id = Column(Integer, ForeignKey('deck_templates.id'))
    card_name = Column(String, index=True)
    quantity = Column(Integer, default=1)
    card_type = Column(String, nullable=True)
    colors = Column(String, nullable=True)
    mana_cost = Column(String, nullable=True)

class MTGCard(Base):
    __tablename__ = "mtg_cards"
    
    uuid = Column(String, primary_key=True, index=True)  # UUID univoco della carta
    name = Column(String, index=True, nullable=False)  # Nome in inglese
    mana_cost = Column(String, nullable=True)
    mana_value = Column(Integer, nullable=True)  # CMC
    colors = Column(String, nullable=True)  # W,U,B,R,G
    color_identity = Column(String, nullable=True)
    type_line = Column(String, index=True, nullable=True)  # Tipo completo
    types = Column(String, nullable=True)  # Creature, Instant, etc
    subtypes = Column(String, nullable=True)  # Human, Wizard, etc
    supertypes = Column(String, nullable=True)  # Legendary, Basic, etc
    text = Column(String, nullable=True)  # Testo della carta
    power = Column(String, nullable=True)
    toughness = Column(String, nullable=True)
    loyalty = Column(String, nullable=True)
    defense = Column(String, nullable=True)
    rarity = Column(String, index=True, nullable=True)  # common, uncommon, rare, mythic
    set_code = Column(String, index=True, nullable=True)  # Codice set
    artist = Column(String, nullable=True)
    flavor_text = Column(String, nullable=True)
    keywords = Column(String, nullable=True)  # Flying, Haste, etc
    layout = Column(String, nullable=True)  # normal, split, flip, etc
    
    # Traduzioni
    name_it = Column(String, nullable=True)  # Nome italiano
    text_it = Column(String, nullable=True)  # Testo italiano
    type_it = Column(String, nullable=True)  # Tipo italiano
    
    # Immagini (Scryfall URLs)
    image_url = Column(String, nullable=True)
    
    # Legalità (JSON string)
    legalities = Column(String, nullable=True)

class ConsentLog(Base):
    """GDPR consent log for cookie preferences and data processing"""
    __tablename__ = "consent_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    session_id = Column(String, nullable=True, index=True)  # For non-authenticated users
    
    # Consent decisions
    essential = Column(Boolean, default=True, nullable=False)
    analytics = Column(Boolean, default=False, nullable=False)
    marketing = Column(Boolean, default=False, nullable=False)
    
    # Audit information
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    ip_address = Column(String, nullable=False)
    user_agent = Column(String, nullable=False)
    banner_version = Column(String, nullable=False)
    
    # Expiry (12 months from timestamp)
    expires_at = Column(DateTime, nullable=False)

class DeletionRequest(Base):
    """GDPR account deletion requests with grace period"""
    __tablename__ = "deletion_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False, index=True)
    
    # Request details
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    scheduled_for = Column(DateTime, nullable=False)  # requested_at + 7 days
    cancellation_token = Column(String, unique=True, nullable=False, index=True)
    
    # Status tracking
    status = Column(String, default='pending', nullable=False)  # pending, cancelled, completed
    cancelled_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

class DataExportToken(Base):
    """GDPR data export tokens for secure file downloads"""
    __tablename__ = "data_export_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    token = Column(String, unique=True, nullable=False, index=True)
    
    # File information
    file_path = Column(String, nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    
    # Expiry (24 hours from creation)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)

class PolicyAcceptance(Base):
    """GDPR policy acceptance tracking for privacy policy and terms of service"""
    __tablename__ = "policy_acceptances"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
    # Policy details
    policy_type = Column(String, nullable=False)  # 'privacy' or 'terms'
    policy_version = Column(String, nullable=False)
    accepted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Composite index for efficient queries
    __table_args__ = (
        Index('idx_user_policy', 'user_id', 'policy_type', 'policy_version'),
    )
