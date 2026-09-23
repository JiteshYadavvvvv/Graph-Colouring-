"""Pydantic request/response models for the API."""

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class Point(BaseModel):
    x: float
    y: float


class DatasetSummary(BaseModel):
    key: str
    name: str
    kind: Literal["map", "graph"]
    description: str
    vertices: int
    edges: int


class GraphResponse(BaseModel):
    key: str
    name: str
    kind: Literal["map", "graph"]
    description: str
    vertices: List[str]
    edges: List[List[str]]
    adjacency: Dict[str, List[str]]
    layout: Dict[str, Point]
    labels: Dict[str, str]
    statistics: dict


class ColorRequest(BaseModel):
    dataset: str = Field(..., examples=["india"])
    strategy: Literal["natural", "largest_first"] = "natural"


class ColoringStep(BaseModel):
    step: int
    vertex: str
    degree: int
    neighbors: List[str]
    neighbor_colors: Dict[str, int]
    uncolored_neighbors: List[str]
    used_colors: List[int]
    rejected_colors: List[int]
    available_colors: List[int]
    assigned_color: int
    is_new_color: bool
    colors_in_use: int
    message: str


class ColorResponse(BaseModel):
    dataset: str
    strategy: str
    strategy_label: str
    coloring: Dict[str, int]
    colors_used: int
    order: List[str]
    steps: List[ColoringStep]
    valid: bool
    conflicts: List[dict]
    statistics: dict


class ConflictRequest(BaseModel):
    """Check a coloring against a dataset's graph, or against a custom graph."""
    dataset: Optional[str] = Field(None, examples=["india"])
    graph: Optional[Dict[str, List[str]]] = None
    coloring: Dict[str, int]


class Conflict(BaseModel):
    region_a: str
    region_b: str
    color: int


class ConflictResponse(BaseModel):
    valid: bool
    conflicts: List[Conflict]
    conflicting_vertices: List[str]
    uncolored: List[str]
    checked_edges: int
