"""
Tests for DSATUR, Welsh–Powell, and the exact chromatic number
(standard library only).

Run from the backend folder:
    python -m unittest discover -s tests -v
"""

import itertools
import os
import random
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from algorithms import chromatic  # noqa: E402
from algorithms.chromatic import chromatic_number, greedy_clique  # noqa: E402
from algorithms.coloring import (  # noqa: E402
    greedy_coloring,
    greedy_coloring_with_steps,
    is_valid_coloring,
    vertex_order,
)
from algorithms.variants import compare_algorithms, dsatur_coloring, welsh_powell_coloring  # noqa: E402
from data import DATASETS  # noqa: E402


def random_graph(n, p, seed):
    rng = random.Random(seed)
    graph = {f"v{i}": [] for i in range(n)}
    for i, j in itertools.combinations(range(n), 2):
        if rng.random() < p:
            graph[f"v{i}"].append(f"v{j}")
            graph[f"v{j}"].append(f"v{i}")
    return graph


def cycle(n):
    ids = [f"c{i}" for i in range(n)]
    return {v: [ids[(i - 1) % n], ids[(i + 1) % n]] for i, v in enumerate(ids)}


def brute_force_chromatic(graph):
    """Try every assignment of k colors, for k = 1, 2, ... (tiny graphs only)."""
    vertices = list(graph)
    if not vertices:
        return 0
    for k in range(1, len(vertices) + 1):
        for colors in itertools.product(range(k), repeat=len(vertices)):
            coloring = dict(zip(vertices, colors))
            if all(coloring[u] != coloring[v] for u in graph for v in graph[u]):
                return k
    return len(vertices)


PETERSEN = {
    0: [1, 4, 5], 1: [0, 2, 6], 2: [1, 3, 7], 3: [2, 4, 8], 4: [3, 0, 9],
    5: [0, 7, 8], 6: [1, 8, 9], 7: [2, 5, 9], 8: [3, 5, 6], 9: [4, 6, 7],
}


class WelshPowellTests(unittest.TestCase):
    def test_equals_greedy_in_largest_first_order(self):
        graphs = [d["adjacency"] for d in DATASETS.values()]
        graphs += [random_graph(12, 0.35, seed) for seed in range(40)]
        for graph in graphs:
            expected = greedy_coloring(graph, vertex_order(graph, "largest_first"))
            self.assertEqual(welsh_powell_coloring(graph)["coloring"], expected)

    def test_order_is_by_degree(self):
        graph = DATASETS["india"]["adjacency"]
        order = welsh_powell_coloring(graph)["order"]
        degrees = [len(graph[v]) for v in order]
        self.assertEqual(degrees, sorted(degrees, reverse=True))
        self.assertEqual(order[0], "IN-UP")  # Uttar Pradesh has the most neighbors


class DsaturTests(unittest.TestCase):
    def test_valid_on_random_graphs(self):
        for seed in range(60):
            graph = random_graph(14, 0.3, seed)
            self.assertTrue(is_valid_coloring(graph, dsatur_coloring(graph)["coloring"]))

    def test_bipartite_graphs_get_two_colors(self):
        self.assertEqual(dsatur_coloring(DATASETS["bipartite"]["adjacency"])["colors_used"], 2)
        self.assertEqual(dsatur_coloring(cycle(10))["colors_used"], 2)

    def test_traced_dsatur_matches_plain_dsatur(self):
        for graph in [DATASETS["india"]["adjacency"], random_graph(15, 0.3, 7)]:
            traced = greedy_coloring_with_steps(graph, "dsatur")
            plain = dsatur_coloring(graph)
            self.assertEqual(traced["coloring"], plain["coloring"])
            self.assertEqual(traced["order"], plain["order"])

    def test_every_dsatur_step_picks_a_most_saturated_vertex(self):
        graph = DATASETS["india"]["adjacency"]
        steps = greedy_coloring_with_steps(graph, "dsatur")["steps"]
        colored = {}
        for step in steps:
            def saturation(v):
                return len({colored[n] for n in graph[v] if n in colored})
            best = max(saturation(v) for v in graph if v not in colored)
            self.assertEqual(step["saturation"], best)
            colored[step["vertex"]] = step["assigned_color"]


class GreedyWeaknessTests(unittest.TestCase):
    """The crown graph shows that greedy is not always optimal."""

    def test_crown_graph(self):
        graph = DATASETS["bipartite"]["adjacency"]
        self.assertEqual(max(greedy_coloring(graph).values()), 4)
        self.assertEqual(DATASETS["bipartite"]["chromatic"]["value"], 2)
        results = {r["key"]: r for r in compare_algorithms(graph)}
        self.assertEqual(results["greedy"]["colors_used"], 4)
        self.assertEqual(results["welsh_powell"]["colors_used"], 4)
        self.assertEqual(results["dsatur"]["colors_used"], 2)
        for r in results.values():
            self.assertTrue(r["valid"])
            self.assertEqual(r["conflicts"], 0)
            self.assertGreater(r["execution_ms"], 0)


class ChromaticNumberTests(unittest.TestCase):
    def test_known_values(self):
        self.assertEqual(chromatic_number({})["value"], 0)
        self.assertEqual(chromatic_number({"A": []})["value"], 1)
        self.assertEqual(chromatic_number(cycle(6))["value"], 2)
        self.assertEqual(chromatic_number(cycle(7))["value"], 3)
        self.assertEqual(chromatic_number(PETERSEN)["value"], 3)
        expected = {"india": 4, "sample": 4, "triangle": 3, "cycle": 3, "complete": 5, "bipartite": 2, "mini": 3}
        for key, value in expected.items():
            info = DATASETS[key]["chromatic"]
            self.assertTrue(info["exact"], key)
            self.assertEqual(info["value"], value, key)

    def test_matches_brute_force_on_small_random_graphs(self):
        for seed in range(80):
            graph = random_graph(7, 0.45, seed)
            info = chromatic_number(graph)
            self.assertTrue(info["exact"])
            self.assertEqual(info["value"], brute_force_chromatic(graph), seed)

    def test_bounds_are_consistent(self):
        for seed in range(30):
            graph = random_graph(18, 0.4, seed)
            info = chromatic_number(graph)
            clique = greedy_clique(graph)
            for u, v in itertools.combinations(clique, 2):
                self.assertIn(v, graph[u])  # really a clique
            self.assertLessEqual(info["lower_bound"], info["upper_bound"])
            self.assertLessEqual(info["upper_bound"], max(greedy_coloring(graph).values()))

    def test_reports_unknown_when_budget_runs_out(self):
        graph = random_graph(40, 0.5, 3)
        with mock.patch.object(chromatic, "NODE_BUDGET", 5):
            info = chromatic_number(graph)
        if info["lower_bound"] < info["upper_bound"]:
            self.assertIsNone(info["value"])
            self.assertFalse(info["exact"])
            self.assertIn("bounds", info["method"])


class StepMessageTests(unittest.TestCase):
    def test_messages_use_display_names(self):
        dataset = DATASETS["india"]
        steps = greedy_coloring_with_steps(dataset["adjacency"], "natural", dataset["names"])["steps"]
        self.assertIn("Jammu and Kashmir", steps[0]["message"])
        self.assertIn("Jammu and Kashmir", steps[0]["selection"])
        for step in steps:
            self.assertNotIn("IN-", step["message"])
            self.assertEqual(step["saturation"], len(step["used_colors"]))


if __name__ == "__main__":
    unittest.main()
