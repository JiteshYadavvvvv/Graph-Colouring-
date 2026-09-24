/**
 * Plain-language narration of the replay. Every sentence is built from the
 * backend's step record (vertex, neighbors, neighbor colors, used and
 * available colors, assigned color) and the replay cursor, so it can only
 * describe what the algorithm actually did.
 */
import { LAST_PHASE } from './constants';
import { nameOf } from './helpers';

/** [1, 2, 3] → "1, 2 and 3". */
export function listText(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * Narration for one phase of one step.
 * Returns { title, detail }: `title` is the short sentence, `detail` a
 * supporting line (may be empty).
 */
export function narrate(graph, steps, cursor) {
  const step = steps[cursor.step];
  if (!step) return null;
  const name = (v) => nameOf(graph, v);
  const vertex = name(step.vertex);
  const colored = step.neighbors.filter((n) => step.neighbor_colors[n]);
  const used = step.used_colors;

  switch (cursor.phase) {
    case 0:
      return { title: `Selected ${vertex}.`, detail: step.selection };
    case 1:
      return {
        title: 'Checking colors used by neighboring vertices.',
        detail: !step.neighbors.length
          ? `${vertex} has no neighbors, so no color is blocked.`
          : colored.length
            ? `${colored.length} of ${step.neighbors.length} neighbors are colored: ${listText(
                colored.map((n) => `${name(n)} (Color ${step.neighbor_colors[n]})`),
              )}.`
            : `None of its ${step.neighbors.length} neighbors is colored yet.`,
      };
    case 2:
      return {
        title: used.length
          ? `Color${used.length > 1 ? 's' : ''} ${listText(used)} ${used.length > 1 ? 'are' : 'is'} already used.`
          : 'No color is used by its neighbors yet.',
        detail: `Color ${step.assigned_color} is available: the smallest color not used by a neighbor.`,
      };
    case 3:
      return {
        title: `Assigning Color ${step.assigned_color} to ${vertex}.`,
        detail: step.is_new_color ? 'This introduces a new color.' : `Color ${step.assigned_color} is reused.`,
      };
    case LAST_PHASE: {
      const next = steps[cursor.step + 1];
      return next
        ? { title: `Moving to the next vertex: ${name(next.vertex)}.`, detail: `Step ${next.step} of ${steps.length}.` }
        : { title: 'All vertices are colored.', detail: 'The backend now checks every edge for conflicts.' };
    }
    default:
      return null;
  }
}
