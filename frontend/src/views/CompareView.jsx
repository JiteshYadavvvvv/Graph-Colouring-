import { motion } from 'framer-motion';
import { CircleCheck, CircleX, Play, Scale } from 'lucide-react';
import { useEffect, useState } from 'react';
import { compareAlgorithms } from '../api/client';
import Button from '../components/Button';
import { chromaticText } from '../components/GraphInfoPanel';
import LoadingState, { ErrorState } from '../components/LoadingState';
import { CUSTOM_DATASET } from '../utils/constants';
import { formatMs, nameOf } from '../utils/helpers';

const EXPLANATIONS = {
  greedy: 'Colors the vertices in the order they are listed. Fast and simple, but the result depends entirely on that order.',
  welsh_powell:
    'Sorts the vertices by degree first, so the most constrained vertices are colored while many colors are still free. Then it assigns color 1 to every vertex it can, then color 2, and so on.',
  dsatur:
    'Re-decides the order at every step: it colors next the vertex whose neighbors already use the most different colors (its saturation), because that vertex has the fewest options left.',
};

function OrderPreview({ graph, order }) {
  const [open, setOpen] = useState(false);
  const shown = open ? order : order.slice(0, 8);
  return (
    <div className="order-preview">
      <ol>
        {shown.map((v) => (
          <li key={v}>{nameOf(graph, v)}</li>
        ))}
      </ol>
      {order.length > 8 && (
        <button type="button" className="link-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? 'Show less' : `+ ${order.length - 8} more`}
        </button>
      )}
    </div>
  );
}

/** A sentence about what happened on THIS graph, from the actual results. */
function observation(results, chromatic) {
  const counts = results.map((r) => r.colors_used);
  const best = Math.min(...counts);
  const worst = Math.max(...counts);
  const optimal = chromatic?.value;
  if (best === worst) {
    return `All three algorithms used ${best} colors on this graph${
      optimal === best ? ', which is the minimum possible' : ''
    }. On other graphs (try the Bipartite (Crown) dataset) they can disagree.`;
  }
  const winners = results.filter((r) => r.colors_used === best).map((r) => r.name);
  const losers = results.filter((r) => r.colors_used === worst).map((r) => r.name);
  return `On this graph ${winners.join(' and ')} used ${best} colors while ${losers.join(' and ')} used ${worst}${
    optimal === best ? ` (${best} is the minimum possible)` : ''
  }. That is a property of this graph and vertex order, not a general ranking.`;
}

export default function CompareView({ cs, navigate }) {
  const { graph } = cs;
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    const source = graph.key === CUSTOM_DATASET ? { graph: graph.adjacency, names: graph.names } : { dataset: graph.key };
    compareAlgorithms(source)
      .then((data) => !cancelled && setState({ status: 'ready', data }))
      .catch((error) => !cancelled && setState({ status: 'error', error }));
    return () => {
      cancelled = true;
    };
  }, [graph, attempt]);

  const replay = (strategy) => {
    cs.setStrategy(strategy);
    navigate(graph.kind === 'map' ? 'map' : 'graph');
    cs.run('animate', { strategy });
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Compare</span>
          <h1>Algorithm Comparison</h1>
          <p className="muted">
            Greedy Coloring is the main algorithm of this project. Welsh–Powell and DSATUR are greedy too: they never
            undo a color and differ only in the ORDER in which vertices are colored. All three are implemented by hand
            and run on the backend for <strong>{graph.name}</strong>.
          </p>
        </div>
      </header>

      {state.status === 'loading' && <LoadingState label="Running all three algorithms on the backend…" />}
      {state.status === 'error' && (
        <ErrorState title="Comparison failed" message={state.error.message} onRetry={() => setAttempt((a) => a + 1)} />
      )}
      {state.status === 'ready' && (
        <>
          <section className="card">
            <div className="card-title-row wrap">
              <h3 className="card-title">Results on {graph.name}</h3>
              <span className="muted small">
                {state.data.vertices} vertices · {state.data.edges} edges · minimum possible χ ={' '}
                {chromaticText(state.data.chromatic)}
                {state.data.chromatic.exact ? '' : ' (bounds)'}
              </span>
            </div>
            <div className="table-scroll">
              <table className="data-table compare-table">
                <thead>
                  <tr>
                    <th scope="col">Algorithm</th>
                    <th scope="col">Colors</th>
                    <th scope="col">Execution time</th>
                    <th scope="col">Vertex ordering</th>
                    <th scope="col">Validity</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.data.results.map((r) => {
                    const max = Math.max(...state.data.results.map((x) => x.colors_used), 1);
                    return (
                      <tr key={r.key}>
                        <td>
                          <strong>{r.name}</strong>
                          {r.key === 'greedy' && <span className="pill">primary</span>}
                          <div className="muted small">
                            <code>{r.time_complexity}</code>
                          </div>
                        </td>
                        <td>
                          <div className="colors-cell">
                            <div className="mini-bar" aria-hidden="true">
                              <motion.span
                                initial={{ width: 0 }}
                                animate={{ width: `${(r.colors_used / max) * 100}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <strong>{r.colors_used}</strong>
                            {state.data.chromatic.value === r.colors_used && <span className="pill pill-success">optimal</span>}
                          </div>
                        </td>
                        <td className="nowrap">{formatMs(r.execution_ms)}</td>
                        <td className="small">{r.ordering}</td>
                        <td className="nowrap">
                          {r.valid ? (
                            <span className="ok-text">
                              <CircleCheck size={15} aria-hidden="true" /> Valid
                            </span>
                          ) : (
                            <span className="danger-text">
                              <CircleX size={15} aria-hidden="true" /> {r.conflicts} conflicts
                            </span>
                          )}
                        </td>
                        <td>
                          <Button size="sm" variant="ghost" icon={Play} onClick={() => replay(r.strategy)} aria-label={`Replay ${r.name} step by step`}>
                            Replay
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="note">
              <Scale size={15} aria-hidden="true" /> <span>{observation(state.data.results, state.data.chromatic)}</span>
            </p>
            <p className="muted small">
              Each time is the fastest of several batches of repeated runs on the server (a single run on a graph this
              small is below the timer’s resolution). Times are not comparable across different machines.
            </p>
          </section>

          <div className="compare-cards">
            {state.data.results.map((r, i) => (
              <motion.article
                key={r.key}
                className="card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
              >
                <h3 className="card-title">{r.name}</h3>
                <p className="small">{EXPLANATIONS[r.key]}</p>
                <div className="step-section-title">Vertex order used</div>
                <OrderPreview graph={graph} order={r.order} />
              </motion.article>
            ))}
          </div>

          <section className="card">
            <h3 className="card-title">Which one is best?</h3>
            <p className="small">
              None of them on every graph. Graph coloring with the fewest colors is NP-hard, and all three are fast
              heuristics that can be beaten by a clever vertex order on some graph. DSATUR is exact on bipartite graphs
              and often uses fewer colors, at the cost of an O(V) search before every step. Welsh–Powell pays one sort up
              front. Plain greedy is the simplest and fastest, and its quality depends on the order it is given.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
