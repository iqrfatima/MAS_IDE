# agent/qa.py

from agent.base_agent import BaseAgent


class QAAgent(BaseAgent):

    def __init__(self, llm_service):
        super().__init__(llm_service, agent_id="qa")

    def get_role_instructions(self) -> str:
        return """
Review all generated files listed in the knowledge graph and team messages.
Check for bugs, security issues, missing functionality, and broken imports.
List issues in the output field. Add test requirements to graphUpdates.
Do not generate new code unless fixing critical issues.
"""
