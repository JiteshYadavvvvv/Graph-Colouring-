import AdjacencyTable from '../components/AdjacencyTable';
import AlgorithmTimeline from '../components/AlgorithmTimeline';
import ColoringControls, { ShortcutHint } from '../components/ColoringControls';
import GraphInfoPanel from '../components/GraphInfoPanel';
import Legend from '../components/Legend';
import StepPanel from '../components/StepPanel';
import Toggle from '../components/Toggle';
import VertexCard from '../components/VertexCard';
import { useShortcuts } from '../hooks/useShortcuts';
import GraphSVG from '../visualization/GraphSVG';
import { InlineConflicts, legendPulse } from './MapView';

export default function GraphView({ cs }) {
  useShortcuts(cs);
  const { graph, coloring } = cs;
  const showVertexCard = cs.selected && !cs.animating;

  return (
    <div className="page">
      <header className="page-header compact">
        <div>
          <span className="eyebrow">Graph View</span>
          <h1>{graph.name} as a Graph</h1>
          <p className="muted">Drag the nodes to rearrange them. Click a vertex to see its neighbors.</p>
        </div>
        <ShortcutHint />
      </header>

      <ColoringControls coloringState={cs} />
      <InlineConflicts cs={cs} />

      <div className="viz-layout">
        <div className="viz-main">
          <div className="card viz-card">
            <div className="card-title-row wrap">
              <div className="viz-title">
                <h3 className="card-title">Interactive Graph</h3>
                <span className="muted small">
                  {graph.statistics.vertices} vertices · {graph.statistics.edges} edges · drag to move, click to inspect
                </span>
              </div>
              <div className="viz-tools">
                <Toggle checked={cs.showDegrees} onChange={cs.setShowDegrees}>
                  Show vertex degrees
                </Toggle>
              </div>
            </div>
            <GraphSVG
              key={graph.key}
              graph={graph}
              coloring={coloring}
              highlight={cs.highlight}
              selected={cs.selected}
              onSelect={cs.setSelected}
              conflicts={cs.conflicts}
              phaseMs={cs.phaseMs}
              showDegrees={cs.showDegrees}
            />
          </div>
        </div>
        <aside className="viz-side">
          {showVertexCard ? (
            <VertexCard
              graph={graph}
              vertex={cs.selected}
              coloring={coloring}
              onClose={() => cs.setSelected(null)}
              onSelect={cs.setSelected}
            />
          ) : (
            <StepPanel coloringState={cs} />
          )}
          <GraphInfoPanel cs={cs} />
          <Legend coloring={coloring} pulse={legendPulse(cs)} />
          <AlgorithmTimeline coloringState={cs} />
        </aside>
      </div>

      <AdjacencyTable graph={graph} coloring={coloring} selected={cs.selected} onSelect={cs.setSelected} />
    </div>
  );
}
