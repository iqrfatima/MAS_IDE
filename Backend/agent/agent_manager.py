# agent/agent_manager.py

from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Optional


AGENT_ROLES = {
    "planner": "Technical Planner",
    "architect": "Senior Software Architect",
    "frontend": "Senior Frontend Engineer",
    "backend": "Senior Backend Engineer",
    "database": "Senior Database Engineer",
    "testing": "Senior Test Automation Engineer",
    "qa": "QA Engineer",
    "reviewer": "Principal Code Reviewer",
    "merge": "Code Merge and Integration Engineer",
    "devops": "DevOps Engineer",
    "writer": "Technical Documentation Engineer",
}

AGENT_DISPLAY_NAMES = {
    "planner": "Planner",
    "architect": "Architect",
    "frontend": "Frontend",
    "backend": "Backend",
    "database": "Database",
    "testing": "Testing",
    "qa": "QA",
    "reviewer": "Reviewer",
    "merge": "Code Merge",
    "devops": "DevOps",
    "writer": "Writer",
    "orchestrator": "System",
    "system": "System",
}


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower().strip())
    return slug.strip("-") or "project"


@dataclass
class AgentMessage:
    type: str
    sender_id: str
    content: str
    timestamp: float = field(default_factory=time.time)


@dataclass
class AgentSession:
    agent_id: str
    role: str
    history: list[dict[str, str]] = field(default_factory=list)

    def add_turn(self, prompt: str, response: dict[str, Any]) -> None:
        self.history.append({
            "prompt": prompt,
            "output": response.get("output", ""),
            "thought": response.get("thought", ""),
        })


@dataclass
class AgentState:
    goal: str
    graph: dict[str, list] = field(
        default_factory=lambda: {"nodes": [], "links": []}
    )
    messages: list[AgentMessage] = field(default_factory=list)
    generated_files: list[dict[str, str]] = field(default_factory=list)

    def message_to_dict(self, message: AgentMessage) -> dict[str, Any]:
        return {
            "type": message.type,
            "senderId": message.sender_id,
            "senderName": AGENT_DISPLAY_NAMES.get(
                message.sender_id,
                message.sender_id.title(),
            ),
            "content": message.content,
            "timestamp": message.timestamp,
        }

    def to_dict(self) -> dict[str, Any]:
        return {
            "goal": self.goal,
            "graph": self.graph,
            "messages": [
                self.message_to_dict(m)
                for m in self.messages
            ],
            "generated_files": self.generated_files,
        }


class AgentManager:
    """Manages per-agent sessions, shared state, and team communication."""

    def __init__(
        self,
        goal: str,
        on_message: Optional[Callable[[dict[str, Any]], None]] = None,
    ) -> None:
        self.state = AgentState(goal=goal)
        self.sessions: dict[str, AgentSession] = {}
        self.on_message = on_message

    def create_session(self, agent_id: str) -> AgentSession:
        role = AGENT_ROLES.get(agent_id, agent_id.title())
        session = AgentSession(agent_id=agent_id, role=role)
        self.sessions[agent_id] = session
        return session

    def get_session(self, agent_id: str) -> AgentSession:
        session = self.sessions.get(agent_id)
        if not session:
            raise ValueError(f"No session for agent {agent_id}")
        return session

    def add_message(
        self,
        msg_type: str,
        sender_id: str,
        content: str,
    ) -> AgentMessage:
        message = AgentMessage(
            type=msg_type,
            sender_id=sender_id,
            content=content,
        )
        self.state.messages.append(message)

        if self.on_message:
            self.on_message(self.state.message_to_dict(message))

        return message

    def build_context(
        self,
        agent_id: str,
        task: dict[str, Any],
    ) -> str:
        session = self.get_session(agent_id)
        state = self.state

        memory_block = ""
        if session.history:
            recent = session.history[-3:]
            memory_lines = [
                f"Turn {i + 1}: {h.get('thought', h.get('output', ''))}"
                for i, h in enumerate(recent)
            ]
            memory_block = (
                "\nYour Previous Memory (recent turns):\n"
                + "\n".join(memory_lines)
                + "\n"
            )

        return f"""
You are a {session.role}.

Current Project Goal: {state.goal}
Your Task: {task.get("title", "Task")} - {task.get("description", "")}
Target Filename: {task.get("filename") or "N/A"}
{memory_block}
Shared Knowledge Graph (Current State):
{state.graph["nodes"]}
Shared Knowledge Graph Links:
{state.graph["links"]}

Generated Files So Far:
{[file["path"] for file in state.generated_files]}

Recent Team Communication:
{self._format_recent_messages()}


INSTRUCTIONS:

Generate production-ready code.

Requirements:
- No TODOs
- No placeholders
- Complete working implementation
- Proper imports
- Type hints everywhere
- Error handling
- Logging
- Secure defaults
- Follow SOLID principles
- Generate files that compile
- Respect existing project structure
- Reuse existing components when possible
- Return complete file contents
- Do not omit code for brevity
- Assume code will be deployed to production

When generating files:
- Return full files
- Never return partial snippets
- Include dependencies
- Ensure consistency with previously generated files

IMPORTANT OUTPUT FORMAT

Respond ONLY with valid JSON.

{{
  "output": "summary",
  "thought": "reasoning",
  "communication": "message",
  "graphUpdates": {{
    "nodes": [],
    "links": []
  }},
  "files": [
    {{
      "path": "src/App.tsx",
      "content": "..."
    }}
  ]
}}

Do not wrap JSON in markdown.
Do not return explanations.
Do not return prose.
Return only JSON.
"""

# INSTRUCTIONS:
# 1. This is a stateful conversation. You have memory of your previous turns.
# 2. Perform your assigned task autonomously.
# 3. If you need to communicate with another agent, use the "communication" field.
# 4. Provide your output in a JSON format matching this schema:
# {{
#   "output": "The final technical result of your work",
#   "thought": "Your internal reasoning about this step, reflecting on your previous memory",
#   "communication": "A message to the team about what you did",
#   "graphUpdates": {{
#     "nodes": [{{"id": "unique-id", "label": "label", "type": "decision|component|requirement|dependency"}}],
#     "links": [{{"source": "id1", "target": "id2", "label": "relationship"}}]
#   }},
#   "files": [{{"path": "relative/path", "content": "file content"}}]
# }}
# The "files" array is optional — include it when generating code or documents.
# Respond ONLY with the JSON block.

    def _format_recent_messages(self) -> str:
        recent = self.state.messages[-10:]
        if not recent:
            return "(No messages yet)"
        return "\n".join(
            f"[{m.type}] {m.sender_id}: {m.content}"
            for m in recent
        )

    def apply_graph_updates(
        self,
        graph_updates: dict[str, Any] | None,
    ) -> None:
        if not graph_updates:
            return

        existing_ids = {
            n.get("id") for n in self.state.graph["nodes"]
        }

        for node in graph_updates.get("nodes", []):
            if node.get("id") and node["id"] not in existing_ids:
                self.state.graph["nodes"].append(node)
                existing_ids.add(node["id"])

        self.state.graph["links"].extend(
            graph_updates.get("links", [])
        )

    def record_agent_result(
        self,
        agent_id: str,
        task: dict[str, Any],
        prompt: str,
        result: dict[str, Any],
    ) -> None:
        session = self.get_session(agent_id)
        session.add_turn(prompt, result)

        thought = result.get("thought", "")
        if thought:
            self.add_message("thought", agent_id, thought)

        communication = result.get("communication", "")
        if communication:
            self.add_message("agent", agent_id, communication)

        output_preview = str(result.get("output", ""))[:200]
        self.add_message(
            "system",
            "orchestrator",
            f"{agent_id} completed: {task.get('title', 'task')}",
        )

        if output_preview:
            self.add_message("output", agent_id, output_preview)

        self.apply_graph_updates(result.get("graphUpdates"))

        for file_entry in result.get("files", []):
            if file_entry.get("path") and file_entry.get("content") is not None:
                self.state.generated_files.append({
                    "path": file_entry["path"],
                    "content": file_entry["content"],
                })
