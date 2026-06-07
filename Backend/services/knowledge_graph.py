import json
import sqlite3
import uuid
from collections import deque
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"

DB_PATH = DATA_DIR / "knowledge_graph.db"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class KnowledgeGraphService:

    def __init__(self, db_path: Path = DB_PATH):

        self.db_path = db_path

        self.db_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        self._init_db()

    @contextmanager
    def _connection(self):

        conn = sqlite3.connect(
            self.db_path
        )

        conn.row_factory = sqlite3.Row

        conn.execute(
            "PRAGMA foreign_keys = ON"
        )

        try:
            yield conn

            conn.commit()

        except Exception:
            conn.rollback()

            raise

        finally:
            conn.close()

    def _init_db(self):

        with self._connection() as conn:

            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS nodes (
                    id TEXT PRIMARY KEY,
                    label TEXT NOT NULL,
                    type TEXT NOT NULL DEFAULT 'entity',
                    properties TEXT NOT NULL DEFAULT '{}',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS edges (
                    id TEXT PRIMARY KEY,
                    source_id TEXT NOT NULL,
                    target_id TEXT NOT NULL,
                    relationship TEXT NOT NULL,
                    properties TEXT NOT NULL DEFAULT '{}',
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (source_id)
                        REFERENCES nodes(id)
                        ON DELETE CASCADE,
                    FOREIGN KEY (target_id)
                        REFERENCES nodes(id)
                        ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_nodes_type
                    ON nodes(type);

                CREATE INDEX IF NOT EXISTS idx_nodes_label
                    ON nodes(label);

                CREATE INDEX IF NOT EXISTS idx_edges_source
                    ON edges(source_id);

                CREATE INDEX IF NOT EXISTS idx_edges_target
                    ON edges(target_id);

                CREATE INDEX IF NOT EXISTS idx_edges_relationship
                    ON edges(relationship);
                """
            )

    def _row_to_node(self, row: sqlite3.Row) -> dict[str, Any]:

        return {
            "id": row["id"],
            "label": row["label"],
            "type": row["type"],
            "properties": json.loads(
                row["properties"]
            ),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }

    def _row_to_edge(self, row: sqlite3.Row) -> dict[str, Any]:

        return {
            "id": row["id"],
            "source_id": row["source_id"],
            "target_id": row["target_id"],
            "relationship": row["relationship"],
            "properties": json.loads(
                row["properties"]
            ),
            "created_at": row["created_at"],
        }

    def create_node(
        self,
        label: str,
        node_type: str = "entity",
        properties: dict[str, Any] | None = None,
    ) -> dict[str, Any]:

        node_id = str(uuid.uuid4())

        now = _utc_now()

        props = properties or {}

        with self._connection() as conn:

            conn.execute(
                """
                INSERT INTO nodes (
                    id, label, type,
                    properties, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    node_id,
                    label,
                    node_type,
                    json.dumps(props),
                    now,
                    now,
                ),
            )

        return self.get_node(node_id)

    def get_node(
        self,
        node_id: str,
    ) -> dict[str, Any] | None:

        with self._connection() as conn:

            row = conn.execute(
                "SELECT * FROM nodes WHERE id = ?",
                (node_id,),
            ).fetchone()

        if row is None:
            return None

        return self._row_to_node(row)

    def list_nodes(
        self,
        node_type: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:

        query = "SELECT * FROM nodes"
        params: list[Any] = []

        if node_type:
            query += " WHERE type = ?"
            params.append(node_type)

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"

        params.extend([limit, offset])

        with self._connection() as conn:

            rows = conn.execute(
                query,
                params,
            ).fetchall()

        return [
            self._row_to_node(row)
            for row in rows
        ]

    def update_node(
        self,
        node_id: str,
        label: str | None = None,
        node_type: str | None = None,
        properties: dict[str, Any] | None = None,
    ) -> dict[str, Any] | None:

        existing = self.get_node(node_id)

        if existing is None:
            return None

        new_label = (
            label
            if label is not None
            else existing["label"]
        )

        new_type = (
            node_type
            if node_type is not None
            else existing["type"]
        )

        new_props = (
            properties
            if properties is not None
            else existing["properties"]
        )

        with self._connection() as conn:

            conn.execute(
                """
                UPDATE nodes
                SET label = ?, type = ?,
                    properties = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    new_label,
                    new_type,
                    json.dumps(new_props),
                    _utc_now(),
                    node_id,
                ),
            )

        return self.get_node(node_id)

    def delete_node(
        self,
        node_id: str,
    ) -> bool:

        with self._connection() as conn:

            cursor = conn.execute(
                "DELETE FROM nodes WHERE id = ?",
                (node_id,),
            )

        return cursor.rowcount > 0

    def create_edge(
        self,
        source_id: str,
        target_id: str,
        relationship: str,
        properties: dict[str, Any] | None = None,
    ) -> dict[str, Any]:

        if self.get_node(source_id) is None:
            raise ValueError(
                f"Source node '{source_id}' not found"
            )

        if self.get_node(target_id) is None:
            raise ValueError(
                f"Target node '{target_id}' not found"
            )

        edge_id = str(uuid.uuid4())

        now = _utc_now()

        props = properties or {}

        with self._connection() as conn:

            conn.execute(
                """
                INSERT INTO edges (
                    id, source_id, target_id,
                    relationship, properties, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    edge_id,
                    source_id,
                    target_id,
                    relationship,
                    json.dumps(props),
                    now,
                ),
            )

        return self.get_edge(edge_id)

    def get_edge(
        self,
        edge_id: str,
    ) -> dict[str, Any] | None:

        with self._connection() as conn:

            row = conn.execute(
                "SELECT * FROM edges WHERE id = ?",
                (edge_id,),
            ).fetchone()

        if row is None:
            return None

        return self._row_to_edge(row)

    def list_edges(
        self,
        source_id: str | None = None,
        target_id: str | None = None,
        relationship: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:

        clauses: list[str] = []
        params: list[Any] = []

        if source_id:
            clauses.append("source_id = ?")
            params.append(source_id)

        if target_id:
            clauses.append("target_id = ?")
            params.append(target_id)

        if relationship:
            clauses.append("relationship = ?")
            params.append(relationship)

        query = "SELECT * FROM edges"

        if clauses:
            query += " WHERE " + " AND ".join(clauses)

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"

        params.extend([limit, offset])

        with self._connection() as conn:

            rows = conn.execute(
                query,
                params,
            ).fetchall()

        return [
            self._row_to_edge(row)
            for row in rows
        ]

    def delete_edge(
        self,
        edge_id: str,
    ) -> bool:

        with self._connection() as conn:

            cursor = conn.execute(
                "DELETE FROM edges WHERE id = ?",
                (edge_id,),
            )

        return cursor.rowcount > 0

    def get_neighbors(
        self,
        node_id: str,
        relationship: str | None = None,
        direction: str = "both",
    ) -> list[dict[str, Any]]:

        if self.get_node(node_id) is None:
            raise ValueError(
                f"Node '{node_id}' not found"
            )

        results: list[dict[str, Any]] = []

        outgoing_query = """
            SELECT e.*, n.label, n.type, n.properties
            FROM edges e
            JOIN nodes n ON n.id = e.target_id
            WHERE e.source_id = ?
        """

        incoming_query = """
            SELECT e.*, n.label, n.type, n.properties
            FROM edges e
            JOIN nodes n ON n.id = e.source_id
            WHERE e.target_id = ?
        """

        params: list[Any] = [node_id]

        rel_clause = ""

        if relationship:
            rel_clause = " AND e.relationship = ?"
            params.append(relationship)

        with self._connection() as conn:

            if direction in ("out", "both"):
                rows = conn.execute(
                    outgoing_query + rel_clause,
                    params,
                ).fetchall()

                for row in rows:
                    results.append({
                        "edge": self._row_to_edge(row),
                        "node": {
                            "id": row["target_id"],
                            "label": row["label"],
                            "type": row["type"],
                            "properties": json.loads(
                                row["properties"]
                            ),
                        },
                        "direction": "out",
                    })

            if direction in ("in", "both"):
                rows = conn.execute(
                    incoming_query + rel_clause,
                    params,
                ).fetchall()

                for row in rows:
                    results.append({
                        "edge": self._row_to_edge(row),
                        "node": {
                            "id": row["source_id"],
                            "label": row["label"],
                            "type": row["type"],
                            "properties": json.loads(
                                row["properties"]
                            ),
                        },
                        "direction": "in",
                    })

        return results

    def find_path(
        self,
        source_id: str,
        target_id: str,
        max_depth: int = 10,
    ) -> list[str] | None:

        if self.get_node(source_id) is None:
            raise ValueError(
                f"Source node '{source_id}' not found"
            )

        if self.get_node(target_id) is None:
            raise ValueError(
                f"Target node '{target_id}' not found"
            )

        if source_id == target_id:
            return [source_id]

        visited = {source_id}

        queue: deque[tuple[str, list[str]]] = deque(
            [(source_id, [source_id])]
        )

        with self._connection() as conn:

            while queue:

                current, path = queue.popleft()

                if len(path) > max_depth:
                    continue

                rows = conn.execute(
                    """
                    SELECT target_id
                    FROM edges
                    WHERE source_id = ?
                    UNION
                    SELECT source_id
                    FROM edges
                    WHERE target_id = ?
                    """,
                    (current, current),
                ).fetchall()

                for row in rows:
                    neighbor = row[0]

                    if neighbor in visited:
                        continue

                    new_path = path + [neighbor]

                    if neighbor == target_id:
                        return new_path

                    visited.add(neighbor)

                    queue.append(
                        (neighbor, new_path)
                    )

        return None

    def get_subgraph(
        self,
        node_id: str,
        depth: int = 2,
    ) -> dict[str, Any]:

        if self.get_node(node_id) is None:
            raise ValueError(
                f"Node '{node_id}' not found"
            )

        if depth < 0:
            raise ValueError(
                "Depth must be non-negative"
            )

        visited_nodes: set[str] = {node_id}

        visited_edges: set[str] = set()

        frontier = {node_id}

        with self._connection() as conn:

            for _ in range(depth):

                if not frontier:
                    break

                placeholders = ",".join(
                    "?" * len(frontier)
                )

                rows = conn.execute(
                    f"""
                    SELECT *
                    FROM edges
                    WHERE source_id IN ({placeholders})
                       OR target_id IN ({placeholders})
                    """,
                    list(frontier) * 2,
                ).fetchall()

                next_frontier: set[str] = set()

                for row in rows:
                    edge = self._row_to_edge(row)

                    visited_edges.add(edge["id"])

                    for nid in (
                        edge["source_id"],
                        edge["target_id"],
                    ):
                        if nid not in visited_nodes:
                            visited_nodes.add(nid)

                            next_frontier.add(nid)

                frontier = next_frontier

        node_ids = list(visited_nodes)

        node_placeholders = ",".join(
            "?" * len(node_ids)
        )

        with self._connection() as conn:

            node_rows = conn.execute(
                f"""
                SELECT *
                FROM nodes
                WHERE id IN ({node_placeholders})
                """,
                node_ids,
            ).fetchall()

            if visited_edges:
                edge_ids = list(visited_edges)

                edge_placeholders = ",".join(
                    "?" * len(edge_ids)
                )

                edge_rows = conn.execute(
                    f"""
                    SELECT *
                    FROM edges
                    WHERE id IN ({edge_placeholders})
                    """,
                    edge_ids,
                ).fetchall()

            else:
                edge_rows = []

        nodes = [
            self._row_to_node(row)
            for row in node_rows
        ]

        edges = [
            self._row_to_edge(row)
            for row in edge_rows
        ]

        return {
            "root_id": node_id,
            "depth": depth,
            "nodes": nodes,
            "edges": edges,
        }

    def search_nodes(
        self,
        query: str,
        node_type: str | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:

        pattern = f"%{query}%"

        sql = """
            SELECT *
            FROM nodes
            WHERE (
                label LIKE ?
                OR properties LIKE ?
            )
        """

        params: list[Any] = [
            pattern,
            pattern,
        ]

        if node_type:
            sql += " AND type = ?"
            params.append(node_type)

        sql += " ORDER BY updated_at DESC LIMIT ?"

        params.append(limit)

        with self._connection() as conn:

            rows = conn.execute(
                sql,
                params,
            ).fetchall()

        return [
            self._row_to_node(row)
            for row in rows
        ]

    def get_full_graph(
        self,
        limit: int = 500,
    ) -> dict[str, Any]:

        nodes = self.list_nodes(
            limit=limit
        )

        edges = self.list_edges(
            limit=limit
        )

        return {
            "nodes": nodes,
            "edges": edges,
            "node_count": len(nodes),
            "edge_count": len(edges),
        }

    def get_stats(self) -> dict[str, Any]:

        with self._connection() as conn:

            node_count = conn.execute(
                "SELECT COUNT(*) FROM nodes"
            ).fetchone()[0]

            edge_count = conn.execute(
                "SELECT COUNT(*) FROM edges"
            ).fetchone()[0]

            type_rows = conn.execute(
                """
                SELECT type, COUNT(*) AS count
                FROM nodes
                GROUP BY type
                ORDER BY count DESC
                """
            ).fetchall()

            rel_rows = conn.execute(
                """
                SELECT relationship, COUNT(*) AS count
                FROM edges
                GROUP BY relationship
                ORDER BY count DESC
                """
            ).fetchall()

        return {
            "node_count": node_count,
            "edge_count": edge_count,
            "node_types": {
                row["type"]: row["count"]
                for row in type_rows
            },
            "relationships": {
                row["relationship"]: row["count"]
                for row in rel_rows
            },
        }

    def upsert_project_node(
        self,
        project_name: str,
        file_names: list[str],
    ) -> dict[str, Any]:

        with self._connection() as conn:

            row = conn.execute(
                """
                SELECT id
                FROM nodes
                WHERE type = 'project'
                  AND json_extract(
                      properties, '$.project_name'
                  ) = ?
                """,
                (project_name,),
            ).fetchone()

        properties = {
            "project_name": project_name,
            "files": file_names,
        }

        if row:
            return self.update_node(
                row["id"],
                label=project_name,
                properties=properties,
            )

        return self.create_node(
            label=project_name,
            node_type="project",
            properties=properties,
        )

    def upsert_file_node(
        self,
        file_name: str,
        project_name: str,
        relative_path: str | None = None,
    ) -> dict[str, Any]:

        with self._connection() as conn:

            row = conn.execute(
                """
                SELECT id
                FROM nodes
                WHERE type = 'file'
                  AND json_extract(
                      properties, '$.file_name'
                  ) = ?
                  AND json_extract(
                      properties, '$.project_name'
                  ) = ?
                """,
                (file_name, project_name),
            ).fetchone()

        extension = (
            Path(file_name).suffix.lstrip(".")
            or "unknown"
        )

        properties: dict[str, Any] = {
            "file_name": file_name,
            "project_name": project_name,
            "extension": extension,
        }

        if relative_path:
            properties["path"] = relative_path

        label = f"{project_name}/{file_name}"

        if row:
            return self.update_node(
                row["id"],
                label=label,
                properties=properties,
            )

        return self.create_node(
            label=label,
            node_type="file",
            properties=properties,
        )

    def _ensure_edge(
        self,
        source_id: str,
        target_id: str,
        relationship: str,
        properties: dict[str, Any] | None = None,
    ) -> dict[str, Any]:

        existing = self.list_edges(
            source_id=source_id,
            target_id=target_id,
            relationship=relationship,
            limit=1,
        )

        if existing:
            return existing[0]

        return self.create_edge(
            source_id,
            target_id,
            relationship,
            properties,
        )

    def _link_file_dependencies(
        self,
        file_nodes: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:

        by_name = {
            node["properties"]["file_name"]: node
            for node in file_nodes
        }

        html_node = by_name.get("index.html")

        if html_node is None:
            return []

        dependency_edges: list[dict[str, Any]] = []

        for dep_name in ("styles.css", "app.js"):

            dep_node = by_name.get(dep_name)

            if dep_node is None:
                continue

            edge = self._ensure_edge(
                html_node["id"],
                dep_node["id"],
                "includes",
                {
                    "source_file": "index.html",
                    "target_file": dep_name,
                },
            )

            dependency_edges.append(edge)

        return dependency_edges

    def link_project_files(
        self,
        project_name: str,
        file_names: list[str],
        project_path: str | None = None,
    ) -> dict[str, Any]:

        project_node = self.upsert_project_node(
            project_name,
            file_names,
        )

        file_nodes: list[dict[str, Any]] = []

        contains_edges: list[dict[str, Any]] = []

        for file_name in file_names:

            relative_path = (
                f"{project_path}/{file_name}"
                if project_path
                else f"{project_name}/{file_name}"
            )

            file_node = self.upsert_file_node(
                file_name,
                project_name,
                relative_path,
            )

            file_nodes.append(file_node)

            edge = self._ensure_edge(
                project_node["id"],
                file_node["id"],
                "contains",
                {"file_name": file_name},
            )

            contains_edges.append(edge)

        dependency_edges = self._link_file_dependencies(
            file_nodes
        )

        return {
            "project_node": project_node,
            "file_nodes": file_nodes,
            "contains_edges": contains_edges,
            "dependency_edges": dependency_edges,
        }


_graph_service: KnowledgeGraphService | None = None


def get_graph_service() -> KnowledgeGraphService:

    global _graph_service

    if _graph_service is None:
        _graph_service = KnowledgeGraphService()

    return _graph_service
