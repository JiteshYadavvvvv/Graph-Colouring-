"""
Chromatic number: the MINIMUM number of colors a graph needs.

Greedy coloring gives *an* upper bound quickly, but it is not guaranteed to
be the minimum. Finding the true minimum is NP-hard: no known algorithm
solves it in polynomial time on every graph. For the small graphs in this
project an exact backtracking search is still fast, so it is used with a
work budget. If the budget runs out, the answer is reported as unknown,
together with the bounds that were proven, instead of guessing.
"""

import time
from typing import Dict, Hashable, List

from .coloring import Graph, greedy_coloring
from .variants import dsatur_coloring, welsh_powell_coloring

NODE_BUDGET = 200_000     # search-tree nodes, across all k tried
TIME_LIMIT_S = 0.4        # hard wall-clock cap per graph


class _OutOfBudget(Exception):
    pass


def greedy_clique(graph: Graph) -> List[Hashable]:
    """A clique found greedily (not necessarily the largest).

    Any clique of size q forces at least q colors, so its size is a valid
    LOWER bound on the chromatic number.
    """
    position = {v: i for i, v in enumerate(graph)}
    best: List[Hashable] = []
    for start in sorted(graph, key=lambda v: (-len(graph[v]), position[v])):
        clique = [start]
        candidates = set(graph[start])
        while candidates:
            # Grow with the candidate that keeps the most other candidates.
            v = max(candidates, key=lambda u: (len(candidates.intersection(graph[u])), -position[u]))
            clique.append(v)
            candidates.intersection_update(graph[v])
        if len(clique) > len(best):
            best = clique
    return best


def _k_colorable(graph: Graph, k: int, state: dict) -> bool:
    """Backtracking search: can the graph be colored with k colors?

    The next vertex is always the uncolored one with the most distinct
    neighbor colors (the DSATUR rule), which fails fast on dead ends. Colors
    are tried in increasing order and at most one brand-new color is tried
    per vertex, so symmetric colorings (the same one with colors renamed) are
    never explored twice.
    """
    position = {v: i for i, v in enumerate(graph)}
    color: Dict[Hashable, int] = {}
    # seen[v][c] = how many colored neighbors of v have color c
    seen: Dict[Hashable, Dict[int, int]] = {v: {} for v in graph}

    def assign(v, c):
        color[v] = c
        for n in graph[v]:
            seen[n][c] = seen[n].get(c, 0) + 1

    def unassign(v, c):
        del color[v]
        for n in graph[v]:
            seen[n][c] -= 1
            if not seen[n][c]:
                del seen[n][c]

    def search(max_used: int) -> bool:
        if len(color) == len(graph):
            return True
        state["nodes"] += 1
        if state["nodes"] > NODE_BUDGET or (
            state["nodes"] % 1024 == 0 and time.perf_counter() > state["deadline"]
        ):
            raise _OutOfBudget
        v = max(
            (u for u in graph if u not in color),
            key=lambda u: (len(seen[u]), len(graph[u]), -position[u]),
        )
        for c in range(1, min(k, max_used + 1) + 1):
            if c in seen[v]:
                continue
            assign(v, c)
            if search(max(max_used, c)):
                return True
            unassign(v, c)
        return False

    return search(0)


def chromatic_number(graph: Graph) -> dict:
    """Exact chromatic number when the search finishes within its budget.

    Returns:
        {
          "value":        int or None (None = could not be proven in budget),
          "exact":        bool,
          "lower_bound":  int, proven: no coloring with fewer colors exists,
          "upper_bound":  int, achieved by the best heuristic coloring,
          "method":       short description of how the answer was obtained,
          "search_nodes": backtracking nodes explored,
        }
    """
    n = len(graph)
    if n == 0:
        return _result(0, True, 0, 0, "Empty graph", 0)

    upper = min(
        max(greedy_coloring(graph).values()),
        welsh_powell_coloring(graph)["colors_used"],
        dsatur_coloring(graph)["colors_used"],
    )
    lower = max(1, len(greedy_clique(graph)))
    if lower == upper:
        return _result(upper, True, lower, upper,
                       f"A clique of {lower} vertices needs {lower} colors, and a heuristic coloring uses {upper}", 0)

    state = {"nodes": 0, "deadline": time.perf_counter() + TIME_LIMIT_S}
    try:
        for k in range(lower, upper):
            if _k_colorable(graph, k, state):
                return _result(k, True, k, k, f"Exact backtracking search: {k} colors work, {k - 1} do not",
                               state["nodes"])
            lower = k + 1  # proven: k colors are not enough
    except _OutOfBudget:
        return _result(None, False, lower, upper,
                       "Search budget exhausted: only bounds are known", state["nodes"])
    return _result(upper, True, upper, upper,
                   f"Exact backtracking search: fewer than {upper} colors is impossible", state["nodes"])


def _result(value, exact, lower, upper, method, nodes) -> dict:
    return {
        "value": value,
        "exact": exact,
        "lower_bound": lower,
        "upper_bound": upper,
        "method": method,
        "search_nodes": nodes,
    }
