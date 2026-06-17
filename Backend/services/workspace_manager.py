from pathlib import Path


class WorkspaceManager:

    def __init__(self):

        self.workspace = Path(
            "../generated-projects"
        )

        self.workspace.mkdir(
            exist_ok=True
        )

    def create_project(
        self,
        project_name: str
    ):

        project_path = (
            self.workspace / project_name
        )

        project_path.mkdir(
            parents=True,
            exist_ok=True
        )

        return project_path

    def write_files(
        self,
        project_name: str,
        files: list
    ):

        project_path = self.create_project(
            project_name
        )

        for file in files:

            file_path = (
                project_path / file["path"]
            )

            file_path.parent.mkdir(
                parents=True,
                exist_ok=True
            )

            file_path.write_text(
                file["content"],
                encoding="utf-8"
            )

        return str(project_path)

    def read_project_files(
        self,
        project_name: str,
        max_chars: int = 50000,
    ) -> list[dict[str, str]]:

        project_path = self.workspace / project_name

        if not project_path.exists():
            return []

        collected: list[dict[str, str]] = []
        total_chars = 0

        for file_path in project_path.rglob("*"):

            if not file_path.is_file():
                continue

            relative_path = file_path.relative_to(project_path).as_posix()
            content = file_path.read_text(
                encoding="utf-8",
                errors="ignore",
            )

            if total_chars + len(content) > max_chars:
                content = content[: max(0, max_chars - total_chars)]

            collected.append({
                "path": relative_path,
                "content": content,
            })

            total_chars += len(content)

            if total_chars >= max_chars:
                break

        return collected

    def list_projects(self):

        projects = []

        for project in self.workspace.iterdir():

            if project.is_dir():

                projects.append(
                    project.name
                )

        return projects


workspace_manager = WorkspaceManager()
