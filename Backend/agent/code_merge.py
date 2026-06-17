# agent/code_merge.py

from agent.base_agent import BaseAgent


class CodeMergeAgent(BaseAgent):

    def __init__(self, llm_service):
        super().__init__(llm_service, agent_id="merge")

    def get_role_instructions(self) -> str:
        return """
Merge the specialist outputs into one coherent production project.
Resolve duplicate files, broken imports, inconsistent contracts, and
configuration conflicts. Confirm the final file set is runnable.

If corrections are needed, include complete replacement files in the files
array. Add final integration decisions to graphUpdates.
"""
