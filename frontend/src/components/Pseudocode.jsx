const LINES = [
  { text: 'for each vertex v in order:', phase: 0 },
  { text: '    used ← colors of colored neighbors of v', phase: 1 },
  { text: '    c ← 1', phase: 2 },
  { text: '    while c ∈ used:  c ← c + 1', phase: 2 },
  { text: '    color[v] ← c', phase: 3 },
];

/** Greedy pseudocode with the line for the current phase highlighted. */
export default function Pseudocode({ phase = null, title = 'Pseudocode' }) {
  return (
    <div className="card pseudocode">
      <h3 className="card-title">{title}</h3>
      <pre aria-label="Greedy coloring pseudocode">
        {LINES.map((line, i) => (
          <code key={i} className={phase === line.phase ? 'hl' : ''}>
            <span className="ln">{i + 1}</span>
            {line.text}
          </code>
        ))}
      </pre>
    </div>
  );
}
