from fastapi import APIRouter

from pathlib import Path

from api.schemas.prompt import PromptRequest

from services.project_generator import (
    generate_project
)

router = APIRouter()


@router.post("/generate")
def generate(data: PromptRequest):

    project = generate_project(
            data.prompt
        )

    return {
        "status": "success",
        "project": project
    }


@router.get("/projects")
def get_projects():

    base_path = Path("../generated-projects")

    projects = []

    if base_path.exists():

        for project in base_path.iterdir():

            if project.is_dir():

                files = []

                for file in project.iterdir():

                    if file.is_file():

                        files.append({
                            "name": file.name
                        })

                projects.append({
                    "project_name":
                        project.name,

                    "files":
                        files
                })

    return {
        "projects": projects
    }