# agent/devops.py

from agent.base_agent import BaseAgent


class DevOpsAgent(BaseAgent):

    def __init__(self, llm_service):
        super().__init__(llm_service, agent_id="devops")

    def get_role_instructions(self) -> str:
        return """
Generate deployment infrastructure:
- Dockerfile
- docker-compose.yml
- CI/CD workflow (.github/workflows/)
- Deployment instructions

Include all files in the files array.
"""
