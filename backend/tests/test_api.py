"""
HTTP tests: start the real FastAPI app with uvicorn on a free local port and
call every endpoint over HTTP (standard library + uvicorn only).

Run from the backend folder:
    python -m unittest discover -s tests -v
"""

import json
import os
import socket
import sys
import threading
import time
import unittest
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uvicorn  # noqa: E402

from main import app  # noqa: E402


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        port = free_port()
        cls.base = f"http://127.0.0.1:{port}"
        config = uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning")
        cls.server = uvicorn.Server(config)
        cls.thread = threading.Thread(target=cls.server.run, daemon=True)
        cls.thread.start()
        for _ in range(100):
            if cls.server.started:
                break
            time.sleep(0.05)

    @classmethod
    def tearDownClass(cls):
        cls.server.should_exit = True
        cls.thread.join(timeout=5)

    def call(self, path, body=None):
        request = urllib.request.Request(
            self.base + path,
            data=json.dumps(body).encode() if body is not None else None,
            headers={"Content-Type": "application/json"} if body is not None else {},
            method="POST" if body is not None else "GET",
        )
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                return response.status, json.loads(response.read())
        except urllib.error.HTTPError as error:
            return error.code, json.loads(error.read())

    # ---- GET endpoints ----
    def test_health(self):
        status, body = self.call("/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(body["status"], "ok")

    def test_datasets(self):
        status, body = self.call("/api/datasets")
        self.assertEqual(status, 200)
        keys = [d["key"] for d in body]
        self.assertEqual(keys, ["india", "sample", "triangle", "cycle", "complete", "bipartite"])
        k5 = next(d for d in body if d["key"] == "complete")
        self.assertEqual((k5["vertices"], k5["edges"], k5["chromatic_number"]), (5, 10, 5))

    def test_graph(self):
        status, body = self.call("/api/graph/india")
        self.assertEqual(status, 200)
        self.assertEqual(len(body["vertices"]), 31)
        self.assertEqual(len(body["edges"]), 60)
        self.assertEqual(body["names"]["IN-MH"], "Maharashtra")
        self.assertEqual(body["labels"]["IN-MH"], "MH")
        self.assertEqual(body["statistics"]["max_degree"], 9)
        self.assertEqual(body["chromatic"]["value"], 4)

    def test_unknown_dataset_is_404_with_explanation(self):
        status, body = self.call("/api/graph/atlantis")
        self.assertEqual(status, 404)
        self.assertIn("does not exist", body["detail"])

    # ---- POST /api/color ----
    def test_color_every_dataset_and_strategy(self):
        for key in ["india", "sample", "triangle", "cycle", "complete", "bipartite"]:
            for strategy in ["natural", "largest_first", "dsatur"]:
                status, body = self.call("/api/color", {"dataset": key, "strategy": strategy})
                self.assertEqual(status, 200, (key, strategy))
                self.assertTrue(body["valid"])
                self.assertEqual(body["conflicts"], [])
                self.assertEqual(len(body["steps"]), len(body["coloring"]))

    def test_color_custom_graph(self):
        graph = {"a": ["b", "c"], "b": ["a", "c"], "c": ["a", "b"], "d": []}
        status, body = self.call("/api/color", {"graph": graph, "names": {"a": "Maths"}})
        self.assertEqual(status, 200)
        self.assertEqual(body["dataset"], "custom")
        self.assertEqual(body["colors_used"], 3)
        self.assertIn("Maths", body["steps"][0]["message"])

    def test_invalid_graphs_are_rejected_with_422(self):
        cases = {
            "self-loop": {"a": ["a"]},
            "one-way edge": {"a": ["b"], "b": []},
            "unknown vertex": {"a": ["z"]},
            "duplicate edge": {"a": ["b", "b"], "b": ["a", "a"]},
            "empty graph": {},
            "bad id": {"a b": []},
        }
        for label, graph in cases.items():
            status, body = self.call("/api/color", {"graph": graph})
            self.assertEqual(status, 422, label)
            self.assertIn("detail", body, label)

    def test_too_large_graph_is_rejected(self):
        graph = {f"v{i}": [] for i in range(61)}
        status, _ = self.call("/api/analyze", {"graph": graph})
        self.assertEqual(status, 422)

    def test_source_must_be_exactly_one(self):
        self.assertEqual(self.call("/api/color", {})[0], 422)
        self.assertEqual(self.call("/api/color", {"dataset": "india", "graph": {"a": []}})[0], 422)
        self.assertEqual(self.call("/api/color", {"dataset": "india", "strategy": "random"})[0], 422)

    # ---- POST /api/conflicts ----
    def test_conflicts(self):
        _, colored = self.call("/api/color", {"dataset": "india"})
        coloring = dict(colored["coloring"])
        status, body = self.call("/api/conflicts", {"dataset": "india", "coloring": coloring})
        self.assertEqual(status, 200)
        self.assertTrue(body["valid"])
        self.assertEqual(body["checked_edges"], 60)

        coloring["IN-GA"] = coloring["IN-MH"]  # Goa borders Maharashtra
        _, body = self.call("/api/conflicts", {"dataset": "india", "coloring": coloring})
        self.assertFalse(body["valid"])
        self.assertIn("IN-GA", body["conflicting_vertices"])
        self.assertIn("IN-MH", body["conflicting_vertices"])

    def test_conflicts_rejects_unknown_vertices(self):
        status, body = self.call("/api/conflicts", {"dataset": "triangle", "coloring": {"Z": 1}})
        self.assertEqual(status, 422)
        self.assertIn("Z", body["detail"])

    # ---- POST /api/analyze and /api/compare ----
    def test_analyze_custom_graph(self):
        graph = {"v1": ["v2"], "v2": ["v1"]}
        status, body = self.call("/api/analyze", {
            "graph": graph,
            "names": {"v1": "Exam Hall", "v2": "Physics"},
            "layout": {"v1": {"x": 10, "y": 20}},
        })
        self.assertEqual(status, 200)
        self.assertEqual(body["key"], "custom")
        self.assertEqual(body["labels"], {"v1": "EH", "v2": "Phy"})
        self.assertEqual(body["layout"]["v1"], {"x": 10, "y": 20})
        self.assertIn("v2", body["layout"])
        self.assertEqual(body["chromatic"]["value"], 2)

    def test_compare(self):
        status, body = self.call("/api/compare", {"dataset": "bipartite"})
        self.assertEqual(status, 200)
        colors = {r["key"]: r["colors_used"] for r in body["results"]}
        self.assertEqual(colors, {"greedy": 4, "welsh_powell": 4, "dsatur": 2})
        self.assertEqual(body["chromatic"]["value"], 2)

    def test_cors_preflight(self):
        request = urllib.request.Request(self.base + "/api/color", method="OPTIONS", headers={
            "Origin": "https://example.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        })
        with urllib.request.urlopen(request, timeout=5) as response:
            self.assertEqual(response.status, 200)
            self.assertIn(response.headers["access-control-allow-origin"], ("*", "https://example.com"))


if __name__ == "__main__":
    unittest.main()
