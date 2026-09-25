import { motion } from 'framer-motion';
import {
  CircleCheck,
  CirclePlus,
  Eraser,
  Eye,
  Info,
  Link2,
  LoaderCircle,
  MousePointer2,
  Play,
  Plus,
  Shuffle,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getGraph } from '../api/client';
import Button from '../components/Button';
import Segmented from '../components/Segmented';
import { EXAMPLES } from '../content/examples';
import { MAX_NAME_LENGTH, MAX_VERTICES } from '../hooks/usePlayground';
import { CUSTOM_DATASET, STRATEGIES } from '../utils/constants';
import { graphMetrics, isComplete, numberWord } from '../utils/graphMetrics';
import { chromaticText } from '../utils/status';
import GraphEditor from '../visualization/GraphEditor';

const TOOLS = [
  { value: 'select', label: 'Select', icon: MousePointer2, title: 'Select and drag vertices' },
  { value: 'vertex', label: 'Vertex', icon: CirclePlus, title: 'Click the canvas to add a vertex' },
  { value: 'edge', label: 'Edge', icon: Link2, title: 'Click two vertices to connect them' },
  { value: 'erase', label: 'Delete', icon: Eraser, title: 'Click a vertex or an edge to delete it' },
];

/** Starting points: the backend's datasets (actual graph data) or an empty graph. */
const PRESETS = [
  { key: 'india', label: 'India States' },
  { key: 'triangle', label: 'Triangle Graph' },
  { key: 'cycle', label: 'Cycle Graph' },
  { key: 'complete', label: 'Complete Graph K5' },
  { key: 'bipartite', label: 'Bipartite Graph' },
  { key: 'custom', label: 'Custom Graph' },
];

function RenameField({ pg, vertex, onMessage }) {
  const [draft, setDraft] = useState(vertex.name);
  useEffect(() => setDraft(vertex.name), [vertex.id, vertex.name]);
  const commit = () => {
    if (draft === vertex.name) return;
    const error = pg.renameVertex(vertex.id, draft);
    onMessage(error ? { tone: 'error', text: error } : { tone: 'info', text: `Renamed to ${draft.trim()}.` });
    if (error) setDraft(vertex.name);
  };
  return (
    <label className="field">
      <span>Name</span>
      <input
        value={draft}
        maxLength={MAX_NAME_LENGTH + 5}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), commit())}
        aria-describedby="rename-help"
      />
      <small id="rename-help" className="muted">
        ID <code>{vertex.id}</code> stays the same when you rename.
      </small>
    </label>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div title={hint}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/**
 * Shown whenever the graph is complete (every pair of vertices adjacent):
 * why K_n needs exactly n colors, with the figures of the graph on screen.
 */
function CompleteGraphDemo({ n, produced, chromatic }) {
  return (
    <section className="card demo-card" aria-labelledby="demo-title">
      <span className="eyebrow">Demonstration</span>
      <h3 id="demo-title">
        Why K{n} needs {n} colors
      </h3>
      <p>
        K{n} is a complete graph with {numberWord(n)} vertices. Because every pair of vertices is adjacent, each vertex
        requires a different color.
      </p>
      <ul className="demo-points">
        <li>
          E = n(n − 1) / 2 = {n}·{n - 1} / 2 = {(n * (n - 1)) / 2} edges: every pair of vertices is joined.
        </li>
        <li>
          Every vertex is adjacent to the other n − 1 = {n - 1} vertices, so no two vertices can share a color.
        </li>
        <li>
          So at least {n} colors are needed, and {n} are enough: the known minimum is χ(K{n}) = {n}.
        </li>
      </ul>
      {produced ? (
        <p className="demo-result">
          <CircleCheck size={16} aria-hidden="true" /> The algorithm produced {produced} colors; the known minimum is{' '}
          {chromatic ? chromaticText(chromatic) : n}. For a complete graph they always match.
        </p>
      ) : (
        <p className="muted small">Run coloring to see the algorithm produce {n} colors.</p>
      )}
    </section>
  );
}

/** Notes of an unmodified preset: the dataset's own description and characteristics. */
function OriginNotes({ origin }) {
  return (
    <section className="card demo-card" aria-label={`About ${origin.title}`}>
      <span className="eyebrow">About this graph</span>
      <h3>{origin.title}</h3>
      {origin.description && <p>{origin.description}</p>}
      {origin.hint && <p>{origin.hint}</p>}
      {origin.characteristics?.length > 0 && (
        <ul className="demo-points">
          {origin.characteristics.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Graph Playground: build or load a graph, measure it, and color it with the
 * backend's coloring engine (POST /api/analyze, then POST /api/color), the
 * same engine the rest of the application uses. No coloring happens here.
 */
export default function PlaygroundView({ cs, pg, navigate }) {
  const [tool, setTool] = useState('select');
  const [message, setMessage] = useState(null);
  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');
  const [randomN, setRandomN] = useState(8);
  const [randomP, setRandomP] = useState(0.35);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(null); // 'preset' | 'run' | null

  useEffect(() => {
    if (!confirmClear) return undefined;
    const timer = setTimeout(() => setConfirmClear(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmClear]);

  const selected = pg.selected ? pg.byId[pg.selected] : null;
  const sortedVertices = useMemo(() => [...pg.vertices].sort((a, b) => a.name.localeCompare(b.name)), [pg.vertices]);
  const metrics = useMemo(() => graphMetrics(pg.vertices.map((v) => v.id), pg.edges), [pg.vertices, pg.edges]);

  // Backend results are shown only while they belong to the graph as it is now.
  const current = pg.colored && cs.graph?.key === CUSTOM_DATASET && cs.result && cs.runState === 'done';
  const result = current ? cs.result : null;
  const chromatic = current ? cs.graph.chromatic : null;
  const activePreset = pg.unmodified ? (pg.origin.kind === 'dataset' ? pg.origin.key : pg.origin.kind === 'custom' ? 'custom' : null) : null;

  const loadPreset = async (key) => {
    setMessage(null);
    if (key === 'custom') {
      pg.clear();
      setMessage({ tone: 'info', text: 'Empty graph: add vertices with the Vertex tool or the “Add vertex” button.' });
      return;
    }
    setBusy('preset');
    try {
      const graph = await getGraph(key);
      pg.loadDataset(graph);
      setMessage({ tone: 'info', text: `Loaded ${graph.name}: ${graph.vertices.length} vertices, ${graph.edges.length} edges.` });
    } catch (error) {
      setMessage({ tone: 'error', text: error.message });
    } finally {
      setBusy(null);
    }
  };

  const addEdgeFromForm = (event) => {
    event.preventDefault();
    const error = pg.addEdge(edgeFrom, edgeTo);
    setMessage(
      error
        ? { tone: 'error', text: error }
        : { tone: 'info', text: `Connected ${pg.byId[edgeFrom].name} – ${pg.byId[edgeTo].name}.` },
    );
  };

  /** Validate the graph on the backend, then color it there (in place or step by step). */
  const runColoring = async (mode) => {
    if (!pg.vertices.length) {
      setMessage({ tone: 'error', text: 'The graph is empty. Add at least one vertex first.' });
      return;
    }
    setBusy('run');
    setMessage(null);
    try {
      const analyzed = await cs.loadCustomGraph(pg.toSpec());
      pg.markRun();
      if (mode === 'watch') {
        navigate('map');
        cs.run('animate', { graph: analyzed });
      } else {
        await cs.run('instant', { graph: analyzed });
      }
    } catch (error) {
      setMessage({ tone: 'error', text: error.message });
    } finally {
      setBusy(null);
    }
  };

  const verification = current ? cs.verification : null;
  const conflictCount = verification ? verification.conflicts.length : null;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Graph Playground</span>
          <h1>Build Your Own Graph</h1>
          <p className="muted">
            Load a dataset or build a graph, edit it, and color it with the same backend engine as the rest of the
            application. The graph is validated and colored on the server; this page only draws and measures it.
          </p>
        </div>
      </header>

      <section className="card playground-presets" aria-label="Start from a dataset">
        <span className="playground-presets-label">Start from</span>
        <div className="playground-preset-list">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={`dataset-chip ${activePreset === preset.key ? 'active' : ''}`}
              aria-pressed={activePreset === preset.key}
              onClick={() => loadPreset(preset.key)}
              disabled={busy === 'preset'}
            >
              <strong>{preset.label}</strong>
            </button>
          ))}
        </div>
        <label className="select-inline">
          <span className="sr-only">Load an application example</span>
          <select
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              pg.loadExample(e.target.value);
              setMessage({ tone: 'info', text: EXAMPLES[e.target.value].hint });
            }}
          >
            <option value="">Application example…</option>
            {Object.entries(EXAMPLES).map(([key, ex]) => (
              <option key={key} value={key}>
                {ex.title}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="card playground-toolbar" role="toolbar" aria-label="Editing tools">
        <Segmented options={TOOLS} value={tool} onChange={setTool} ariaLabel="Editing tool" />
        <div className="toolbar-actions">
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => {
              const error = pg.addVertex();
              setMessage(error ? { tone: 'error', text: error } : { tone: 'info', text: 'Vertex added.' });
            }}
            disabled={pg.vertices.length >= MAX_VERTICES}
          >
            Add vertex
          </Button>
          <Button
            variant={confirmClear ? 'danger' : 'ghost'}
            size="sm"
            icon={Trash2}
            onClick={() => {
              if (!confirmClear) {
                setConfirmClear(true);
                return;
              }
              pg.clear();
              setConfirmClear(false);
              setMessage({ tone: 'info', text: 'Graph cleared.' });
            }}
            disabled={!pg.vertices.length}
          >
            {confirmClear ? 'Click again to clear' : 'Clear graph'}
          </Button>
        </div>
      </div>

      <div className="viz-layout">
        <div className="viz-main">
          <div className="card viz-card">
            <div className="card-title-row wrap">
              <div className="viz-title">
                <h3 className="card-title">{pg.unmodified ? pg.origin.title : `${pg.origin.title} (edited)`}</h3>
                <span className="muted small">
                  {metrics.V} vertices · {metrics.E} edges
                  {result ? ` · colored by the backend with ${result.colors_used} colors` : ''}
                </span>
              </div>
            </div>
            <GraphEditor
              pg={pg}
              tool={tool}
              onMessage={setMessage}
              coloring={current ? cs.coloring : null}
              conflicts={current ? cs.conflicts.vertices : null}
            />
            {message && (
              <motion.p
                key={message.text}
                className={`editor-message tone-${message.tone}`}
                role={message.tone === 'error' ? 'alert' : 'status'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {message.tone === 'error' ? <TriangleAlert size={15} aria-hidden="true" /> : <Info size={15} aria-hidden="true" />}
                {message.text}
              </motion.p>
            )}
            <p className="muted small">
              Keyboard: Tab to a vertex, Enter to use the current tool, Delete to remove it, arrow keys to move it.
            </p>
          </div>

          <section className="card playground-metrics" aria-labelledby="metrics-title">
            <h3 id="metrics-title" className="card-title">
              Graph metrics
            </h3>
            <dl className="metric-grid six">
              <Metric label="V" value={metrics.V} hint="Number of vertices" />
              <Metric label="E" value={metrics.E} hint="Number of edges" />
              <Metric label="Density" value={metrics.density.toFixed(3)} hint="E divided by the number of vertex pairs, V(V − 1) / 2" />
              <Metric label="Min degree" value={metrics.minDegree} />
              <Metric label="Max degree" value={metrics.maxDegree} />
              <Metric label="Avg degree" value={metrics.averageDegree.toFixed(2)} hint="2E / V" />
            </dl>
            <h4 className="subhead">Coloring</h4>
            <dl className="metric-grid three">
              <Metric label="Colors produced by algorithm" value={result ? result.colors_used : '—'} />
              <Metric
                label="Conflicts"
                value={verification ? conflictCount : current && cs.verifying ? '…' : '—'}
              />
              <Metric
                label={
                  <>
                    Known minimum <span className="nocase">(χ)</span>
                  </>
                }
                value={chromatic ? `${chromaticText(chromatic)}${chromatic.exact ? '' : ' (bounds)'}` : '—'}
              />
            </dl>
            <p className="muted small">
              {chromatic
                ? chromatic.exact
                  ? `The minimum was proven by an exact search on the backend. The algorithm's count is not guaranteed to match it on other graphs.`
                  : 'The minimum could not be proven within the search budget, so only bounds are shown.'
                : 'Run coloring to get the colors produced and the known minimum from the backend.'}
            </p>
          </section>

          {isComplete(metrics) ? (
            <CompleteGraphDemo n={metrics.V} produced={result?.colors_used} chromatic={chromatic} />
          ) : (
            pg.unmodified && (pg.origin.kind === 'dataset' || pg.origin.kind === 'example') && <OriginNotes origin={pg.origin} />
          )}
        </div>

        <aside className="viz-side">
          <div className="card run-card">
            <h3 className="card-title">Color this graph</h3>
            <label className="field">
              <span>Vertex order</span>
              <select value={cs.strategy} onChange={(e) => cs.setStrategy(e.target.value)}>
                {STRATEGIES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <Button icon={busy === 'run' ? LoaderCircle : Play} onClick={() => runColoring('instant')} disabled={Boolean(busy) || !pg.vertices.length}>
              {busy === 'run' ? 'Coloring…' : 'Run coloring'}
            </Button>
            <Button variant="secondary" icon={Eye} onClick={() => runColoring('watch')} disabled={Boolean(busy) || !pg.vertices.length}>
              Watch step by step
            </Button>
            <p className="muted small">
              {result
                ? 'Colored by the backend. Edit the graph and run again to recolor it.'
                : pg.colored === false && pg.vertices.length && cs.graph?.key === CUSTOM_DATASET
                  ? 'The graph has changed since the last run.'
                  : 'The backend validates the graph, colors it, and checks every edge.'}
            </p>
          </div>


          <div className="card">
            <h3 className="card-title">Selected vertex</h3>
            {selected ? (
              <>
                <RenameField pg={pg} vertex={selected} onMessage={setMessage} />
                <p className="small">
                  Degree <strong>{pg.degree(selected.id)}</strong>
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => {
                    pg.removeVertex(selected.id);
                    setMessage({ tone: 'info', text: `Deleted vertex ${selected.name} and its edges.` });
                  }}
                >
                  Delete vertex
                </Button>
              </>
            ) : (
              <p className="muted small">Click a vertex (Select tool) to rename or delete it.</p>
            )}
          </div>

          <form className="card" onSubmit={addEdgeFromForm}>
            <h3 className="card-title">Add edge</h3>
            <div className="edge-form">
              <label className="field">
                <span>From</span>
                <select value={edgeFrom} onChange={(e) => setEdgeFrom(e.target.value)} required>
                  <option value="">Choose…</option>
                  {sortedVertices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>To</span>
                <select value={edgeTo} onChange={(e) => setEdgeTo(e.target.value)} required>
                  <option value="">Choose…</option>
                  {sortedVertices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit" size="sm" variant="secondary" icon={Link2} disabled={pg.vertices.length < 2}>
                Add
              </Button>
            </div>
          </form>

          <div className="card">
            <div className="card-title-row">
              <h3 className="card-title">Edges</h3>
              <span className="pill">{pg.edges.length}</span>
            </div>
            {pg.edges.length ? (
              <ul className="edge-list">
                {pg.edges.map(([a, b]) => (
                  <li key={`${a}|${b}`}>
                    <span>
                      {pg.byId[a].name} – {pg.byId[b].name}
                    </span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => {
                        pg.removeEdge(a, b);
                        setMessage({ tone: 'info', text: `Deleted edge ${pg.byId[a].name} – ${pg.byId[b].name}.` });
                      }}
                      aria-label={`Delete edge ${pg.byId[a].name} – ${pg.byId[b].name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">No edges yet.</p>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Random graph</h3>
            <label className="field">
              <span>
                Vertices: <strong>{randomN}</strong>
              </span>
              <input type="range" min={3} max={20} value={randomN} onChange={(e) => setRandomN(Number(e.target.value))} />
            </label>
            <label className="field">
              <span>
                Edge probability: <strong>{Math.round(randomP * 100)}%</strong>
              </span>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={randomP}
                onChange={(e) => setRandomP(Number(e.target.value))}
              />
            </label>
            <Button
              variant="secondary"
              size="sm"
              icon={Shuffle}
              onClick={() => {
                pg.randomGraph(randomN, randomP);
                setMessage({ tone: 'info', text: `Generated a random graph with ${randomN} vertices.` });
              }}
            >
              Generate
            </Button>
            <p className="muted small">Replaces the current graph. Each pair of vertices is joined with the chosen probability.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
