"""
Greedy Graph Coloring, implemented from scratch (no graph library).

Graph representation
--------------------
Every graph is an ADJACENCY LIST: a dict that maps each vertex ID to the list
of vertex IDs it shares an edge with.

    graph = {
        "A": ["B", "C"],
        "B": ["A"],
        "C": ["A"],
    }

The graph is undirected, so if "B" is in graph["A"] then "A" is in graph["B"].

Colors are the positive integers 1, 2, 3, ... The frontend maps each integer
to a display color, and the algorithm only ever sees numbers.

Vertex order
------------
Greedy coloring always colors one vertex at a time and gives it the smallest
color that none of its already-colored neighbors uses. The variants differ
only in WHICH vertex is colored next:

    natural        dataset order                          (static order)
    largest_first  highest degree first (Welsh–Powell)    (static order)
    dsatur         most distinct neighbor colors first    (chosen at every step)
"""

from typing import Dict, Hashable, Iterable, List, Optional, Set

Graph = Dict[Hashable, List[Hashable]]
Coloring = Dict[Hashable, int]

ORDER_STRATEGIES = {
    "natural": "Natural order (vertices in dataset order)",
    "largest_first": "Largest degree first (Welsh–Powell order)",
    "dsatur": "DSATUR (most-saturated vertex first)",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def vertex_order(graph: Graph, strategy: str = "natural") -> List[Hashable]:
    """Return the order in which greedy coloring visits the vertices, for the
    strategies whose order is fixed before coloring starts.

    DSATUR has no fixed order: it picks the next vertex while coloring (see
    most_saturated_vertex), so it is not handled here.
    """
    if strategy == "natural":
        return list(graph.keys())
    if strategy == "largest_first":
        # Welsh–Powell idea: color the "most constrained" vertices first.
        # Python's sort is stable, so vertices with equal degree keep their
        # original dataset order. Cost: O(V log V).
        return sorted(graph.keys(), key=lambda v: len(graph[v]), reverse=True)
    raise ValueError(f"Unknown ordering strategy '{strategy}'")


def most_saturated_vertex(candidates: Iterable[Hashable], saturation: Dict[Hashable, Set[int]],
                          graph: Graph, position: Dict[Hashable, int]) -> Hashable:
    """DSATUR's choice: the uncolored vertex whose colored neighbors use the
    most DISTINCT colors (its saturation). Ties go to the higher degree, then
    to the vertex listed first in the dataset, so the result is deterministic.

    Scans every candidate, so one call costs O(V).
    """
    return max(candidates, key=lambda v: (len(saturation[v]), len(graph[v]), -position[v]))


def smallest_available_color(used_colors: Set[int]) -> int:
    """Return the smallest positive integer that is NOT in used_colors.

    A vertex with d neighbors can see at most d distinct colors, so this loop
    runs at most d + 1 times. That bound keeps greedy coloring fast.
    """
    color = 1
    while color in used_colors:
        color += 1
    return color


def count_edges(graph: Graph) -> int:
    """Each undirected edge appears twice in an adjacency list (u->v, v->u)."""
    return sum(len(neighbors) for neighbors in graph.values()) // 2


def iterate_edges(graph: Graph) -> Iterable[tuple]:
    """Yield each undirected edge exactly once, as (u, v)."""
    position = {vertex: index for index, vertex in enumerate(graph)}
    for u, neighbors in graph.items():
        for v in neighbors:
            # Only emit the edge from the endpoint that appears first, so the
            # pair (u, v) and (v, u) is not reported twice.
            if position[u] < position[v]:
                yield u, v


def validate_graph(graph: Graph) -> None:
    """Raise ValueError if the adjacency list is not a simple undirected graph.

    One set of neighbors per vertex makes every membership test O(1), so the
    whole check costs O(V + E).
    """
    neighbor_sets = {vertex: set(neighbors) for vertex, neighbors in graph.items()}
    for vertex, neighbors in graph.items():
        if len(neighbor_sets[vertex]) != len(neighbors):
            raise ValueError(f"Vertex '{vertex}' lists the same neighbor twice")
        for neighbor in neighbors:
            if neighbor == vertex:
                raise ValueError(f"Vertex '{vertex}' has a self-loop")
            if neighbor not in graph:
                raise ValueError(f"'{vertex}' is adjacent to unknown vertex '{neighbor}'")
            if vertex not in neighbor_sets[neighbor]:
                raise ValueError(
                    f"Edge {vertex}–{neighbor} is missing its reverse direction "
                    f"(the graph must be undirected)"
                )


# ---------------------------------------------------------------------------
# Core algorithm
# ---------------------------------------------------------------------------

def greedy_coloring(graph: Graph, order: Optional[List[Hashable]] = None) -> Coloring:
    """Plain greedy coloring. Returns {vertex: color}.

    for every vertex v (in the chosen order):
        used = colors of v's neighbors that are ALREADY colored
        give v the smallest color >= 1 that is not in used

    Time:  O(V + E). Each vertex is visited once, each adjacency entry is
           read once, and the smallest-color search stops within deg(v) + 1
           tries.
    Space: O(V) for the coloring, plus O(Δ) for the temporary 'used' set.
    """
    coloring: Coloring = {}
    for vertex in (order if order is not None else graph):
        # Find colors already used by the current vertex's neighbors.
        # We cannot assign any of these colors to the current vertex.
        used = {coloring[n] for n in graph[vertex] if n in coloring}

        # Pick the smallest color that no colored neighbor is using.
        coloring[vertex] = smallest_available_color(used)
    return coloring


def greedy_coloring_with_steps(graph: Graph, strategy: str = "natural",
                               names: Optional[Dict[Hashable, str]] = None) -> dict:
    """Run greedy coloring and record every decision it makes.

    This runs the same algorithm as greedy_coloring(), but it also writes down
    the reasoning at each vertex (why it was picked, which neighbors were
    checked, which colors were blocked, which were free) so the frontend can
    replay it exactly. `names` maps vertex IDs to display names for the
    human-readable messages; the algorithm itself only uses IDs.

    Returns:
        {
          "order":        [...vertices in the order they were colored...],
          "coloring":     {vertex: color},
          "colors_used":  int,
          "steps":        [ {...one record per vertex...} ],
          "operations":   {"neighbor_checks": int, "color_checks": int},
        }

    Time (natural / largest_first): O(V + E + V·C), where C is the number of
    colors in use. The V·C term comes only from listing the blocked and
    available colors for the visualization; the coloring decision itself is
    O(V + E). largest_first adds an O(V log V) sort. dsatur adds an O(V) scan
    per step to find the most saturated vertex: O(V² + E) in total.

    Space: O(V + E + V·C) for the recorded steps (each stores the vertex's
    neighbors and its blocked and available colors); the coloring itself
    needs O(V).
    """
    if strategy not in ORDER_STRATEGIES:
        raise ValueError(f"Unknown ordering strategy '{strategy}'")
    validate_graph(graph)

    def name(v):
        return names.get(v, v) if names else v

    position = {vertex: index for index, vertex in enumerate(graph)}
    static_order = None if strategy == "dsatur" else vertex_order(graph, strategy)
    uncolored = set(graph)
    # saturation[v] = distinct colors among v's colored neighbors. Only DSATUR
    # needs it to choose vertices, but every strategy reports it.
    saturation: Dict[Hashable, Set[int]] = {v: set() for v in graph}

    coloring: Coloring = {}
    order: List[Hashable] = []
    steps: List[dict] = []
    colors_in_use = 0          # largest color assigned so far (C)
    neighbor_checks = 0        # how many adjacency entries we inspected
    color_checks = 0           # how many candidate colors we tested

    for step_number in range(1, len(graph) + 1):
        # 0. Choose the next vertex.
        if static_order is not None:
            vertex = static_order[step_number - 1]
        else:
            vertex = most_saturated_vertex(uncolored, saturation, graph, position)
        selection = _explain_selection(strategy, vertex, graph, saturation, name)
        neighbors = list(graph[vertex])

        # 1. Look at every neighbor. The colored ones restrict our choice.
        #    Uncolored ones don't matter yet, because greedy never looks ahead.
        neighbor_colors: Dict[Hashable, int] = {}
        uncolored_neighbors: List[Hashable] = []
        for neighbor in neighbors:
            neighbor_checks += 1
            if neighbor in coloring:
                neighbor_colors[neighbor] = coloring[neighbor]
            else:
                uncolored_neighbors.append(neighbor)

        # 2. The set of colors we are NOT allowed to use. For the record it is
        #    listed in increasing order by scanning the palette 1..C, which
        #    costs O(C) instead of a sort.
        used_colors = set(neighbor_colors.values())
        used_in_order = [c for c in range(1, colors_in_use + 1) if c in used_colors]

        # 3. Try colors 1, 2, 3, ... and take the first one not in used_colors.
        rejected_colors: List[int] = []
        candidate = 1
        while True:
            color_checks += 1
            if candidate not in used_colors:
                break
            rejected_colors.append(candidate)
            candidate += 1
        assigned_color = candidate

        # 4. For the visualization: every color from the current palette (plus
        #    one fresh color) that this vertex COULD legally take. Greedy
        #    always takes the smallest, which is available_colors[0].
        available_colors = [
            c for c in range(1, colors_in_use + 2) if c not in used_colors
        ]
        is_new_color = assigned_color > colors_in_use

        coloring[vertex] = assigned_color
        colors_in_use = max(colors_in_use, assigned_color)
        uncolored.discard(vertex)
        order.append(vertex)
        for neighbor in neighbors:
            if neighbor in uncolored:
                saturation[neighbor].add(assigned_color)

        steps.append({
            "step": step_number,
            "vertex": vertex,
            "degree": len(neighbors),
            "saturation": len(used_colors),
            "selection": selection,
            "neighbors": neighbors,
            "neighbor_colors": neighbor_colors,
            "uncolored_neighbors": uncolored_neighbors,
            "used_colors": used_in_order,
            "rejected_colors": rejected_colors,
            "available_colors": available_colors,
            "assigned_color": assigned_color,
            "is_new_color": is_new_color,
            "colors_in_use": colors_in_use,
            "message": _explain_step(name(vertex), neighbor_colors, rejected_colors,
                                     assigned_color, is_new_color),
        })

    return {
        "order": order,
        "coloring": coloring,
        "colors_used": colors_in_use,
        "steps": steps,
        "operations": {
            "neighbor_checks": neighbor_checks,
            "color_checks": color_checks,
        },
    }


def _explain_selection(strategy, vertex, graph, saturation, name) -> str:
    """One sentence saying why this vertex is colored next."""
    degree = len(graph[vertex])
    if strategy == "largest_first":
        return f"{name(vertex)} is next in Welsh–Powell order (degree {degree})."
    if strategy == "dsatur":
        sat = len(saturation[vertex])
        return (f"{name(vertex)} has the highest saturation: its colored neighbors use "
                f"{sat} distinct color{'s' if sat != 1 else ''} (ties go to the higher degree, {degree}).")
    return f"{name(vertex)} is next in dataset order."


def _explain_step(vertex_name, neighbor_colors, rejected_colors, assigned_color, is_new_color) -> str:
    """Build a one-sentence, human-readable explanation of a single step."""
    if not neighbor_colors:
        return (f"No neighbor of {vertex_name} is colored yet, so the smallest "
                f"color, Color {assigned_color}, is free.")
    blocked = ", ".join(str(c) for c in rejected_colors)
    suffix = " (a new color is introduced)" if is_new_color else ""
    if rejected_colors:
        return (f"Neighbors block Color {blocked}. Smallest available color "
                f"is {assigned_color}{suffix}.")
    return (f"Colored neighbors don't use Color 1, so {vertex_name} takes "
            f"Color {assigned_color}{suffix}.")


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

def find_conflicts(graph: Graph, coloring: Coloring) -> List[dict]:
    """Return every edge whose two endpoints share the same color.

    Checks each undirected edge once: O(V + E).
    """
    conflicts = []
    for u, v in iterate_edges(graph):
        if u in coloring and v in coloring and coloring[u] == coloring[v]:
            conflicts.append({"region_a": u, "region_b": v, "color": coloring[u]})
    return conflicts


def is_valid_coloring(graph: Graph, coloring: Coloring) -> bool:
    """A coloring is valid when every vertex has a color >= 1 and no edge
    joins two vertices of the same color."""
    for vertex in graph:
        color = coloring.get(vertex)
        if not isinstance(color, int) or color < 1:
            return False
    return not find_conflicts(graph, coloring)


# ---------------------------------------------------------------------------
# Statistics
# ---------------------------------------------------------------------------

def graph_statistics(graph: Graph) -> dict:
    """Degree and size statistics of the graph."""
    vertex_count = len(graph)
    edge_count = count_edges(graph)
    degrees = {v: len(n) for v, n in graph.items()}
    max_degree = max(degrees.values(), default=0)
    min_degree = min(degrees.values(), default=0)
    average_degree = (2 * edge_count / vertex_count) if vertex_count else 0.0
    possible_edges = vertex_count * (vertex_count - 1) / 2
    density = edge_count / possible_edges if possible_edges else 0.0
    return {
        "vertices": vertex_count,
        "edges": edge_count,
        "max_degree": max_degree,
        "min_degree": min_degree,
        "average_degree": round(average_degree, 2),
        "density": round(density, 3),
        "degrees": degrees,
        # Greedy never needs more than Δ + 1 colors: a vertex has at most Δ
        # neighbors, so at most Δ colors can be blocked.
        "greedy_upper_bound": max_degree + 1 if vertex_count else 0,
    }
