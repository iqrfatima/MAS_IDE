# agent/planner.py

from agent.base_agent import BaseAgent


class PlannerAgent(BaseAgent):

    def __init__(self, llm_service):
        super().__init__(llm_service, agent_id="planner")

    def get_role_instructions(self) -> str:
        return """
Convert the user prompt into a production delivery plan.
Create a task graph with clear dependencies, acceptance criteria, risks,
and ownership for architect, frontend, backend, database, testing, devops,
reviewer, merge, and writer agents.

Add task, requirement, and dependency nodes to graphUpdates.
Do not generate code files. Focus on project scope and execution order.
"""
