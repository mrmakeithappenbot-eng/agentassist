"""
Security utilities for encryption, hashing, and JWT tokens
"""

import os
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.backends import default_backend
from passlib.context import CryptContext
from jose import JWTError, jwt
import json

from app.core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

# JWT tokens
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

# AES-256-GCM encryption for CRM credentials
class CredentialEncryptor:
    """
    AES-256-GCM encryption for sensitive credentials
    Critical: This is the security layer protecting all CRM API keys
    """
    
    def __init__(self):
        # Decode the base64 encryption key from environment
        key_bytes = base64.b64decode(settings.ENCRYPTION_KEY)
        if len(key_bytes) != 32:
            raise ValueError("ENCRYPTION_KEY must be exactly 32 bytes (256 bits)")
        self.aesgcm = AESGCM(key_bytes)
    
    def encrypt(self, plaintext: Dict[str, Any]) -> tuple[str, str]:
        """
        Encrypt a dictionary of credentials
        Returns: (encrypted_data_b64, iv_b64)
        """
        # Convert dict to JSON string
        plaintext_bytes = json.dumps(plaintext).encode('utf-8')
        
        # Generate a random 96-bit IV (12 bytes is standard for GCM)
        iv = os.urandom(12)
        
        # Encrypt
        ciphertext = self.aesgcm.encrypt(iv, plaintext_bytes, None)
        
        # Return base64-encoded strings for database storage
        return (
            base64.b64encode(ciphertext).decode('utf-8'),
            base64.b64encode(iv).decode('utf-8')
        )
    
    def decrypt(self, encrypted_data_b64: str, iv_b64: str) -> Dict[str, Any]:
        """
        Decrypt credentials back to dictionary
        """
        # Decode from base64
        ciphertext = base64.b64decode(encrypted_data_b64)
        iv = base64.b64decode(iv_b64)
        
        # Decrypt
        plaintext_bytes = self.aesgcm.decrypt(iv, ciphertext, None)
        
        # Parse JSON
        return json.loads(plaintext_bytes.decode('utf-8'))

# Global encryptor instance
credential_encryptor = CredentialEncryptor()

def encrypt_credentials(credentials: Dict[str, Any]) -> tuple[str, str]:
    """Convenience function to encrypt CRM credentials"""
    return credential_encryptor.encrypt(credentials)

def decrypt_credentials(encrypted_data: str, iv: str) -> Dict[str, Any]:
    """Convenience function to decrypt CRM credentials"""
    return credential_encryptor.decrypt(encrypted_data, iv)

def generate_encryption_key() -> str:
    """
    Generate a new 256-bit encryption key (base64 encoded)
    Run this once and store in .env as ENCRYPTION_KEY
    """
    key = os.urandom(32)
    return base64.b64encode(key).decode('utf-8')
