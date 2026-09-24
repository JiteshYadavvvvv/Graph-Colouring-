import AlgorithmTimeline from '../components/AlgorithmTimeline';
import ColoringControls, { ShortcutHint } from '../components/ColoringControls';
import { InlineConflicts } from '../components/ConflictBanner';
import GraphInfoPanel from '../components/GraphInfoPanel';
import Legend, { legendPulse } from '../components/Legend';
import Pseudocode from '../components/Pseudocode';
import StepPanel from '../components/StepPanel';
import VertexCard from '../components/VertexCard';
import VizStage from '../components/VizStage';
import { useShortcuts } from '../hooks/useShortcuts';

/**
 * The main workspace: the geographical map and its graph side by side, both
 * driven by the same state, with the algorithm's execution panel below.
 *
 *   map → graph representation → graph coloring → algorithm execution → result
 */
export default function MapView({ cs }) {
  useShortcuts(cs);
  const { graph, coloring } = cs;
  const isMap = graph.kind === 'map';

  return (
    <div className="page">
      <header className="page-header compact">
        <div>
          <span className="eyebrow">Workspace · map → graph → coloring</span>
          <h1>{isMap ? 'Map and Graph Workspace' : `Coloring the ${graph.name}`}</h1>
        </div>
        <ShortcutHint />
      </header>

      <ColoringControls coloringState={cs} />
      <InlineConflicts cs={cs} />

      <VizStage cs={cs} defaultMode={isMap ? 'split' : 'graph'} narration />

      <div className="workspace-panels">
        <div className="panel-col">
          <StepPanel coloringState={cs} />
        </div>
        <div className="panel-col">
          {cs.selected && !cs.animating && (
            <VertexCard
              graph={graph}
              vertex={cs.selected}
              coloring={coloring}
              onClose={() => cs.setSelected(null)}
              onSelect={cs.setSelected}
            />
          )}
          <GraphInfoPanel cs={cs} />
          <Legend coloring={coloring} pulse={legendPulse(cs)} />
        </div>
        <div className="panel-col">
          <Pseudocode phase={cs.animating ? cs.cursor.phase : null} strategy={cs.result?.strategy ?? cs.strategy} />
          <AlgorithmTimeline coloringState={cs} />
        </div>
      </div>
    </div>
  );
}
