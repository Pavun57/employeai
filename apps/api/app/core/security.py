"""Security utilities — encryption for OAuth tokens."""

import base64
import os

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.core.config import settings


def _get_fernet() -> Fernet:
    """Derive a Fernet key from the encryption key setting."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"employeai-salt-v1",
        iterations=480000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(settings.encryption_key.encode()))
    return Fernet(key)


def encrypt_token(plaintext: str) -> bytes:
    """Encrypt a token for database storage."""
    fernet = _get_fernet()
    return fernet.encrypt(plaintext.encode())


def decrypt_token(ciphertext: bytes) -> str:
    """Decrypt a token from database storage."""
    fernet = _get_fernet()
    return fernet.decrypt(ciphertext).decode()


def generate_random_key(length: int = 32) -> str:
    """Generate a cryptographically secure random key."""
    return os.urandom(length).hex()
