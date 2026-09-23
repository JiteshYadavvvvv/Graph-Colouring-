"""
Dataset registry. Every graph the application can show is defined in this
package and nowhere else.
"""

from algorithms.coloring import iterate_edges, validate_graph

from . import india_map, sample_graph


def _dataset(key, name, kind, description, adjacency, layout, labels, listed=True):
    # Fail fast at startup if a dataset is not a valid undirected graph.
    validate_graph(adjacency)
    return {
        "key": key,
        "name": name,
        "kind": kind,
        "description": description,
        "adjacency": adjacency,
        "layout": {v: {"x": x, "y": y} for v, (x, y) in layout.items()},
        "labels": labels,
        "listed": listed,
    }


DATASETS = {
    india_map.KEY: _dataset(
        india_map.KEY, india_map.NAME, india_map.KIND, india_map.DESCRIPTION,
        india_map.ADJACENCY, india_map.LAYOUT, india_map.LABELS,
    ),
    sample_graph.KEY: _dataset(
        sample_graph.KEY, sample_graph.NAME, sample_graph.KIND, sample_graph.DESCRIPTION,
        sample_graph.ADJACENCY, sample_graph.LAYOUT, sample_graph.LABELS,
    ),
    # Used by the tutorial page only, so it is hidden from the dataset menu.
    sample_graph.MINI_KEY: _dataset(
        sample_graph.MINI_KEY, sample_graph.MINI_NAME, "graph", sample_graph.MINI_DESCRIPTION,
        sample_graph.MINI_ADJACENCY, sample_graph.MINI_LAYOUT,
        {v: v for v in sample_graph.MINI_ADJACENCY}, listed=False,
    ),
}


def get_dataset(key: str) -> dict:
    """Return a dataset by key. Raises KeyError for unknown keys."""
    return DATASETS[key]


def edge_list(adjacency: dict) -> list:
    return [[u, v] for u, v in iterate_edges(adjacency)]
