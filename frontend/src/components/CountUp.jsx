import { useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

/** Counts up to a numeric value once (non-numbers are shown as they are). */
export default function CountUp({ value, duration = 0.8, decimals = 0 }) {
  const reduce = useReducedMotion();
  const numeric = typeof value === 'number' && Number.isFinite(value);
  const [shown, setShown] = useState(numeric && !reduce ? 0 : value);

  useEffect(() => {
    if (!numeric || reduce) {
      setShown(value);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / (duration * 1000));
      setShown(value * (1 - (1 - p) ** 3));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, numeric, reduce, duration]);

  return numeric ? Number(shown).toFixed(decimals) : shown;
}
