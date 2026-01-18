import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from jose import jwt
from app.auth import get_current_token, get_jwks
from fastapi.security import HTTPAuthorizationCredentials

def test_valid_token():
    """Test that a valid JWT token is accepted."""
    # Mock JWKS response
    mock_jwks = {
        "keys": [{
            "kid": "test-kid",
            "kty": "RSA",
            "use": "sig",
            "n": "test-n",
            "e": "AQAB"
        }]
    }
    
    # Mock JWT token
    mock_payload = {
        "sub": "auth0|123456",
        "email": "user@example.com",
        "aud": "test-audience"
    }
    
    with patch('app.auth.get_jwks', return_value=mock_jwks), \
         patch('app.auth.jwt.get_unverified_header', return_value={"kid": "test-kid"}), \
         patch('app.auth.jwt.decode', return_value=mock_payload):
        
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid.jwt.token")
        result = get_current_token(creds)
        
        assert result["sub"] == "auth0|123456"
        assert result["email"] == "user@example.com"

def test_invalid_token():
    """Test that an invalid JWT token is rejected."""
    # Mock JWKS response
    mock_jwks = {
        "keys": [{
            "kid": "test-kid",
            "kty": "RSA",
            "use": "sig",
            "n": "test-n",
            "e": "AQAB"
        }]
    }
    
    with patch('app.auth.get_jwks', return_value=mock_jwks), \
         patch('app.auth.jwt.get_unverified_header', return_value={"kid": "test-kid"}), \
         patch('app.auth.jwt.decode', side_effect=Exception("Invalid token")):
        
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid.jwt.token")
        
        with pytest.raises(HTTPException) as exc_info:
            get_current_token(creds)
        
        assert exc_info.value.status_code == 401
        assert "Invalid token" in exc_info.value.detail

def test_missing_token():
    """Test that missing token returns 401."""
    # This is handled by FastAPI's Security dependency
    # We test the function behavior when no matching key is found
    mock_jwks = {
        "keys": [{
            "kid": "wrong-kid",
            "kty": "RSA",
            "use": "sig",
            "n": "test-n",
            "e": "AQAB"
        }]
    }
    
    with patch('app.auth.get_jwks', return_value=mock_jwks), \
         patch('app.auth.jwt.get_unverified_header', return_value={"kid": "test-kid"}):
        
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token.with.wrong.kid")
        
        with pytest.raises(HTTPException) as exc_info:
            get_current_token(creds)
        
        assert exc_info.value.status_code == 401
        assert "Invalid header" in exc_info.value.detail

def test_token_missing_sub():
    """Test that token without 'sub' claim is rejected."""
    from app.main import get_current_user
    from unittest.mock import MagicMock
    
    # Token without 'sub'
    mock_token = {
        "email": "user@example.com"
    }
    
    mock_db = MagicMock()
    
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(token=mock_token, db=mock_db)
    
    assert exc_info.value.status_code == 401
    assert "missing sub" in exc_info.value.detail.lower()

@patch('app.auth.requests.get')
def test_get_jwks_success(mock_get):
    """Test JWKS retrieval success."""
    # Reset cached JWKS
    import app.auth
    app.auth._jwks = None
    
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "keys": [{
            "kid": "test-kid",
            "kty": "RSA",
            "use": "sig",
            "n": "test-n",
            "e": "AQAB"
        }]
    }
    mock_get.return_value = mock_response
    
    result = get_jwks()
    
    assert "keys" in result
    assert len(result["keys"]) == 1
    assert result["keys"][0]["kid"] == "test-kid"
    
    # Reset for other tests
    app.auth._jwks = None

@patch('app.auth.requests.get')
def test_get_jwks_cached(mock_get):
    """Test that JWKS is cached after first retrieval."""
    import app.auth
    
    # Set cached JWKS
    cached_jwks = {"keys": [{"kid": "cached-kid"}]}
    app.auth._jwks = cached_jwks
    
    result = get_jwks()
    
    # Should return cached value without making request
    assert result == cached_jwks
    mock_get.assert_not_called()
    
    # Reset for other tests
    app.auth._jwks = None

def test_get_current_user_creates_new_user(test_db):
    """Test that get_current_user creates a new user if not exists."""
    from app.main import get_current_user
    from app.models import User
    
    mock_token = {
        "sub": "auth0|new-user",
        "email": "newuser@example.com"
    }
    
    user = get_current_user(token=mock_token, db=test_db)
    
    assert user.auth0_sub == "auth0|new-user"
    assert user.email == "newuser@example.com"
    
    # Verify user was saved to DB
    db_user = test_db.query(User).filter(User.auth0_sub == "auth0|new-user").first()
    assert db_user is not None

def test_get_current_user_returns_existing_user(test_db):
    """Test that get_current_user returns existing user."""
    from app.main import get_current_user
    from app.models import User
    
    # Create existing user
    existing_user = User(
        auth0_sub="auth0|existing",
        email="existing@example.com"
    )
    test_db.add(existing_user)
    test_db.commit()
    test_db.refresh(existing_user)
    
    mock_token = {
        "sub": "auth0|existing",
        "email": "existing@example.com"
    }
    
    user = get_current_user(token=mock_token, db=test_db)
    
    assert user.id == existing_user.id
    assert user.auth0_sub == "auth0|existing"
    
    # Verify no duplicate was created
    user_count = test_db.query(User).filter(User.auth0_sub == "auth0|existing").count()
    assert user_count == 1
