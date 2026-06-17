# agent/base_agent.py

from abc import ABC, abstractmethod
from typing import Any

from agent.agent_manager import AgentManager


class BaseAgent(ABC):

    def __init__(
        self,
        llm_service,
        agent_id: str,
    ):
        self.llm = llm_service
        self.agent_id = agent_id

    @abstractmethod
    def get_role_instructions(self) -> str:
        pass

    async def execute(
        self,
        task: dict[str, Any],
        manager: AgentManager,
    ) -> dict[str, Any]:
        manager.create_session(self.agent_id)

        manager.add_message(
            "system",
            "orchestrator",
            f"Assigning task to {self.agent_id}: {task.get('title', '')}",
        )

        context = manager.build_context(self.agent_id, task)
        role_extra = self.get_role_instructions()

        prompt = context
        if role_extra:
            prompt = f"{context}\n\nROLE-SPECIFIC GUIDANCE:\n{role_extra}"

        result = await self.llm.generate_json(prompt)

        manager.record_agent_result(
            self.agent_id,
            task,
            prompt,
            result,
        )

        return result
