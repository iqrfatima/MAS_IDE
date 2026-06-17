# agent/backend.py

from agent.base_agent import BaseAgent


class BackendAgent(BaseAgent):

    def __init__(self, llm_service):
        super().__init__(llm_service, agent_id="backend")

    def get_role_instructions(self) -> str:
        return """
Generate COMPLETE FastAPI applications.

Requirements:

- main.py
- requirements.txt
- routers
- schemas
- services
- models
- database connection
- dependency injection
- logging
- exception handlers
- validation

Generate every required file.

Return all files in files[].

Never generate snippets.
Never omit files.
"""
