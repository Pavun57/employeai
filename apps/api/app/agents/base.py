"""Base agent class — all AI employees inherit from this."""

from abc import ABC, abstractmethod
from typing import Any, Optional

from app.llm.provider import llm


class BaseAgent(ABC):
    """Base class for all AI employee agents."""

    def __init__(self, agent_id: str, org_id: str, config: dict, system_prompt: str = ""):
        self.agent_id = agent_id
        self.org_id = org_id
        self.config = config
        self.system_prompt = system_prompt or self.default_system_prompt()

    @abstractmethod
    def default_system_prompt(self) -> str:
        """Return the default system prompt for this agent type."""
        pass

    @abstractmethod
    async def get_tools(self) -> list[dict]:
        """Return the tools available to this agent."""
        pass

    async def think(self, messages: list[dict], context: Optional[dict] = None) -> str:
        """Send a message to the LLM and get a response."""
        system = self.system_prompt
        if context:
            system += f"\n\nContext:\n{self._format_context(context)}"

        return await llm.chat(
            messages=messages,
            system_prompt=system,
            temperature=0.7,
        )

    async def execute_task(self, task: dict) -> dict:
        """Execute a task. Override in subclasses for specific behavior."""
        messages = [
            {"role": "user", "content": self._format_task(task)},
        ]
        response = await self.think(messages, context=task.get("context"))
        return {
            "status": "completed",
            "output": response,
        }

    def _format_task(self, task: dict) -> str:
        """Format a task dict into a user message."""
        parts = [f"Task: {task.get('title', 'Untitled')}"]
        if desc := task.get("description"):
            parts.append(f"Description: {desc}")
        if data := task.get("input_data"):
            parts.append(f"Input Data: {data}")
        return "\n".join(parts)

    def _format_context(self, context: dict) -> str:
        """Format context dict into a string for the system prompt."""
        return "\n".join(f"- {k}: {v}" for k, v in context.items())
