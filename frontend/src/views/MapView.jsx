import { Info } from 'lucide-react';
import { useState } from 'react';
import AlgorithmTimeline from '../components/AlgorithmTimeline';
import ColoringControls from '../components/ColoringControls';
import Legend from '../components/Legend';
import Pseudocode from '../components/Pseudocode';
import StepPanel from '../components/StepPanel';
import VertexCard from '../components/VertexCard';
import GraphSVG from '../visualization/GraphSVG';
import IndiaMapSVG from '../visualization/IndiaMapSVG';

export default function MapView({ cs }) {
  const { graph, coloring } = cs;
  const [showEdges, setShowEdges] = useState(false);
  const isMap = graph.kind === 'map';

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Map View</span>
          <h1>{isMap ? 'Coloring the Map of India' : `Coloring the ${graph.name}`}</h1>
          <p className="muted">
            Watch the backend’s greedy algorithm color each region in turn. No two regions that share a border may
            get the same color.
          </p>
        </div>
      </header>

      <ColoringControls coloringState={cs} />

      <div className="viz-layout">
        <div className="viz-main">
          <div className="card viz-card">
            <div className="card-title-row wrap">
              <h3 className="card-title">{isMap ? 'Stylized India Map' : 'Abstract Graph'}</h3>
              {isMap && (
                <label className="toggle">
                  <input type="checkbox" checked={showEdges} onChange={(e) => setShowEdges(e.target.checked)} />
                  <span className="toggle-track" aria-hidden="true" />
                  Show graph edges on the map
                </label>
              )}
            </div>
            {isMap ? (
              <IndiaMapSVG
                graph={graph}
                coloring={coloring}
                highlight={cs.highlight}
                selected={cs.selected}
                onSelect={cs.setSelected}
                conflicts={cs.conflicts}
                showEdges={showEdges}
              />
            ) : (
              <>
                <p className="note">
                  <Info size={15} aria-hidden="true" /> This dataset has no geography, so its regions are drawn as
                  vertices. The algorithm is the same.
                </p>
                <GraphSVG
                  key={graph.key}
                  graph={graph}
                  coloring={coloring}
                  highlight={cs.highlight}
                  selected={cs.selected}
                  onSelect={cs.setSelected}
                  conflicts={cs.conflicts}
                />
              </>
            )}
          </div>
          <AlgorithmTimeline coloringState={cs} labels={graph.labels} />
        </div>
        <aside className="viz-side">
          <StepPanel coloringState={cs} />
          <Pseudocode phase={cs.animating ? cs.cursor.phase : null} />
          {cs.selected && !cs.animating && (
            <VertexCard
              graph={graph}
              vertex={cs.selected}
              coloring={coloring}
              onClose={() => cs.setSelected(null)}
              onSelect={cs.setSelected}
            />
          )}
          <Legend coloring={coloring} />
        </aside>
      </div>
    </div>
  );
}
