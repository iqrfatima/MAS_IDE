# agent/frontend.py

from agent.base_agent import BaseAgent


class FrontendAgent(BaseAgent):

    def __init__(self, llm_service):
        super().__init__(llm_service, agent_id="frontend")

    def get_role_instructions(self) -> str:

        return """
Generate COMPLETE React + TypeScript + Tailwind applications.

Requirements:

- Generate every required file
- Generate package.json
- Generate vite.config.ts
- Generate tsconfig.json
- Generate src/App.tsx
- Generate all pages
- Generate all components
- Generate hooks
- Generate API services
- Generate routing
- Generate responsive layouts
- Generate loading/error states

Return files in the files array.

Never omit files.
Never say 'existing code remains unchanged'.
Never use placeholders.
"""