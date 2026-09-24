/**
 * Teaching content for the How It Works page: key terms (with small
 * illustrations), the algorithm in six steps, pseudocode, and properties.
 */
import { PALETTE } from '../utils/constants';

const N = (cx, cy, fill = '#E6EAF2', stroke = '#172033') => (
  <circle cx={cx} cy={cy} r="7" fill={fill} stroke={stroke} strokeWidth="2" />
);

export const CONCEPTS = [
  {
    term: 'Graph',
    meaning: 'A set of vertices joined by edges. It records only which things are connected.',
    art: (
      <>
        <path d="M12 16 L46 14 L30 46 Z M12 16 L30 46" stroke="#94A3B8" strokeWidth="2.5" fill="none" />
        {N(12, 16)}
        {N(46, 14)}
        {N(30, 46)}
      </>
    ),
  },
  {
    term: 'Vertex',
    meaning: 'One object in the graph. Here: a state, or an exam, or a variable.',
    art: <circle cx="30" cy="30" r="14" fill="#E6EAF2" stroke="#3157D5" strokeWidth="3" />,
  },
  {
    term: 'Edge',
    meaning: 'A connection between two vertices. Here: the two states share a border.',
    art: (
      <>
        <line x1="12" y1="30" x2="48" y2="30" stroke="#6C5CE7" strokeWidth="4" strokeLinecap="round" />
        {N(12, 30)}
        {N(48, 30)}
      </>
    ),
  },
  {
    term: 'Degree',
    meaning: 'How many edges touch a vertex, i.e. how many neighbors it has.',
    art: (
      <>
        <path d="M30 30 L10 14 M30 30 L50 14 M30 30 L30 52" stroke="#94A3B8" strokeWidth="2.5" />
        {N(10, 14)}
        {N(50, 14)}
        {N(30, 52)}
        <circle cx="30" cy="30" r="9" fill="#3157D5" />
        <text x="30" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">3</text>
      </>
    ),
  },
  {
    term: 'Color',
    meaning: 'A label given to a vertex, written as 1, 2, 3, … Here: a fill color on the map.',
    art: (
      <>
        <circle cx="18" cy="30" r="10" fill={PALETTE[0].fill} />
        <circle cx="42" cy="30" r="10" fill={PALETTE[1].fill} />
      </>
    ),
  },
  {
    term: 'Conflict',
    meaning: 'An edge whose two ends have the same color. A valid coloring has none.',
    art: (
      <>
        <line x1="14" y1="36" x2="46" y2="36" stroke="#E5484D" strokeWidth="3" strokeDasharray="5 4" />
        <circle cx="14" cy="36" r="9" fill={PALETTE[0].fill} stroke="#E5484D" strokeWidth="3" />
        <circle cx="46" cy="36" r="9" fill={PALETTE[0].fill} stroke="#E5484D" strokeWidth="3" />
        <text x="30" y="20" textAnchor="middle" fontSize="16" fontWeight="800" fill="#E5484D">!</text>
      </>
    ),
  },
  {
    term: 'Graph coloring',
    meaning: 'Giving every vertex a color so that no edge joins two vertices of the same color.',
    art: (
      <>
        <path d="M12 16 L46 14 L30 46 Z" stroke="#94A3B8" strokeWidth="2.5" fill="none" />
        <circle cx="12" cy="16" r="8" fill={PALETTE[0].fill} />
        <circle cx="46" cy="14" r="8" fill={PALETTE[1].fill} />
        <circle cx="30" cy="46" r="8" fill={PALETTE[2].fill} />
      </>
    ),
  },
  {
    term: 'Greedy coloring',
    meaning: 'Color vertices one at a time, always taking the smallest color the neighbors do not use.',
    art: (
      <>
        <rect x="8" y="22" width="12" height="16" rx="3" fill={PALETTE[0].fill} opacity="0.35" />
        <rect x="24" y="22" width="12" height="16" rx="3" fill={PALETTE[1].fill} />
        <rect x="40" y="22" width="12" height="16" rx="3" fill={PALETTE[2].fill} opacity="0.35" />
        <path d="M30 48 L30 42" stroke="#172033" strokeWidth="2.5" strokeLinecap="round" />
      </>
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
