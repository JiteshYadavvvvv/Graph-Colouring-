"""
FastAPI server for the Interactive Map Coloring System.

Run:  uvicorn main:app --reload
Docs: http://127.0.0.1:8000/docs
"""

import math
import os
import time

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from algorithms.chromatic import chromatic_number
from algorithms.coloring import (
    ORDER_STRATEGIES,
    count_edges,
    find_conflicts,
    graph_statistics,
    greedy_coloring_with_steps,
    is_valid_coloring,
    validate_graph,
)
from algorithms.variants import compare_algorithms
from data import DATASETS, edge_list, get_dataset
from models.schemas import (
    AnalyzeRequest,
    ColorRequest,
    ColorResponse,
    CompareRequest,
    CompareResponse,
    ConflictRequest,
    ConflictResponse,
    DatasetSummary,
    GraphResponse,
    GraphSource,
)

app = FastAPI(
    title="Interactive Map Coloring API",
    description="Greedy graph coloring engine with step-by-step execution traces.",
    version="2.0.0",
)

# The Vite dev server proxies /api, so local development needs no CORS. A
# deployed frontend calls the API from another origin: set FRONTEND_URL to
# that origin (comma-separated for several, e.g. production + a custom domain).
# If it is not set, any origin may read the API. That is safe here because the
# API is public, read-only, and uses no cookies or credentials.
FRONTEND_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.environ.get("FRONTEND_URL", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS or ["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

CUSTOM_KEY = "custom"

# Complexity of one traced run, per strategy (see algorithms/coloring.py).
COMPLEXITY = {
    "natural": {"time": "O(V + E + V·C)", "core_time": "O(V + E)"},
    "largest_first": {"time": "O(V log V + E + V·C)", "core_time": "O(V log V + E)"},
    "dsatur": {"time": "O(V² + E)", "core_time": "O(V² + E)"},
}


@app.exception_handler(Exception)
async def unexpected_error(request: Request, exc: Exception):
    # Never send a stack trace to the browser; uvicorn still logs the error.
    return JSONResponse(
        status_code=500,
        content={"detail": "The coloring engine hit an unexpected error. Please try again."},
    )


def _require_dataset(key: str) -> dict:
    try:
        return get_dataset(key)
    except KeyError:
        available = ", ".join(k for k, d in DATASETS.items() if d["listed"])
        raise HTTPException(
            status_code=404,
            detail=f"Dataset '{key}' does not exist. Available datasets: {available}.",
        )


def _require_valid_graph(graph: dict) -> None:
    try:
        validate_graph(graph)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=f"Invalid graph: {error}.")


def _resolve(source: GraphSource):
    """Return (adjacency, names, key) for a dataset key or a custom graph."""
    if source.dataset is not None:
        d = _require_dataset(source.dataset)
        return d["adjacency"], d["names"], d["key"]
    _require_valid_graph(source.graph)
    return source.graph, {v: (source.names or {}).get(v, v) for v in source.graph}, CUSTOM_KEY


def _short_label(name: str) -> str:
    """Up to 3 characters that fit inside a graph node: 'Physics' -> 'Phy',
    'Exam Hall B' -> 'EHB'."""
    words = name.split()
    if len(words) > 1:
        return "".join(w[0] for w in words[:3]).upper()
    return name[:3]


def _circle_layout(vertices):
    n = max(len(vertices), 1)
    return {
        v: {"x": round(300 + 200 * math.cos(-math.pi / 2 + 2 * math.pi * i / n), 1),
            "y": round(250 + 200 * math.sin(-math.pi / 2 + 2 * math.pi * i / n), 1)}
        for i, v in enumerate(vertices)
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "coloring-engine", "datasets": sum(d["listed"] for d in DATASETS.values())}


@app.get("/api/datasets", response_model=list[DatasetSummary])
def list_datasets():
    summaries = []
    for d in DATASETS.values():
        if not d["listed"]:
            continue
        stats = graph_statistics(d["adjacency"])
        summaries.append(DatasetSummary(
            key=d["key"], name=d["name"], kind=d["kind"], graph_type=d["graph_type"],
            description=d["description"], characteristics=d["characteristics"],
            vertices=stats["vertices"], edges=stats["edges"],
            max_degree=stats["max_degree"], min_degree=stats["min_degree"],
            average_degree=stats["average_degree"],
            chromatic_number=d["chromatic"]["value"], chromatic_exact=d["chromatic"]["exact"],
        ))
    return summaries


@app.get("/api/graph/{dataset}", response_model=GraphResponse)
def get_graph(dataset: str):
    d = _require_dataset(dataset)
    adjacency = d["adjacency"]
    return GraphResponse(
        key=d["key"], name=d["name"], kind=d["kind"], graph_type=d["graph_type"],
        description=d["description"], characteristics=d["characteristics"],
        vertices=list(adjacency.keys()),
        edges=edge_list(adjacency),
        adjacency=adjacency,
        layout=d["layout"],
        labels=d["labels"],
        names=d["names"],
        statistics=graph_statistics(adjacency),
        chromatic=d["chromatic"],
    )


@app.post("/api/analyze", response_model=GraphResponse)
def analyze_graph(request: AnalyzeRequest):
    """Validate a custom graph (from the Graph Playground) and describe it in
    the same format as a built-in dataset."""
    graph = request.graph
    _require_valid_graph(graph)
    names = {v: (request.names or {}).get(v, v) for v in graph}
    layout = _circle_layout(list(graph))
    for v, point in (request.layout or {}).items():
        layout[v] = {"x": point.x, "y": point.y}
    return GraphResponse(
        key=CUSTOM_KEY, name="Custom Graph", kind="graph", graph_type="Custom graph (Graph Playground)",
        description="A graph built in the Graph Playground.",
        characteristics=[],
        vertices=list(graph.keys()),
        edges=edge_list(graph),
        adjacency=graph,
        layout=layout,
        labels={v: _short_label(names[v]) for v in graph},
        names=names,
        statistics=graph_statistics(graph),
        chromatic=chromatic_number(graph),
    )


@app.post("/api/color", response_model=ColorResponse)
def color_graph(request: ColorRequest):
    graph, names, key = _resolve(request)

    started = time.perf_counter()
    result = greedy_coloring_with_steps(graph, request.strategy, names)
    elapsed_ms = (time.perf_counter() - started) * 1000

    conflicts = find_conflicts(graph, result["coloring"])
    stats = graph_statistics(graph)
    stats.update({
        "colors_used": result["colors_used"],
        "conflicts": len(conflicts),
        "algorithm": "Greedy Graph Coloring",
        "strategy": request.strategy,
        "time_complexity": COMPLEXITY[request.strategy]["time"],
        "core_time_complexity": COMPLEXITY[request.strategy]["core_time"],
        "space_complexity": "O(V + E)",
        "execution_ms": round(elapsed_ms, 4),
        **result["operations"],
    })
    return ColorResponse(
        dataset=key,
        algorithm="Greedy Graph Coloring",
        strategy=request.strategy,
        strategy_label=ORDER_STRATEGIES[request.strategy],
        coloring=result["coloring"],
        colors_used=result["colors_used"],
        order=result["order"],
        steps=result["steps"],
        valid=is_valid_coloring(graph, result["coloring"]),
        conflicts=conflicts,
        statistics=stats,
    )


@app.post("/api/conflicts", response_model=ConflictResponse)
def check_conflicts(request: ConflictRequest):
    graph, _, _ = _resolve(request)

    unknown = [v for v in request.coloring if v not in graph]
    if unknown:
        raise HTTPException(
            status_code=422,
            detail=f"Coloring mentions vertices that are not in the graph: {', '.join(unknown)}",
        )

    conflicts = find_conflicts(graph, request.coloring)
    conflicting = sorted({c["region_a"] for c in conflicts} | {c["region_b"] for c in conflicts})
    uncolored = [v for v in graph if v not in request.coloring]
    return ConflictResponse(
        valid=is_valid_coloring(graph, request.coloring),
        conflicts=conflicts,
        conflicting_vertices=conflicting,
        uncolored=uncolored,
        checked_edges=count_edges(graph),
    )


@app.post("/api/compare", response_model=CompareResponse)
def compare(request: CompareRequest):
    """Run Greedy, Welsh–Powell and DSATUR on the same graph."""
    graph, _, key = _resolve(request)
    chromatic = DATASETS[key]["chromatic"] if key in DATASETS else chromatic_number(graph)
    return CompareResponse(
        dataset=key,
        vertices=len(graph),
        edges=count_edges(graph),
        results=compare_algorithms(graph),
        chromatic=chromatic,
    )
