"""
FastAPI server for the Interactive Map Coloring System.

Run:  uvicorn main:app --reload
Docs: http://127.0.0.1:8000/docs
"""

import time

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from algorithms.coloring import (
    ORDER_STRATEGIES,
    count_edges,
    find_conflicts,
    graph_statistics,
    greedy_coloring_with_steps,
    is_valid_coloring,
    validate_graph,
)
from data import DATASETS, edge_list, get_dataset
from models.schemas import (
    ColorRequest,
    ColorResponse,
    ConflictRequest,
    ConflictResponse,
    DatasetSummary,
    GraphResponse,
)

app = FastAPI(
    title="Interactive Map Coloring API",
    description="Greedy graph coloring engine with step-by-step execution traces.",
    version="1.0.0",
)

# The Vite dev server proxies /api, but CORS is also enabled so the frontend
# can talk to the API directly (e.g. with VITE_API_URL set).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


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


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "coloring-engine", "datasets": len(DATASETS)}


@app.get("/api/datasets", response_model=list[DatasetSummary])
def list_datasets():
    return [
        DatasetSummary(
            key=d["key"], name=d["name"], kind=d["kind"], description=d["description"],
            vertices=len(d["adjacency"]), edges=count_edges(d["adjacency"]),
        )
        for d in DATASETS.values()
        if d["listed"]
    ]


@app.get("/api/graph/{dataset}", response_model=GraphResponse)
def get_graph(dataset: str):
    d = _require_dataset(dataset)
    adjacency = d["adjacency"]
    return GraphResponse(
        key=d["key"], name=d["name"], kind=d["kind"], description=d["description"],
        vertices=list(adjacency.keys()),
        edges=edge_list(adjacency),
        adjacency=adjacency,
        layout=d["layout"],
        labels=d["labels"],
        statistics=graph_statistics(adjacency),
    )


@app.post("/api/color", response_model=ColorResponse)
def color_graph(request: ColorRequest):
    d = _require_dataset(request.dataset)
    graph = d["adjacency"]

    started = time.perf_counter()
    result = greedy_coloring_with_steps(graph, request.strategy)
    elapsed_ms = (time.perf_counter() - started) * 1000

    conflicts = find_conflicts(graph, result["coloring"])
    stats = graph_statistics(graph)
    stats.update({
        "colors_used": result["colors_used"],
        "conflicts": len(conflicts),
        "algorithm": "Greedy Graph Coloring",
        "strategy": request.strategy,
        "time_complexity": "O(V + E + V·C)",
        "core_time_complexity": "O(V + E)",
        "space_complexity": "O(V + E)",
        "execution_ms": round(elapsed_ms, 4),
        **result["operations"],
    })
    return ColorResponse(
        dataset=d["key"],
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
    if request.graph is not None:
        graph = request.graph
        try:
            validate_graph(graph)
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error))
    elif request.dataset is not None:
        graph = _require_dataset(request.dataset)["adjacency"]
    else:
        raise HTTPException(status_code=422, detail="Provide either 'dataset' or 'graph'.")

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
