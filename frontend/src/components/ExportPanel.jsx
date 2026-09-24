import { useState } from 'react';
import { EXPORTS, canExport, runExport } from '../utils/export';
import Button from './Button';
import { EXPORT_ICONS } from './ExportMenu';

const DESCRIPTIONS = {
  json: 'Every vertex with its color, plus statistics and verification.',
  csv: 'One row per vertex: order, ID, name, degree, color.',
  adjacency: 'The graph itself: each vertex with its neighbors.',
  report: 'Dataset, algorithm, colors, conflicts, time and timestamp.',
};

/** Export buttons with a short description of each file. */
export default function ExportPanel({ cs }) {
  const [saved, setSaved] = useState('');
  return (
    <div className="card export-panel">
      <h3 className="card-title">Export results</h3>
      <ul className="export-list">
        {EXPORTS.map((item) => {
          const Icon = EXPORT_ICONS[item.id];
          return (
            <li key={item.id}>
              <div>
                <strong>
                  {item.label} <span className="pill">{item.format}</span>
                </strong>
                <p className="muted small">{DESCRIPTIONS[item.id]}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={Icon}
                disabled={!canExport(item, cs)}
                onClick={() => setSaved(runExport(item.id, cs) ?? '')}
                aria-label={`Download ${item.label} as ${item.format}`}
              >
                Download
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="muted small" role="status">
        {saved ? `Saved ${saved}` : ''}
      </p>
    </div>
  );
}
