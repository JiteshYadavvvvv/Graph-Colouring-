import { Hash, Network, Palette, ShieldAlert } from 'lucide-react';
import AdjacencyTable from '../components/AdjacencyTable';
import AlgorithmTimeline from '../components/AlgorithmTimeline';
import ColoringControls from '../components/ColoringControls';
import Legend from '../components/Legend';
import StatCard from '../components/StatCard';
import StepPanel from '../components/StepPanel';
import VertexCard from '../components/VertexCard';
import { usedColors } from '../utils/helpers';
import GraphSVG from '../visualization/GraphSVG';
import { legendPulse } from './MapView';

export default function GraphView({ cs }) {
  const { graph, coloring, verification } = cs;
  const showVertexCard = cs.selected && !cs.animating;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Graph View</span>
          <h1>{graph.name} as a Graph</h1>
          <p className="muted">Drag the nodes to rearrange them. Click a vertex to see its neighbors.</p>
        </div>
      </header>

      <div className="stat-grid">
        <StatCard icon={Network} label="Vertices" value={graph.statistics.vertices} hint="Regions" />
        <StatCard icon={Hash} label="Edges" value={graph.statistics.edges} hint="Shared borders" tone="secondary" delay={0.05} />
        <StatCard icon={Palette} label="Current Colors" value={usedColors(coloring).length} hint="Distinct colors on screen" tone="accent" delay={0.1} />
        <StatCard
          icon={ShieldAlert}
          label="Conflicts"
          value={verification ? verification.conflicts.length : '—'}
          hint={verification ? (verification.valid ? 'Verified valid' : 'See Conflicts page') : 'Not verified yet'}
          tone={verification && verification.conflicts.length ? 'danger' : 'success'}
          delay={0.15}
        />
      </div>

      <ColoringControls coloringState={cs} />

      <div className="viz-layout">
        <div className="viz-main">
          <div className="card viz-card">
            <div className="card-title-row">
              <h3 className="card-title">Interactive Graph</h3>
              <span className="muted small">Drag to move · click to inspect</span>
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
          <Legend coloring={coloring} pulse={legendPulse(cs)} />
          <AlgorithmTimeline coloringState={cs} />
        </aside>
      </div>

      <AdjacencyTable graph={graph} coloring={coloring} selected={cs.selected} onSelect={cs.setSelected} />
    </div>
  );
}
