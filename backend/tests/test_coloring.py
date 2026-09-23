"""
Algorithm tests (standard library only).

Run from the backend folder:
    python -m unittest discover -s tests -v
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from algorithms.coloring import (  # noqa: E402
    find_conflicts,
    graph_statistics,
    greedy_coloring,
    greedy_coloring_with_steps,
    is_valid_coloring,
    validate_graph,
)
from data import DATASETS  # noqa: E402


def complete_graph(n):
    names = [f"V{i}" for i in range(n)]
    return {v: [u for u in names if u != v] for v in names}


class GreedyColoringTests(unittest.TestCase):
    def test_empty_graph(self):
        result = greedy_coloring_with_steps({})
        self.assertEqual(result["coloring"], {})
        self.assertEqual(result["steps"], [])
        self.assertEqual(result["colors_used"], 0)
        self.assertTrue(is_valid_coloring({}, {}))

    def test_single_vertex(self):
        graph = {"A": []}
        self.assertEqual(greedy_coloring(graph), {"A": 1})
        self.assertTrue(is_valid_coloring(graph, greedy_coloring(graph)))

    def test_two_connected_vertices(self):
        graph = {"A": ["B"], "B": ["A"]}
        coloring = greedy_coloring(graph)
        self.assertEqual(coloring, {"A": 1, "B": 2})
        self.assertTrue(is_valid_coloring(graph, coloring))

    def test_triangle_needs_three_colors(self):
        graph = {"A": ["B", "C"], "B": ["A", "C"], "C": ["A", "B"]}
        coloring = greedy_coloring(graph)
        self.assertEqual(len(set(coloring.values())), 3)
        self.assertTrue(is_valid_coloring(graph, coloring))

    def test_complete_graphs_need_n_colors(self):
        for n in range(1, 8):
            graph = complete_graph(n)
            coloring = greedy_coloring(graph)
            self.assertEqual(max(coloring.values()), n)
            self.assertTrue(is_valid_coloring(graph, coloring))

    def test_all_datasets_are_valid_graphs_and_colorings(self):
        for key, dataset in DATASETS.items():
            graph = dataset["adjacency"]
            validate_graph(graph)
            for strategy in ("natural", "largest_first"):
                result = greedy_coloring_with_steps(graph, strategy)
                self.assertTrue(is_valid_coloring(graph, result["coloring"]), key)
                self.assertEqual(len(result["steps"]), len(graph))
                # The Δ + 1 upper bound must always hold.
                self.assertLessEqual(result["colors_used"],
                                     graph_statistics(graph)["greedy_upper_bound"])

    def test_steps_match_plain_algorithm(self):
        graph = DATASETS["india"]["adjacency"]
        traced = greedy_coloring_with_steps(graph)
        self.assertEqual(traced["coloring"], greedy_coloring(graph))
        for step in traced["steps"]:
            # The assigned color is the smallest color not used by neighbors.
            self.assertNotIn(step["assigned_color"], step["used_colors"])
            self.assertEqual(step["assigned_color"], step["available_colors"][0])
            self.assertEqual(step["rejected_colors"],
                             list(range(1, step["assigned_color"])))

    def test_mini_tutorial_graph_walkthrough(self):
        result = greedy_coloring_with_steps(DATASETS["mini"]["adjacency"])
        self.assertEqual(result["coloring"], {"A": 1, "B": 2, "C": 2, "D": 1, "E": 3})

    def test_india_uses_at_most_four_colors(self):
        # India is a planar map, so four colors always suffice (Four Color Theorem).
        result = greedy_coloring_with_steps(DATASETS["india"]["adjacency"])
        self.assertLessEqual(result["colors_used"], 4)


class ConflictDetectionTests(unittest.TestCase):
    def test_detects_conflict(self):
        graph = {"A": ["B"], "B": ["A", "C"], "C": ["B"]}
        coloring = {"A": 1, "B": 1, "C": 2}
        conflicts = find_conflicts(graph, coloring)
        self.assertEqual(conflicts, [{"region_a": "A", "region_b": "B", "color": 1}])
        self.assertFalse(is_valid_coloring(graph, coloring))

    def test_uncolored_vertex_is_invalid(self):
        graph = {"A": ["B"], "B": ["A"]}
        self.assertFalse(is_valid_coloring(graph, {"A": 1}))

    def test_each_edge_reported_once(self):
        graph = complete_graph(4)
        coloring = {v: 1 for v in graph}
        self.assertEqual(len(find_conflicts(graph, coloring)), 6)

    def test_validate_graph_rejects_directed_edge(self):
        with self.assertRaises(ValueError):
            validate_graph({"A": ["B"], "B": []})


if __name__ == "__main__":
    unittest.main()
