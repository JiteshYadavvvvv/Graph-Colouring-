import { useEffect } from 'react';

/**
 * Presentation shortcuts for the algorithm pages:
 *   Space  run / pause / resume      →  advance one phase
 *   F      finish (skip to the end)   R  reset
 * Keys are ignored while the focus is on a form field or on a control that
 * handles the key itself (buttons, radios, map regions, graph nodes).
 */
export function useShortcuts(cs) {
  const { runState, run, togglePause, stepForward, skipToEnd, reset } = cs;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target.closest?.('input, select, textarea, button, [role="button"], [role="radio"]')) return;
      const busy = runState === 'requesting';
      const animating = runState === 'playing' || runState === 'paused';

      if (event.key === ' ') {
        event.preventDefault();
        if (animating) togglePause();
        else if (!busy) run('animate');
      } else if (event.key === 'ArrowRight') {
        if (busy || runState === 'done') return;
        event.preventDefault();
        stepForward();
      } else if (event.key === 'f' || event.key === 'F') {
        if (!busy && runState !== 'done') skipToEnd();
      } else if (event.key === 'r' || event.key === 'R') {
        reset();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [runState, run, togglePause, stepForward, skipToEnd, reset]);
}

export const SHORTCUTS = [
  { keys: 'Space', action: 'run / pause' },
  { keys: '→', action: 'step' },
  { keys: 'F', action: 'finish' },
  { keys: 'R', action: 'reset' },
];
