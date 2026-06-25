# agent/orchestrator.py

import asyncio
from typing import Any, AsyncGenerator, Callable, Optional
import subprocess
from pathlib import Path
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
from services.llm_service import GeminiQuotaError
from services.hybrid_llm_service import create_hybrid_llm_service
from services.workspace_manager import workspace_manager
import time
import urllib.request
import urllib.error
import json

def call_masai_retrieve(project_path: str, query: str) -> dict:
    url = "http://127.0.0.1:8001/retrieve"
    req = urllib.request.Request(
        url,
        data=json.dumps({"project_path": project_path, "query": query}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"Error calling MASAI retrieve service: {e}")
    return {}

# def format_retrieved_context(data: dict) -> str:
#     if not data:
#         return "No relevant context found."
        
#     parts = []
    
#     files = data.get("files", [])
#     if files:
#         parts.append("Relevant Files:\n" + "\n".join(f"- {f}" for f in files))
        
#     symbols = data.get("symbols", [])
#     if symbols:
#         sym_lines = []
#         for s in symbols:
#             kind = s.get("kind", "")
#             name = s.get("qualifiedName", s.get("name", ""))
#             file = s.get("filePath", "")
#             range_info = s.get("range", {})
#             start_line = range_info.get("start", {}).get("line", 0) + 1
#             sym_lines.append(f"- [{kind}] {name} (in {file}:{start_line})")
#         parts.append("Relevant Symbols:\n" + "\n".join(sym_lines))
        
#     flow = data.get("flow", [])
#     if flow:
#         flow_lines = []
#         for step in flow:
#             step_num = step.get("step", 0)
#             from_name = step.get("fromName", "")
#             to_name = step.get("toName", "")
#             rel = step.get("relationKind", "")
#             flow_lines.append(f"  Step {step_num}: {from_name} --({rel})--> {to_name}")
#         parts.append("Execution Flow Steps:\n" + "\n".join(flow_lines))
        
#     snippets = data.get("snippets", [])
#     if snippets:
#         snip_parts = []
#         for snip in snippets:
#             file = snip.get("filePath", "")
#             sym = snip.get("symbolName", "")
#             start = snip.get("startLine", 0)
#             end = snip.get("endLine", 0)
#             content = snip.get("content", "")
#             snip_parts.append(f"--- Symbol: {sym} in {file} (Lines {start}-{end}) ---\n{content}")
#         parts.append("Relevant Code Snippets:\n" + "\n\n".join(snip_parts))
        
#     return "\n\n".join(parts)
#
def format_retrieved_context(data: dict) -> str:
    if not data:
        return "No relevant context found."

    parts = []

    files = data.get("files", [])[:10]
    if files:
        parts.append(
            "Relevant Files:\n"
            + "\n".join(f"- {f}" for f in files)
        )

    symbols = data.get("symbols", [])[:20]
    if symbols:
        sym_lines = []

        for s in symbols:
            kind = s.get("kind", "")
            name = s.get(
                "qualifiedName",
                s.get("name", "")
            )
            file = s.get("filePath", "")

            range_info = s.get(
                "range",
                {}
            )

            start_line = (
                range_info.get(
                    "start",
                    {}
                ).get(
                    "line",
                    0
                ) + 1
            )

            sym_lines.append(
                f"- [{kind}] {name} "
                f"(in {file}:{start_line})"
            )

        parts.append(
            "Relevant Symbols:\n"
            + "\n".join(sym_lines)
        )

    flow = data.get("flow", [])[:15]

    if flow:
        flow_lines = []

        for step in flow:
            flow_lines.append(
                f"Step {step.get('step',0)}: "
                f"{step.get('fromName','')} "
                f"--({step.get('relationKind','')})--> "
                f"{step.get('toName','')}"
            )

        parts.append(
            "Execution Flow Steps:\n"
            + "\n".join(flow_lines)
        )

    return "\n\n".join(parts)
#
def run_masai_analysis(project_path: str) -> bool:
    import subprocess
    import os
    from pathlib import Path
    
    masai_dir = (Path(__file__).parent.parent.parent.parent / "masai -kg - Copy (2)").resolve()
    abs_project_path = str(Path(project_path).resolve())
    
    cmd = ["npm", "run", "dev", "--", abs_project_path]
    use_shell = os.name == 'nt'
    
    try:
        print(f"Running MASAI analysis in {masai_dir} on project path {abs_project_path}")
        result = subprocess.run(
            cmd,
            cwd=str(masai_dir),
            capture_output=True,
            text=True,
            shell=use_shell
        )
        if result.returncode == 0:
            print("MASAI analysis completed successfully.")
            return True
        else:
            print(f"MASAI analysis failed with exit code {result.returncode}. Stderr: {result.stderr}")
            fallback_cmd = ["npx", "tsx", "src/index.ts", abs_project_path]
            print(f"Retrying with fallback command: {' '.join(fallback_cmd)}")
            fallback_result = subprocess.run(
                fallback_cmd,
                cwd=str(masai_dir),
                capture_output=True,
                text=True,
                shell=use_shell
            )
            if fallback_result.returncode == 0:
                print("MASAI fallback analysis completed successfully.")
                return True
            else:
                print(f"MASAI fallback analysis failed. Stderr: {fallback_result.stderr}")
                return False
    except Exception as e:
        print(f"Exception running MASAI analysis: {e}")
        return False

# 
def validate_project(project_path: str) -> dict:
    project = Path(project_path)

    try:
        # React / Vite
        if (project / "package.json").exists():

            result = subprocess.run(
                ["npm", "run", "build"],
                cwd=project_path,
                capture_output=True,
                text=True,
                timeout=120,
            )

            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "error": result.stderr,
            }

        # Python
        result = subprocess.run(
            ["python", "-m", "compileall", "."],
            cwd=project_path,
            capture_output=True,
            text=True,
            timeout=120,
        )

        return {
            "success": result.returncode == 0,
            "output": result.stdout,
            "error": result.stderr,
        }

    except Exception as exc:
        return {
            "success": False,
            "error": str(exc),
            "output": "",
        }
# 

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

# FINALIZATION_PIPELINE = [
#     ("devops", DevOpsAgent, {
#         "title": "CI/CD Validation Setup",
#         "description": "Create Docker, CI/CD workflows, environment configuration, and validation commands",
#         "filename": "Dockerfile",
#     }),
#     ("reviewer", ReviewerAgent, {
#         "title": "Review Agent",
#         "description": "Review generated code, architecture, tests, security, accessibility, and deployability",
#     }),
#     ("merge", CodeMergeAgent, {
#         "title": "Code Merge Agent",
#         "description": "Resolve conflicts and finalize the generated file set",
#     }),
#     ("qa", QAAgent, {
#         "title": "Final CI/CD Validation",
#         "description": "Validate the final merged project and list production readiness checks",
#     }),
#     ("writer", WriterAgent, {
#         "title": "Documentation",
#         "description": "Write README, API docs, setup, deployment, and validation instructions",
#         "filename": "README.md",
#     }),
# ]
# 
FINALIZATION_PIPELINE = [
    ("devops", DevOpsAgent, {
        "title": "CI/CD Validation Setup",
        "description": "Create Docker, CI/CD workflows, environment configuration, and validation commands",
        "filename": "Dockerfile",
    }),
    ("merge", CodeMergeAgent, {
        "title": "Code Merge Agent",
        "description": "Resolve conflicts and finalize the generated file set",
    }),
    ("writer", WriterAgent, {
        "title": "Documentation",
        "description": "Write README, API docs, setup, deployment, and validation instructions",
        "filename": "README.md",
    }),
]
# 

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
        # # to wrap every agent call, one agent failing won't instantly kill the whole MAS run.
        # try:
        #     result = await agents[agent_id].execute(task, manager)

        # except GeminiQuotaError as exc:

        #     manager.add_message(
        #         "warning",
        #         "system",
        #         f"{agent_id} temporarily unavailable: {exc}"
        #     )

        #     return agent_id, {
        #         "status": "failed",
        #         "error": str(exc)
        #     }

        return agent_id, result

    async def _execute_pipeline(
        self,
        goal: str,
        gemini_api_key: Optional[str],
        emit: Callable[[str, dict[str, Any]], None],
    ) -> dict[str, Any]:
        manager = AgentManager(
            goal=goal,
            on_message=lambda msg: emit("message", msg),
        )
        llm = create_hybrid_llm_service(
            gemini_api_key=gemini_api_key,
            on_fallback=lambda agent_id: manager.add_message(
                "warning",
                "system",
                f"Gemini quota exceeded — **{agent_id}** is using OpenRouter instead.",
            ),
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

        # if manager.state.generated_files:
        #     project_path = workspace_manager.write_files(
        #         project_name,
        #         manager.state.generated_files,
        #     )

        #     manager.add_message(
        #         "system",
        #         "orchestrator",
        #         f"Wrote {len(manager.state.generated_files)} files to {project_path}",
        #     )
        ###
        if manager.state.generated_files:
            project_path = workspace_manager.write_files(
            project_name,
            manager.state.generated_files,
        )

        manager.add_message(
            "system",
            "orchestrator",
            f"Wrote {len(manager.state.generated_files)} files to {project_path}",
        )

        # ==========================================
         # LOCAL VALIDATION
        # ==========================================
        validation = validate_project(project_path)

        if validation["success"]:
            manager.add_message(
                "system",
                "orchestrator",
                "Local validation passed successfully.",
            )
        else:
            manager.add_message(
                "system",
                "orchestrator",
                "Local validation failed. Launching Reviewer and QA agents...",
            )

        error_text = validation.get("error", "")[:8000]

        for agent_id in ["reviewer", "qa"]:
            task = {
                "title": "Fix Validation Errors",
                "description": f"""
                    Fix these build/compile errors:

                {error_text}
                """,
            }

            completed_id, result = await self._execute_agent_task(
                agent_id,
                task,
                agents,
                manager,
                emit,
            )

            results[completed_id] = result

        # Rewrite fixed files
        project_path = workspace_manager.write_files(
            project_name,
            manager.state.generated_files,
        )

        manager.add_message(
            "system",
            "orchestrator",
            "Reviewer/QA fixes applied and files rewritten.",
        )
        ###
        manager.add_message(
            "system",
            "orchestrator",
              "Running MASAI Knowledge Graph analysis...",
        )
           
        run_masai_analysis(project_path)
        kg_result = {"status": "success"}

        manager.add_message(
                "system",
                "orchestrator",
                "MASAI Knowledge Graph analysis completed and semantic model updated.",
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

        target_project = project_name or slugify(goal)

        # 1. Resolve selected project path & call MASAI /retrieve
        project_path = str((workspace_manager.workspace / target_project).resolve())
        retrieved_context = ""
        if (workspace_manager.workspace / target_project).exists():
            emit("message", {
                "type": "system",
                "senderId": "orchestrator",
                "senderName": "System",
                "content": f"Loading context from MASAI Knowledge Graph for: {target_project}...",
                "timestamp": time.time()
            })
            try:
                retrieval_res = call_masai_retrieve(project_path, goal)
                if retrieval_res:
                    retrieved_context = format_retrieved_context(retrieval_res)
            except Exception as exc:
                print(f"Error calling MASAI retrieval: {exc}")

        # 2. Inject retrieved context into agent prompt
        if retrieved_context:
            agent_prompt = f"""User Request:
{goal}

Relevant Project Context:
{retrieved_context}"""
        else:
            agent_prompt = goal

        manager = AgentManager(
            goal=agent_prompt,
            on_message=lambda msg: emit("message", msg),
        )
        llm = create_hybrid_llm_service(
            gemini_api_key=gemini_api_key,
            on_fallback=lambda aid: manager.add_message(
                "warning",
                "system",
                f"Gemini quota exceeded — **{aid}** is using OpenRouter instead.",
            ),
        )
        agents = self._build_agents(llm)

        existing_files = workspace_manager.read_project_files(target_project)
        manager.add_message(
            "system",
            "orchestrator",
            f"Routing direct request to {agent_id} agent for project '{target_project}'.",
        )

        # if existing_files:
        #     manager.state.generated_files.extend(existing_files)
        #     file_snapshot = "\n\n".join(
        #         f"FILE: {file['path']}\n{file['content'][:6000]}"
        #         for file in existing_files[:12]
        #     )
        #     manager.add_message(
        #         "system",
        #         "orchestrator",
        #         f"Loaded {len(existing_files)} existing files as context for targeted changes.",
        #     )
        #     manager.add_message(
        #         "system",
        #         "orchestrator",
        #         f"Existing project snapshot:\n{file_snapshot}",
        #     )
        #
        if existing_files:
            manager.state.generated_files.extend(
                existing_files
            )

        manager.add_message(
            "system",
            "orchestrator",
            f"Loaded {len(existing_files)} project files.",
        )
        
        # 

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

        manager.add_message(
            "system",
            "orchestrator",
            f"{agent_id} updated {len(manager.state.generated_files)} files in {project_path}.",
        )

        manager.add_message(
            "system",
            "orchestrator",
            "Updating MASAI Knowledge Graph...",
        )
        run_masai_analysis(project_path)
        kg_result = {"status": "success"}

        manager.add_message(
            "system",
            "orchestrator",
            "MASAI Knowledge Graph updated successfully.",
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