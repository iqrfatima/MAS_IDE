
from pathlib import Path

from fastapi import APIRouter, HTTPException

from api.schemas.prompt import PromptRequest
from agent.orchestrator import orchestrator

router = APIRouter()


@router.post("/generate")
async def generate(data: PromptRequest):

    result = await orchestrator.run(
        goal=data.prompt
    )

    return result


@router.get("/projects/{project_name}/semantic-model")
def get_semantic_model(project_name: str):
    import json
    model_path = Path("../generated-projects") / project_name / ".masai" / "semantic-model.json"
    if not model_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Semantic model not found for project '{project_name}'"
        )
    try:
        with open(model_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading semantic model: {str(e)}"
        )


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
    
# NEW ROUTE
@router.get("/projects/{project_name}/file")
def read_file(
    project_name: str,
    path: str
):

    file_path = (
        Path("../generated-projects")
        / project_name
        / path
    )

    if not file_path.exists():

        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return {
        "path": path,
        "content": file_path.read_text(
            encoding="utf-8",
            errors="ignore"
        )
    }