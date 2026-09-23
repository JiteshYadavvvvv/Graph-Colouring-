# Interactive Map Coloring System Using Graph Coloring

An interactive DSA visualization that colors a map of Indian states with the **Greedy Graph Coloring** algorithm. The algorithm runs in Python on a FastAPI backend and records every decision it makes. The React frontend replays those recorded decisions one step at a time, so you watch the algorithm's actual reasoning rather than a scripted animation.

```
Region  → Vertex
Border  → Edge
Color   → Label assigned to a vertex (1, 2, 3, …)
```

---

## Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Graph Representation](#graph-representation)
6. [Algorithm](#algorithm)
7. [Pseudocode](#pseudocode)
8. [Worked Example](#worked-example)
9. [Complexity](#complexity)
10. [API Documentation](#api-documentation)
11. [Installation](#installation)
12. [Testing](#testing)
13. [Project Structure](#project-structure)
14. [DSA Viva Questions](#dsa-viva-questions)
15. [Recommended PPT Screenshots](#recommended-ppt-screenshots)
16. [Limitations](#limitations)

---

## Project Overview

**Map coloring** asks for a color for each region of a map so that no two regions sharing a border get the same color. If each region is a *vertex* and each shared border is an *edge*, map coloring becomes **graph vertex coloring**.

This project:

* stores **31 Indian regions** (28 states plus Jammu and Kashmir, Ladakh and Delhi; 60 shared land borders) as an adjacency list on the backend,
* runs a hand-written **greedy coloring** algorithm that records every step,
* animates those steps on a **geographically accurate SVG map of India** (real state boundaries, stored locally) and on a draggable node-link graph, side by side if you like,
* checks the result with a separate **conflict detector** endpoint,
* includes a clearly labeled **debug feature** that injects a conflict, so you can show that the detector actually works.

A second, abstract dataset (a 6-vertex wheel graph) shows that the same algorithm works on any graph, not just maps.

## Features

| Area | What it does |
|---|---|
| **Home dashboard** | Hero section, the three-step idea (Model → Color → Verify), dataset picker |
| **Graph view** | Draggable SVG node-link graph, click-to-inspect vertex card (degree + neighbors), neighbor/edge highlighting, adjacency list as a tree or a table with a filter |
| **Map view** | Real India state/UT boundaries (local SVG, no map service) with hover tooltips (name, degree, color), click/keyboard selection, leader-line labels for small states, an optional overlay of the graph edges, and a **Map / Graph / Split** switch that shows the map and graph in sync |
| **Algorithm replay** | Each backend step is replayed in 4 phases: *select vertex → check neighbors → find smallest color → assign*. Only the edges being checked animate; the chosen color spreads through the region and a soft halo fades out. Includes a step counter, progress bar, pseudocode with the current line highlighted, and a vertical algorithm timeline |
| **Controls** | Run, Pause/Resume (continues from the same phase), Step (one phase at a time), Finish (skip to the end), Reset, speed (Slow / Normal / Fast / Instant = 1800 / 1100 / 500 / 100 ms per phase), vertex-order choice (natural or largest-degree-first / Welsh–Powell). Keyboard shortcuts on the Map and Graph pages: **Space** run / pause / resume, **→** step, **F** finish, **R** reset |
| **Results** | Completion summary with animated counters (regions, colors used, conflicts) and the verdict from the backend verifier, a table sortable by order/region/degree/color, color classes (independent sets), final map preview |
| **Conflict detection** | `POST /api/conflicts` checks every edge; conflicting regions get a red outline and a short, controlled pulse on the map and the graph, and the conflicting edge turns red; the raw JSON response is shown |
| **Simulate conflict** | *DEMO / DEBUG FEATURE*: copies a neighbor's color onto one vertex **in the browser only**, then asks the backend to detect the conflict |
| **How It Works** | Vertex/Edge/Color concept cards, plus a 5-vertex tutorial graph animated from real backend steps, with Back/Next/Play controls |
| **Statistics** | V, E, colors, conflicts, max/avg degree, the complexity explanation, measured operation counts, a degree bar chart, and a comparison of natural vs. largest-first ordering |
| **Quality** | Error, loading, and empty states; keyboard focus styles; ARIA labels; `prefers-reduced-motion` support; responsive from 390 px phones to 1920 px projectors; works fully offline |

## Tech Stack

**Backend:** Python 3.10+ (3.12 on Vercel), FastAPI, Uvicorn, Pydantic. The coloring algorithm uses no graph library (no NetworkX).

**Frontend:** React 18, Vite 8, plain JavaScript, native SVG, plain CSS, `framer-motion` (animation), `lucide-react` (icons). There is no CSS framework and nothing is loaded from a CDN. All fonts are system fonts.

## Architecture

```
┌───────────────────────── Browser (React + Vite) ─────────────────────────┐
│  views/*  ──uses──►  hooks/useColoring.js  ──calls──►  api/client.js      │
│     │                  (state + playback clock)             │  fetch /api │
│     └── visualization/GraphSVG.jsx, IndiaMapSVG.jsx          │             │
└──────────────────────────────────────────────────────────────┼────────────┘
                                   Vite dev proxy /api → :8000 │
┌──────────────────────────── FastAPI (Python) ────────────────▼────────────┐
│  main.py  ── routes ──►  algorithms/coloring.py  (greedy, verify, stats)  │
│                   └──►  data/india_map.py, data/sample_graph.py (graphs)  │
└───────────────────────────────────────────────────────────────────────────┘
```

Data flow:

```
Dataset (Python) → GET /api/graph/{dataset} → React renders the graph
User clicks Run  → POST /api/color → greedy_coloring_with_steps() → coloring + steps
React replays the steps one phase at a time → map, graph, and timeline update
Animation ends   → POST /api/conflicts → verdict banner
```

**Single source of truth:** adjacency lists exist only in `backend/data/`. The frontend never stores its own copy. `frontend/src/data/indiaGeometry.js` contains only drawing geometry (SVG paths), keyed by state code (`MH`, `GJ`, …), which is joined to the backend graph through `graph.labels`.

**Map geometry.** The boundaries come from GIS data ([udit-001/india-maps-data](https://github.com/udit-001/india-maps-data), district GeoJSON), processed once at development time by `tools/build_india_map.py`: districts are dissolved into states, projected with a Lambert Conformal Conic projection, simplified together (so neighbors keep an identical shared border), and written to `indiaGeometry.js`. The same script measures every shared land border, and the backend adjacency list was checked against it. The app never downloads map data at runtime.

**The frontend never computes colors.** `utils/helpers.js → coloringAtCursor()` rebuilds the visible coloring from `steps[i].assigned_color` values returned by the backend.

## Graph Representation

The graph is an **adjacency list**, a Python `dict` that maps each vertex to its list of neighbors:

```python
ADJACENCY = {
    "Goa":         ["Maharashtra", "Karnataka"],
    "Maharashtra": ["Gujarat", "Madhya Pradesh", "Chhattisgarh", "Telangana", "Karnataka", "Goa"],
    ...
}
```

The graph is undirected: if `B` is in `graph[A]`, then `A` is in `graph[B]`. `validate_graph()` enforces this, rejects self-loops and unknown vertices, and runs when the server starts.

| Dataset | V | E | Max degree Δ | Colors (greedy) |
|---|---|---|---|---|
| Indian States | 31 | 60 | 9 (Uttar Pradesh) | 4 |
| Sample Graph (wheel W₅) | 6 | 10 | 5 (C) | 4 (optimal) |
| Mini tutorial graph | 5 | 6 | 3 | 3 |

## Algorithm

**Greedy coloring** visits the vertices one at a time in a fixed order. For each vertex, it looks at the neighbors that are already colored and gives the vertex the **smallest color number that none of those neighbors uses**.

* It always produces a **valid** coloring, because the chosen color is never one of the neighbors' colors.
* It uses **at most Δ + 1 colors**. A vertex has at most Δ neighbors, so at most Δ colors can be blocked, and one of 1…Δ+1 is always free.
* It is **not always optimal**. The result depends on the vertex order.

Two orders are supported:

* `natural`: the order in which the dataset lists the vertices.
* `largest_first`: highest degree first (the **Welsh–Powell** order).

## Pseudocode

```
GREEDY-COLORING(G, order):
    color ← empty map
    for each vertex v in order:
        used ← { color[u] : u ∈ Adj[v] and u is already colored }
        c ← 1
        while c ∈ used:
            c ← c + 1
        color[v] ← c
    return color

IS-VALID(G, color):
    for each edge (u, v) in G:
        if color[u] = color[v]: return false
    return true
```

The Python implementation (`backend/algorithms/coloring.py`) follows this line for line, with comments aimed at DSA understanding.

## Worked Example

Tutorial graph (`dataset = "mini"`), edges A–B, A–C, B–D, C–D, C–E, D–E:

```
A — B
|   |
C — D
 \ /
  E
```

| Step | Vertex | Colored neighbors | Blocked colors | Assigned |
|---|---|---|---|---|
| 1 | A | none | none | **1** |
| 2 | B | A=1 | 1 | **2** |
| 3 | C | A=1 | 1 | **2** |
| 4 | D | B=2, C=2 | 2 | **1** |
| 5 | E | C=2, D=1 | 1, 2 | **3** |

Result: 3 colors. C, D, and E form a triangle, so 3 is the minimum possible, and greedy is optimal here. The test `test_mini_tutorial_graph_walkthrough` checks these exact values, and the How It Works page animates them from the backend's response.

## Complexity

Let **V** = number of vertices, **E** = number of edges, and **C** = number of colors in use.

| | Cost | Why |
|---|---|---|
| Collect neighbor colors | O(V + E) | every vertex visited once, every adjacency entry (2E total) read once |
| Find smallest free color | O(V + E) total | at most deg(v)+1 tries per vertex (hash-set lookups) |
| List available colors (for the visualization) | O(V · C) | the step recorder lists every free color from 1…C+1 |
| **Total (implemented, with step recording)** | **O(V + E + V·C)** | |
| Plain `greedy_coloring()` without step recording | O(V + E) | |
| Largest-first ordering | + O(V log V) | sorting by degree |
| Conflict detection | O(V + E) | each edge checked once |
| **Space** | **O(V + E)** | adjacency list V + 2E entries; coloring O(V); steps O(V + E) |

Because C ≤ Δ + 1, the V·C term is at most V(Δ + 1). The Statistics page shows measured counts. For India, it reports 120 neighbor checks (= 2E) and 62 candidate-color tests.

## API Documentation

Base URL: `http://127.0.0.1:8000`. Interactive docs: `http://127.0.0.1:8000/docs`.

### `GET /api/health`
```json
{ "status": "ok", "service": "coloring-engine", "datasets": 3 }
```

### `GET /api/datasets`
Lists the selectable datasets.
```json
[{ "key": "india", "name": "Indian States", "kind": "map", "description": "...", "vertices": 31, "edges": 60 },
 { "key": "sample", "name": "Sample Graph", "kind": "graph", "description": "...", "vertices": 6, "edges": 10 }]
```

### `GET /api/graph/{dataset}`
`dataset` ∈ `india`, `sample`, `mini`. Unknown keys return **404** with a readable `detail`.
```json
{
  "key": "india", "name": "Indian States", "kind": "map", "description": "...",
  "vertices": ["Jammu and Kashmir", "..."],
  "edges": [["Jammu and Kashmir", "Ladakh"], "..."],
  "adjacency": { "Punjab": ["Jammu and Kashmir", "Himachal Pradesh", "Haryana", "Rajasthan"], "...": [] },
  "layout": { "Punjab": { "x": 170, "y": 155 } },
  "labels": { "Punjab": "PB" },
  "statistics": { "vertices": 31, "edges": 60, "max_degree": 9, "min_degree": 1,
                  "average_degree": 3.87, "density": 0.129, "greedy_upper_bound": 10, "degrees": {} }
}
```

### `POST /api/color`
Request:
```json
{ "dataset": "india", "strategy": "natural" }
```
`strategy` is `natural` (default) or `largest_first`. Other values return **422**.

Response (abridged):
```json
{
  "dataset": "india", "strategy": "natural", "strategy_label": "Natural order (vertices in dataset order)",
  "coloring": { "Jammu and Kashmir": 1, "Ladakh": 2, "...": 0 },
  "colors_used": 4,
  "order": ["Jammu and Kashmir", "Ladakh", "..."],
  "steps": [{
    "step": 18, "vertex": "Maharashtra", "degree": 6,
    "neighbors": ["Gujarat", "Madhya Pradesh", "Chhattisgarh", "Telangana", "Karnataka", "Goa"],
    "neighbor_colors": { "Gujarat": 1, "Madhya Pradesh": 2, "Chhattisgarh": 3 },
    "uncolored_neighbors": ["Telangana", "Karnataka", "Goa"],
    "used_colors": [1, 2, 3], "rejected_colors": [1, 2, 3], "available_colors": [4, 5],
    "assigned_color": 4, "is_new_color": false, "colors_in_use": 4,
    "message": "Neighbors block Color 1, 2, 3. Smallest available color is 4."
  }],
  "valid": true, "conflicts": [],
  "statistics": { "colors_used": 4, "conflicts": 0, "time_complexity": "O(V + E + V·C)",
                  "space_complexity": "O(V + E)", "neighbor_checks": 120, "color_checks": 62,
                  "execution_ms": 0.11, "...": "graph statistics as above" }
}
```

### `POST /api/conflicts`
Request (send **either** `dataset` **or** a custom `graph`, plus the `coloring`):
```json
{ "dataset": "india", "coloring": { "Punjab": 1, "Haryana": 1 } }
```
Response:
```json
{
  "valid": false,
  "conflicts": [{ "region_a": "Punjab", "region_b": "Haryana", "color": 1 }],
  "conflicting_vertices": ["Haryana", "Punjab"],
  "uncolored": ["Himachal Pradesh", "..."],
  "checked_edges": 60
}
```
A custom `graph` that is not undirected, or a coloring that names unknown vertices, returns **422** with an explanation. Any unexpected server error returns **500** with a short JSON `detail` and never a stack trace.

## Installation

Requirements: **Python 3.10+** and **Node.js 18+**. After the first install, no internet connection is needed.

### Backend (Linux / macOS)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Backend (Windows, PowerShell)
```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```
(If PowerShell blocks the activation script, use `venv\Scripts\activate.bat` in Command Prompt instead.)

The API runs on **http://127.0.0.1:8000**.

### Frontend (all platforms, in a second terminal)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**. Vite forwards every `/api` request to port 8000, so you don't need any CORS or URL setup.

Optional settings:
* `API_TARGET=http://host:port npm run dev` points the dev proxy at a different backend.
* `VITE_API_URL=http://host:port` makes the browser call that backend directly (the backend already allows CORS).
* `npm run build && npm run preview` serves a production build on port 4173, using the same proxy.

### Deploying the backend on Vercel

The backend is a plain FastAPI app that Vercel imports as `main:app` (no uvicorn on Vercel). Create a **separate Vercel project** for it:

* **Root Directory:** `backend` (Project Settings → Build and Deployment). This setting cannot live in `vercel.json`.
* **Framework Preset:** FastAPI. `backend/vercel.json` sets `"framework": "fastapi"`, which overrides the dashboard, so a project that was auto-detected as *Services* (because the repository root holds both `frontend/` and `backend/`) builds correctly.
* **Python:** 3.12 (`backend/.python-version`). Dependencies come from `backend/requirements.txt`.
* **Environment variable (optional):** `FRONTEND_URL` = the deployed frontend's origin, e.g. `https://your-frontend.vercel.app` (comma-separate several). When set, only those origins may call the API from a browser; when unset, any origin may (the API is public and read-only).
* After deploying, the API lives at `https://<backend-project>.vercel.app/api/...`; `/docs` shows the interactive API docs. Use `https://<backend-project>.vercel.app` (no `/api`) as the frontend's `VITE_API_URL`.

### Deploying the frontend (Vercel, Netlify, …)

* **Root directory:** `frontend` · **Install:** `npm install` (or `npm ci`) · **Build:** `npm run build` · **Output:** `dist`. No `--force` / `--legacy-peer-deps` flags are needed.
* **Node:** `^20.19.0 || >=22.12.0` (required by Vite 8; declared in `package.json` → `engines`).
* **`VITE_API_URL`** is the FastAPI origin used by production builds. It is committed in `frontend/.env.production` (`https://backend-tau-eight-78.vercel.app`, origin only, no `/api`). A `VITE_API_URL` set in the hosting platform's environment variables overrides that file. Vite embeds the value at build time, so **redeploy the frontend after changing it**. If a production build has no value, `vite build` prints a warning and the app would call `/api` on its own host (404).
* `npm run dev` ignores `.env.production`: it calls `/api` on the dev server, which proxies to `http://127.0.0.1:8000`.
* The backend already allows cross-origin requests (CORS), so no backend change is needed.

## Testing

### Algorithm unit tests (standard library only)
```bash
cd backend
python -m unittest discover -s tests -v
```
There are 15 tests: empty graph, single vertex, two connected vertices, triangle, complete graphs K₁–K₇ (n colors), every dataset with both orderings (valid, and ≤ Δ + 1 colors), every vertex having a unique label and a layout position, traced steps matching the plain algorithm, the exact tutorial walkthrough, known India borders, India ≤ 4 colors, conflict detection, each edge reported once, uncolored vertex marked invalid, and a directed edge rejected.

### API smoke test (backend running)
```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/datasets
curl http://127.0.0.1:8000/api/graph/india
curl http://127.0.0.1:8000/api/graph/sample
curl -X POST http://127.0.0.1:8000/api/color -H "Content-Type: application/json" -d '{"dataset":"india"}'
curl -X POST http://127.0.0.1:8000/api/conflicts -H "Content-Type: application/json" \
     -d '{"dataset":"india","coloring":{"Punjab":1,"Haryana":1}}'
```

## Project Structure

```
interactive-map-coloring/
├── backend/
│   ├── main.py                 FastAPI app: 5 endpoints, error handling, CORS
│   ├── requirements.txt        fastapi, pydantic (+ uvicorn for local runs)
│   ├── vercel.json             Vercel: FastAPI preset, excludes tests from the bundle
│   ├── .python-version         3.12 (Vercel runtime)
│   ├── algorithms/coloring.py  greedy_coloring, greedy_coloring_with_steps, is_valid_coloring,
│   │                           find_conflicts, vertex_order (natural / Welsh–Powell), graph_statistics
│   ├── data/__init__.py        dataset registry and startup validation
│   ├── data/india_map.py       31-region adjacency list, state codes, graph layout
│   ├── data/sample_graph.py    6-vertex wheel graph and 5-vertex tutorial graph
│   ├── models/schemas.py       Pydantic request/response models
│   └── tests/test_coloring.py  unit tests
├── tools/build_india_map.py    dev-only: GeoJSON → local SVG geometry + border check (needs shapely)
└── frontend/
    ├── vite.config.js          /api proxy to the backend
    └── src/
        ├── App.jsx             layout, hash-based navigation, page transitions, error/loading states
        ├── api/client.js       the only module that calls fetch (timeouts, friendly errors)
        ├── hooks/useColoring.js    all app state: dataset, result, playback clock, verification
        ├── visualization/GraphSVG.jsx     draggable node-link graph (pointer events)
        ├── visualization/IndiaMapSVG.jsx  map rendering (fills, outlines, labels, fill animation)
        ├── data/indiaGeometry.js          generated state boundaries (SVG paths, label anchors)
        ├── components/         Navbar, Sidebar, Button, StatCard, CountUp, Legend, AdjacencyTable,
        │                       ResultsTable, AlgorithmTimeline, StepPanel, Pseudocode, Segmented,
        │                       VizStage (map / graph / split), ColoringControls, ConflictBanner,
        │                       VertexCard, ColorChip, LoadingState
        ├── views/              Home, GraphView, MapView, ResultsView, ConflictsView,
        │                       HowItWorks, StatisticsView
        ├── utils/constants.js  palette, navigation, phase names, speeds (all animation timings derive from these)
        ├── utils/helpers.js    color lookup, coloringAtCursor (replay), viewBox math
        └── styles/             variables.css (design tokens), globals.css, animations.css
```

## DSA Viva Questions

1. **What is a graph?** A set of vertices V together with a set of edges E, where each edge connects two vertices. Here, states are vertices and shared borders are edges.
2. **What is graph coloring?** Assigning a label (color) to every vertex so that the two endpoints of every edge get different labels.
3. **What is the chromatic number?** χ(G), the minimum number of colors needed for a valid coloring of G. For our wheel graph χ = 4. For any triangle χ = 3.
4. **What is greedy coloring?** Visit the vertices in some order and give each one the smallest color not used by its already-colored neighbors.
5. **Why does greedy coloring work (why is it valid)?** When a vertex is colored, it avoids every color of its colored neighbors. Neighbors colored later avoid its color in turn. So no edge ever connects two vertices of the same color.
6. **Is greedy coloring always optimal?** No. Example: in a *crown graph* (two rows a₁…aₙ and b₁…bₙ, with aᵢ joined to every bⱼ where j ≠ i), the order a₁, b₁, a₂, b₂, … makes greedy use n colors, even though the graph is bipartite and needs only 2.
7. **What is the worst-case number of colors?** Δ + 1, where Δ is the maximum degree. A complete graph Kₙ needs exactly n = Δ + 1.
8. **What is the time complexity?** This implementation is O(V + E + V·C), because it lists the available colors for the visualization. The bare greedy decision is O(V + E). Welsh–Powell adds O(V log V) for sorting.
9. **What is the space complexity?** O(V + E) for the adjacency list, plus O(V) for the coloring.
10. **What is an adjacency list?** For each vertex, a list of its neighbors. It uses V + 2E entries for an undirected graph.
11. **Why use adjacency lists here?** Map graphs are sparse (E is about 2V). An adjacency list uses O(V + E) space, while a matrix uses O(V²). It also lets us visit a vertex's neighbors in O(deg v), which is exactly what greedy needs.
12. **What is the difference between a vertex and an edge?** A vertex is an entity (a region). An edge is a relationship between two vertices (a shared border).
13. **Why can adjacent vertices not have the same color?** That is the definition of a proper coloring. On a map, two neighboring regions with the same color would be indistinguishable at their border.
14. **What is Welsh–Powell?** Greedy coloring with the vertices sorted by degree in descending order, so the most constrained vertices are colored first.
15. **How is Welsh–Powell different from simple greedy?** The coloring rule is the same, and only the order changes. It often, though not always, uses fewer colors, and it guarantees at most max over i of min(dᵢ + 1, i) colors. Try the "Vertex order" selector in the app.
16. **Why is minimum graph coloring computationally difficult?** Deciding whether χ(G) ≤ k is NP-complete for k ≥ 3, and no polynomial-time algorithm is known. That is why fast heuristics like greedy are used in practice.
17. **What happens if the graph is complete?** Every vertex is adjacent to every other one, so greedy (and any algorithm) needs n colors. The unit tests check this for K₁ through K₇.
18. **Can greedy coloring use more colors than necessary?** Yes, with a bad vertex order (see Q6). However, some order always exists for which greedy is optimal: color the vertices class by class following an optimal coloring.
19. **How does this project convert a map into a graph?** Each state is a vertex. Two states get an edge if they share a land border, as listed in `backend/data/india_map.py` (checked against real boundary geometry by `tools/build_india_map.py`). The SVG map is only a drawing, and the adjacency list is the data the algorithm uses.
20. **How does conflict detection work?** `find_conflicts()` walks every edge (u, v) once and reports it if `color[u] == color[v]`. This takes O(V + E). A coloring is valid when there are no conflicts and every vertex has a color.
21. **What is the Four Color Theorem?** Every planar map can be colored with at most 4 colors. Our India map is planar, and greedy used exactly 4 colors.
22. **What is an independent set, and how does it relate to coloring?** A set of vertices with no edges between them. Each color class of a valid coloring is an independent set, as shown on the Results page.

## Recommended PPT Screenshots

| # | Screen | How to get it | What it demonstrates |
|---|---|---|---|
| 1 | **Home dashboard** | Open the app | The project's purpose and the Model → Color → Verify pipeline |
| 2 | **Interactive graph + adjacency list** | Graph page → click *Maharashtra* | Region = vertex, border = edge, degree, and the adjacency list served by the backend |
| 3 | **Algorithm running** | Map page → *Split* view → speed *Slow* → Run → Pause on a step with several colored neighbors (e.g. step 18, Maharashtra: neighbors use colors 1, 2, 3, so it gets 4) | The algorithm's reasoning on the map and the graph at once: current vertex, neighbor colors, blocked vs. available colors, and the highlighted pseudocode line |
| 4 | **Fully colored map + legend** | Let the animation finish | The final valid 4-coloring, with a legend showing only the colors used |
| 5 | **Results table** | Results page → sort by *Assigned Color* | The per-region assignment, color classes (independent sets), and the "Valid Coloring" verdict |
| 6 | **Conflict detection demo** | Conflicts page → Simulate Conflict | The red banner, red regions on the map, red vertices and edge on the graph, and the raw API response, which prove the verifier works |
| 7 | **Statistics dashboard** | Statistics page | V, E, Δ, the O(V + E + VC) explanation, measured operation counts, the degree chart, and the Welsh–Powell comparison |

Tip: a 1920×1080 browser window (projector size) gives the cleanest screenshots.

## Limitations

* Boundaries are simplified to about 3 km precision so the map stays light (≈ 75 KB). The small union territories Chandigarh, Puducherry, Dadra & Nagar Haveli and Daman & Diu, Lakshadweep and the Andaman & Nicobar Islands are drawn for completeness but are not graph vertices (they are enclaves or islands). Contacts shorter than about 10 km (mere tripoints such as Uttarakhand – Haryana) are not treated as edges; the short Himachal Pradesh – Uttar Pradesh border is included.
* Boundaries follow the source dataset (`udit-001/india-maps-data`), which draws India's official extent: Jammu and Kashmir includes PoK, and Ladakh includes Gilgit-Baltistan and Aksai Chin.
* Datasets are fixed in Python files. There is no in-app graph editor. To add a dataset, add a module under `backend/data/` and register it in `data/__init__.py`. Map shapes exist only for the India dataset, so other datasets appear as node-link graphs.
* Dragged node positions reset when you reload the page or switch datasets.
* Greedy coloring is a heuristic. The app reports how many colors it used, but it does not compute the exact chromatic number.
