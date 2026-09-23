import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import ColorChip from './ColorChip';

/** Adjacency list received from the backend, shown as a tree or as a table. */
export default function AdjacencyTable({ graph, coloring = {}, selected, onSelect }) {
  const [mode, setMode] = useState('tree');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return graph.vertices.filter(
      (v) => !q || v.toLowerCase().includes(q) || graph.adjacency[v].some((n) => n.toLowerCase().includes(q)),
    );
  }, [graph, query]);

  const select = (v) => onSelect?.(selected === v ? null : v);

  return (
    <div className="card adjacency">
      <div className="card-title-row wrap">
        <div>
          <h3 className="card-title">Adjacency List</h3>
          <p className="muted small">
            Served by <code>GET /api/graph/{graph.key}</code>: {graph.vertices.length} vertices, {graph.edges.length} edges
          </p>
        </div>
        <div className="adjacency-tools">
          <label className="search-field">
            <Search size={14} aria-hidden="true" />
            <input
              type="search"
              placeholder="Filter regions"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Filter adjacency list"
            />
          </label>
          <div className="segmented" role="tablist" aria-label="Adjacency display mode">
            {['tree', 'table'].map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                className={mode === m ? 'active' : ''}
                onClick={() => setMode(m)}
              >
                {m === 'tree' ? 'Tree' : 'Table'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {rows.length === 0 && <p className="muted small">No region matches “{query}”.</p>}

      {mode === 'tree' ? (
        <div className="adj-tree">
          {rows.map((v) => {
            const neighbors = graph.adjacency[v];
            return (
              <div
                key={v}
                role="button"
                tabIndex={0}
                className={`adj-node ${selected === v ? 'selected' : ''}`}
                onClick={() => select(v)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), select(v))}
                aria-pressed={selected === v}
              >
                <div className="adj-root">
                  {coloring[v] ? <ColorChip color={coloring[v]} /> : <span className="dot-neutral" aria-hidden="true" />}
                  <strong>{v}</strong>
                  <span className="degree-badge">{neighbors.length}</span>
                </div>
                <ul>
                  {neighbors.map((n, i) => (
                    <li key={n}>
                      <span className="branch" aria-hidden="true">
                        {i === neighbors.length - 1 ? '└──' : '├──'}
                      </span>
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Region</th>
                <th scope="col">Degree</th>
                <th scope="col">Adjacent Regions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr
                  key={v}
                  className={selected === v ? 'selected' : ''}
                  onClick={() => select(v)}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), select(v))}
                >
                  <td className="nowrap">
                    <strong>{v}</strong>
                  </td>
                  <td>{graph.adjacency[v].length}</td>
                  <td>{graph.adjacency[v].join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
