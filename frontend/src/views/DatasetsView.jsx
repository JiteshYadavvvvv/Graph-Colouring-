import { motion } from 'framer-motion';
import { ArrowRight, Check, PencilRuler } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getGraph } from '../api/client';
import Button from '../components/Button';
import { CUSTOM_DATASET } from '../utils/constants';
import GraphSVG from '../visualization/GraphSVG';
import IndiaMapSVG from '../visualization/IndiaMapSVG';

/** Small, non-interactive drawing of a dataset (its graph is fetched once and cached). */
function Preview({ datasetKey, kind }) {
  const [graph, setGraph] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getGraph(datasetKey)
      .then((g) => !cancelled && setGraph(g))
      .catch(() => {}); // the card still works without a preview
    return () => {
      cancelled = true;
    };
  }, [datasetKey]);

  if (!graph) return <div className="dataset-preview placeholder" aria-hidden="true" />;
  return (
    <div className="dataset-preview" aria-hidden="true">
      {kind === 'map' ? (
        <IndiaMapSVG graph={graph} interactive={false} />
      ) : (
        <GraphSVG graph={graph} draggable={false} interactive={false} nodeRadius={graph.vertices.length > 6 ? 20 : 26} />
      )}
    </div>
  );
}

function Fact({ label, value, title }) {
  return (
    <div title={title}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function DatasetsView({ cs, navigate }) {
  const { datasets, datasetKey, changeDataset, hasCustomGraph, graph } = cs;

  const open = (key, kind) => {
    changeDataset(key);
    navigate(kind === 'map' ? 'map' : 'graph');
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Datasets</span>
          <h1>Choose a Graph</h1>
          <p className="muted">
            Every dataset is an adjacency list served by the backend. The figures below are computed from it: the
            degrees by counting neighbors, and the minimum number of colors (χ) by an exact search on the server.
          </p>
        </div>
      </header>

      <div className="dataset-grid">
        {datasets.map((d, i) => {
          const active = d.key === datasetKey;
          return (
            <motion.article
              key={d.key}
              className={`card dataset-card ${active ? 'active' : ''}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Preview datasetKey={d.key} kind={d.kind} />
              <div className="dataset-body">
                <div className="card-title-row">
                  <h2 className="dataset-name">{d.name}</h2>
                  {active && (
                    <span className="pill pill-success">
                      <Check size={12} aria-hidden="true" /> Active
                    </span>
                  )}
                </div>
                <p className="dataset-type">{d.graph_type}</p>
                <dl className="dataset-facts">
                  <Fact label="Vertices" value={d.vertices} />
                  <Fact label="Edges" value={d.edges} />
                  <Fact label="Max degree" value={d.max_degree} />
                  <Fact
                    label="Known min."
                    value={d.chromatic_number ?? '?'}
                    title="Known minimum (chromatic number χ), proven by an exact search on the backend"
                  />
                </dl>
                <ul className="dataset-traits">
                  {d.characteristics.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <Button
                  variant={active ? 'secondary' : 'primary'}
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => open(d.key, d.kind)}
                  aria-label={`${active ? 'Open' : 'Use'} ${d.name}`}
                >
                  {active ? 'Open' : 'Use this dataset'}
                </Button>
              </div>
            </motion.article>
          );
        })}

        <motion.article
          className={`card dataset-card playground-card ${datasetKey === CUSTOM_DATASET ? 'active' : ''}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: datasets.length * 0.05 }}
        >
          <div className="dataset-preview placeholder playground-art" aria-hidden="true">
            <PencilRuler size={42} />
          </div>
          <div className="dataset-body">
            <h2 className="dataset-name">Your own graph</h2>
            <p className="dataset-type">Graph Playground</p>
            <p className="muted small">
              Add vertices and edges by hand, generate a random graph, or load an application example, then color it
              with the same backend algorithm.
            </p>
            <div className="hero-actions">
              <Button size="sm" icon={PencilRuler} onClick={() => navigate('playground')}>
                Open Playground
              </Button>
              {hasCustomGraph && (
                <Button variant="secondary" size="sm" onClick={() => open(CUSTOM_DATASET, 'graph')}>
                  Use last custom graph{graph?.key === CUSTOM_DATASET ? ' (active)' : ''}
                </Button>
              )}
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
}
