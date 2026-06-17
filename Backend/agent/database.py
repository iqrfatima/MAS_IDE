# agent/database.py

from agent.base_agent import BaseAgent


class DatabaseAgent(BaseAgent):

    def __init__(self, llm_service):
        super().__init__(llm_service, agent_id="database")

    def get_role_instructions(self) -> str:
        return """
Design and generate the persistence layer for the project.
Include schemas, migrations or setup scripts, seed data, repository helpers,
and database configuration that align with the backend API contract.

Prefer simple, production-ready defaults such as SQLite for local projects
unless the architect explicitly requires another database.
Include generated files in the files array.
"""
