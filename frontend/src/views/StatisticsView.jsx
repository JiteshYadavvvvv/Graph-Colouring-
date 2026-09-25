import { motion } from 'framer-motion';
import { Activity, ArrowRight, Clock, Cpu, GitBranch, Hash, Network, Palette, ShieldAlert, Sigma } from 'lucide-react';
import { useMemo, useState } from 'react';
import Button from '../components/Button';
import ChromaticCard from '../components/ChromaticCard';
import ColorDistribution from '../components/ColorDistribution';
import { chromaticText } from '../utils/status';
import StatCard from '../components/StatCard';
import { strategyInfo } from '../utils/constants';
import { formatMs, nameOf, usedColors } from '../utils/helpers';

/** Horizontal bar chart of vertex degrees (single series, one hue). */
function DegreeChart({ graph, coloring }) {
  const [hover, setHover] = useState(null);
  const rows = useMemo(
    () =>
      [...graph.vertices].sort(
        (a, b) => graph.adjacency[b].length - graph.adjacency[a].length || nameOf(graph, a).localeCompare(nameOf(graph, b)),
      ),
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
              {nameOf(graph, v)}
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
                  <strong>{nameOf(graph, v)}</strong>
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

const COMPLEXITY_ROWS = [
  {
    id: 'natural',
    time: 'O(V + E)',
    why: 'Each vertex is visited once and each adjacency entry is read once (2E entries). The smallest free color is found within deg(v) + 1 tries.',
  },
  {
    id: 'largest_first',
    time: 'O(V log V + E)',
    why: 'Same loop as above, after sorting the vertices by degree once (O(V log V)).',
  },
  {
    id: 'dsatur',
    time: 'O(V² + E)',
    why: 'Before every step, all uncolored vertices are scanned to find the most saturated one (O(V) per step, V steps).',
  },
];

export default function StatisticsView({ cs, navigate }) {
  const { graph, result, coloring, verification, runState } = cs;
  const g = graph.statistics;
  const s = runState === 'done' ? result?.statistics : null;
  const V = g.vertices;
  const E = g.edges;
  const C = s ? s.colors_used : null;
  const activeStrategy = result?.strategy ?? cs.strategy;

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
        <StatCard icon={Palette} label="Colors Produced" value={s ? usedColors(coloring).length : '—'} hint="C, by the algorithm" tone="accent" delay={0.06} />
        <StatCard icon={Sigma} label="Known Minimum" value={chromaticText(graph.chromatic)} hint={graph.chromatic?.exact ? 'χ, proven' : 'χ, bounds only'} delay={0.09} />
        <StatCard icon={GitBranch} label="Max / Min Degree" value={`${g.max_degree} / ${g.min_degree}`} hint="Δ / δ" delay={0.12} />
        <StatCard icon={Activity} label="Average Degree" value={g.average_degree} hint="2E / V" tone="secondary" delay={0.15} />
        <StatCard icon={ShieldAlert} label="Conflicts" value={verification ? verification.conflicts.length : '—'} hint="From /api/conflicts" tone={verification?.conflicts.length ? 'danger' : 'success'} delay={0.18} />
        <StatCard icon={Cpu} label="Algorithm" value="Greedy" hint={strategyInfo(activeStrategy).short} tone="accent" delay={0.21} />
      </div>

      <div className="viz-layout">
        <div className="viz-main">
          <div className="card complexity">
            <h3 className="card-title">Complexity of this implementation</h3>
            <div className="complexity-grid">
              <div className="complexity-box">
                <span className="eyebrow">Time (greedy, natural order)</span>
                <span className="big-o">O(V + E)</span>
              </div>
              <div className="complexity-box">
                <span className="eyebrow">Extra space</span>
                <span className="big-o">O(V)</span>
              </div>
            </div>
            <ul className="explain-list">
              <li>
                <strong>V</strong> = number of vertices, <strong>E</strong> = number of edges, <strong>C</strong> = number
                of colors in use, <strong>Δ</strong> = maximum degree.
              </li>
              <li>
                <strong>Time O(V + E)</strong>: every vertex is visited once, and every adjacency-list entry is read once
                to collect the neighbors’ colors (2E entries in total). A vertex with d neighbors can see at most d
                colors, so the search for the smallest free color stops within d + 1 tries, which adds up to O(V + E).
              </li>
              <li>
                <strong>Space O(V)</strong>: the color of each vertex, plus a temporary set of at most Δ neighbor
                colors. The input adjacency list itself takes O(V + E).
              </li>
              <li>
                <strong>What this app runs</strong>: the backend also records every decision so the browser can replay
                it. Listing each vertex’s blocked and available colors adds O(V · C) time, and the recorded trace
                stores each vertex’s neighbor list and those colors, O(V + E + V · C) space. The coloring decisions are
                unchanged.
              </li>
            </ul>
            <div className="table-scroll">
              <table className="data-table complexity-table">
                <thead>
                  <tr>
                    <th scope="col">Vertex order</th>
                    <th scope="col">Time</th>
                    <th scope="col">Why</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPLEXITY_ROWS.map((row) => (
                    <tr key={row.id} className={row.id === activeStrategy ? 'selected' : ''}>
                      <td className="nowrap">
                        <strong>{strategyInfo(row.id).algorithm}</strong>
                      </td>
                      <td className="nowrap">
                        <code>{row.time}</code>
                      </td>
                      <td>{row.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                    <strong>{formatMs(s.execution_ms)}</strong>
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
          <ChromaticCard graph={graph} colorsUsed={s ? usedColors(coloring).length : null} />
          {s && (
            <div className="card">
              <h3 className="card-title">Color distribution</h3>
              <ColorDistribution graph={graph} coloring={coloring} order={result.order} />
            </div>
          )}
          <div className="card">
            <h3 className="card-title">Bounds on the number of colors</h3>
            <ul className="compare-list">
              <li>
                <span>Greedy never exceeds Δ + 1</span>
                <strong>{g.greedy_upper_bound}</strong>
              </li>
              <li>
                <span>Proven lower bound (no fewer colors can work)</span>
                <strong>{graph.chromatic?.lower_bound}</strong>
              </li>
              {graph.kind === 'map' && (
                <li>
                  <span>Four Color Theorem (planar maps)</span>
                  <strong>≤ 4</strong>
                </li>
              )}
            </ul>
            <Button variant="secondary" size="sm" icon={ArrowRight} onClick={() => navigate('compare')}>
              Compare algorithms
            </Button>
          </div>
          <div className="card">
            <h3 className="card-title">
              <Clock size={16} aria-hidden="true" /> Timing note
            </h3>
            <p className="muted small">
              The execution time is measured on the backend with a high-resolution timer around the algorithm only.
              On graphs this small it is far shorter than the network round trip, so it varies from run to run and
              does not reflect what you wait for in the browser.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
