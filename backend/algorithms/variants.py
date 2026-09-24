"""
Two classic alternatives to plain greedy coloring, implemented by hand for
the comparison page (no graph library).

Both are still greedy algorithms: they never undo a color. They only change
the ORDER in which vertices are colored, and that order decides how many
colors are needed. Neither is better on every graph.
"""

import time
from typing import Callable, Dict, Hashable, List

from .coloring import (
    Graph,
    find_conflicts,
    greedy_coloring,
    is_valid_coloring,
    most_saturated_vertex,
    smallest_available_color,
)


def welsh_powell_coloring(graph: Graph) -> dict:
    """Welsh–Powell (1967), in its classic color-by-color form.

        sort the vertices by degree, highest first
        for color = 1, 2, 3, ...:
            walk down the sorted list and give `color` to every uncolored
            vertex that has no neighbor already holding `color`

    It produces exactly the same coloring as vertex-by-vertex greedy on the
    same order (the "largest_first" strategy), just built one color class at
    a time.

    Time:  O(V log V) for the sort, plus one pass over the remaining vertices
           and their adjacency lists per color: O(V log V + C·(V + E)).
    Space: O(V).
    """
    order = sorted(graph, key=lambda v: len(graph[v]), reverse=True)  # stable
    coloring: Dict[Hashable, int] = {}
    remaining = order
    color = 0
    while remaining:
        color += 1
        this_class = set()
        still_uncolored = []
        for vertex in remaining:
            if any(neighbor in this_class for neighbor in graph[vertex]):
                still_uncolored.append(vertex)
            else:
                coloring[vertex] = color
                this_class.add(vertex)
        remaining = still_uncolored
    return {"coloring": coloring, "order": order, "colors_used": color}


def dsatur_coloring(graph: Graph) -> dict:
    """DSATUR (Brélaz, 1979).

        while some vertex is uncolored:
            pick the uncolored vertex whose neighbors use the most distinct
            colors (its saturation); break ties by higher degree
            give it the smallest color its neighbors are not using

    DSATUR colors every bipartite graph with 2 colors, but like any
    polynomial-time heuristic it is not optimal on every graph.

    Time:  O(V) scan per step to find the most saturated vertex: O(V² + E).
    Space: O(V + E) for the per-vertex sets of neighbor colors.
    """
    position = {v: i for i, v in enumerate(graph)}
    saturation = {v: set() for v in graph}
    uncolored = set(graph)
    coloring: Dict[Hashable, int] = {}
    order: List[Hashable] = []
    while uncolored:
        vertex = most_saturated_vertex(uncolored, saturation, graph, position)
        color = smallest_available_color(saturation[vertex])
        coloring[vertex] = color
        order.append(vertex)
        uncolored.remove(vertex)
        for neighbor in graph[vertex]:
            if neighbor in uncolored:
                saturation[neighbor].add(color)
    return {"coloring": coloring, "order": order, "colors_used": max(coloring.values(), default=0)}


def _natural_greedy(graph: Graph) -> dict:
    coloring = greedy_coloring(graph)
    return {"coloring": coloring, "order": list(graph), "colors_used": max(coloring.values(), default=0)}


ALGORITHMS = [
    {
        "key": "greedy",
        "strategy": "natural",
        "name": "Greedy Coloring",
        "ordering": "Dataset order, fixed before coloring starts",
        "time_complexity": "O(V + E)",
        "run": _natural_greedy,
    },
    {
        "key": "welsh_powell",
        "strategy": "largest_first",
        "name": "Welsh–Powell",
        "ordering": "Highest degree first, fixed before coloring starts",
        "time_complexity": "O(V log V + C·(V + E))",
        "run": welsh_powell_coloring,
    },
    {
        "key": "dsatur",
        "strategy": "dsatur",
        "name": "DSATUR",
        "ordering": "Most distinct neighbor colors first, re-chosen at every step",
        "time_complexity": "O(V² + E)",
        "run": dsatur_coloring,
    },
]


def _time_per_run_ms(run: Callable[[Graph], dict], graph: Graph, batches: int = 5) -> float:
    """Wall-clock time of one run, in milliseconds, measured like `timeit`.

    A single run on a small graph takes microseconds, below the timer's
    resolution, so runs are grouped into batches of at least ~1 ms. The
    fastest batch is reported: slower batches were only disturbed by other
    work on the server (other requests, garbage collection), not by the
    algorithm itself.
    """
    runs_per_batch = 1
    while True:
        started = time.perf_counter()
        for _ in range(runs_per_batch):
            run(graph)
        elapsed = time.perf_counter() - started
        if elapsed >= 0.001 or runs_per_batch >= 4096:
            break
        runs_per_batch *= 2
    best = elapsed / runs_per_batch
    for _ in range(batches - 1):
        started = time.perf_counter()
        for _ in range(runs_per_batch):
            run(graph)
        best = min(best, (time.perf_counter() - started) / runs_per_batch)
    return best * 1000


def compare_algorithms(graph: Graph) -> List[dict]:
    """Run every algorithm on the same graph and report what each produced."""
    results = []
    for algorithm in ALGORITHMS:
        outcome = algorithm["run"](graph)
        coloring = outcome["coloring"]
        results.append({
            "key": algorithm["key"],
            "strategy": algorithm["strategy"],
            "name": algorithm["name"],
            "ordering": algorithm["ordering"],
            "time_complexity": algorithm["time_complexity"],
            "colors_used": outcome["colors_used"],
            "execution_ms": round(_time_per_run_ms(algorithm["run"], graph), 5),
            "order": outcome["order"],
            "coloring": coloring,
            "valid": is_valid_coloring(graph, coloring),
            "conflicts": len(find_conflicts(graph, coloring)),
        })
    return results
