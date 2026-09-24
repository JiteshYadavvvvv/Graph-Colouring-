/**
 * Teaching content for the Learn Graph Coloring page: seven lessons with
 * small illustrated examples, the algorithm in six steps, pseudocode, and
 * the algorithm's key properties.
 */
import { PALETTE } from '../utils/constants';

/* Tiny SVG helpers for the lesson diagrams (viewBox units). */
const fillOf = (c) => (c ? PALETTE[c - 1].fill : '#E6EAF2');

function Node({ x, y, label, color, ring, r = 11 }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={fillOf(color)} stroke={ring ?? (color ? '#fff' : '#172033')} strokeWidth={ring ? 3 : 2} />
      <text x={x} y={y} dy="0.35em" textAnchor="middle" fontSize="9" fontWeight="700" fill={color && color !== 4 ? '#fff' : '#172033'}>
        {label}
      </text>
    </g>
  );
}

function Edge({ a, b, color = '#94A3B8', dashed }) {
  return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth="2.5" strokeDasharray={dashed ? '4 3' : undefined} />;
}

// Four vertices A–D with edges A–B, A–C, B–C, C–D (used by lessons 1 and 2).
const P = { A: [30, 22], B: [30, 68], C: [80, 45], D: [130, 45] };
const SMALL_EDGES = [['A', 'B'], ['A', 'C'], ['B', 'C'], ['C', 'D']];

function SmallGraph({ highlight }) {
  return (
    <svg viewBox="0 0 160 90" role="img" aria-label="A graph with vertices A, B, C, D and edges A–B, A–C, B–C, C–D">
      {SMALL_EDGES.map(([u, v]) => (
        <Edge key={u + v} a={P[u]} b={P[v]} color={highlight && (u === highlight || v === highlight) ? '#3157D5' : undefined} />
      ))}
      {Object.entries(P).map(([v, [x, y]]) => (
        <Node key={v} x={x} y={y} label={v} ring={v === highlight ? '#3157D5' : undefined} />
      ))}
      {highlight && (
        <g>
          <rect x={P[highlight][0] + 6} y={P[highlight][1] - 30} width="34" height="15" rx="7" fill="#3157D5" />
          <text x={P[highlight][0] + 23} y={P[highlight][1] - 22.5} dy="0.35em" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#fff">
            deg 3
          </text>
        </g>
      )}
    </svg>
  );
}

/**
 * "Learn Graph Coloring": seven short lessons, each with a small example.
 * The facts about India (Kerala – Tamil Nadu share a border) match the
 * backend dataset.
 */
export const LESSONS = [
  {
    id: 'graph',
    question: 'What is a graph?',
    text: 'A graph is a set of points, called vertices, joined by lines, called edges. It records only who is connected to whom: positions, sizes and distances do not matter.',
    example: 'Four friends A, B, C, D, with an edge between two friends who know each other: V = {A, B, C, D} and E = {A–B, A–C, B–C, C–D}.',
    art: <SmallGraph />,
  },
  {
    id: 'vertex',
    question: 'What is a vertex?',
    text: 'A vertex is one object in the graph. The number of edges that touch a vertex is its degree.',
    example: 'Vertex C touches A, B and D, so its degree is 3. On the map of India, every state is one vertex.',
    art: <SmallGraph highlight="C" />,
  },
  {
    id: 'edge',
    question: 'What is an edge?',
    text: 'An edge connects two vertices that are related. In map coloring the relation is “the two regions share a border”, and the edge has no direction.',
    example: 'Kerala and Tamil Nadu share a border, so the graph of India contains the edge Kerala – Tamil Nadu.',
    art: (
      <svg viewBox="0 0 160 90" role="img" aria-label="Two vertices, KL and TN, joined by an edge">
        <Edge a={[40, 45]} b={[120, 45]} color="#3157D5" />
        <Node x={40} y={45} label="KL" r={15} />
        <Node x={120} y={45} label="TN" r={15} />
        <text x="80" y="20" textAnchor="middle" fontSize="8.5" fill="#68738A">shares a border</text>
      </svg>
    ),
  },
  {
    id: 'coloring',
    question: 'What is graph coloring?',
    text: 'Graph coloring gives every vertex a color so that the two ends of every edge get different colors. An edge whose two ends have the same color is a conflict.',
    example: 'The path A – B – C can be colored 1, 2, 1. A and C may share a color because they are not adjacent; coloring B with 1 as well would create two conflicts.',
    art: (
      <svg viewBox="0 0 160 90" role="img" aria-label="Path A–B–C colored 1, 2, 1">
        <Edge a={[30, 45]} b={[80, 45]} />
        <Edge a={[80, 45]} b={[130, 45]} />
        <Node x={30} y={45} label="A" color={1} r={13} />
        <Node x={80} y={45} label="B" color={2} r={13} />
        <Node x={130} y={45} label="C" color={1} r={13} />
      </svg>
    ),
  },
  {
    id: 'chromatic',
    question: 'What is a chromatic number?',
    text: 'The chromatic number χ(G) is the smallest number of colors that can color the graph without any conflict. Computing it exactly is NP-hard, so large graphs are usually colored with fast heuristics such as greedy coloring.',
    example: 'A triangle needs 3 colors (χ = 3) because each vertex touches the other two. A square cycle needs only 2 (χ = 2): opposite corners can share a color.',
    art: (
      <svg viewBox="0 0 160 90" role="img" aria-label="A triangle colored with 3 colors and a square colored with 2">
        <Edge a={[35, 18]} b={[14, 70]} />
        <Edge a={[35, 18]} b={[56, 70]} />
        <Edge a={[14, 70]} b={[56, 70]} />
        <Node x={35} y={18} label="1" color={1} />
        <Node x={14} y={70} label="2" color={2} />
        <Node x={56} y={70} label="3" color={3} />
        <Edge a={[100, 22]} b={[146, 22]} />
        <Edge a={[146, 22]} b={[146, 68]} />
        <Edge a={[146, 68]} b={[100, 68]} />
        <Edge a={[100, 68]} b={[100, 22]} />
        <Node x={100} y={22} label="1" color={1} />
        <Node x={146} y={22} label="2" color={2} />
        <Node x={146} y={68} label="1" color={1} />
        <Node x={100} y={68} label="2" color={2} />
        <text x="35" y="88" textAnchor="middle" fontSize="8.5" fill="#68738A">χ = 3</text>
        <text x="123" y="88" textAnchor="middle" fontSize="8.5" fill="#68738A">χ = 2</text>
      </svg>
    ),
  },
  {
    id: 'greedy',
    question: 'What is greedy coloring?',
    text: 'Greedy coloring visits the vertices one at a time and gives each the smallest color that none of its already-colored neighbors uses. It never changes a color once assigned. It takes O(V + E) time, but it does not always reach χ(G): the order in which vertices are visited matters.',
    example: 'On the path A – B – C in the order A, B, C: A has no colored neighbor and gets 1; B sees 1 and gets 2; C sees 2 and gets 1.',
    art: (
      <svg viewBox="0 0 160 90" role="img" aria-label="Greedy coloring of the path A, B, C in order: 1, 2, 1">
        <Edge a={[30, 50]} b={[80, 50]} />
        <Edge a={[80, 50]} b={[130, 50]} />
        {[
          [30, 'A', 1, '1st'],
          [80, 'B', 2, '2nd'],
          [130, 'C', 1, '3rd'],
        ].map(([x, label, color, order]) => (
          <g key={label}>
            <text x={x} y="24" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#6C5CE7">
              {order}
            </text>
            <Node x={x} y={50} label={label} color={color} r={13} />
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: 'map-to-graph',
    question: 'Why does map coloring become graph coloring?',
    text: 'Coloring a map only depends on which regions touch, not on their shapes or sizes. Replace every region by a vertex and every shared border by an edge: two regions need different colors exactly when their vertices are joined by an edge. Coloring the map is therefore the same problem as coloring its graph, which is what this application does with the states of India.',
    example: 'The four regions on the left share five borders (W–X, W–Y, W–Z, X–Z, Y–Z), so their graph has four vertices and five edges. Three colors are enough.',
    art: (
      <svg viewBox="0 0 230 100" role="img" aria-label="Four map regions W, X, Y, Z and the graph with four vertices and five edges">
        {[
          ['M10 16 L55 8 L68 42 L36 62 L8 50 Z', 1, 'W', 34, 34],
          ['M55 8 L100 16 L94 54 L68 42 Z', 2, 'X', 80, 30],
          ['M8 50 L36 62 L42 94 L12 88 Z', 2, 'Y', 25, 75],
          ['M36 62 L68 42 L94 54 L88 94 L42 94 Z', 3, 'Z', 66, 72],
        ].map(([d, color, label, x, y]) => (
          <g key={label}>
            <path d={d} fill={PALETTE[color - 1].fill} stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
            <text x={x} y={y} dy="0.35em" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">
              {label}
            </text>
          </g>
        ))}
        <path d="M112 52 L132 52" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M127 47 L133 52 L127 57" stroke="#94A3B8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {[
          [[160, 26], [210, 22]],
          [[160, 26], [158, 78]],
          [[160, 26], [206, 76]],
          [[210, 22], [206, 76]],
          [[158, 78], [206, 76]],
        ].map(([a, b], i) => (
          <Edge key={i} a={a} b={b} />
        ))}
        <Node x={160} y={26} label="W" color={1} />
        <Node x={210} y={22} label="X" color={2} />
        <Node x={158} y={78} label="Y" color={2} />
        <Node x={206} y={76} label="Z" color={3} />
      </svg>
    ),
  },
];

export const ALGORITHM_STEPS = [
  { title: 'Select a vertex', text: 'Take the next vertex in the chosen order.' },
  { title: 'Inspect adjacent vertices', text: 'Look at every neighbor of that vertex.' },
  { title: 'Collect the neighbors’ colors', text: 'Note which colors the already-colored neighbors use. Uncolored neighbors are ignored.' },
  { title: 'Pick the smallest available color', text: 'Try 1, 2, 3, … and stop at the first color no neighbor uses.' },
  { title: 'Assign that color', text: 'The vertex keeps it for good: greedy never goes back.' },
  { title: 'Repeat', text: 'Continue with the next vertex until every vertex has a color.' },
];

export const FULL_PSEUDOCODE = `GREEDY-COLORING(G, order)
  color ← empty map              // vertex → color
  for each vertex v in order:    // 1. select a vertex
    used ← empty set
    for each neighbor u of v:    // 2. inspect neighbors
      if u has a color:
        add color[u] to used     // 3. collect their colors
    c ← 1
    while c is in used:          // 4. smallest free color
      c ← c + 1
    color[v] ← c                 // 5. assign it
  return color                   // 6. all vertices colored`;

export const FACTS = [
  { title: 'Always valid', text: 'A vertex never takes a color that one of its colored neighbors already has.' },
  { title: 'At most Δ + 1 colors', text: 'A vertex with d neighbors can have at most d colors blocked, so color d + 1 is always free.' },
  { title: 'Not always optimal', text: 'Greedy never looks ahead. A poor vertex order can use more colors than the chromatic number.' },
  { title: 'Order matters', text: 'Welsh–Powell colors high-degree vertices first, which often uses fewer colors.' },
];
