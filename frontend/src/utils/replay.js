/**
 * Replaying a backend coloring run. The run is a list of steps (one per
 * vertex); each step is shown in PHASES.length phases. A position in the
 * replay is a cursor { step, phase }. Everything the visualizations show is
 * derived from the backend's steps and the cursor; nothing is computed anew.
 */
import { LAST_PHASE } from './constants';

export const START = { step: -1, phase: 0 };

export function nextCursor(cursor, totalSteps) {
  if (cursor.phase < LAST_PHASE) return { step: cursor.step, phase: cursor.phase + 1 };
  if (cursor.step + 1 < totalSteps) return { step: cursor.step + 1, phase: 0 };
  return null; // finished
}

export function previousCursor(cursor) {
  if (cursor.phase > 0) return { step: cursor.step, phase: cursor.phase - 1 };
  if (cursor.step > 0) return { step: cursor.step - 1, phase: LAST_PHASE };
  return null; // already at the very first phase
}

/**
 * The coloring visible at a cursor, using ONLY the colors the backend
 * assigned in its steps. A vertex shows its color from its "assign" phase on.
 */
export function coloringAtCursor(steps, cursor) {
  const coloring = {};
  if (!steps || cursor.step < 0) return coloring;
  for (let i = 0; i < cursor.step; i += 1) {
    coloring[steps[i].vertex] = steps[i].assigned_color;
  }
  const current = steps[cursor.step];
  if (current && cursor.phase >= 3) coloring[current.vertex] = current.assigned_color;
  return coloring;
}

export const NO_HIGHLIGHT = { running: false, active: null, neighbors: new Set(), phase: 0, recent: null, next: null };

/**
 * What the map and the graph emphasize at a cursor while a replay runs:
 *   active     vertex being processed (none in the "move to next" phase)
 *   neighbors  neighbors being checked
 *   recent     most recently colored vertex (its halo fades out)
 *   next       vertex the loop moves to (only in the "move to next" phase)
 */
export function highlightAt(steps, cursor) {
  const step = steps?.[cursor.step];
  if (!step) return NO_HIGHLIGHT;
  const advancing = cursor.phase === LAST_PHASE;
  return {
    running: true,
    active: advancing ? null : step.vertex,
    neighbors: new Set(cursor.phase >= 1 && !advancing ? step.neighbors : []),
    phase: cursor.phase,
    recent: cursor.phase >= 3 ? step.vertex : steps[cursor.step - 1]?.vertex ?? null,
    next: advancing ? steps[cursor.step + 1]?.vertex ?? null : null,
  };
}
