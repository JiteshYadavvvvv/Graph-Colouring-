"""
Classic textbook graphs. Each one isolates a single idea about coloring:

    triangle   K3      the smallest graph that needs 3 colors
    cycle      C7      odd cycles need 3 colors (even cycles need only 2)
    complete   K5      a complete graph Kn always needs n colors
    bipartite  crown   2 colors suffice, yet greedy in a bad order uses 4

Only the adjacency lists and drawing positions are written here. Every
number the app shows (degrees, colors used, chromatic number) is computed
from these adjacency lists by the backend.
"""

import math


def circle_layout(ids, cx=300, cy=250, radius=180):
    """Place vertices evenly on a circle, starting at the top, clockwise."""
    n = len(ids)
    return {
        v: (
            round(cx + radius * math.cos(-math.pi / 2 + 2 * math.pi * i / n)),
            round(cy + radius * math.sin(-math.pi / 2 + 2 * math.pi * i / n)),
        )
        for i, v in enumerate(ids)
    }


def complete_adjacency(ids):
    return {v: [u for u in ids if u != v] for v in ids}


def cycle_adjacency(ids):
    n = len(ids)
    return {v: [ids[(i - 1) % n], ids[(i + 1) % n]] for i, v in enumerate(ids)}


# ---------------------------------------------------------------------------
# Triangle K3
# ---------------------------------------------------------------------------
TRIANGLE = {
    "key": "triangle",
    "name": "Triangle Graph K3",
    "graph_type": "Complete graph K3 (also the cycle C3)",
    "description": "Three vertices, each adjacent to the other two.",
    "characteristics": [
        "Every vertex is adjacent to every other vertex.",
        "The smallest graph that needs 3 colors.",
    ],
    "adjacency": complete_adjacency(["A", "B", "C"]),
    "layout": circle_layout(["A", "B", "C"], radius=150),
}

# ---------------------------------------------------------------------------
# Cycle C7
# ---------------------------------------------------------------------------
_CYCLE_IDS = ["A", "B", "C", "D", "E", "F", "G"]
CYCLE = {
    "key": "cycle",
    "name": "Cycle Graph C7",
    "graph_type": "Cycle graph C7 (odd length)",
    "description": "Seven vertices joined in a single ring.",
    "characteristics": [
        "Every vertex has degree 2.",
        "An odd cycle cannot be colored with 2 colors; an even cycle can.",
    ],
    "adjacency": cycle_adjacency(_CYCLE_IDS),
    "layout": circle_layout(_CYCLE_IDS),
}

# ---------------------------------------------------------------------------
# Complete graph K5
# ---------------------------------------------------------------------------
_K5_IDS = ["A", "B", "C", "D", "E"]
COMPLETE = {
    "key": "complete",
    "name": "Complete Graph K5",
    "graph_type": "Complete graph K5",
    "description": "Five vertices where every pair is connected.",
    "characteristics": [
        "Every pair of vertices is adjacent, so every vertex needs its own color.",
        "K5 is not planar: it could never come from a map.",
    ],
    "adjacency": complete_adjacency(_K5_IDS),
    "layout": circle_layout(_K5_IDS),
}

# ---------------------------------------------------------------------------
# Bipartite crown graph: K(4,4) minus a perfect matching.
# U_i is adjacent to V_j exactly when i != j. The vertex order interleaves
# the two sides (U1, V1, U2, V2, ...), which is the classic order that makes
# plain greedy coloring use 4 colors on a graph that needs only 2.
# ---------------------------------------------------------------------------
_N = 4
_CROWN_ORDER = [f"{side}{i}" for i in range(1, _N + 1) for side in ("U", "V")]
BIPARTITE = {
    "key": "bipartite",
    "name": "Bipartite Graph (Crown)",
    "graph_type": "Bipartite crown graph: K4,4 minus a perfect matching",
    "description": "Two groups, U and V. Ui is connected to Vj whenever i ≠ j; no edge stays inside a group.",
    "characteristics": [
        "Bipartite: coloring group U with one color and group V with another always works.",
        "The dataset order U1, V1, U2, V2, … is a bad order for plain greedy coloring.",
        "Compare the algorithms on this graph to see why vertex order matters.",
    ],
    "adjacency": {
        v: [
            f"{'V' if v[0] == 'U' else 'U'}{j}"
            for j in range(1, _N + 1)
            if j != int(v[1:])
        ]
        for v in _CROWN_ORDER
    },
    "layout": {
        f"{side}{i}": (140 if side == "U" else 460, 70 + (i - 1) * 120)
        for i in range(1, _N + 1)
        for side in ("U", "V")
    },
}

ALL = [TRIANGLE, CYCLE, COMPLETE, BIPARTITE]
