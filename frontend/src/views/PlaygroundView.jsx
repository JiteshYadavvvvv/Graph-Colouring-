import { AnimatePresence, motion } from 'framer-motion';
import {
  CirclePlus,
  Eraser,
  Info,
  Link2,
  MousePointer2,
  Play,
  Plus,
  Shuffle,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button';
import Segmented from '../components/Segmented';
import { EXAMPLES } from '../content/examples';
import { MAX_NAME_LENGTH, MAX_VERTICES } from '../hooks/usePlayground';
import { STRATEGIES } from '../utils/constants';
import GraphEditor from '../visualization/GraphEditor';

const TOOLS = [
  { value: 'select', label: 'Select', icon: MousePointer2, title: 'Select and drag vertices' },
  { value: 'vertex', label: 'Vertex', icon: CirclePlus, title: 'Click the canvas to add a vertex' },
  { value: 'edge', label: 'Edge', icon: Link2, title: 'Click two vertices to connect them' },
  { value: 'erase', label: 'Delete', icon: Eraser, title: 'Click a vertex or an edge to delete it' },
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

export default function PlaygroundView({ cs, pg, navigate }) {
  const [tool, setTool] = useState('select');
  const [message, setMessage] = useState(null);
  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');
  const [randomN, setRandomN] = useState(8);
  const [randomP, setRandomP] = useState(0.35);
  const [confirmClear, setConfirmClear] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!confirmClear) return undefined;
    const timer = setTimeout(() => setConfirmClear(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmClear]);

  const selected = pg.selected ? pg.byId[pg.selected] : null;
  const maxDegree = pg.vertices.reduce((max, v) => Math.max(max, pg.degree(v.id)), 0);
  const sortedVertices = useMemo(() => [...pg.vertices].sort((a, b) => a.name.localeCompare(b.name)), [pg.vertices]);

  const addEdgeFromForm = (event) => {
    event.preventDefault();
    const error = pg.addEdge(edgeFrom, edgeTo);
    setMessage(
      error
        ? { tone: 'error', text: error }
        : { tone: 'info', text: `Connected ${pg.byId[edgeFrom].name} – ${pg.byId[edgeTo].name}.` },
    );
  };

  const colorIt = async () => {
    if (!pg.vertices.length) {
      setMessage({ tone: 'error', text: 'The graph is empty. Add at least one vertex first.' });
      return;
    }
    setSubmitting(true);
    setMessage({ tone: 'info', text: 'Sending the graph to the backend…' });
    try {
      const analyzed = await cs.loadCustomGraph(pg.toSpec());
      navigate('graph');
      cs.run('animate', { graph: analyzed });
    } catch (error) {
      setMessage({ tone: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Graph Playground</span>
          <h1>Build Your Own Graph</h1>
          <p className="muted">
            Draw a graph, then color it with the same backend algorithm used for the map. The graph is validated on the
            server, so every result you see is computed there.
          </p>
        </div>
      </header>

      <div className="card playground-toolbar" role="toolbar" aria-label="Playground tools">
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
          <label className="select-inline">
            <span className="sr-only">Load an example</span>
            <select
              value=""
              onChange={(e) => {
                if (!e.target.value) return;
                pg.loadExample(e.target.value);
                setMessage({ tone: 'info', text: EXAMPLES[e.target.value].hint });
              }}
            >
              <option value="">Load example…</option>
              {Object.entries(EXAMPLES).map(([key, ex]) => (
                <option key={key} value={key}>
                  {ex.title}
                </option>
              ))}
            </select>
          </label>
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
                <h3 className="card-title">Canvas</h3>
                <span className="muted small">
                  {pg.vertices.length} vertices · {pg.edges.length} edges · max degree {maxDegree}
                </span>
              </div>
            </div>
            <GraphEditor pg={pg} tool={tool} onMessage={setMessage} />
            <AnimatePresence mode="wait">
              {message && (
                <motion.p
                  key={message.text}
                  className={`editor-message tone-${message.tone}`}
                  role={message.tone === 'error' ? 'alert' : 'status'}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {message.tone === 'error' ? <TriangleAlert size={15} aria-hidden="true" /> : <Info size={15} aria-hidden="true" />}
                  {message.text}
                </motion.p>
              )}
            </AnimatePresence>
            <p className="muted small">
              Keyboard: Tab to a vertex, Enter to use the current tool, Delete to remove it, arrow keys to move it.
            </p>
          </div>
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
            <Button icon={Play} onClick={colorIt} disabled={submitting || !pg.vertices.length}>
              {submitting ? 'Sending…' : 'Run coloring'}
            </Button>
            <p className="muted small">
              Opens the Graph view and replays the backend’s steps. Results, Conflicts, Statistics, Compare and Export
              then work on your graph too.
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
