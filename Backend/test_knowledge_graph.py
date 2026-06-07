from pathlib import Path
import tempfile

from services.knowledge_graph import KnowledgeGraphService


def main():
    tmpdir = tempfile.mkdtemp()
    db = Path(tmpdir) / "test.db"
    svc = KnowledgeGraphService(db_path=db)

    a = svc.create_node("Alice", "person", {"role": "developer"})
    b = svc.create_node("Backend API", "component")
    c = svc.create_node("FastAPI", "technology")

    e1 = svc.create_edge(a["id"], b["id"], "works_on")
    svc.create_edge(b["id"], c["id"], "built_with")

    assert svc.get_node(a["id"])["label"] == "Alice"
    assert len(svc.get_neighbors(a["id"])) == 1

    path = svc.find_path(a["id"], c["id"])
    assert path is not None and len(path) == 3

    sub = svc.get_subgraph(a["id"], depth=2)
    assert len(sub["nodes"]) == 3
    assert len(sub["edges"]) == 2

    assert len(svc.search_nodes("Backend")) == 1
    assert svc.get_stats()["node_count"] == 3

    updated = svc.update_node(a["id"], label="Alice Smith")
    assert updated["label"] == "Alice Smith"

    result = svc.link_project_files(
        "demo-app",
        ["index.html", "styles.css", "app.js"],
        "/tmp/demo-app",
    )

    project = result["project_node"]
    assert project["type"] == "project"
    assert len(result["file_nodes"]) == 3
    assert len(result["contains_edges"]) == 3
    assert len(result["dependency_edges"]) == 2

    stats = svc.get_stats()
    assert stats["node_types"]["project"] == 1
    assert stats["node_types"]["file"] == 3
    assert stats["relationships"]["contains"] == 3
    assert stats["relationships"]["includes"] == 2

    second = svc.link_project_files(
        "demo-app",
        ["index.html", "styles.css", "app.js"],
        "/tmp/demo-app",
    )
    assert len(second["contains_edges"]) == 3
    assert svc.get_stats()["node_count"] == 7

    assert svc.delete_edge(e1["id"])
    assert svc.delete_node(a["id"])

    print("All knowledge graph service tests passed!")


if __name__ == "__main__":
    main()
