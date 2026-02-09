"""
Test suite for GDPR router endpoints

Tests all GDPR API endpoints:
- POST /api/gdpr/consent
- GET /api/gdpr/consent
- POST /api/gdpr/export
- GET /api/gdpr/download/:token
- POST /api/gdpr/delete-account
- POST /api/gdpr/cancel-deletion
- GET /api/gdpr/privacy-policy
- GET /api/gdpr/terms-of-service
- POST /api/gdpr/accept-policy
"""

import pytest
import sys
import os
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import User, ConsentLog, DeletionRequest, DataExportToken, PolicyAcceptance
from app.routers.gdpr import router
from fastapi.testclient import TestClient
from fastapi import FastAPI
import bcrypt

# Create test database
TEST_DATABASE_URL = "sqlite:///./test_gdpr_router.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override database dependency
from app.database import get_db

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Create test app
app = FastAPI()
app.include_router(router, prefix="/api/gdpr")
app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(db):
    """Create a test user"""
    hashed_password = bcrypt.hashpw("testpassword123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user = User(
        email="test@example.com",
        hashed_password=hashed_password,
        is_verified=True,
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_token(test_user):
    """Generate a JWT token for the test user"""
    from jose import jwt
    from datetime import datetime, timedelta
    
    SECRET_KEY = "your-secret-key-change-in-production"
    ALGORITHM = "HS256"
    
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode = {"sub": str(test_user.id), "email": test_user.email, "exp": expire}
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token


def test_log_consent_anonymous(db):
    """Test logging consent for anonymous user"""
    response = client.post(
        "/api/gdpr/consent",
        json={
            "essential": True,
            "analytics": True,
            "marketing": False,
            "banner_version": "1.0"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "consent_id" in data
    assert "timestamp" in data
    
    # Verify consent was logged in database
    consent = db.query(ConsentLog).filter(ConsentLog.id == data["consent_id"]).first()
    assert consent is not None
    assert consent.essential is True
    assert consent.analytics is True
    assert consent.marketing is False
    assert consent.banner_version == "1.0"


def test_log_consent_authenticated(db, test_user, auth_token):
    """Test logging consent for authenticated user"""
    response = client.post(
        "/api/gdpr/consent",
        json={
            "essential": True,
            "analytics": False,
            "marketing": False,
            "banner_version": "1.0"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    
    # Verify consent was linked to user
    consent = db.query(ConsentLog).filter(ConsentLog.id == data["consent_id"]).first()
    assert consent.user_id == test_user.id


def test_get_consent_history_requires_auth(db):
    """Test that getting consent history requires authentication"""
    response = client.get("/api/gdpr/consent")
    assert response.status_code == 401


def test_get_consent_history(db, test_user, auth_token):
    """Test getting consent history for authenticated user"""
    # Create some consent logs
    from app.services.consent_service import ConsentService
    consent_service = ConsentService()
    
    consent_service.log_consent(
        db=db,
        user_id=test_user.id,
        session_id=None,
        essential=True,
        analytics=True,
        marketing=False,
        ip_address="127.0.0.1",
        user_agent="Test Agent",
        banner_version="1.0"
    )
    
    response = client.get(
        "/api/gdpr/consent",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "current_consent" in data
    assert "history" in data
    assert len(data["history"]) == 1
    assert data["history"][0]["analytics"] is True


def test_request_data_export_requires_auth(db):
    """Test that data export requires authentication"""
    response = client.post("/api/gdpr/export")
    assert response.status_code == 401


def test_request_data_export(db, test_user, auth_token):
    """Test requesting data export"""
    response = client.post(
        "/api/gdpr/export",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "download_url" in data
    assert "expires_at" in data
    assert "file_size_bytes" in data
    assert "/api/gdpr/download/" in data["download_url"]


def test_download_export_file_invalid_token(db):
    """Test downloading with invalid token"""
    response = client.get("/api/gdpr/download/invalid_token")
    assert response.status_code == 404


def test_download_export_file(db, test_user, auth_token):
    """Test downloading export file with valid token"""
    # First, request an export
    export_response = client.post(
        "/api/gdpr/export",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    download_url = export_response.json()["download_url"]
    token = download_url.split("/")[-1]
    
    # Now download the file
    response = client.get(f"/api/gdpr/download/{token}")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    assert "attachment" in response.headers["content-disposition"]
    
    # Verify the content is valid JSON
    import json
    data = json.loads(response.content)
    assert "export_metadata" in data
    assert "account" in data
    assert data["account"]["email"] == test_user.email


def test_delete_account_requires_auth(db):
    """Test that account deletion requires authentication"""
    response = client.post(
        "/api/gdpr/delete-account",
        json={
            "password": "testpassword123",
            "confirmation": "DELETE MY ACCOUNT"
        }
    )
    assert response.status_code == 401


def test_delete_account_wrong_confirmation(db, test_user, auth_token):
    """Test account deletion with wrong confirmation text"""
    response = client.post(
        "/api/gdpr/delete-account",
        json={
            "password": "testpassword123",
            "confirmation": "DELETE MY ACCOUNT PLEASE"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 400


def test_delete_account_wrong_password(db, test_user, auth_token):
    """Test account deletion with wrong password"""
    response = client.post(
        "/api/gdpr/delete-account",
        json={
            "password": "wrongpassword",
            "confirmation": "DELETE MY ACCOUNT"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 401


def test_delete_account_success(db, test_user, auth_token):
    """Test successful account deletion request"""
    response = client.post(
        "/api/gdpr/delete-account",
        json={
            "password": "testpassword123",
            "confirmation": "DELETE MY ACCOUNT"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "deletion_scheduled" in data
    assert "cancellation_token" in data
    assert "message" in data
    
    # Verify deletion request was created
    deletion_request = db.query(DeletionRequest).filter(
        DeletionRequest.user_id == test_user.id
    ).first()
    assert deletion_request is not None
    assert deletion_request.status == "pending"


def test_cancel_deletion_invalid_token(db):
    """Test cancelling deletion with invalid token"""
    response = client.post(
        "/api/gdpr/cancel-deletion",
        json={"cancellation_token": "invalid_token"}
    )
    assert response.status_code == 404


def test_cancel_deletion_success(db, test_user, auth_token):
    """Test successful deletion cancellation"""
    # First, request deletion
    delete_response = client.post(
        "/api/gdpr/delete-account",
        json={
            "password": "testpassword123",
            "confirmation": "DELETE MY ACCOUNT"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    cancellation_token = delete_response.json()["cancellation_token"]
    
    # Now cancel it
    response = client.post(
        "/api/gdpr/cancel-deletion",
        json={"cancellation_token": cancellation_token}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "cancelled" in data["message"].lower()
    
    # Verify deletion request was cancelled
    deletion_request = db.query(DeletionRequest).filter(
        DeletionRequest.user_id == test_user.id
    ).first()
    assert deletion_request.status == "cancelled"


def test_get_privacy_policy():
    """Test getting privacy policy"""
    response = client.get("/api/gdpr/privacy-policy")
    
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "version" in data
    assert "last_updated" in data
    assert "effective_date" in data
    assert "Privacy Policy" in data["content"]


def test_get_terms_of_service():
    """Test getting terms of service"""
    response = client.get("/api/gdpr/terms-of-service")
    
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "version" in data
    assert "last_updated" in data
    assert "effective_date" in data
    assert "Terms of Service" in data["content"]


def test_accept_policy_requires_auth(db):
    """Test that accepting policy requires authentication"""
    response = client.post(
        "/api/gdpr/accept-policy",
        json={
            "policy_type": "privacy",
            "version": "1.0"
        }
    )
    assert response.status_code == 401


def test_accept_policy_invalid_type(db, test_user, auth_token):
    """Test accepting policy with invalid type"""
    response = client.post(
        "/api/gdpr/accept-policy",
        json={
            "policy_type": "invalid",
            "version": "1.0"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 400


def test_accept_privacy_policy(db, test_user, auth_token):
    """Test accepting privacy policy"""
    response = client.post(
        "/api/gdpr/accept-policy",
        json={
            "policy_type": "privacy",
            "version": "1.0"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "accepted_at" in data
    
    # Verify policy acceptance was recorded
    acceptance = db.query(PolicyAcceptance).filter(
        PolicyAcceptance.user_id == test_user.id,
        PolicyAcceptance.policy_type == "privacy"
    ).first()
    assert acceptance is not None
    assert acceptance.policy_version == "1.0"
    
    # Verify user's privacy_policy_version was updated
    db.refresh(test_user)
    assert test_user.privacy_policy_version == "1.0"


def test_accept_terms_of_service(db, test_user, auth_token):
    """Test accepting terms of service"""
    response = client.post(
        "/api/gdpr/accept-policy",
        json={
            "policy_type": "terms",
            "version": "1.0"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    
    # Verify user's terms_version was updated
    db.refresh(test_user)
    assert test_user.terms_version == "1.0"


def test_export_file_expires(db, test_user, auth_token):
    """Test that export tokens expire after 24 hours"""
    # Create an expired export token
    from app.services.data_export_service import DataExportService
    export_service = DataExportService()
    
    # Generate export
    token = export_service.generate_export_file(db, test_user.id)
    
    # Manually expire the token
    export_token = db.query(DataExportToken).filter(
        DataExportToken.token == token
    ).first()
    export_token.expires_at = datetime.utcnow() - timedelta(hours=1)
    db.commit()
    
    # Try to download
    response = client.get(f"/api/gdpr/download/{token}")
    assert response.status_code == 410  # Gone


def test_deletion_already_pending(db, test_user, auth_token):
    """Test that requesting deletion twice fails"""
    # First deletion request
    client.post(
        "/api/gdpr/delete-account",
        json={
            "password": "testpassword123",
            "confirmation": "DELETE MY ACCOUNT"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    # Second deletion request should fail
    response = client.post(
        "/api/gdpr/delete-account",
        json={
            "password": "testpassword123",
            "confirmation": "DELETE MY ACCOUNT"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 400
    assert "already pending" in response.json()["detail"].lower()


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "-s"])
