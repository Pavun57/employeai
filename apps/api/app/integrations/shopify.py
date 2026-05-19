"""Shopify connector — orders, products, customers."""

from typing import Optional

import httpx

from app.integrations.base import BaseConnector


class ShopifyConnector(BaseConnector):
    """Connector for Shopify store data access."""

    def __init__(self, access_token: str, shop_domain: str, refresh_token: Optional[str] = None):
        super().__init__(access_token, refresh_token)
        self.shop_domain = shop_domain
        self.api_base = f"https://{shop_domain}/admin/api/2024-01"

    async def verify_connection(self) -> bool:
        """Verify Shopify token validity."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/shop.json",
                headers={"X-Shopify-Access-Token": self.access_token},
            )
            return response.status_code == 200

    async def refresh_access_token(self) -> Optional[str]:
        """Shopify offline tokens don't expire; returns current token."""
        return self.access_token

    async def get_account_info(self) -> dict:
        """Get shop info."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/shop.json",
                headers={"X-Shopify-Access-Token": self.access_token},
            )
            if response.status_code == 200:
                return response.json().get("shop", {})
            return {}

    async def get_orders(self, limit: int = 10, status: str = "any") -> list[dict]:
        """Get recent orders."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/orders.json",
                headers={"X-Shopify-Access-Token": self.access_token},
                params={"limit": limit, "status": status},
            )
            if response.status_code == 200:
                return response.json().get("orders", [])
            return []

    async def get_order(self, order_id: str) -> dict:
        """Get a specific order by ID."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/orders/{order_id}.json",
                headers={"X-Shopify-Access-Token": self.access_token},
            )
            if response.status_code == 200:
                return response.json().get("order", {})
            return {}

    async def get_products(self, limit: int = 20) -> list[dict]:
        """Get products from the store."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/products.json",
                headers={"X-Shopify-Access-Token": self.access_token},
                params={"limit": limit},
            )
            if response.status_code == 200:
                return response.json().get("products", [])
            return []

    async def get_customers(self, limit: int = 20) -> list[dict]:
        """Get customers from the store."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/customers.json",
                headers={"X-Shopify-Access-Token": self.access_token},
                params={"limit": limit},
            )
            if response.status_code == 200:
                return response.json().get("customers", [])
            return []

    async def search_orders(self, query: str) -> list[dict]:
        """Search orders by order number, email, or name."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/orders.json",
                headers={"X-Shopify-Access-Token": self.access_token},
                params={"status": "any", "fields": "id,name,email,total_price,financial_status,fulfillment_status,created_at"},
            )
            if response.status_code == 200:
                orders = response.json().get("orders", [])
                # Filter client-side for flexible search
                query_lower = query.lower()
                return [
                    o for o in orders
                    if query_lower in str(o.get("name", "")).lower()
                    or query_lower in str(o.get("email", "")).lower()
                    or query_lower in str(o.get("id", ""))
                ]
            return []
