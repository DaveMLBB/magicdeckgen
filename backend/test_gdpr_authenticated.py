"""
Authenticated integration tests for GDPR endpoints
Tests endpoints that require authentication
"""

import requests
import json

BASE_URL = "http://localhost:8000"

# Test user credentials
TEST_EMAIL = "gdpr_test@example.com"
TEST_PASSWORD = "TestPassword123!"


def register_test_user():
    """Register a test user"""
    print("\n📝 Registering test user...")
    response = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
    )
    if response.status_code == 400 and "già registrata" in response.text:
        print("   User already exists, will use existing user")
        return True
    assert response.status_code == 200
    print("   ✅ User registered")
    return True


def login_test_user():
    """Login and get auth token"""
    print("\n🔐 Logging in...")
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
    )
    assert response.status_code == 200
    data = response.json()
    token = data["access_token"]
    print(f"   ✅ Logged in, token: {token[:20]}...")
    return token


def test_log_consent_authenticated(token):
    """Test POST /api/gdpr/consent with authentication"""
    print("\n🧪 Testing POST /api/gdpr/consent (authenticated)...")
    response = requests.post(
        f"{BASE_URL}/api/gdpr/consent",
        json={
            "essential": True,
            "analytics": False,
            "marketing": True,
            "banner_version": "1.0"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"   Status: {response.status_code}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    print("   ✅ Authenticated consent logging works!")
    return data["consent_id"]


def test_get_consent_history(token):
    """Test GET /api/gdpr/consent"""
    print("\n🧪 Testing GET /api/gdpr/consent...")
    response = requests.get(
        f"{BASE_URL}/api/gdpr/consent",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"   Status: {response.status_code}")
    assert response.status_code == 200
    data = response.json()
    assert "current_consent" in data
    assert "history" in data
    assert len(data["history"]) > 0
    print(f"   ✅ Consent history retrieved! Found {len(data['history'])} entries")
    print(f"   Current consent: {data['current_consent']}")


def test_request_data_export(token):
    """Test POST /api/gdpr/export"""
    print("\n🧪 Testing POST /api/gdpr/export...")
    response = requests.post(
        f"{BASE_URL}/api/gdpr/export",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"   Status: {response.status_code}")
    assert response.status_code == 200
    data = response.json()
    assert "download_url" in data
    assert "expires_at" in data
    assert "file_size_bytes" in data
    print(f"   ✅ Export requested! Size: {data['file_size_bytes']} bytes")
    print(f"   Download URL: {data['download_url']}")
    return data["download_url"]


def test_download_export(download_url):
    """Test GET /api/gdpr/download/:token"""
    print("\n🧪 Testing GET /api/gdpr/download/:token...")
    response = requests.get(f"{BASE_URL}{download_url}")
    print(f"   Status: {response.status_code}")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    
    # Parse and validate JSON
    data = response.json()
    assert "export_metadata" in data
    assert "account" in data
    assert "saved_decks" in data
    assert "card_collections" in data
    assert "consent_history" in data
    assert "policy_acceptances" in data
    
    print(f"   ✅ Export downloaded successfully!")
    print(f"   Account email: {data['account']['email']}")
    print(f"   Saved decks: {len(data['saved_decks'])}")
    print(f"   Collections: {len(data['card_collections'])}")
    print(f"   Consent history: {len(data['consent_history'])}")


def test_accept_privacy_policy(token):
    """Test POST /api/gdpr/accept-policy (privacy)"""
    print("\n🧪 Testing POST /api/gdpr/accept-policy (privacy)...")
    response = requests.post(
        f"{BASE_URL}/api/gdpr/accept-policy",
        json={
            "policy_type": "privacy",
            "version": "1.0"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"   Status: {response.status_code}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "accepted_at" in data
    print(f"   ✅ Privacy policy accepted at {data['accepted_at']}")


def test_accept_terms_of_service(token):
    """Test POST /api/gdpr/accept-policy (terms)"""
    print("\n🧪 Testing POST /api/gdpr/accept-policy (terms)...")
    response = requests.post(
        f"{BASE_URL}/api/gdpr/accept-policy",
        json={
            "policy_type": "terms",
            "version": "1.0"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"   Status: {response.status_code}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    print(f"   ✅ Terms of service accepted at {data['accepted_at']}")


def test_delete_account_wrong_password(token):
    """Test POST /api/gdpr/delete-account with wrong password"""
    print("\n🧪 Testing POST /api/gdpr/delete-account (wrong password)...")
    response = requests.post(
        f"{BASE_URL}/api/gdpr/delete-account",
        json={
            "password": "WrongPassword123!",
            "confirmation": "DELETE MY ACCOUNT"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"   Status: {response.status_code}")
    assert response.status_code == 401
    print("   ✅ Correctly rejected wrong password!")


def test_delete_account_wrong_confirmation(token):
    """Test POST /api/gdpr/delete-account with wrong confirmation"""
    print("\n🧪 Testing POST /api/gdpr/delete-account (wrong confirmation)...")
    response = requests.post(
        f"{BASE_URL}/api/gdpr/delete-account",
        json={
            "password": TEST_PASSWORD,
            "confirmation": "DELETE MY ACCOUNT PLEASE"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"   Status: {response.status_code}")
    assert response.status_code == 400
    print("   ✅ Correctly rejected wrong confirmation text!")


def test_delete_account_and_cancel(token):
    """Test POST /api/gdpr/delete-account and cancellation"""
    print("\n🧪 Testing POST /api/gdpr/delete-account (with cancellation)...")
    response = requests.post(
        f"{BASE_URL}/api/gdpr/delete-account",
        json={
            "password": TEST_PASSWORD,
            "confirmation": "DELETE MY ACCOUNT"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"   Status: {response.status_code}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "cancellation_token" in data
    print(f"   ✅ Deletion scheduled for {data['deletion_scheduled']}")
    
    # Now cancel it
    print("\n🧪 Testing POST /api/gdpr/cancel-deletion...")
    cancel_response = requests.post(
        f"{BASE_URL}/api/gdpr/cancel-deletion",
        json={"cancellation_token": data["cancellation_token"]}
    )
    print(f"   Status: {cancel_response.status_code}")
    assert cancel_response.status_code == 200
    cancel_data = cancel_response.json()
    assert cancel_data["success"] is True
    print("   ✅ Deletion cancelled successfully!")


if __name__ == "__main__":
    print("=" * 60)
    print("GDPR Authenticated Endpoints Integration Tests")
    print("=" * 60)
    print("\n⚠️  Make sure the server is running on http://localhost:8000")
    print()
    
    try:
        # Setup
        register_test_user()
        token = login_test_user()
        
        # Test authenticated endpoints
        test_log_consent_authenticated(token)
        test_get_consent_history(token)
        
        download_url = test_request_data_export(token)
        test_download_export(download_url)
        
        test_accept_privacy_policy(token)
        test_accept_terms_of_service(token)
        
        # Test account deletion
        test_delete_account_wrong_password(token)
        test_delete_account_wrong_confirmation(token)
        test_delete_account_and_cancel(token)
        
        print("\n" + "=" * 60)
        print("✅ All authenticated tests passed!")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
    except requests.exceptions.ConnectionError:
        print("\n❌ Could not connect to server. Make sure it's running on http://localhost:8000")
        exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
