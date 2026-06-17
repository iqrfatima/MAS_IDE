# agent/testing.py

from agent.base_agent import BaseAgent


class TestingAgent(BaseAgent):

    def __init__(self, llm_service):
        super().__init__(llm_service, agent_id="testing")

    def get_role_instructions(self) -> str:
        return """
Generate automated tests for the generated project.
Cover frontend behavior, backend endpoints, database integration, and core
business rules. Include test setup instructions and realistic fixtures.

Include test files in the files array using conventional paths such as
tests/, src/__tests__/, or e2e/ based on the architecture.
"""
