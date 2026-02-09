"""
ConsentService - Manages cookie consent logging and retrieval for GDPR compliance.

This service handles:
- Logging consent decisions with full audit trail
- Retrieving consent history for users
- Getting current consent status
- Cleaning up old consent records
"""

from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import ConsentLog


class ConsentService:
    """Service for managing GDPR cookie consent"""
    
    def log_consent(
        self,
        db: Session,
        user_id: Optional[int],
        session_id: Optional[str],
        essential: bool,
        analytics: bool,
        marketing: bool,
        ip_address: str,
        user_agent: str,
        banner_version: str
    ) -> ConsentLog:
        """
        Log a consent decision to the database.
        Creates audit trail for GDPR compliance.
        
        Args:
            db: Database session
            user_id: User ID for authenticated users (None for anonymous)
            session_id: Session ID for anonymous users (None for authenticated)
            essential: Essential cookies consent (always True)
            analytics: Analytics cookies consent
            marketing: Marketing cookies consent
            ip_address: User's IP address at time of consent
            user_agent: User's browser user agent string
            banner_version: Version of the consent banner shown
            
        Returns:
            ConsentLog: The created consent log entry
            
        Requirements: 1.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
        """
        # Calculate expiry date (12 months from now)
        timestamp = datetime.utcnow()
        expires_at = timestamp + timedelta(days=365)
        
        # Create consent log entry
        consent_log = ConsentLog(
            user_id=user_id,
            session_id=session_id,
            essential=essential,
            analytics=analytics,
            marketing=marketing,
            timestamp=timestamp,
            ip_address=ip_address,
            user_agent=user_agent,
            banner_version=banner_version,
            expires_at=expires_at
        )
        
        db.add(consent_log)
        db.commit()
        db.refresh(consent_log)
        
        return consent_log
    
    def get_user_consent_history(
        self,
        db: Session,
        user_id: int
    ) -> List[ConsentLog]:
        """
        Retrieve all consent decisions for a user.
        Used for data export and audit purposes.
        
        Args:
            db: Database session
            user_id: User ID to retrieve consent history for
            
        Returns:
            List[ConsentLog]: List of consent decisions ordered by timestamp descending
            
        Requirements: 4.5, 7.9
        """
        return db.query(ConsentLog)\
            .filter(ConsentLog.user_id == user_id)\
            .order_by(ConsentLog.timestamp.desc())\
            .all()
    
    def get_current_consent(
        self,
        db: Session,
        user_id: Optional[int] = None,
        session_id: Optional[str] = None
    ) -> Optional[ConsentLog]:
        """
        Get the most recent consent decision for a user or session.
        Returns None if no consent found or consent expired.
        
        Args:
            db: Database session
            user_id: User ID for authenticated users
            session_id: Session ID for anonymous users
            
        Returns:
            ConsentLog or None: Most recent non-expired consent, or None
            
        Requirements: 1.8
        """
        query = db.query(ConsentLog)
        
        # Filter by user_id or session_id
        if user_id is not None:
            query = query.filter(ConsentLog.user_id == user_id)
        elif session_id is not None:
            query = query.filter(ConsentLog.session_id == session_id)
        else:
            return None
        
        # Get most recent consent
        consent = query\
            .order_by(ConsentLog.timestamp.desc())\
            .first()
        
        # Check if consent is expired
        if consent and consent.expires_at < datetime.utcnow():
            return None
        
        return consent
    
    def cleanup_old_consents(
        self,
        db: Session
    ) -> int:
        """
        Delete consent logs older than 3 years.
        Returns count of deleted records.
        
        Args:
            db: Database session
            
        Returns:
            int: Number of consent records deleted
            
        Requirements: 7.8
        """
        three_years_ago = datetime.utcnow() - timedelta(days=365 * 3)
        
        # Count records to be deleted
        count = db.query(ConsentLog)\
            .filter(ConsentLog.timestamp < three_years_ago)\
            .count()
        
        # Delete old consent logs
        db.query(ConsentLog)\
            .filter(ConsentLog.timestamp < three_years_ago)\
            .delete()
        
        db.commit()
        
        return count
