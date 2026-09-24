/**
 * Viva preparation content. Answers are written for a second-year
 * engineering student. `live(graph)` adds a sentence about the dataset that
 * is loaded right now, using its real numbers.
 */
export const VIVA_QUESTIONS = [
  {
    id: 'what-is',
    q: 'What is graph coloring?',
    a: 'Graph coloring assigns a label, called a color, to every vertex of a graph so that the two endpoints of every edge get different colors. The usual goal is to use as few colors as possible.',
  },
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
    id: 'greedy',
    q: 'What is greedy coloring?',
    a: 'Greedy coloring visits the vertices one by one and gives each the smallest color that none of its already-colored neighbors uses. It makes the best local choice at every step and never changes a color once assigned.',
  },
  {
    id: 'complexity',
    q: 'What is the time complexity?',
    a: 'O(V + E). Every vertex is visited once and every adjacency-list entry is read once (2E entries). A vertex with d neighbors can see at most d colors, so its smallest free color is found within d + 1 tries. Extra space is O(V) for the colors. This app also records a step trace for the animation, which costs O(V·C) extra time and O(V + E) space.',
    live: (g) =>
      `For ${g.name}: V = ${g.statistics.vertices} and E = ${g.statistics.edges}, so the algorithm reads ${2 * g.statistics.edges} adjacency entries.`,
  },
  {
    id: 'optimal',
    q: 'Can greedy coloring always produce the minimum number of colors?',
    a: 'No. Greedy never looks ahead, so a bad vertex order can force extra colors. The Bipartite (Crown) dataset needs only 2 colors, but greedy in its natural order uses 4. Greedy does guarantee at most Δ + 1 colors, where Δ is the maximum degree.',
  },
  {
    id: 'conflict',
    q: 'What is a conflict?',
    a: 'A conflict is an edge whose two endpoints have the same color. A coloring is valid only when there are no conflicts. The backend checks this by looking at every edge once, in O(V + E).',
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
    id: 'same-color',
    q: 'What happens if two adjacent vertices have the same color?',
    a: 'The coloring becomes invalid. On a map, the two neighboring states would look the same and their border would disappear. Use “Simulate Conflict” to create one: the detector highlights both vertices and their edge, and “Fix Coloring” restores the valid result.',
  },
  {
    id: 'backend',
    q: 'Why is the backend responsible for coloring?',
    a: 'It keeps a single source of truth: the graph data, the algorithm and the verification all live in one place (Python/FastAPI), and every client sees the same, testable result. The frontend only visualizes the steps the backend recorded, so the animation cannot show something the algorithm did not do.',
  },
  {
    id: 'graph-vs-map',
    q: 'What is the difference between a graph and a map?',
    a: 'A map is geometry: shapes, areas and positions. A graph is pure structure: vertices and the edges between them. Turning the map into a graph throws away everything except “who touches whom”, which is exactly what coloring needs. Map graphs are planar, which is why four colors always suffice for them (the Four Color Theorem).',
  },
  {
    id: 'applications',
    q: 'What are real-world applications of graph coloring?',
    a: 'Exam and course timetabling (colors are time slots), register allocation in compilers (colors are CPU registers), frequency assignment for radio towers and Wi-Fi (colors are channels), job scheduling on shared machines, and map coloring. See the Applications page.',
  },
  {
    id: 'welsh-powell',
    q: 'How do Welsh–Powell and DSATUR differ from plain greedy?',
    a: 'All three are greedy. Welsh–Powell sorts vertices by degree first, so the hardest vertices are colored early. DSATUR picks, at every step, the vertex whose neighbors already use the most different colors. Neither is best on every graph; see the Compare page.',
  },
  {
    id: 'four-color',
    q: 'Why does the India map need only four colors?',
    a: 'Any map of connected regions gives a planar graph, and the Four Color Theorem (Appel and Haken, 1976) proves every planar graph can be colored with at most four colors. The India graph actually needs exactly four, which the backend proves with an exact search.',
  },
];

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
