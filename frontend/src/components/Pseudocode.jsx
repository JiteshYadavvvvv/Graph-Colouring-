/**
 * Greedy coloring pseudocode with the line for the current phase highlighted.
 * Phases: 0 choose vertex, 1 check neighbors, 2 find color, 3 assign, 4 next.
 * Only the way the next vertex is chosen differs between the strategies.
 */
const HEADERS = {
  natural: [{ text: 'for each vertex v in dataset order:', phases: [0, 4] }],
  largest_first: [
    { text: 'order ← vertices sorted by degree, highest first', phases: [] },
    { text: 'for each vertex v in order:', phases: [0, 4] },
  ],
  dsatur: [
    { text: 'while some vertex is uncolored:', phases: [4] },
    { text: '    v ← uncolored vertex with the most distinct', phases: [0] },
    { text: '        neighbor colors (ties: highest degree)', phases: [0] },
  ],
};

const BODY = [
  { text: '    used ← { color[u] : u adjacent to v, u colored }', phases: [1] },
  { text: '    c ← 1', phases: [2] },
  { text: '    while c ∈ used:  c ← c + 1', phases: [2] },
  { text: '    color[v] ← c', phases: [3] },
];

export default function Pseudocode({ phase = null, strategy = 'natural', title = 'Pseudocode' }) {
  const lines = [...(HEADERS[strategy] ?? HEADERS.natural), ...BODY];
  return (
    <div className="card pseudocode">
      <h3 className="card-title">{title}</h3>
      <pre aria-label="Greedy coloring pseudocode">
        {lines.map((line, i) => (
          <code key={i} className={phase !== null && line.phases.includes(phase) ? 'hl' : ''}>
            <span className="ln">{i + 1}</span>
            {line.text}
          </code>
        ))}
      </pre>
    </div>
  );
}
