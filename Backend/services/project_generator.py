from pathlib import Path

from services.knowledge_graph import (
    get_graph_service,
)


BASE_DIR = Path(__file__).resolve().parent.parent.parent

PROJECTS_DIR = BASE_DIR / "generated-projects"


def generate_project(prompt: str):

    project_name = (
        prompt.lower()
        .replace(" ", "-")
    )

    project_path = (
        PROJECTS_DIR / project_name
    )

    project_path.mkdir(
        parents=True,
        exist_ok=True
    )

    files = [
        {
            "name": "index.html",
            "content": f"""
<!DOCTYPE html>

<html>

<head>
  <title>{prompt}</title>
</head>

<body>
  <h1>{prompt}</h1>
</body>

</html>
"""
        },

        {
            "name": "styles.css",
            "content": """
body {
  background: #111;
  color: white;
  font-family: Arial;
}
"""
        },

        {
            "name": "app.js",
            "content": """
console.log("AI Project Running");
"""
        }
    ]

    for file in files:

        file_path = (
            project_path / file["name"]
        )

        file_path.write_text(
            file["content"]
        )

    file_names = [
        file["name"]
        for file in files
    ]

    graph = get_graph_service()

    graph_result = graph.link_project_files(
        project_name,
        file_names,
        str(project_path),
    )

    project_node = graph_result["project_node"]

    return {
        "project_name": project_name,
        "files": [
            {
                "name": name
            }

            for name in file_names
        ],
        "knowledge_graph_node_id":
            project_node["id"],
        "knowledge_graph_file_node_ids": [
            node["id"]
            for node in graph_result["file_nodes"]
        ],
    }