"""Agent orchestrator — creates and manages agent instances, dispatches tasks."""

from typing import Optional

from app.agents.base import BaseAgent
from app.agents.marketing import MarketingAgent
from app.agents.support import SupportAgent
from app.agents.social import SocialMediaAgent


AGENT_REGISTRY: dict[str, type[BaseAgent]] = {
    "marketing": MarketingAgent,
    "support": SupportAgent,
    "social_media": SocialMediaAgent,
}


class AgentOrchestrator:
    """Creates agent instances and dispatches tasks to them."""

    def __init__(self):
        self._instances: dict[str, BaseAgent] = {}

    def get_or_create_agent(
        self,
        agent_id: str,
        agent_type: str,
        org_id: str,
        config: dict,
        system_prompt: str = "",
    ) -> BaseAgent:
        """Get an existing agent instance or create a new one."""
        if agent_id in self._instances:
            return self._instances[agent_id]

        agent_class = AGENT_REGISTRY.get(agent_type)
        if not agent_class:
            raise ValueError(f"Unknown agent type: {agent_type}")

        agent = agent_class(
            agent_id=agent_id,
            org_id=org_id,
            config=config,
            system_prompt=system_prompt,
        )
        self._instances[agent_id] = agent
        return agent

    async def execute_task(
        self,
        agent_id: str,
        agent_type: str,
        org_id: str,
        config: dict,
        system_prompt: str,
        task: dict,
    ) -> dict:
        """Execute a task using the appropriate agent."""
        agent = self.get_or_create_agent(
            agent_id=agent_id,
            agent_type=agent_type,
            org_id=org_id,
            config=config,
            system_prompt=system_prompt,
        )
        return await agent.execute_task(task)

    def remove_agent(self, agent_id: str):
        """Remove an agent instance from memory."""
        self._instances.pop(agent_id, None)


# Singleton orchestrator
orchestrator = AgentOrchestrator()
