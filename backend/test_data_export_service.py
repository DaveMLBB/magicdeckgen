"""
Unit tests for DataExportService

Tests the export_user_data method to ensure it correctly:
- Queries user account information
- Queries all saved decks with cards
- Queries all card collections with cards
- Queries consent history
- Queries policy acceptances
- Structures data according to export format
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import (
    User, SavedDeck, SavedDeckCard, CardCollection, Card,
    ConsentLog, PolicyAcceptance
)
from app.services.data_export_service import DataExportService


# Test database setup
@pytest.fixture
def db_session():
    """Create a test database session"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def sample_user(db_session):
    """Create a sample user with complete data"""
    # Create user
    user = User(
        email="test@example.com",
        hashed_password="hashed_password_123",
        is_verified=True,
        created_at=datetime(2023, 6, 1, 12, 0, 0),
        last_login_at=datetime(2024, 1, 14, 9, 15, 0),
        subscription_type="monthly_10",
        subscription_expires_at=datetime(2024, 2, 1, 12, 0, 0),
        uploads_count=5,
        uploads_limit=100,
        searches_count=20,
        searches_limit=1000,
        marketing_emails_enabled=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Create saved deck
    deck = SavedDeck(
        name="Mono Red Aggro",
        description="Fast aggressive deck",
        format="standard",
        colors="R",
        archetype="aggro",
        source="manual",
        completion_percentage=85,
        is_public=True,
        user_id=user.id,
        created_at=datetime(2023, 8, 15, 14, 20, 0),
        updated_at=datetime(2023, 8, 16, 10, 30, 0)
    )
    db_session.add(deck)
    db_session.commit()
    db_session.refresh(deck)
    
    # Add cards to deck
    card1 = SavedDeckCard(
        deck_id=deck.id,
        card_name="Lightning Bolt",
        quantity=4,
        card_type="Instant",
        mana_cost="{R}",
        colors="R",
        rarity="common",
        is_owned=True,
        quantity_owned=4
    )
    card2 = SavedDeckCard(
        deck_id=deck.id,
        card_name="Monastery Swiftspear",
        quantity=4,
        card_type="Creature",
        mana_cost="{R}",
        colors="R",
        rarity="uncommon",
        is_owned=True,
        quantity_owned=3
    )
    db_session.add_all([card1, card2])
    db_session.commit()
    
    # Create card collection
    collection = CardCollection(
        name="My Collection",
        description="Personal card collection",
        user_id=user.id,
        created_at=datetime(2023, 6, 5, 10, 0, 0),
        updated_at=datetime(2023, 12, 1, 15, 0, 0)
    )
    db_session.add(collection)
    db_session.commit()
    db_session.refresh(collection)
    
    # Add cards to collection
    coll_card1 = Card(
        name="Lightning Bolt",
        quantity_owned=8,
        card_type="Instant",
        colors="R",
        mana_cost="{R}",
        rarity="common",
        user_id=user.id,
        collection_id=collection.id
    )
    coll_card2 = Card(
        name="Counterspell",
        quantity_owned=4,
        card_type="Instant",
        colors="U",
        mana_cost="{U}{U}",
        rarity="common",
        user_id=user.id,
        collection_id=collection.id
    )
    db_session.add_all([coll_card1, coll_card2])
    db_session.commit()
    
    # Create consent log
    consent = ConsentLog(
        user_id=user.id,
        session_id=None,
        essential=True,
        analytics=True,
        marketing=False,
        timestamp=datetime(2023, 6, 1, 12, 5, 0),
        ip_address="192.168.1.1",
        user_agent="Mozilla/5.0",
        banner_version="1.0",
        expires_at=datetime(2024, 6, 1, 12, 5, 0)
    )
    db_session.add(consent)
    db_session.commit()
    
    # Create policy acceptances
    privacy_acceptance = PolicyAcceptance(
        user_id=user.id,
        policy_type="privacy",
        policy_version="1.0",
        accepted_at=datetime(2023, 6, 1, 12, 0, 0)
    )
    terms_acceptance = PolicyAcceptance(
        user_id=user.id,
        policy_type="terms",
        policy_version="1.0",
        accepted_at=datetime(2023, 6, 1, 12, 0, 0)
    )
    db_session.add_all([privacy_acceptance, terms_acceptance])
    db_session.commit()
    
    return user


def test_export_user_data_includes_account_info(db_session, sample_user):
    """Test that export includes complete account information"""
    service = DataExportService()
    export_data = service.export_user_data(db_session, sample_user.id)
    
    # Verify account section exists
    assert "account" in export_data
    account = export_data["account"]
    
    # Verify all account fields
    assert account["email"] == "test@example.com"
    assert account["is_verified"] is True
    assert account["subscription_type"] == "monthly_10"
    assert account["uploads_count"] == 5
    assert account["uploads_limit"] == 100
    assert account["searches_count"] == 20
    assert account["searches_limit"] == 1000
    assert account["marketing_emails_enabled"] is True
    assert "created_at" in account
    assert "last_login_at" in account
    assert "subscription_expires_at" in account


def test_export_user_data_includes_saved_decks(db_session, sample_user):
    """Test that export includes all saved decks with cards"""
    service = DataExportService()
    export_data = service.export_user_data(db_session, sample_user.id)
    
    # Verify saved_decks section exists
    assert "saved_decks" in export_data
    assert len(export_data["saved_decks"]) == 1
    
    # Verify deck data
    deck = export_data["saved_decks"][0]
    assert deck["name"] == "Mono Red Aggro"
    assert deck["description"] == "Fast aggressive deck"
    assert deck["format"] == "standard"
    assert deck["colors"] == "R"
    assert deck["archetype"] == "aggro"
    assert deck["source"] == "manual"
    assert deck["completion_percentage"] == 85
    assert deck["is_public"] is True
    
    # Verify deck has cards
    assert "cards" in deck
    assert len(deck["cards"]) == 2
    
    # Verify card data
    card_names = [card["card_name"] for card in deck["cards"]]
    assert "Lightning Bolt" in card_names
    assert "Monastery Swiftspear" in card_names
    
    # Verify card details
    lightning_bolt = next(c for c in deck["cards"] if c["card_name"] == "Lightning Bolt")
    assert lightning_bolt["quantity"] == 4
    assert lightning_bolt["card_type"] == "Instant"
    assert lightning_bolt["mana_cost"] == "{R}"
    assert lightning_bolt["colors"] == "R"
    assert lightning_bolt["rarity"] == "common"
    assert lightning_bolt["is_owned"] is True
    assert lightning_bolt["quantity_owned"] == 4


def test_export_user_data_includes_card_collections(db_session, sample_user):
    """Test that export includes all card collections with cards"""
    service = DataExportService()
    export_data = service.export_user_data(db_session, sample_user.id)
    
    # Verify card_collections section exists
    assert "card_collections" in export_data
    assert len(export_data["card_collections"]) == 1
    
    # Verify collection data
    collection = export_data["card_collections"][0]
    assert collection["name"] == "My Collection"
    assert collection["description"] == "Personal card collection"
    
    # Verify collection has cards
    assert "cards" in collection
    assert len(collection["cards"]) == 2
    
    # Verify card data
    card_names = [card["name"] for card in collection["cards"]]
    assert "Lightning Bolt" in card_names
    assert "Counterspell" in card_names
    
    # Verify card details
    lightning_bolt = next(c for c in collection["cards"] if c["name"] == "Lightning Bolt")
    assert lightning_bolt["quantity_owned"] == 8
    assert lightning_bolt["card_type"] == "Instant"
    assert lightning_bolt["colors"] == "R"


def test_export_user_data_includes_consent_history(db_session, sample_user):
    """Test that export includes consent history"""
    service = DataExportService()
    export_data = service.export_user_data(db_session, sample_user.id)
    
    # Verify consent_history section exists
    assert "consent_history" in export_data
    assert len(export_data["consent_history"]) == 1
    
    # Verify consent data
    consent = export_data["consent_history"][0]
    assert consent["essential"] is True
    assert consent["analytics"] is True
    assert consent["marketing"] is False
    assert consent["banner_version"] == "1.0"
    assert consent["ip_address"] == "192.168.1.1"
    assert consent["user_agent"] == "Mozilla/5.0"
    assert "timestamp" in consent
    assert "expires_at" in consent


def test_export_user_data_includes_policy_acceptances(db_session, sample_user):
    """Test that export includes policy acceptances"""
    service = DataExportService()
    export_data = service.export_user_data(db_session, sample_user.id)
    
    # Verify policy_acceptances section exists
    assert "policy_acceptances" in export_data
    assert len(export_data["policy_acceptances"]) == 2
    
    # Verify policy types
    policy_types = [p["policy_type"] for p in export_data["policy_acceptances"]]
    assert "privacy" in policy_types
    assert "terms" in policy_types
    
    # Verify policy data
    privacy_policy = next(p for p in export_data["policy_acceptances"] if p["policy_type"] == "privacy")
    assert privacy_policy["version"] == "1.0"
    assert "accepted_at" in privacy_policy


def test_export_user_data_includes_metadata(db_session, sample_user):
    """Test that export includes proper metadata"""
    service = DataExportService()
    export_data = service.export_user_data(db_session, sample_user.id)
    
    # Verify metadata section exists
    assert "export_metadata" in export_data
    metadata = export_data["export_metadata"]
    
    # Verify metadata fields
    assert metadata["user_id"] == sample_user.id
    assert metadata["format_version"] == "1.0"
    assert "export_date" in metadata
    
    # Verify export_date is in ISO format with Z suffix
    assert metadata["export_date"].endswith("Z")


def test_export_user_data_with_no_decks(db_session):
    """Test export for user with no saved decks"""
    # Create user without decks
    user = User(
        email="nodeck@example.com",
        hashed_password="hashed_password",
        is_verified=True,
        created_at=datetime.utcnow()
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    service = DataExportService()
    export_data = service.export_user_data(db_session, user.id)
    
    # Verify empty decks list
    assert "saved_decks" in export_data
    assert len(export_data["saved_decks"]) == 0


def test_export_user_data_with_no_collections(db_session):
    """Test export for user with no card collections"""
    # Create user without collections
    user = User(
        email="nocoll@example.com",
        hashed_password="hashed_password",
        is_verified=True,
        created_at=datetime.utcnow()
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    service = DataExportService()
    export_data = service.export_user_data(db_session, user.id)
    
    # Verify empty collections list
    assert "card_collections" in export_data
    assert len(export_data["card_collections"]) == 0


def test_export_user_data_with_no_consent_history(db_session):
    """Test export for user with no consent history"""
    # Create user without consent logs
    user = User(
        email="noconsent@example.com",
        hashed_password="hashed_password",
        is_verified=True,
        created_at=datetime.utcnow()
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    service = DataExportService()
    export_data = service.export_user_data(db_session, user.id)
    
    # Verify empty consent history
    assert "consent_history" in export_data
    assert len(export_data["consent_history"]) == 0


def test_export_user_data_invalid_user(db_session):
    """Test export for non-existent user raises error"""
    service = DataExportService()
    
    with pytest.raises(ValueError, match="User with id 99999 not found"):
        service.export_user_data(db_session, 99999)


def test_export_data_structure_matches_design(db_session, sample_user):
    """Test that export structure matches the design document format"""
    service = DataExportService()
    export_data = service.export_user_data(db_session, sample_user.id)
    
    # Verify all top-level keys from design document
    expected_keys = [
        "export_metadata",
        "account",
        "saved_decks",
        "card_collections",
        "consent_history",
        "policy_acceptances"
    ]
    
    for key in expected_keys:
        assert key in export_data, f"Missing required key: {key}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
