
from pathlib import Path

from fastapi import APIRouter

from api.schemas.prompt import PromptRequest
from agent.orchestrator import orchestrator

router = APIRouter()


@router.post("/generate")
async def generate(data: PromptRequest):

    result = await orchestrator.run(
        goal=data.prompt
    )

    return result


@router.get("/projects")
def get_projects():

    base_path = Path("../generated-projects")

    projects = []

    if base_path.exists():

        for project in base_path.iterdir():

            if project.is_dir():

                files = []

                for file in project.rglob("*"):

                    if file.is_file():

                        files.append({
                            "name": file.relative_to(project).as_posix()
                        })

                projects.append({
                    "project_name": project.name,
                    "files": files
                })

    return {
        "projects": projects
    }