"""
Dataset registry. Every graph the application can show is defined in this
package and nowhere else.
"""

from algorithms.chromatic import chromatic_number
from algorithms.coloring import iterate_edges, validate_graph

from . import classic_graphs, india_map, sample_graph


def _dataset(key, name, kind, description, adjacency, layout, *, graph_type,
             characteristics=(), labels=None, names=None, listed=True):
    # Fail fast at startup if a dataset is not a valid undirected graph.
    validate_graph(adjacency)
    return {
        "key": key,
        "name": name,
        "kind": kind,
        "graph_type": graph_type,
        "description": description,
        "characteristics": list(characteristics),
        "adjacency": adjacency,
        "layout": {v: {"x": x, "y": y} for v, (x, y) in layout.items()},
        "labels": labels or {v: v for v in adjacency},
        "names": names or {v: v for v in adjacency},
        # Computed once per process: the datasets never change at runtime.
        "chromatic": chromatic_number(adjacency),
        "listed": listed,
    }


DATASETS = {
    india_map.KEY: _dataset(
        india_map.KEY, india_map.NAME, india_map.KIND, india_map.DESCRIPTION,
        india_map.ADJACENCY, india_map.LAYOUT,
        graph_type=india_map.GRAPH_TYPE, characteristics=india_map.CHARACTERISTICS,
        labels=india_map.LABELS, names=india_map.NAMES,
    ),
    sample_graph.KEY: _dataset(
        sample_graph.KEY, sample_graph.NAME, sample_graph.KIND, sample_graph.DESCRIPTION,
        sample_graph.ADJACENCY, sample_graph.LAYOUT,
        graph_type=sample_graph.GRAPH_TYPE, characteristics=sample_graph.CHARACTERISTICS,
    ),
    **{
        g["key"]: _dataset(
            g["key"], g["name"], "graph", g["description"], g["adjacency"], g["layout"],
            graph_type=g["graph_type"], characteristics=g["characteristics"],
        )
        for g in classic_graphs.ALL
    },
    # Used by the tutorial page only, so it is hidden from the dataset menu.
    sample_graph.MINI_KEY: _dataset(
        sample_graph.MINI_KEY, sample_graph.MINI_NAME, "graph", sample_graph.MINI_DESCRIPTION,
        sample_graph.MINI_ADJACENCY, sample_graph.MINI_LAYOUT,
        graph_type=sample_graph.MINI_GRAPH_TYPE, listed=False,
    ),
}


def get_dataset(key: str) -> dict:
    """Return a dataset by key. Raises KeyError for unknown keys."""
    return DATASETS[key]


def edge_list(adjacency: dict) -> list:
    return [[u, v] for u, v in iterate_edges(adjacency)]
