/**
 * Plain-data summaries of the application state, shared by the header
 * indicators, the statistics panel and the pages. No UI code here.
 */

/**
 * Verdict on the coloring, from the run state and POST /api/conflicts.
 * tone: 'neutral' | 'info' | 'success' | 'danger'; `busy` = work in progress.
 */
export function coloringStatus(cs) {
  const { runState, verification, verifying, completedSteps, totalSteps } = cs;
  if (runState === 'idle') return { tone: 'neutral', text: 'Not colored yet' };
  if (runState === 'requesting') return { tone: 'info', text: 'Running…', busy: true };
  if (runState === 'playing' || runState === 'paused') {
    return { tone: 'info', text: `Coloring ${completedSteps}/${totalSteps}`, busy: runState === 'playing' };
  }
  if (verifying) return { tone: 'info', text: 'Verifying…', busy: true };
  if (!verification) return { tone: 'neutral', text: 'Not verified' };
  if (verification.valid) return { tone: 'success', text: 'Valid' };
  return { tone: 'danger', text: 'Invalid: conflicts found' };
}

/** The chromatic number when it is known ("4"), otherwise its proven bounds ("3–4"). */
export function chromaticText(chromatic) {
  if (!chromatic) return '—';
  if (chromatic.value !== null && chromatic.value !== undefined) return String(chromatic.value);
  return `${chromatic.lower_bound}–${chromatic.upper_bound}`;
}
