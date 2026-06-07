from fastapi import APIRouter, HTTPException, Query

from api.schemas.knowledge_graph import (
    EdgeCreate,
    NodeCreate,
    NodeUpdate,
    PathQuery,
    SubgraphQuery,
)

from services.knowledge_graph import (
    get_graph_service,
)

router = APIRouter(
    prefix="/knowledge-graph",
    tags=["knowledge-graph"],
)


@router.get("/stats")
def graph_stats():

    service = get_graph_service()

    return {
        "status": "success",
        "stats": service.get_stats(),
    }


@router.get("")
def get_full_graph(
    limit: int = Query(
        default=500,
        ge=1,
        le=5000,
    ),
):

    service = get_graph_service()

    return {
        "status": "success",
        "graph": service.get_full_graph(
            limit=limit
        ),
    }


@router.get("/nodes")
def list_nodes(
    type: str | None = None,
    limit: int = Query(
        default=100,
        ge=1,
        le=1000,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
):

    service = get_graph_service()

    return {
        "status": "success",
        "nodes": service.list_nodes(
            node_type=type,
            limit=limit,
            offset=offset,
        ),
    }


@router.post("/nodes")
def create_node(data: NodeCreate):

    service = get_graph_service()

    node = service.create_node(
        label=data.label,
        node_type=data.type,
        properties=data.properties,
    )

    return {
        "status": "success",
        "node": node,
    }


@router.get("/nodes/search")
def search_nodes(
    q: str = Query(
        ...,
        min_length=1,
    ),
    type: str | None = None,
    limit: int = Query(
        default=50,
        ge=1,
        le=200,
    ),
):

    service = get_graph_service()

    return {
        "status": "success",
        "nodes": service.search_nodes(
            query=q,
            node_type=type,
            limit=limit,
        ),
    }


@router.get("/nodes/{node_id}")
def get_node(node_id: str):

    service = get_graph_service()

    node = service.get_node(node_id)

    if node is None:
        raise HTTPException(
            status_code=404,
            detail="Node not found",
        )

    return {
        "status": "success",
        "node": node,
    }


@router.patch("/nodes/{node_id}")
def update_node(
    node_id: str,
    data: NodeUpdate,
):

    service = get_graph_service()

    node = service.update_node(
        node_id,
        label=data.label,
        node_type=data.type,
        properties=data.properties,
    )

    if node is None:
        raise HTTPException(
            status_code=404,
            detail="Node not found",
        )

    return {
        "status": "success",
        "node": node,
    }


@router.delete("/nodes/{node_id}")
def delete_node(node_id: str):

    service = get_graph_service()

    deleted = service.delete_node(node_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Node not found",
        )

    return {
        "status": "success",
        "deleted": True,
    }


@router.get("/nodes/{node_id}/neighbors")
def get_neighbors(
    node_id: str,
    relationship: str | None = None,
    direction: str = Query(
        default="both",
        pattern="^(in|out|both)$",
    ),
):

    service = get_graph_service()

    try:
        neighbors = service.get_neighbors(
            node_id,
            relationship=relationship,
            direction=direction,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return {
        "status": "success",
        "neighbors": neighbors,
    }


@router.post("/nodes/{node_id}/subgraph")
def get_subgraph(
    node_id: str,
    data: SubgraphQuery,
):

    service = get_graph_service()

    try:
        subgraph = service.get_subgraph(
            node_id,
            depth=data.depth,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    return {
        "status": "success",
        "subgraph": subgraph,
    }


@router.get("/edges")
def list_edges(
    source_id: str | None = None,
    target_id: str | None = None,
    relationship: str | None = None,
    limit: int = Query(
        default=100,
        ge=1,
        le=1000,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
):

    service = get_graph_service()

    return {
        "status": "success",
        "edges": service.list_edges(
            source_id=source_id,
            target_id=target_id,
            relationship=relationship,
            limit=limit,
            offset=offset,
        ),
    }


@router.post("/edges")
def create_edge(data: EdgeCreate):

    service = get_graph_service()

    try:
        edge = service.create_edge(
            source_id=data.source_id,
            target_id=data.target_id,
            relationship=data.relationship,
            properties=data.properties,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    return {
        "status": "success",
        "edge": edge,
    }


@router.get("/edges/{edge_id}")
def get_edge(edge_id: str):

    service = get_graph_service()

    edge = service.get_edge(edge_id)

    if edge is None:
        raise HTTPException(
            status_code=404,
            detail="Edge not found",
        )

    return {
        "status": "success",
        "edge": edge,
    }


@router.delete("/edges/{edge_id}")
def delete_edge(edge_id: str):

    service = get_graph_service()

    deleted = service.delete_edge(edge_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Edge not found",
        )

    return {
        "status": "success",
        "deleted": True,
    }


@router.post("/query/path")
def find_path(data: PathQuery):

    service = get_graph_service()

    try:
        path = service.find_path(
            source_id=data.source_id,
            target_id=data.target_id,
            max_depth=data.max_depth,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return {
        "status": "success",
        "path": path,
        "found": path is not None,
    }
