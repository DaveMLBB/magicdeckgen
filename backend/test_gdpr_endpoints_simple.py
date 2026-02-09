"""
Simple integration test for GDPR endpoints
Tests the endpoints by making actual HTTP requests to a running server
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_privacy_policy():
    """Test GET /api/gdpr/privacy-policy"""
    print("\n🧪 Testing GET /api/gdpr/privacy-policy...")
    response = requests.get(f"{BASE_URL}/api/gdpr/privacy-policy")
    print(f"Status: {response.status_code}")
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "version" in data
    assert "Privacy Policy" in data["content"]
    print("✅ Privacy policy endpoint works!")


def test_terms_of_service():
    """Test GET /api/gdpr/terms-of-service"""
    print("\n🧪 Testing GET /api/gdpr/terms-of-service...")
    response = requests.get(f"{BASE_URL}/api/gdpr/terms-of-service")
    print(f"Status: {response.status_code}")
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "version" in data
    assert "Terms of Service" in data["content"]
    print("✅ Terms of service endpoint works!")


def test_log_consent_anonymous():
    """Test POST /api/gdpr/consent (anonymous)"""
    print("\n🧪 Testing POST /api/gdpr/consent (anonymous)...")
    response = requests.post(
        f"{BASE_URL}/api/gdpr/consent",
        json={
            "essential": True,
            "analytics": True,
            "marketing": False,
            "banner_version": "1.0"
        }
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "consent_id" in data
    assert "timestamp" in data
    print("✅ Anonymous consent logging works!")


def test_consent_requires_auth():
    """Test GET /api/gdpr/consent requires authentication"""
    print("\n🧪 Testing GET /api/gdpr/consent (no auth)...")
    response = requests.get(f"{BASE_URL}/api/gdpr/consent")
    print(f"Status: {response.status_code}")
    assert response.status_code == 401
    print("✅ Consent history correctly requires authentication!")


def test_export_requires_auth():
    """Test POST /api/gdpr/export requires authentication"""
    print("\n🧪 Testing POST /api/gdpr/export (no auth)...")
    response = requests.post(f"{BASE_URL}/api/gdpr/export")
    print(f"Status: {response.status_code}")
    assert response.status_code == 401
    print("✅ Data export correctly requires authentication!")


def test_delete_account_requires_auth():
    """Test POST /api/gdpr/delete-account requires authentication"""
    print("\n🧪 Testing POST /api/gdpr/delete-account (no auth)...")
    response = requests.post(
        f"{BASE_URL}/api/gdpr/delete-account",
        json={
            "password": "test",
            "confirmation": "DELETE MY ACCOUNT"
        }
    )
    print(f"Status: {response.status_code}")
    assert response.status_code == 401
    print("✅ Account deletion correctly requires authentication!")


def test_download_invalid_token():
    """Test GET /api/gdpr/download/:token with invalid token"""
    print("\n🧪 Testing GET /api/gdpr/download/:token (invalid token)...")
    response = requests.get(f"{BASE_URL}/api/gdpr/download/invalid_token_12345")
    print(f"Status: {response.status_code}")
    assert response.status_code == 404
    print("✅ Download correctly rejects invalid tokens!")


def test_cancel_deletion_invalid_token():
    """Test POST /api/gdpr/cancel-deletion with invalid token"""
    print("\n🧪 Testing POST /api/gdpr/cancel-deletion (invalid token)...")
    response = requests.post(
        f"{BASE_URL}/api/gdpr/cancel-deletion",
        json={"cancellation_token": "invalid_token_12345"}
    )
    print(f"Status: {response.status_code}")
    assert response.status_code == 404
    print("✅ Cancellation correctly rejects invalid tokens!")


def test_accept_policy_requires_auth():
    """Test POST /api/gdpr/accept-policy requires authentication"""
    print("\n🧪 Testing POST /api/gdpr/accept-policy (no auth)...")
    response = requests.post(
        f"{BASE_URL}/api/gdpr/accept-policy",
        json={
            "policy_type": "privacy",
            "version": "1.0"
        }
    )
    print(f"Status: {response.status_code}")
    assert response.status_code == 401
    print("✅ Policy acceptance correctly requires authentication!")


if __name__ == "__main__":
    print("=" * 60)
    print("GDPR Endpoints Integration Tests")
    print("=" * 60)
    print("\n⚠️  Make sure the server is running on http://localhost:8000")
    print("   Run: python run.py")
    print()
    
    try:
        # Test public endpoints
        test_privacy_policy()
        test_terms_of_service()
        test_log_consent_anonymous()
        
        # Test authentication requirements
        test_consent_requires_auth()
        test_export_requires_auth()
        test_delete_account_requires_auth()
        test_accept_policy_requires_auth()
        
        # Test error handling
        test_download_invalid_token()
        test_cancel_deletion_invalid_token()
        
        print("\n" + "=" * 60)
        print("✅ All tests passed!")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        exit(1)
    except requests.exceptions.ConnectionError:
        print("\n❌ Could not connect to server. Make sure it's running on http://localhost:8000")
        exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        exit(1)
