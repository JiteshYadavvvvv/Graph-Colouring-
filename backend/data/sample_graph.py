"""
Abstract graphs with no geography. They show that the same greedy algorithm
works on ANY graph, not just on maps.
"""

# ---------------------------------------------------------------------------
# Sample graph: a "wheel". C is the hub, and A-B-E-F-D-A is a 5-cycle rim.
# The rim is an odd cycle, so it needs 3 colors, and the hub touches every
# rim vertex, so it needs a 4th. The chromatic number is therefore 4.
# ---------------------------------------------------------------------------
KEY = "sample"
NAME = "Sample Graph"
KIND = "graph"
DESCRIPTION = (
    "An abstract 6-vertex wheel graph (hub C plus an odd 5-cycle). "
    "Its chromatic number is 4."
)

ADJACENCY = {
    "A": ["B", "C", "D"],
    "B": ["A", "C", "E"],
    "C": ["A", "B", "D", "E", "F"],
    "D": ["A", "C", "F"],
    "E": ["B", "C", "F"],
    "F": ["C", "D", "E"],
}

LABELS = {v: v for v in ADJACENCY}

LAYOUT = {
    "A": (300, 80),
    "B": (470, 205),
    "C": (300, 260),
    "D": (130, 205),
    "E": (405, 420),
    "F": (195, 420),
}


# ---------------------------------------------------------------------------
# Mini tutorial graph used on the "How It Works" page.
#
#     A — B
#     |   |
#     C — D
#      \ /
#       E
# ---------------------------------------------------------------------------
MINI_KEY = "mini"
MINI_NAME = "Mini Tutorial Graph"
MINI_DESCRIPTION = "A 5-vertex graph used for the step-by-step tutorial."

MINI_ADJACENCY = {
    "A": ["B", "C"],
    "B": ["A", "D"],
    "C": ["A", "D", "E"],
    "D": ["B", "C", "E"],
    "E": ["C", "D"],
}

MINI_LAYOUT = {
    "A": (90, 60),
    "B": (250, 60),
    "C": (90, 180),
    "D": (250, 180),
    "E": (170, 290),
}
