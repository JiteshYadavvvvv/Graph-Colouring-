import { motion } from 'framer-motion';
import { Activity, Clock, Cpu, GitBranch, Hash, Network, Palette, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { runColoring } from '../api/client';
import StatCard from '../components/StatCard';
import { STRATEGIES } from '../utils/constants';
import { usedColors } from '../utils/helpers';

/** Horizontal bar chart of vertex degrees (single series, one hue). */
function DegreeChart({ graph, coloring }) {
  const [hover, setHover] = useState(null);
  const rows = useMemo(
    () => [...graph.vertices].sort((a, b) => graph.adjacency[b].length - graph.adjacency[a].length || a.localeCompare(b)),
    [graph],
  );
  const max = Math.max(1, graph.statistics.max_degree);
  const ticks = Array.from({ length: max + 1 }, (_, i) => i).filter((t) => max <= 10 || t % 2 === 0);

  return (
    <div className="degree-chart" role="table" aria-label="Degree of each vertex">
      <div className="degree-axis" aria-hidden="true">
        <span />
        <div className="degree-ticks">
          {ticks.map((t) => (
            <span key={t} style={{ left: `${(t / max) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>
      </div>
      {rows.map((v, i) => {
        const d = graph.adjacency[v].length;
        const isMax = d === graph.statistics.max_degree;
        return (
          <div
            key={v}
            className={`degree-row ${hover === v ? 'hover' : ''}`}
            role="row"
            onPointerEnter={() => setHover(v)}
            onPointerLeave={() => setHover(null)}
          >
            <span className="degree-name" role="rowheader">
              {v}
            </span>
            <div className="degree-track" role="cell" aria-label={`degree ${d}`}>
              {ticks.map((t) => (
                <span key={t} className="gridline" style={{ left: `${(t / max) * 100}%` }} aria-hidden="true" />
              ))}
              <motion.div
                className="degree-bar"
                initial={{ width: 0 }}
                animate={{ width: `${(d / max) * 100}%` }}
                transition={{ delay: Math.min(i * 0.025, 0.5), duration: 0.5 }}
              />
              {isMax && (
                <span className="degree-direct" style={{ left: `${(d / max) * 100}%` }}>
                  Δ = {d}
                </span>
              )}
              {hover === v && (
                <div className="chart-tip" style={{ left: `${Math.min((d / max) * 100, 70)}%` }}>
                  <strong>{v}</strong>
                  <span>
                    Degree {d}
                    {coloring[v] ? ` · Color ${coloring[v]}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Runs both vertex orders on the backend and compares how many colors each uses. */
function OrderComparison({ graph }) {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    Promise.all(STRATEGIES.map((s) => runColoring(graph.key, s.id)))
      .then((results) => !cancelled && setState({ status: 'ready', results }))
      .catch((error) => !cancelled && setState({ status: 'error', error }));
    return () => {
      cancelled = true;
    };
  }, [graph.key]);

  return (
    <div className="card">
      <h3 className="card-title">Does vertex order matter?</h3>
      <p className="muted small">Both orders were run on the backend for this dataset.</p>
      {state.status === 'loading' && <p className="muted small">Running both strategies…</p>}
      {state.status === 'error' && <p className="error-text small">{state.error.message}</p>}
      {state.status === 'ready' && (
        <ul className="compare-list">
          {state.results.map((r) => (
            <li key={r.strategy}>
              <span>{r.strategy_label}</span>
              <strong>
                {r.colors_used} colors {r.valid ? '✓' : '✗'}
              </strong>
            </li>
          ))}
          <li className="muted">
            <span>Greedy upper bound (Δ + 1)</span>
            <strong>{graph.statistics.greedy_upper_bound}</strong>
          </li>
        </ul>
      )}
    </div>
  );
}

export default function StatisticsView({ cs }) {
  const { graph, result, coloring, verification, runState } = cs;
  const g = graph.statistics;
  const s = runState === 'done' ? result?.statistics : null;
  const V = g.vertices;
  const E = g.edges;
  const C = s ? s.colors_used : null;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Statistics</span>
          <h1>Algorithm Statistics</h1>
          <p className="muted">
            {graph.name}
            {s ? ` · last run: ${result.strategy_label}` : ' · run the algorithm to fill in the coloring figures'}
          </p>
        </div>
      </header>

      <div className="stat-grid four">
        <StatCard icon={Network} label="Vertices" value={V} hint="V" />
        <StatCard icon={Hash} label="Edges" value={E} hint="E" tone="secondary" delay={0.03} />
        <StatCard icon={Palette} label="Colors Used" value={s ? usedColors(coloring).length : '—'} hint="C" tone="accent" delay={0.06} />
        <StatCard icon={ShieldAlert} label="Conflicts" value={verification ? verification.conflicts.length : '—'} hint="From /api/conflicts" tone={verification?.conflicts.length ? 'danger' : 'success'} delay={0.09} />
        <StatCard icon={GitBranch} label="Maximum Degree" value={g.max_degree} hint="Δ" delay={0.12} />
        <StatCard icon={Activity} label="Average Degree" value={g.average_degree} hint="2E / V" tone="secondary" delay={0.15} />
        <StatCard icon={Cpu} label="Algorithm" value="Greedy" hint={s ? result.strategy_label : 'Graph Coloring'} tone="accent" delay={0.18} />
        <StatCard icon={Clock} label="Time Complexity" value="O(V + E + VC)" hint="Worst case" delay={0.21} />
      </div>

      <div className="viz-layout">
        <div className="viz-main">
          <div className="card complexity">
            <h3 className="card-title">Greedy Graph Coloring: complexity</h3>
            <div className="complexity-grid">
              <div className="complexity-box">
                <span className="eyebrow">Worst-case time</span>
                <span className="big-o">O(V + E + VC)</span>
              </div>
              <div className="complexity-box">
                <span className="eyebrow">Space</span>
                <span className="big-o">O(V + E)</span>
              </div>
            </div>
            <ul className="explain-list">
              <li>
                <strong>V</strong> = number of vertices, <strong>E</strong> = number of edges, <strong>C</strong> = number
                of colors in use.
              </li>
              <li>
                <strong>O(V + E)</strong>: every vertex is visited once, and every adjacency-list entry is read once to
                collect the neighbors’ colors (2E entries in total).
              </li>
              <li>
                <strong>O(V · C)</strong>: for each vertex, this implementation also lists every color in the current
                palette that is still available, so the visualization can show it. The smallest free color is found
                within deg(v) + 1 tries, so the core decision alone is O(V + E).
              </li>
              <li>
                <strong>Space O(V + E)</strong>: the adjacency list stores V + 2E entries, and the coloring uses O(V).
              </li>
            </ul>
            {s && (
              <div className="measured">
                <span className="eyebrow">Measured on this run</span>
                <div className="measured-grid">
                  <div>
                    <strong>{s.neighbor_checks}</strong>
                    <span>neighbor checks (= 2E = {2 * E})</span>
                  </div>
                  <div>
                    <strong>{s.color_checks}</strong>
                    <span>candidate colors tested</span>
                  </div>
                  <div>
                    <strong>{V + E + V * C}</strong>
                    <span>
                      V + E + V·C with V={V}, E={E}, C={C}
                    </span>
                  </div>
                  <div>
                    <strong>{s.execution_ms} ms</strong>
                    <span>backend execution time</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-title-row">
              <h3 className="card-title">Degree of each vertex</h3>
              <span className="muted small">Average {g.average_degree} · density {g.density}</span>
            </div>
            <DegreeChart graph={graph} coloring={coloring} />
          </div>
        </div>
        <aside className="viz-side">
          <OrderComparison graph={graph} />
          <div className="card">
            <h3 className="card-title">Bounds on the number of colors</h3>
            <ul className="compare-list">
              <li>
                <span>Greedy never exceeds Δ + 1</span>
                <strong>{g.greedy_upper_bound}</strong>
              </li>
              <li>
                <span>Minimum degree</span>
                <strong>{g.min_degree}</strong>
              </li>
              {graph.kind === 'map' && (
                <li>
                  <span>Four Color Theorem (planar maps)</span>
                  <strong>≤ 4</strong>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
