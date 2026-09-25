"""Pydantic request/response models for the API."""

from typing import Annotated, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, StringConstraints, model_validator

# Limits for graphs sent by the client (the Graph Playground). The built-in
# datasets are defined on the server and are not subject to them.
MAX_CUSTOM_VERTICES = 60
MAX_CUSTOM_EDGES = 600

VertexId = Annotated[str, StringConstraints(pattern=r"^[A-Za-z0-9_.:\-]{1,32}$")]
VertexName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]
VertexLabel = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4)]
DatasetKey = Annotated[str, StringConstraints(min_length=1, max_length=40)]
# Python's JSON parser accepts NaN and Infinity; a layout must be real numbers.
Coordinate = Annotated[float, Field(allow_inf_nan=False)]
Adjacency = Dict[VertexId, List[VertexId]]
Strategy = Literal["natural", "largest_first", "dsatur"]


class Point(BaseModel):
    x: Coordinate
    y: Coordinate


class ChromaticInfo(BaseModel):
    """Minimum number of colors, when it could be proven."""
    value: Optional[int] = Field(None, description="Chromatic number, or null if it could not be proven")
    exact: bool
    lower_bound: int
    upper_bound: int
    method: str
    search_nodes: int


class DatasetSummary(BaseModel):
    key: str
    name: str
    kind: Literal["map", "graph"]
    graph_type: str
    description: str
    characteristics: List[str]
    vertices: int
    edges: int
    max_degree: int
    min_degree: int
    average_degree: float
    chromatic_number: Optional[int]
    chromatic_exact: bool


class GraphResponse(BaseModel):
    key: str
    name: str
    kind: Literal["map", "graph"]
    graph_type: str
    description: str
    characteristics: List[str]
    vertices: List[str]
    edges: List[List[str]]
    adjacency: Dict[str, List[str]]
    layout: Dict[str, Point]
    labels: Dict[str, str]
    names: Dict[str, str]
    statistics: dict
    chromatic: ChromaticInfo


class GraphSource(BaseModel):
    """Either a built-in dataset (by key) or a custom adjacency list."""
    dataset: Optional[DatasetKey] = Field(None, examples=["india"])
    graph: Optional[Adjacency] = Field(None, description="Custom graph as an adjacency list of vertex IDs")
    names: Optional[Dict[VertexId, VertexName]] = Field(
        None, description="Display names for a custom graph's vertices (IDs are used if omitted)")

    @model_validator(mode="after")
    def exactly_one_source(self):
        if (self.dataset is None) == (self.graph is None):
            raise ValueError("Provide either 'dataset' or 'graph' (but not both).")
        if self.graph is not None:
            check_custom_graph_size(self.graph)
            unknown = [v for v in (self.names or {}) if v not in self.graph]
            if unknown:
                raise ValueError(f"'names' mentions vertices that are not in the graph: {', '.join(unknown[:10])}")
        return self


def check_custom_graph_size(graph: Dict[str, List[str]]) -> None:
    if not graph:
        raise ValueError("The graph has no vertices. Add at least one vertex.")
    if len(graph) > MAX_CUSTOM_VERTICES:
        raise ValueError(f"The graph has {len(graph)} vertices; the limit is {MAX_CUSTOM_VERTICES}.")
    edges = sum(len(neighbors) for neighbors in graph.values()) // 2
    if edges > MAX_CUSTOM_EDGES:
        raise ValueError(f"The graph has {edges} edges; the limit is {MAX_CUSTOM_EDGES}.")


class AnalyzeRequest(BaseModel):
    """A custom graph to validate and describe (used by the Graph Playground)."""
    graph: Adjacency
    names: Optional[Dict[VertexId, VertexName]] = None
    labels: Optional[Dict[VertexId, VertexLabel]] = Field(
        None, description="Short labels drawn inside the nodes (derived from the names if omitted)")
    layout: Optional[Dict[VertexId, Point]] = None

    @model_validator(mode="after")
    def within_limits(self):
        check_custom_graph_size(self.graph)
        for field in ("names", "labels", "layout"):
            unknown = [v for v in (getattr(self, field) or {}) if v not in self.graph]
            if unknown:
                raise ValueError(f"'{field}' mentions vertices that are not in the graph: {', '.join(unknown[:10])}")
        return self


class ColorRequest(GraphSource):
    strategy: Strategy = "natural"


class ColoringStep(BaseModel):
    step: int
    vertex: str
    degree: int
    saturation: int
    selection: str
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


class Conflict(BaseModel):
    region_a: str
    region_b: str
    color: int


class ColorResponse(BaseModel):
    dataset: str
    algorithm: str
    strategy: str
    strategy_label: str
    coloring: Dict[str, int]
    colors_used: int
    order: List[str]
    steps: List[ColoringStep]
    valid: bool
    conflicts: List[Conflict]
    statistics: dict


class ConflictRequest(GraphSource):
    """Check a coloring against a dataset's graph, or against a custom graph."""
    coloring: Dict[VertexId, int]


class ConflictResponse(BaseModel):
    valid: bool
    conflicts: List[Conflict]
    conflicting_vertices: List[str]
    uncolored: List[str]
    checked_edges: int


class CompareRequest(GraphSource):
    pass


class AlgorithmResult(BaseModel):
    key: str
    strategy: Strategy
    name: str
    ordering: str
    time_complexity: str
    colors_used: int
    execution_ms: float
    order: List[str]
    coloring: Dict[str, int]
    valid: bool
    conflicts: int


class CompareResponse(BaseModel):
    dataset: str
    vertices: int
    edges: int
    results: List[AlgorithmResult]
    chromatic: ChromaticInfo
