"""
DataExportService - Generates comprehensive user data exports for GDPR compliance.

This service handles:
- Compiling all user data into structured format
- Generating JSON export files
- Managing export tokens with expiry
- Retrieving export files securely
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models import (
    User, SavedDeck, SavedDeckCard, CardCollection, Card,
    ConsentLog, PolicyAcceptance, DataExportToken
)
from app.services.consent_service import ConsentService
import secrets
import json
import os
from pathlib import Path


class DataExportService:
    """Service for managing GDPR data exports"""
    
    def __init__(self):
        self.consent_service = ConsentService()
        # Create exports directory if it doesn't exist
        self.exports_dir = Path(__file__).parent.parent.parent / "data" / "exports"
        self.exports_dir.mkdir(parents=True, exist_ok=True)
    
    def export_user_data(
        self,
        db: Session,
        user_id: int
    ) -> dict:
        """
        Compile all user data into a structured dictionary.
        Includes: account info, decks, collections, consent history, policy acceptances.
        
        Args:
            db: Database session
            user_id: User ID to export data for
            
        Returns:
            dict: Structured user data following the export format from design document
            
        Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
        """
        # Query user account information
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User with id {user_id} not found")
        
        # Build export metadata
        export_data = {
            "export_metadata": {
                "user_id": user_id,
                "export_date": datetime.utcnow().isoformat() + "Z",
                "format_version": "1.0"
            }
        }
        
        # Query and structure account information
        export_data["account"] = {
            "email": user.email,
            "created_at": user.created_at.isoformat() + "Z" if user.created_at else None,
            "last_login_at": user.last_login_at.isoformat() + "Z" if user.last_login_at else None,
            "is_verified": user.is_verified,
            "subscription_type": user.subscription_type,
            "subscription_expires_at": user.subscription_expires_at.isoformat() + "Z" if user.subscription_expires_at else None,
            "uploads_count": user.uploads_count,
            "uploads_limit": user.uploads_limit,
            "searches_count": user.searches_count,
            "searches_limit": user.searches_limit,
            "marketing_emails_enabled": user.marketing_emails_enabled
        }
        
        # Query all saved decks with cards
        saved_decks = db.query(SavedDeck).filter(SavedDeck.user_id == user_id).all()
        export_data["saved_decks"] = []
        
        for deck in saved_decks:
            # Query cards for this deck
            deck_cards = db.query(SavedDeckCard).filter(SavedDeckCard.deck_id == deck.id).all()
            
            deck_data = {
                "id": deck.id,
                "name": deck.name,
                "description": deck.description,
                "format": deck.format,
                "colors": deck.colors,
                "archetype": deck.archetype,
                "source": deck.source,
                "completion_percentage": deck.completion_percentage,
                "is_public": deck.is_public,
                "created_at": deck.created_at.isoformat() + "Z" if deck.created_at else None,
                "updated_at": deck.updated_at.isoformat() + "Z" if deck.updated_at else None,
                "cards": []
            }
            
            # Add cards to deck
            for card in deck_cards:
                deck_data["cards"].append({
                    "card_name": card.card_name,
                    "quantity": card.quantity,
                    "card_type": card.card_type,
                    "mana_cost": card.mana_cost,
                    "colors": card.colors,
                    "rarity": card.rarity,
                    "is_owned": card.is_owned,
                    "quantity_owned": card.quantity_owned
                })
            
            export_data["saved_decks"].append(deck_data)
        
        # Query all card collections with cards
        collections = db.query(CardCollection).filter(CardCollection.user_id == user_id).all()
        export_data["card_collections"] = []
        
        for collection in collections:
            # Query cards in this collection
            collection_cards = db.query(Card).filter(Card.collection_id == collection.id).all()
            
            collection_data = {
                "id": collection.id,
                "name": collection.name,
                "description": collection.description,
                "created_at": collection.created_at.isoformat() + "Z" if collection.created_at else None,
                "updated_at": collection.updated_at.isoformat() + "Z" if collection.updated_at else None,
                "cards": []
            }
            
            # Add cards to collection
            for card in collection_cards:
                collection_data["cards"].append({
                    "name": card.name,
                    "quantity_owned": card.quantity_owned,
                    "card_type": card.card_type,
                    "colors": card.colors,
                    "mana_cost": card.mana_cost,
                    "rarity": card.rarity
                })
            
            export_data["card_collections"].append(collection_data)
        
        # Query consent history
        consent_history = self.consent_service.get_user_consent_history(db, user_id)
        export_data["consent_history"] = []
        
        for consent in consent_history:
            export_data["consent_history"].append({
                "timestamp": consent.timestamp.isoformat() + "Z" if consent.timestamp else None,
                "essential": consent.essential,
                "analytics": consent.analytics,
                "marketing": consent.marketing,
                "banner_version": consent.banner_version,
                "ip_address": consent.ip_address,
                "user_agent": consent.user_agent,
                "expires_at": consent.expires_at.isoformat() + "Z" if consent.expires_at else None
            })
        
        # Query policy acceptances
        policy_acceptances = db.query(PolicyAcceptance).filter(PolicyAcceptance.user_id == user_id).all()
        export_data["policy_acceptances"] = []
        
        for acceptance in policy_acceptances:
            export_data["policy_acceptances"].append({
                "policy_type": acceptance.policy_type,
                "version": acceptance.policy_version,
                "accepted_at": acceptance.accepted_at.isoformat() + "Z" if acceptance.accepted_at else None
            })
        
        return export_data
    
    def generate_export_file(
        self,
        db: Session,
        user_id: int
    ) -> str:
        """
        Create JSON file with user data and return download token.
        Token valid for 24 hours.
        
        Args:
            db: Database session
            user_id: User ID to generate export for
            
        Returns:
            str: Download token for retrieving the export file
            
        Requirements: 4.6, 6.1, 6.7
        """
        # Get user data
        export_data = self.export_user_data(db, user_id)
        
        # Generate secure token
        token = secrets.token_urlsafe(32)
        
        # Create filename
        filename = f"user_data_{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        file_path = self.exports_dir / filename
        
        # Write JSON to file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Create DataExportToken record
        created_at = datetime.utcnow()
        expires_at = created_at + timedelta(hours=24)
        
        export_token = DataExportToken(
            user_id=user_id,
            token=token,
            file_path=str(file_path),
            file_size_bytes=file_size,
            created_at=created_at,
            expires_at=expires_at
        )
        
        db.add(export_token)
        db.commit()
        db.refresh(export_token)
        
        return token
    
    def get_export_file(
        self,
        db: Session,
        token: str
    ) -> Tuple[bytes, str]:
        """
        Retrieve export file by token.
        Returns (file_content, filename).
        Raises exception if token expired or invalid.
        
        Args:
            db: Database session
            token: Download token
            
        Returns:
            Tuple[bytes, str]: File content and filename
            
        Raises:
            ValueError: If token is invalid or expired
            
        Requirements: 6.7
        """
        # Query DataExportToken
        export_token = db.query(DataExportToken).filter(DataExportToken.token == token).first()
        
        if not export_token:
            raise ValueError("Invalid export token")
        
        # Check if token expired
        if export_token.expires_at < datetime.utcnow():
            raise ValueError("Export token has expired")
        
        # Read file
        file_path = Path(export_token.file_path)
        
        if not file_path.exists():
            raise ValueError("Export file not found")
        
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        # Extract filename from path
        filename = file_path.name
        
        return file_content, filename
    
    def cleanup_expired_tokens(
        self,
        db: Session
    ) -> int:
        """
        Delete expired DataExportToken records and associated files.
        Returns count of deleted records.
        
        Args:
            db: Database session
            
        Returns:
            int: Number of tokens deleted
        """
        # Query expired tokens
        expired_tokens = db.query(DataExportToken)\
            .filter(DataExportToken.expires_at < datetime.utcnow())\
            .all()
        
        count = len(expired_tokens)
        
        # Delete associated files
        for token in expired_tokens:
            file_path = Path(token.file_path)
            if file_path.exists():
                try:
                    file_path.unlink()
                except Exception as e:
                    print(f"Error deleting export file {file_path}: {e}")
        
        # Delete token records
        db.query(DataExportToken)\
            .filter(DataExportToken.expires_at < datetime.utcnow())\
            .delete()
        
        db.commit()
        
        return count
