import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { colorName, nameOf } from '../utils/helpers';
import ColorChip from './ColorChip';

const COLUMNS = [
  { id: 'order', label: 'Order' },
  { id: 'region', label: 'Region' },
  { id: 'degree', label: 'Degree' },
  { id: 'color', label: 'Assigned Color' },
];

/** Final coloring, sortable by visiting order, region name, degree, or color. */
export default function ResultsTable({ result, graph, coloring, conflictVertices }) {
  const [sort, setSort] = useState({ key: 'order', dir: 'asc' });

  const rows = useMemo(() => {
    const data = result.steps.map((s) => ({
      order: s.step,
      id: s.vertex,
      region: nameOf(graph, s.vertex),
      degree: s.degree,
      color: coloring[s.vertex],
      changed: coloring[s.vertex] !== s.assigned_color,
    }));
    const factor = sort.dir === 'asc' ? 1 : -1;
    return data.sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      const primary = typeof x === 'string' ? x.localeCompare(y) : x - y;
      return (primary || a.order - b.order) * factor;
    });
  }, [result, graph, coloring, sort]);

  const toggle = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label="Color assignment of every vertex">
      <table className="data-table results-table">
        <thead>
          <tr>
            {COLUMNS.map((c) => {
              const active = sort.key === c.id;
              const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
              return (
                <th key={c.id} scope="col" aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button className="sort-btn" onClick={() => toggle(c.id)}>
                    {c.label}
                    <Icon size={13} aria-hidden="true" />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={conflictVertices.has(r.id) ? 'conflict' : ''}>
              <td className="muted">{String(r.order).padStart(2, '0')}</td>
              <td>
                <strong>{r.region}</strong>
                {r.id !== r.region && <span className="muted small id-sub">{r.id}</span>}
              </td>
              <td>{r.degree}</td>
              <td className="nowrap">
                <ColorChip color={r.color} /> Color {r.color} <span className="muted small">({colorName(r.color)})</span>
                {r.changed && <span className="pill pill-danger">simulated</span>}
                {conflictVertices.has(r.id) && <span className="pill pill-danger">⚠ conflict</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
