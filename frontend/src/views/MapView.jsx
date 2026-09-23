import AlgorithmTimeline from '../components/AlgorithmTimeline';
import ColoringControls, { ShortcutHint } from '../components/ColoringControls';
import { useShortcuts } from '../hooks/useShortcuts';
import Legend from '../components/Legend';
import Pseudocode from '../components/Pseudocode';
import StepPanel from '../components/StepPanel';
import VertexCard from '../components/VertexCard';
import VizStage from '../components/VizStage';

/** Legend emphasis for the step being replayed: flash a reused color. */
export function legendPulse(cs) {
  const step = cs.activeStep;
  if (!step || cs.cursor.phase !== 3 || step.is_new_color) return null;
  return { color: step.assigned_color, key: step.step };
}

export default function MapView({ cs }) {
  useShortcuts(cs);
  const { graph, coloring } = cs;
  const isMap = graph.kind === 'map';

  return (
    <div className="page">
      <header className="page-header compact">
        <div>
          <span className="eyebrow">Map View · replaying backend steps</span>
          <h1>{isMap ? 'Coloring the Map of India' : `Coloring the ${graph.name}`}</h1>
        </div>
        <ShortcutHint />
      </header>

      <ColoringControls coloringState={cs} />

      <div className="viz-layout">
        <div className="viz-main">
          <VizStage cs={cs} />
          <Pseudocode phase={cs.animating ? cs.cursor.phase : null} />
        </div>

        <aside className="viz-side">
          {cs.selected && !cs.animating && (
            <VertexCard
              graph={graph}
              vertex={cs.selected}
              coloring={coloring}
              onClose={() => cs.setSelected(null)}
              onSelect={cs.setSelected}
            />
          )}
          <StepPanel coloringState={cs} />
          <Legend coloring={coloring} pulse={legendPulse(cs)} />
          <AlgorithmTimeline coloringState={cs} />
        </aside>
      </div>
    </div>
  );
}
