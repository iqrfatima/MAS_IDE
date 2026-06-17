# agent/orchestrator.py

import asyncio
from typing import Any, AsyncGenerator, Callable, Optional

from agent.agent_manager import AgentManager, slugify
from agent.architect import ArchitectAgent
from agent.backend import BackendAgent
from agent.code_merge import CodeMergeAgent
from agent.database import DatabaseAgent
from agent.devops import DevOpsAgent
from agent.frontend import FrontendAgent
from agent.qa import QAAgent
from agent.planner import PlannerAgent
from agent.reviewer import ReviewerAgent
from agent.testing import TestingAgent
from agent.writer import WriterAgent
from services.file_analyzer import analyze_project
from services.knowledge_graph import get_graph_service
from services.llm_service import GeminiQuotaError, create_gemini_service
from services.workspace_manager import workspace_manager


AGENT_REGISTRY = {
    "planner": PlannerAgent,
    "architect": ArchitectAgent,
    "frontend": FrontendAgent,
    "backend": BackendAgent,
    "database": DatabaseAgent,
    "testing": TestingAgent,
    "devops": DevOpsAgent,
    "writer": WriterAgent,
    "qa": QAAgent,
    "reviewer": ReviewerAgent,
    "merge": CodeMergeAgent,
}

ORCHESTRATOR_PIPELINE = [
    ("planner", PlannerAgent, {
        "title": "Task Graph Creation",
        "description": "Plan the prompt as a production task graph with dependencies, owners, acceptance criteria, and risks",
    }),
    ("architect", ArchitectAgent, {
        "title": "Architecture and KG Update",
        "description": "Create system architecture, folder structure, API design, and architecture KG updates",
    }),
]

PARALLEL_SPECIALISTS = [
    ("frontend", FrontendAgent, {
        "title": "Frontend Implementation",
        "description": "Build React + TypeScript + Tailwind UI components",
        "filename": "src/App.tsx",
    }),
    ("backend", BackendAgent, {
        "title": "Backend Implementation",
        "description": "Build FastAPI routes, services, and data models",
        "filename": "main.py",
    }),
    ("database", DatabaseAgent, {
        "title": "Database Implementation",
        "description": "Build schemas, migrations, persistence helpers, and seed data",
        "filename": "database/schema.sql",
    }),
    ("testing", TestingAgent, {
        "title": "Testing Implementation",
        "description": "Build unit, integration, API, and UI tests",
        "filename": "tests/",
    }),
]

FINALIZATION_PIPELINE = [
    ("devops", DevOpsAgent, {
        "title": "CI/CD Validation Setup",
        "description": "Create Docker, CI/CD workflows, environment configuration, and validation commands",
        "filename": "Dockerfile",
    }),
    ("reviewer", ReviewerAgent, {
        "title": "Review Agent",
        "description": "Review generated code, architecture, tests, security, accessibility, and deployability",
    }),
    ("merge", CodeMergeAgent, {
        "title": "Code Merge Agent",
        "description": "Resolve conflicts and finalize the generated file set",
    }),
    ("qa", QAAgent, {
        "title": "Final CI/CD Validation",
        "description": "Validate the final merged project and list production readiness checks",
    }),
    ("writer", WriterAgent, {
        "title": "Documentation",
        "description": "Write README, API docs, setup, deployment, and validation instructions",
        "filename": "README.md",
    }),
]


class Orchestrator:

    def _build_agents(self, llm_service) -> dict[str, Any]:
        return {
            agent_id: agent_cls(llm_service)
            for agent_id, agent_cls in AGENT_REGISTRY.items()
        }

    async def _execute_agent_task(
        self,
        agent_id: str,
        task: dict[str, Any],
        agents: dict[str, Any],
        manager: AgentManager,
        emit: Callable[[str, dict[str, Any]], None],
    ) -> tuple[str, dict[str, Any]]:
        emit("agent_start", {
            "agentId": agent_id,
            "task": task.get("title", ""),
        })

        result = await agents[agent_id].execute(task, manager)

        emit("agent_done", {
            "agentId": agent_id,
            "task": task.get("title", ""),
        })

        return agent_id, result

    async def _execute_pipeline(
        self,
        goal: str,
        gemini_api_key: Optional[str],
        emit: Callable[[str, dict[str, Any]], None],
    ) -> dict[str, Any]:
        llm = create_gemini_service(api_key=gemini_api_key)
        manager = AgentManager(
            goal=goal,
            on_message=lambda msg: emit("message", msg),
        )
        agents = self._build_agents(llm)
        results: dict[str, Any] = {}

        manager.add_message(
            "system",
            "orchestrator",
            f"Starting project: **{goal}**",
        )
        manager.add_message(
            "system",
            "orchestrator",
            "Orchestrator is planning the project structure...",
        )

        try:
            for agent_id, _, task in ORCHESTRATOR_PIPELINE:
                completed_id, result = await self._execute_agent_task(
                    agent_id, task, agents, manager, emit
                )
                results[completed_id] = result

            manager.add_message(
                "system",
                "orchestrator",
                "Launching frontend, backend, database, and testing agents in parallel...",
            )

            parallel_results = await asyncio.gather(*[
                self._execute_agent_task(
                    agent_id, task, agents, manager, emit
                )
                for agent_id, _, task in PARALLEL_SPECIALISTS
            ])

            for completed_id, result in parallel_results:
                results[completed_id] = result

            for agent_id, _, task in FINALIZATION_PIPELINE:
                completed_id, result = await self._execute_agent_task(
                    agent_id, task, agents, manager, emit
                )
                results[completed_id] = result

            manager.add_message(
                "system",
                "orchestrator",
                "Agent flow completed: task graph, architecture, specialists, review, merge, file generation, and validation.",
            )

        except GeminiQuotaError as exc:
            manager.add_message(
                "error",
                "system",
                f"Gemini quota exceeded: {exc}. "
                "Wait a few minutes or use a different API key.",
            )
            return self._build_response(
                goal, manager, results,
                status="quota_exceeded", error=str(exc),
            )

        except Exception as exc:
            manager.add_message(
                "error",
                "system",
                f"Pipeline failed: {exc}",
            )
            return self._build_response(
                goal, manager, results,
                status="error", error=str(exc),
            )

        project_name = slugify(goal)
        project_path = None
        kg_result = None

        if manager.state.generated_files:
            project_path = workspace_manager.write_files(
                project_name,
                manager.state.generated_files,
            )

            file_names = [f["path"] for f in manager.state.generated_files]

            graph = get_graph_service()
            kg_result = graph.link_project_files(
                project_name,
                file_names,
                project_path,
            )

            analysis = analyze_project(project_path)
            extraction_result = graph.index_project_analysis(
                project_name,
                analysis,
            )
            kg_result["extraction"] = extraction_result

            manager.add_message(
                "system",
                "orchestrator",
                f"Wrote {len(manager.state.generated_files)} files to {project_path}",
            )
            manager.add_message(
                "system",
                "orchestrator",
                f"Extracted {len(extraction_result['symbol_nodes'])} code symbols into the shared knowledge graph.",
            )

        return self._build_response(
            goal,
            manager,
            results,
            status="success",
            project_name=project_name,
            project_path=project_path,
            knowledge_graph=kg_result,
        )

    async def run(
        self,
        goal: str,
        gemini_api_key: Optional[str] = None,
        agent_id: Optional[str] = None,
        project_name: Optional[str] = None,
    ) -> dict[str, Any]:
        result_holder: dict[str, Any] = {}

        def emit(_event: str, _data: dict[str, Any]) -> None:
            pass

        if agent_id and agent_id != "orchestrator":
            result_holder["result"] = await self._execute_direct_agent(
                goal, gemini_api_key, agent_id, project_name, emit
            )
        else:
            result_holder["result"] = await self._execute_pipeline(
                goal, gemini_api_key, emit
            )
        return result_holder["result"]

    async def run_stream(
        self,
        goal: str,
        gemini_api_key: Optional[str] = None,
        agent_id: Optional[str] = None,
        project_name: Optional[str] = None,
    ) -> AsyncGenerator[tuple[str, dict[str, Any]], None]:
        queue: asyncio.Queue[tuple[str, dict[str, Any]] | None] = (
            asyncio.Queue()
        )

        def emit(event: str, data: dict[str, Any]) -> None:
            queue.put_nowait((event, data))

        async def run_pipeline() -> None:
            try:
                result = await self._execute_pipeline(
                    goal, gemini_api_key, emit
                ) if not agent_id or agent_id == "orchestrator" else await self._execute_direct_agent(
                    goal, gemini_api_key, agent_id, project_name, emit
                )
                queue.put_nowait(("complete", result))
            except Exception as exc:
                queue.put_nowait(("error", {"message": str(exc)}))
            finally:
                queue.put_nowait(None)

        task = asyncio.create_task(run_pipeline())

        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                yield item
        finally:
            await task

    async def _execute_direct_agent(
        self,
        goal: str,
        gemini_api_key: Optional[str],
        agent_id: str,
        project_name: Optional[str],
        emit: Callable[[str, dict[str, Any]], None],
    ) -> dict[str, Any]:
        if agent_id not in AGENT_REGISTRY:
            raise ValueError(f"Unknown agent '{agent_id}'")

        llm = create_gemini_service(api_key=gemini_api_key)
        agents = self._build_agents(llm)
        target_project = project_name or slugify(goal)
        manager = AgentManager(
            goal=goal,
            on_message=lambda msg: emit("message", msg),
        )

        existing_files = workspace_manager.read_project_files(target_project)
        manager.add_message(
            "system",
            "orchestrator",
            f"Routing direct request to {agent_id} agent for project '{target_project}'.",
        )

        if existing_files:
            manager.state.generated_files.extend(existing_files)
            file_snapshot = "\n\n".join(
                f"FILE: {file['path']}\n{file['content'][:6000]}"
                for file in existing_files[:12]
            )
            manager.add_message(
                "system",
                "orchestrator",
                f"Loaded {len(existing_files)} existing files as context for targeted changes.",
            )
            manager.add_message(
                "system",
                "orchestrator",
                f"Existing project snapshot:\n{file_snapshot}",
            )

        task = {
            "title": f"Direct {agent_id.title()} Change",
            "description": (
                "Apply the user's requested change directly in your specialty. "
                "Return complete replacement files for any modified paths and "
                "keep unchanged files out of the files array unless they are required."
            ),
        }

        try:
            _, result = await self._execute_agent_task(
                agent_id, task, agents, manager, emit
            )
        except GeminiQuotaError as exc:
            return self._build_response(
                goal, manager, {},
                status="quota_exceeded", error=str(exc),
            )
        except Exception as exc:
            return self._build_response(
                goal, manager, {},
                status="error", error=str(exc),
            )

        merged_files = {
            file["path"]: file
            for file in existing_files
        }
        for file in manager.state.generated_files:
            merged_files[file["path"]] = file

        manager.state.generated_files = list(merged_files.values())

        project_path = workspace_manager.write_files(
            target_project,
            manager.state.generated_files,
        )

        graph = get_graph_service()
        file_names = [file["path"] for file in manager.state.generated_files]
        kg_result = graph.link_project_files(
            target_project,
            file_names,
            project_path,
        )
        analysis = analyze_project(project_path)
        kg_result["extraction"] = graph.index_project_analysis(
            target_project,
            analysis,
        )

        manager.add_message(
            "system",
            "orchestrator",
            f"{agent_id} updated {len(manager.state.generated_files)} files in {project_path}.",
        )

        return self._build_response(
            goal,
            manager,
            {agent_id: result},
            status="success",
            project_name=target_project,
            project_path=project_path,
            knowledge_graph=kg_result,
        )

    def _build_response(
        self,
        goal: str,
        manager: AgentManager,
        results: dict[str, Any],
        status: str,
        error: Optional[str] = None,
        project_name: Optional[str] = None,
        project_path: Optional[str] = None,
        knowledge_graph: Optional[dict] = None,
    ) -> dict[str, Any]:
        return {
            "status": status,
            "goal": goal,
            "error": error,
            "project_name": project_name,
            "project_path": project_path,
            "knowledge_graph": knowledge_graph,
            "agents": results,
            "chat_log": manager.state.to_dict()["messages"],
            "graph": manager.state.graph,
            "files_generated": len(manager.state.generated_files),
        }


orchestrator = Orchestrator()
