"""Base connector interface for external platform integrations."""

from abc import ABC, abstractmethod
from typing import Any, Optional


class BaseConnector(ABC):
    """Abstract base class for all platform connectors."""

    def __init__(self, access_token: str, refresh_token: Optional[str] = None):
        self.access_token = access_token
        self.refresh_token = refresh_token

    @abstractmethod
    async def verify_connection(self) -> bool:
        """Verify the connection/token is still valid."""
        pass

    @abstractmethod
    async def refresh_access_token(self) -> Optional[str]:
        """Refresh the access token if expired. Returns new token or None."""
        pass

    @abstractmethod
    async def get_account_info(self) -> dict:
        """Get basic account information."""
        pass
