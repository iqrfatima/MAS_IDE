# agent/architect.py

from agent.base_agent import BaseAgent


class ArchitectAgent(BaseAgent):

    def __init__(self, llm_service):
        super().__init__(llm_service, agent_id="architect")

    def get_role_instructions(self) -> str:
        return """
Create:
1. System architecture overview
2. Folder structure
3. Component breakdown
4. API design
5. Task graph handoff for specialist agents
6. Production readiness constraints, validation gates, and integration contracts

Add architecture components, interfaces, dependencies, and requirements to graphUpdates.
Do not generate code files. Put design documents in the output field.
{
  "files": [
    {
      "path": "frontend/package.json"
    },
    {
      "path": "frontend/src/App.tsx"
    },
    {
      "path": "backend/main.py"
    }
  ]
}
"""
