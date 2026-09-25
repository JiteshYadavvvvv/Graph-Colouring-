import {
  Braces,
  Cpu,
  Database,
  GraduationCap,
  Layers,
  Map as MapIcon,
  MonitorSmartphone,
  Network,
  Server,
  ShieldCheck,
  Workflow,
} from 'lucide-react';

/**
 * Content of the About page. Every statement describes the code in this
 * repository: technologies are the ones in package.json / requirements.txt,
 * complexities are those of backend/algorithms/coloring.py as implemented.
 */

export const ABOUT = {
  title: 'Interactive Map Coloring System Using Graph Coloring',
  problem:
    'Map coloring is a practical way to introduce graph coloring, but conventional explanations are often static.',
  approach:
    'Represent geographical regions as vertices and shared boundaries as edges, then apply graph-coloring algorithms to generate and visualize valid color assignments.',
  mapping: [
    { from: 'Region', to: 'Vertex (stable ID such as IN-MH)' },
    { from: 'Shared boundary', to: 'Edge' },
    { from: 'Map color', to: 'Vertex color 1, 2, 3, …' },
  ],
};

/** `view` is the page where the feature can be seen. */
export const CONTRIBUTIONS = [
  {
    title: 'Interactive geographical visualization',
    text: 'The 31 mainland states and union territories of India, drawn from real boundary data as a local SVG map. Hover a state for its details; select it to see its neighbors.',
    view: 'map',
  },
  {
    title: 'Synchronized map and graph representations',
    text: 'A region and its vertex share one stable ID, so selections, colors and highlights stay in step between the map and the graph (Split view).',
    view: 'map',
  },
  {
    title: 'Step-by-step coloring execution',
    text: 'Auto Play, Step-by-Step and Instant modes replay the decisions recorded by the backend, five phases per vertex, with narration and highlighted pseudocode.',
    view: 'map',
  },
  {
    title: 'Conflict detection and simulation',
    text: 'The backend checks every edge of a coloring. Simulate Conflict breaks a coloring on purpose to show the detection; Fix Coloring runs the algorithm again.',
    view: 'conflicts',
  },
  {
    title: 'Multiple graph datasets',
    text: 'The India map, five textbook graphs (wheel W6, triangle K3, cycle C7, complete K5, bipartite crown graph) and custom graphs built in the Playground.',
    view: 'datasets',
  },
  {
    title: 'Graph statistics',
    text: 'Vertices, edges, degrees, density, colors produced, known minimum (χ), conflicts, operation counts and execution time, computed from the actual graph and run.',
    view: 'stats',
  },
  {
    title: 'Educational / viva mode',
    text: 'Seven illustrated lessons, real-world applications, and a Viva Mode with 20 questions in six topics plus a scored quiz.',
    view: 'viva',
  },
  {
    title: 'Offline-capable local map/data architecture',
    text: 'Map geometry, datasets and icons are bundled with the app: no CDN, map tiles, web fonts or external API. With the frontend and backend on one machine, no internet connection is needed.',
    view: null,
  },
];

/**
 * The path of one coloring request, top to bottom. `tier` groups the nodes
 * into the browser and the backend; `edge` labels the arrow below a node.
 */
export const PIPELINE = [
  {
    tier: 'browser',
    icon: MonitorSmartphone,
    title: 'React / Vite',
    where: 'hooks/useColoring.js · api/client.js',
    text: 'The user picks a dataset, a vertex order and a mode. The app sends one request with the dataset key, or the custom graph from the Playground.',
    edge: 'POST /api/color',
  },
  {
    tier: 'backend',
    icon: Server,
    title: 'FastAPI',
    where: 'main.py · models/schemas.py',
    text: 'Pydantic validates the request: vertex IDs, names, the strategy, and size limits (60 vertices, 600 edges for custom graphs).',
    edge: 'validated request',
  },
  {
    tier: 'backend',
    icon: Database,
    title: 'Graph Dataset',
    where: 'data/india_map.py · data/classic_graphs.py',
    text: 'A built-in dataset is loaded from the backend’s registry; a custom graph is taken from the request.',
    edge: 'vertices and neighbors',
  },
  {
    tier: 'backend',
    icon: Network,
    title: 'Adjacency List',
    where: '{ "IN-MH": ["IN-GJ", "IN-MP", …] }',
    text: 'Each vertex ID maps to the list of its neighbors. validate_graph() rejects self-loops, duplicate edges and one-way edges.',
    edge: 'graph',
  },
  {
    tier: 'backend',
    icon: Cpu,
    title: 'Coloring Engine',
    where: 'algorithms/coloring.py',
    text: 'greedy_coloring_with_steps() colors the vertices in the chosen order and records every decision: neighbors, blocked colors, available colors, assigned color.',
    edge: 'coloring + step trace',
  },
  {
    tier: 'backend',
    icon: ShieldCheck,
    title: 'Conflict Detection',
    where: 'find_conflicts() · is_valid_coloring()',
    text: 'Every edge is checked once for two endpoints with the same color, and every vertex must have a color.',
    edge: 'conflicts + validity',
  },
  {
    tier: 'backend',
    icon: Braces,
    title: 'JSON Result',
    where: 'ColorResponse',
    text: 'Coloring, visiting order, one record per step, conflicts, validity, and statistics: degrees, colors used, operation counts, execution time, complexity.',
    edge: 'HTTP response',
  },
  {
    tier: 'browser',
    icon: Layers,
    title: 'React Visualization',
    where: 'IndiaMapSVG · GraphSVG · StepPanel',
    text: 'The browser replays the recorded steps on the map, the graph and the panels. It never computes a color itself, and it re-checks the coloring on screen with POST /api/conflicts.',
    edge: null,
  },
];

export const TIERS = {
  browser: 'Browser · React',
  backend: 'Backend · FastAPI (Python)',
};

export const ENDPOINTS = [
  { method: 'GET', path: '/api/health', text: 'Service status' },
  { method: 'GET', path: '/api/datasets', text: 'Dataset list with V, E, degrees and χ' },
  { method: 'GET', path: '/api/graph/{dataset}', text: 'One graph: adjacency list, layout, statistics' },
  { method: 'POST', path: '/api/analyze', text: 'Validates and describes a Playground graph' },
  { method: 'POST', path: '/api/color', text: 'Greedy coloring with the step trace' },
  { method: 'POST', path: '/api/conflicts', text: 'Checks any coloring edge by edge' },
  { method: 'POST', path: '/api/compare', text: 'Greedy vs. Welsh–Powell vs. DSATUR' },
];

export const DESIGN_DECISIONS = [
  'The backend is the only place where colors are computed; the browser replays the recorded steps.',
  'The built-in datasets exist only in backend/data/. The frontend stores the map’s drawing geometry, not its graph structure.',
  'Every vertex has a stable ID (IN-MH, v3). Algorithms, API and UI use IDs; names are for display.',
  'The API is stateless: no database, no accounts, nothing stored between requests.',
];

/** Only technologies that the code actually uses. */
export const STACK = [
  {
    group: 'Frontend',
    icon: MonitorSmartphone,
    items: [
      { name: 'React 18', role: 'Components and state (hooks such as useColoring and usePlayground)' },
      { name: 'JavaScript (ES modules, JSX)', role: 'Application code; no TypeScript' },
      { name: 'CSS with custom properties', role: 'Hand-written styles; no CSS framework' },
      { name: 'Framer Motion 11', role: 'Transitions and step animations' },
      { name: 'Lucide React', role: 'Icons' },
      { name: 'Hash-based navigation', role: 'Written in App.jsx; no router library' },
    ],
  },
  {
    group: 'Backend',
    icon: Server,
    items: [
      { name: 'Python 3.12', role: 'Deployment runtime (.python-version); 3.10 or newer runs locally' },
      { name: 'FastAPI', role: 'HTTP API, CORS, interactive documentation at /docs' },
      { name: 'Pydantic 2', role: 'Validation of requests and responses' },
      { name: 'Uvicorn', role: 'ASGI server for local development only' },
    ],
  },
  {
    group: 'Algorithm',
    icon: Cpu,
    items: [
      { name: 'Hand-written Python', role: 'Standard library only; no NetworkX or other graph library' },
      { name: 'Greedy coloring', role: 'Natural, largest-degree-first and DSATUR vertex orders, with step trace' },
      { name: 'Welsh–Powell and DSATUR', role: 'Classic forms for the Compare page (algorithms/variants.py)' },
      { name: 'Exact chromatic number', role: 'Bounded backtracking with a clique lower bound (algorithms/chromatic.py)' },
      { name: 'Conflict detection', role: 'One pass over all edges (find_conflicts)' },
    ],
  },
  {
    group: 'Visualization',
    icon: MapIcon,
    items: [
      { name: 'Inline SVG rendered by React', role: 'IndiaMapSVG (map), GraphSVG (draggable graph), GraphEditor (Playground)' },
      { name: 'CSS bar charts', role: 'Color distribution of a result; no charting or mapping library' },
    ],
  },
  {
    group: 'Data',
    icon: Database,
    items: [
      { name: 'India state boundaries', role: 'udit‑001/india‑maps‑data (district GeoJSON), converted offline into SVG paths (indiaGeometry.js)' },
      { name: 'Graph datasets', role: 'Python adjacency lists in backend/data/: India (31 vertices, 60 edges) and five textbook graphs' },
      { name: 'Custom graphs', role: 'Kept in browser memory and sent to the API as JSON; no database' },
    ],
  },
  {
    group: 'Deployment',
    icon: Workflow,
    items: [
      { name: 'Vercel (backend)', role: 'FastAPI project from backend/ (vercel.json imports main:app)' },
      { name: 'Vercel (frontend)', role: 'Static site built by Vite into dist/' },
      { name: 'Environment variables', role: 'VITE_API_URL (backend address, set at build time); FRONTEND_URL (optional CORS allow-list)' },
    ],
  },
  {
    group: 'Development tools',
    icon: Braces,
    items: [
      { name: 'Vite 8', role: 'Dev server with an /api proxy to the backend, and the production bundler' },
      { name: 'Node.js 20.19+ / 22.12+ and npm', role: 'Frontend dependencies and scripts' },
      { name: 'Python venv and pip', role: 'Backend dependencies (requirements.txt)' },
      { name: 'unittest', role: 'Backend tests, including HTTP tests against a real Uvicorn server' },
      { name: 'Shapely', role: 'Only for regenerating the map geometry (tools/build_india_map.py)' },
      { name: 'Git', role: 'Version control' },
    ],
  },
];

export const ALGORITHM = {
  input: [
    'An undirected simple graph as an adjacency list: each vertex ID mapped to the IDs of its neighbors.',
    'A vertex order: natural (dataset order), largest degree first (Welsh–Powell), or DSATUR.',
    'Optional display names, used only in the step explanations.',
  ],
  output: [
    'A coloring: every vertex ID mapped to a color 1, 2, 3, …, with different colors on the two ends of every edge.',
    'The number of colors used (C) and the order in which the vertices were colored.',
    'One record per step: the vertex, its colored neighbors, blocked and available colors, and the color assigned.',
    'The conflict check: a list of conflicting edges (empty for greedy’s own result) and a validity flag.',
  ],
  /** Time of the implementation in backend/algorithms/coloring.py. */
  time: [
    { part: 'Coloring decisions (greedy_coloring)', cost: 'O(V + E)', why: 'Each vertex once, each adjacency entry once; the smallest free color is found within deg(v) + 1 tries.' },
    { part: 'Run as executed by the API, natural order', cost: 'O(V + E + V·C)', why: 'Each step also lists the blocked and available colors (up to C + 1) for the replay.' },
    { part: 'Largest degree first (Welsh–Powell order)', cost: 'O(V log V + E + V·C)', why: 'One sort by degree before coloring.' },
    { part: 'DSATUR order', cost: 'O(V² + E)', why: 'A linear scan for the most saturated vertex before each step (no priority queue).' },
    { part: 'Input validation', cost: 'O(V + E)', why: 'One set of neighbors per vertex makes each check O(1).' },
    { part: 'Conflict detection', cost: 'O(V + E)', why: 'Every edge is checked once.' },
  ],
  space: [
    { part: 'Adjacency list (input)', cost: 'O(V + E)', why: 'V entries and 2E neighbor references.' },
    { part: 'Coloring decisions', cost: 'O(V)', why: 'One color per vertex, plus a set of at most Δ blocked colors.' },
    { part: 'Recorded steps (API response)', cost: 'O(V + E + V·C)', why: 'Each step stores the vertex’s neighbors and its blocked and available colors.' },
    { part: 'DSATUR saturation sets', cost: 'O(V + E)', why: 'The distinct neighbor colors of each vertex.' },
  ],
  note:
    'A textbook analysis of greedy coloring gives O(V + E) time and O(V) extra space. The coloring loop here matches it. The version the API runs costs more because it records, for every vertex, what the visualization replays. C ≤ Δ + 1, so that version is at most O(V·Δ + E).',
  limitations: [
    'The number of colors depends on the vertex order. The same graph can need more colors in one order than in another.',
    'It does not guarantee the minimum. On the bipartite crown graph (χ = 2), greedy in dataset order uses 4 colors; DSATUR finds 2.',
    'Its only general guarantee is at most Δ + 1 colors, where Δ is the maximum degree.',
    'It never revises a color: no look-ahead and no backtracking.',
    'DSATUR is implemented with a linear scan per step, O(V²), which is fine at this project’s graph sizes but not for very large graphs.',
  ],
};

export const LIMITATIONS = [
  {
    title: 'Greedy is not optimal',
    text: 'Greedy coloring does not necessarily produce the minimum number of colors (the chromatic number) for arbitrary graphs. The app shows the colors produced and the known minimum separately.',
  },
  {
    title: 'Known minimum within a budget',
    text: 'The exact chromatic number comes from a backtracking search limited to 200,000 search nodes and 0.4 s per graph. When the limit is reached, for example on a larger custom graph, only proven bounds are shown.',
  },
  {
    title: 'Map accuracy depends on the bundled data',
    text: 'Boundaries come from the bundled udit‑001/india‑maps‑data dataset, simplified to about 3 km for drawing. The map is a visualization, not an official survey map.',
  },
  {
    title: 'Modeling choices for the India graph',
    text: 'Two regions are adjacent when they share a land border of at least about 10 km, so point contacts are not edges. Chandigarh, Puducherry, Dadra & Nagar Haveli and Daman & Diu, Lakshadweep, and the Andaman & Nicobar Islands are drawn but are not vertices.',
  },
  {
    title: 'One geographic dataset',
    text: 'Only India has map shapes. The other graphs are shown as node-link diagrams.',
  },
  {
    title: 'Educational scale',
    text: 'The application is primarily an educational visualization system. Custom graphs are limited to 60 vertices and 600 edges (40 vertices in the Playground editor), and every vertex and edge is drawn as SVG, so much larger graphs would need visualization optimization.',
  },
  {
    title: 'Requires the backend',
    text: 'Colors are computed only by the FastAPI backend. The browser alone cannot color a graph, so offline use means running both parts locally.',
  },
  {
    title: 'No persistence',
    text: 'Custom graphs, results and dragged node positions live in the browser’s memory and are lost on reload. There is no experiment history.',
  },
  {
    title: 'Timings are indicative',
    text: 'Execution times are measured on the server for graphs of at most a few dozen vertices, so they are in microseconds and vary with machine load. They illustrate the algorithms; they are not a benchmark.',
  },
];

export const FUTURE_SCOPE = [
  { icon: Cpu, title: 'Additional coloring algorithms', text: 'Recursive Largest First, tabu search or simulated annealing, compared on the same page; SAT or integer-programming solvers for exact results on larger graphs.' },
  { icon: Network, title: 'Larger graph datasets', text: 'Graphs with thousands of vertices, with canvas or WebGL rendering and a heap-based DSATUR.' },
  { icon: Braces, title: 'User-created datasets', text: 'Saving Playground graphs to a file and loading them again, or sharing them through a link.' },
  { icon: Database, title: 'Persistent experiment history', text: 'Keeping past runs so results can be compared across sessions.' },
  { icon: Layers, title: 'Advanced graph analysis', text: 'Largest cliques, independent sets, planarity checks, and edge or list coloring.' },
  { icon: MonitorSmartphone, title: 'Accessibility improvements', text: 'Testing with screen readers and color-vision-deficiency simulations, and narration that can be read aloud.' },
  { icon: MapIcon, title: 'Additional geographic datasets', text: 'Districts of a state, or other countries, produced with the same map-building tool.' },
  { icon: GraduationCap, title: 'Classroom / teaching mode', text: 'Instructor-led sessions in which a class follows one run and answers quiz questions together.' },
];

