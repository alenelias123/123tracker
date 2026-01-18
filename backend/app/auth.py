import json
import requests
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from app.config import settings

security = HTTPBearer()

# Cache JWKS
_jwks = None
def get_jwks():
    global _jwks
    if _jwks:
        return _jwks
    url = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"
    resp = requests.get(url, timeout=5)
    resp.raise_for_status()
    _jwks = resp.json()
    return _jwks

def get_current_token(creds: HTTPAuthorizationCredentials = Security(security)):
    token = creds.credentials
    jwks = get_jwks()
    unverified_header = jwt.get_unverified_header(token)
    rsa_key = {}
    for key in jwks["keys"]:
        if key["kid"] == unverified_header.get("kid"):
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"],
            }
            break
    if not rsa_key:
        raise HTTPException(status_code=401, detail="Invalid header")
    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=settings.AUTH0_AUDIENCE,
            issuer=settings.AUTH0_ISSUER,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload  # contains sub, email (if scope), etc.