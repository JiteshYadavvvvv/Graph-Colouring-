import { Sigma } from 'lucide-react';
import { chromaticText } from '../utils/status';

/**
 * Keeps two numbers apart: the colors the greedy algorithm PRODUCED, and the
 * MINIMUM possible (the chromatic number χ), which the backend computes with
 * an exact search when the graph is small enough and otherwise only bounds.
 */
export default function ChromaticCard({ graph, colorsUsed }) {
  const chi = graph.chromatic;
  const known = chi?.value !== null && chi?.value !== undefined;

  let verdict;
  if (colorsUsed === null || colorsUsed === undefined) {
    verdict = 'Run the algorithm to compare its result with the minimum.';
  } else if (known && colorsUsed === chi.value) {
    verdict = `Greedy used exactly the minimum (${chi.value}) on this graph. That is not guaranteed in general: on other graphs, or with another vertex order, greedy can use more.`;
  } else if (known) {
    verdict = `Greedy used ${colorsUsed} colors, but ${chi.value} would be enough. Greedy never revises a decision, so a bad vertex order can cost extra colors. Try the other orders on the Compare page.`;
  } else {
    verdict = `Greedy used ${colorsUsed} colors. The minimum lies between ${chi.lower_bound} and ${chi.upper_bound}, but it could not be proven within the search budget.`;
  }

  return (
    <div className="card chromatic-card">
      <div className="card-title-row">
        <h3 className="card-title">Colors used vs. minimum possible</h3>
        <Sigma size={18} className="muted" aria-hidden="true" />
      </div>
      <div className="chromatic-compare">
        <div>
          <span className="eyebrow">Produced by greedy</span>
          <strong>{colorsUsed ?? '—'}</strong>
        </div>
        <div>
          <span className="eyebrow">
            Minimum possible <span className="nocase">(χ)</span>
          </span>
          <strong>{chromaticText(chi)}</strong>
          <span className="muted small">{known ? 'exact' : 'bounds only'}</span>
        </div>
      </div>
      <p className="small">{verdict}</p>
      <p className="muted small">
        How χ was found: {chi?.method}. Finding the chromatic number is NP-hard: no known algorithm finds it quickly
        on every graph, so exact answers are only practical for small graphs like these. Greedy algorithms are fast
        but give only an upper bound.
      </p>
    </div>
  );
}
