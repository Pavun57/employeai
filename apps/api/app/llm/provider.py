"""Abstracted LLM provider — supports Groq API, LM Studio, and any OpenAI-compatible endpoint."""

from typing import AsyncGenerator, Optional

import httpx

from app.core.config import settings


class LLMProvider:
    """Unified interface for LLM completions."""

    def __init__(self):
        self._configure()

    def _configure(self):
        """Set up provider based on settings."""
        if settings.llm_provider == "groq":
            self.base_url = settings.groq_base_url
            self.api_key = settings.groq_api_key
            self.model = "llama-3.3-70b-versatile" if settings.llm_model in ("", "default") else settings.llm_model
        elif settings.llm_provider == "lmstudio":
            self.base_url = settings.llm_base_url
            self.api_key = settings.llm_api_key or "lm-studio"
            self.model = settings.llm_model or "default"
        else:
            # Generic OpenAI-compatible
            self.base_url = settings.llm_base_url
            self.api_key = settings.llm_api_key
            self.model = settings.llm_model

    async def chat(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system_prompt: Optional[str] = None,
    ) -> str:
        """Send a chat completion request and return the response text."""
        if system_prompt:
            messages = [{"role": "system", "content": system_prompt}] + messages

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def chat_stream(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream a chat completion response."""
        if system_prompt:
            messages = [{"role": "system", "content": system_prompt}] + messages

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": True,
                },
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: ") and line != "data: [DONE]":
                        import json
                        chunk = json.loads(line[6:])
                        delta = chunk["choices"][0].get("delta", {})
                        if content := delta.get("content"):
                            yield content


# Singleton instance
llm = LLMProvider()


async def generate_text(prompt: str, temperature: float = 0.7, max_tokens: int = 2048) -> str:
    """Convenience function to generate text from a prompt."""
    return await llm.chat(
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
    )
