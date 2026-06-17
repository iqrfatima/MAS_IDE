# agent/reviewer.py

from agent.base_agent import BaseAgent


class ReviewerAgent(BaseAgent):

    def __init__(self, llm_service):
        super().__init__(llm_service, agent_id="reviewer")

    def get_role_instructions(self) -> str:
        return """
Act as the senior production reviewer for the whole project.
Inspect generated files, contracts, imports, security, accessibility,
performance, and test coverage. Return a concise review with required fixes.

Add review findings and validation requirements to graphUpdates.
Only include files when a critical correction is needed.
"""
