import { Columns2, Info, Map as MapIcon, Network } from 'lucide-react';
import { useState } from 'react';
import GraphSVG from '../visualization/GraphSVG';
import IndiaMapSVG from '../visualization/IndiaMapSVG';
import Segmented from './Segmented';
import Toggle from './Toggle';

const MODES = [
  { value: 'map', label: 'Map', icon: MapIcon },
  { value: 'graph', label: 'Graph', icon: Network },
  { value: 'split', label: 'Split', icon: Columns2 },
];

/**
 * Card that shows the dataset as a map, as a graph, or both side by side.
 * Every view reads the same shared state (coloring, highlight, selection,
 * conflicts), so selecting a region in one selects it in the other.
 *
 * edges: 'toggle' shows a "Graph edges" switch for the map overlay;
 *        'conflicts' always overlays only the conflicting edges.
 */
export default function VizStage({ cs, title, edges = 'toggle', defaultMode = 'map' }) {
  const { graph } = cs;
  const isMap = graph.kind === 'map';
  const [mode, setMode] = useState(defaultMode);
  const [showEdges, setShowEdges] = useState(false);
  const view = isMap ? mode : 'graph';

  const shared = {
    graph,
    coloring: cs.coloring,
    highlight: cs.highlight,
    selected: cs.selected,
    onSelect: cs.setSelected,
    conflicts: cs.conflicts,
    phaseMs: cs.phaseMs,
    showDegrees: cs.showDegrees,
  };

  const heading =
    title ?? (view === 'graph' ? 'Graph' : view === 'split' ? 'Map ⇄ Graph (synchronized)' : 'Map of India');

  return (
    <div className="card viz-card">
      <div className="card-title-row wrap">
        <div className="viz-title">
          <h3 className="card-title">{heading}</h3>
          <span className="muted small">
            {graph.statistics.vertices} vertices · {graph.statistics.edges} edges
          </span>
        </div>
        <div className="viz-tools">
          <Toggle checked={cs.showDegrees} onChange={cs.setShowDegrees}>
            Show vertex degrees
          </Toggle>
          {isMap && edges === 'toggle' && view !== 'graph' && (
            <Toggle checked={showEdges} onChange={setShowEdges}>
              Graph edges
            </Toggle>
          )}
          {isMap && <Segmented ariaLabel="Visualization" options={MODES} value={mode} onChange={setMode} size="sm" />}
        </div>
      </div>

      {!isMap && (
        <p className="note">
          <Info size={15} aria-hidden="true" /> This dataset has no geography, so its regions are drawn as vertices.
          The algorithm is the same.
        </p>
      )}

      <div className={`viz-stage mode-${view}`}>
        {view !== 'graph' && <IndiaMapSVG {...shared} showEdges={edges === 'conflicts' ? 'conflicts' : showEdges} />}
        {view !== 'map' && <GraphSVG key={graph.key} {...shared} />}
      </div>
    </div>
  );
}
