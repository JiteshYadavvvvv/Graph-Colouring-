import { useEffect } from 'react';

/**
 * Presentation shortcuts for the algorithm pages:
 *   Space  play / pause (starts auto play when idle)
 *   →      next phase (starts step-by-step mode when idle)
 *   ←      previous phase
 *   F      finish instantly          R  reset
 * Keys are ignored while the focus is on a form field or on a control that
 * handles the key itself (buttons, radios, map regions, graph nodes).
 */
export function useShortcuts(cs) {
  const { runState, playPause, stepForward, stepBack, skipToEnd, reset } = cs;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target.closest?.('input, select, textarea, button, [role="button"], [role="radio"], [role="menuitem"]')) return;
      const busy = runState === 'requesting';

      if (event.key === ' ') {
        event.preventDefault();
        if (!busy) playPause();
      } else if (event.key === 'ArrowRight') {
        if (busy || runState === 'done') return;
        event.preventDefault();
        stepForward();
      } else if (event.key === 'ArrowLeft') {
        if (busy || runState === 'idle') return;
        event.preventDefault();
        stepBack();
      } else if (event.key === 'f' || event.key === 'F') {
        if (!busy && runState !== 'done') skipToEnd();
      } else if (event.key === 'r' || event.key === 'R') {
        reset();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [runState, playPause, stepForward, stepBack, skipToEnd, reset]);
}

export const SHORTCUTS = [
  { keys: 'Space', action: 'play / pause' },
  { keys: '← →', action: 'step' },
  { keys: 'F', action: 'finish' },
  { keys: 'R', action: 'reset' },
];
