from typing import Any

from pydantic import BaseModel, Field


class NodeCreate(BaseModel):
    label: str
    type: str = "entity"
    properties: dict[str, Any] = Field(
        default_factory=dict
    )


class NodeUpdate(BaseModel):
    label: str | None = None
    type: str | None = None
    properties: dict[str, Any] | None = None


class EdgeCreate(BaseModel):
    source_id: str
    target_id: str
    relationship: str
    properties: dict[str, Any] = Field(
        default_factory=dict
    )


class PathQuery(BaseModel):
    source_id: str
    target_id: str
    max_depth: int = 10


class SubgraphQuery(BaseModel):
    depth: int = 2
