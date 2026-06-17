# agent/writer.py

from agent.base_agent import BaseAgent


class WriterAgent(BaseAgent):

    def __init__(self, llm_service):
        super().__init__(llm_service, agent_id="writer")

    def get_role_instructions(self) -> str:
        return """
Generate technical documentation:
- README.md with setup and usage
- API documentation
- Installation guide

Include all docs in the files array.
"""
