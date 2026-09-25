/**
 * Viva preparation content, grouped by topic. Answers are written for a
 * second-year engineering student. `live(graph)` adds a sentence about the
 * dataset that is loaded right now, using its real numbers.
 */
export const VIVA_TOPICS = [
  {
    id: 'basics',
    title: 'Graph basics',
    questions: [
      {
        id: 'graph',
        q: 'What is a graph?',
        a: 'A graph G = (V, E) is a set of vertices V and a set of edges E, where each edge joins two vertices. It captures relationships only: which objects are connected to which.',
      },
      {
        id: 'vertex',
        q: 'What is a vertex, and what is its degree?',
        a: 'A vertex is one object of the graph. Its degree is the number of edges that touch it, which is the same as its number of neighbors. The largest degree in the graph is written Δ.',
        live: (g) => {
          const hub = g.vertices.find((v) => g.adjacency[v].length === g.statistics.max_degree);
          return `In ${g.name}, Δ = ${g.statistics.max_degree}${hub ? ` (${g.names?.[hub] ?? hub})` : ''}.`;
        },
      },
      {
        id: 'edge',
        q: 'What is an edge?',
        a: 'An edge is a connection between two vertices. Here edges are undirected: if Punjab borders Haryana, then Haryana borders Punjab, and both adjacency lists contain the other state.',
        live: (g) => `${g.name} has ${g.statistics.edges} edges.`,
      },
      {
        id: 'adjacency-list',
        q: 'What is an adjacency list, and why is it used here?',
        a: 'For every vertex, a list of its neighbors. It needs O(V + E) memory, while an adjacency matrix needs O(V²), and it lists the neighbors of a vertex in O(deg v) time, which is exactly the operation greedy coloring performs for every vertex. Map graphs are sparse, so the list is the natural choice.',
        live: (g) =>
          `For ${g.name}: ${g.statistics.vertices} lists with ${2 * g.statistics.edges} entries in total, versus ${g.statistics.vertices ** 2} cells in a matrix.`,
      },
    ],
  },
  {
    id: 'map',
    title: 'From map to graph',
    questions: [
      {
        id: 'states-vertices',
        q: 'Why are states represented as vertices?',
        a: 'Coloring only cares about which regions must differ, not about their shape or size. Each state is one independent thing that needs exactly one color, so it becomes one vertex.',
        live: (g) => (g.kind === 'map' ? `This map has ${g.statistics.vertices} vertices, one per state or union territory.` : null),
      },
      {
        id: 'borders-edges',
        q: 'Why are neighboring states connected by edges?',
        a: 'An edge records a constraint: two states that share a border must not get the same color. States that only touch at a single point are not neighbors, so they get no edge.',
        live: (g) => (g.kind === 'map' ? `There are ${g.statistics.edges} shared borders, so ${g.statistics.edges} edges.` : null),
      },
      {
        id: 'transformation',
        q: 'How is the map of India transformed into a graph?',
        a: 'Each participating state or union territory becomes a vertex with a stable ID, for example IN-MH for Maharashtra. Two vertices are joined when their regions share a land border of at least about 10 km, so mere point contacts are ignored. The borders were measured from real boundary data by a script, and the resulting adjacency list is stored on the backend. The map only draws the shapes; the algorithm works on the adjacency list.',
      },
      {
        id: 'graph-vs-map',
        q: 'What is the difference between a graph and a map?',
        a: 'A map is geometry: shapes, areas and positions. A graph is pure structure: vertices and the edges between them. Turning the map into a graph throws away everything except “who touches whom”, which is exactly what coloring needs. Map graphs are planar, which is why four colors always suffice for them (the Four Color Theorem).',
      },
      {
        id: 'four-color',
        q: 'Why does the India map need only four colors?',
        a: 'Any map of connected regions gives a planar graph, and the Four Color Theorem (Appel and Haken, 1976) proves every planar graph can be colored with at most four colors. The India graph actually needs exactly four, which the backend proves with an exact search.',
      },
    ],
  },
  {
    id: 'coloring',
    title: 'Graph coloring',
    questions: [
      {
        id: 'what-is',
        q: 'What is graph coloring?',
        a: 'Graph coloring assigns a label, called a color, to every vertex of a graph so that the two endpoints of every edge get different colors. The usual goal is to use as few colors as possible.',
      },
      {
        id: 'chromatic',
        q: 'What is a chromatic number?',
        a: 'The chromatic number χ(G) is the smallest number of colors that can color the graph without conflicts. Finding it is NP-hard, so for large graphs we usually settle for a good heuristic such as greedy coloring, which only gives an upper bound.',
        live: (g) =>
          g.chromatic?.value !== null && g.chromatic?.value !== undefined
            ? `For ${g.name}, χ = ${g.chromatic.value} (found by an exact search on the backend).`
            : null,
      },
      {
        id: 'greedy',
        q: 'What is greedy coloring?',
        a: 'Greedy coloring visits the vertices one by one and gives each the smallest color that none of its already-colored neighbors uses. It makes the best local choice at every step and never changes a color once assigned.',
      },
      {
        id: 'optimal',
        q: 'Can greedy coloring always produce the minimum number of colors?',
        a: 'No. Greedy never looks ahead, so a bad vertex order can force extra colors. The Bipartite (Crown) dataset needs only 2 colors, but greedy in its natural order uses 4. Greedy does guarantee at most Δ + 1 colors, where Δ is the maximum degree.',
      },
      {
        id: 'welsh-powell',
        q: 'How do Welsh–Powell and DSATUR differ from plain greedy?',
        a: 'All three are greedy. Welsh–Powell sorts vertices by degree first, so the hardest vertices are colored early. DSATUR picks, at every step, the vertex whose neighbors already use the most different colors. Neither is best on every graph; see the Compare page.',
      },
    ],
  },
  {
    id: 'complexity',
    title: 'Complexity',
    questions: [
      {
        id: 'complexity',
        q: 'What is the time complexity?',
        a: 'O(V + E). Every vertex is visited once and every adjacency-list entry is read once (2E entries). A vertex with d neighbors can see at most d colors, so its smallest free color is found within d + 1 tries. Extra space is O(V) for the colors. This app also records a step trace for the animation, which costs O(V·C) extra time and O(V + E + V·C) space.',
        live: (g) =>
          `For ${g.name}: V = ${g.statistics.vertices} and E = ${g.statistics.edges}, so the algorithm reads ${2 * g.statistics.edges} adjacency entries.`,
      },
    ],
  },
  {
    id: 'verification',
    title: 'Conflicts and verification',
    questions: [
      {
        id: 'conflict',
        q: 'What is a conflict?',
        a: 'A conflict is an edge whose two endpoints have the same color. A coloring is valid only when there are no conflicts. The backend checks this by looking at every edge once, in O(V + E).',
      },
      {
        id: 'detection',
        q: 'How does conflict detection work?',
        a: 'The backend walks through every edge (u, v) once and reports it if color[u] = color[v]. A coloring is valid when no edge is reported and every vertex has a color. This takes O(V + E) time. In this app, POST /api/conflicts runs the check after every coloring and after Simulate Conflict.',
        live: (g) => `For ${g.name}, each check examines all ${g.statistics.edges} edges.`,
      },
      {
        id: 'same-color',
        q: 'What happens if two adjacent vertices have the same color?',
        a: 'The coloring becomes invalid. On a map, the two neighboring states would look the same and their border would disappear. Use “Simulate Conflict” to create one: the detector highlights both vertices and their edge, and “Fix Coloring” restores the valid result.',
      },
    ],
  },
  {
    id: 'applications',
    title: 'Applications and design',
    questions: [
      {
        id: 'applications',
        q: 'What are real-world applications of graph coloring?',
        a: 'Exam and course timetabling (colors are time slots), register allocation in compilers (colors are CPU registers), frequency assignment for radio towers and Wi-Fi (colors are channels), job scheduling on shared machines, and map coloring. See the Applications page.',
      },
      {
        id: 'backend',
        q: 'Why is the backend responsible for coloring?',
        a: 'It keeps a single source of truth: the graph data, the algorithm and the verification all live in one place (Python/FastAPI), and every client sees the same, testable result. The frontend only visualizes the steps the backend recorded, so the animation cannot show something the algorithm did not do.',
      },
    ],
  },
];

export const VIVA_QUESTIONS = VIVA_TOPICS.flatMap((topic) => topic.questions);

/** Multiple-choice quiz. `answer` is the index of the correct option. */
export const QUIZ = [
  {
    q: 'In the map-coloring graph, what does an edge represent?',
    options: ['A state', 'Two states that share a border', 'A color', 'A capital city'],
    answer: 1,
    why: 'Vertices are regions; an edge joins two regions that share a border.',
  },
  {
    q: 'Greedy coloring gives the current vertex…',
    options: [
      'a random color',
      'the color used by most neighbors',
      'the smallest color not used by its colored neighbors',
      'a brand-new color every time',
    ],
    answer: 2,
    why: 'It always takes the smallest available color.',
  },
  {
    q: 'What is the time complexity of greedy coloring with an adjacency list?',
    options: ['O(V + E)', 'O(V!)', 'O(2^V)', 'O(E log E)'],
    answer: 0,
    why: 'Each vertex is visited once and each adjacency entry is read once.',
  },
  {
    q: 'A graph has maximum degree Δ = 5. Greedy coloring uses at most…',
    options: ['4 colors', '5 colors', '6 colors', 'it depends only on V'],
    answer: 2,
    why: 'At most Δ neighbors can block colors, so color Δ + 1 is always free.',
  },
  {
    q: 'The chromatic number χ(G) is…',
    options: [
      'the number of edges',
      'the minimum number of colors needed for a valid coloring',
      'the number of colors greedy uses',
      'the maximum degree',
    ],
    answer: 1,
    why: 'Greedy only gives an upper bound on χ.',
  },
  {
    q: 'How many colors does the complete graph K5 need?',
    options: ['2', '3', '4', '5'],
    answer: 3,
    why: 'Every pair of vertices is adjacent, so all five need different colors.',
  },
  {
    q: 'How many colors does an odd cycle need?',
    options: ['1', '2', '3', '4'],
    answer: 2,
    why: 'Two colors would have to alternate around the cycle, which fails when its length is odd.',
  },
  {
    q: 'An adjacency list for an undirected graph with V vertices and E edges holds…',
    options: ['V² entries', 'V lists with 2E entries in total', 'E entries', '2V entries'],
    answer: 1,
    why: 'Each undirected edge appears in the lists of both of its endpoints.',
  },
  {
    q: 'How does the map of India become a graph in this project?',
    options: [
      'Each district becomes an edge',
      'Each state becomes a vertex, and each shared land border becomes an edge',
      'Each color becomes a vertex',
      'Each border becomes a vertex',
    ],
    answer: 1,
    why: 'Only adjacency matters for coloring, so shapes are dropped and borders become edges.',
  },
  {
    q: 'Conflict detection checks…',
    options: ['every vertex once', 'every edge once', 'every pair of vertices', 'only the highest-degree vertices'],
    answer: 1,
    why: 'A conflict is an edge whose two ends share a color, so each edge is checked once: O(V + E).',
  },
  {
    q: 'A coloring is invalid when…',
    options: [
      'it uses more than four colors',
      'two adjacent vertices share a color',
      'two non-adjacent vertices share a color',
      'a vertex has degree 0',
    ],
    answer: 1,
    why: 'That edge is a conflict.',
  },
  {
    q: 'In exam scheduling as graph coloring, a color stands for…',
    options: ['a student', 'an exam', 'a time slot', 'a classroom'],
    answer: 2,
    why: 'Exams are vertices, shared students are edges, colors are time slots.',
  },
  {
    q: 'Which statement about greedy coloring is true?',
    options: [
      'It always finds the chromatic number',
      'Its result can depend on the order of the vertices',
      'It can produce conflicts',
      'It needs exponential time',
    ],
    answer: 1,
    why: 'Try the Bipartite (Crown) dataset on the Compare page.',
  },
];
