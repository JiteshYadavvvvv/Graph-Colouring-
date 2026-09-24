import { GraduationCap, RotateCcw } from 'lucide-react';
import { INSTITUTION, PROJECT } from '../content/identity';
import { CUSTOM_DATASET } from '../utils/constants';
import Button from './Button';
import InstituteLogo, { HAS_INSTITUTE_LOGO } from './InstituteLogo';
import ExportMenu from './ExportMenu';

function Logo() {
  return (
    <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#172033" />
      <path d="M12 13 L28 15 L20 29 Z M12 13 L20 29" stroke="#5B6B8C" strokeWidth="2" fill="none" />
      <circle cx="12" cy="13" r="5" fill="#3B6FE0" />
      <circle cx="28" cy="15" r="5" fill="#18B7A0" />
      <circle cx="20" cy="29" r="5" fill="#8B5CF6" />
    </svg>
  );
}

export default function Navbar({ cs, onNavigate }) {
  const { datasets, datasetKey, changeDataset, hasCustomGraph } = cs;
  return (
    <header className="navbar">
      <a
        className="brand"
        href="#home"
        aria-label={`${PROJECT.brand}, ${PROJECT.name}, ${INSTITUTION.name}: home`}
        onClick={(e) => {
          e.preventDefault();
          onNavigate('home');
        }}
      >
        {HAS_INSTITUTE_LOGO ? <InstituteLogo height={40} decorative className="brand-logo" /> : <Logo />}
        <div className="brand-text">
          <div className="brand-institute">{INSTITUTION.name}</div>
          <div className="brand-title">
            <span className="brand-name">{PROJECT.brand}</span>
            <span className="brand-full">{PROJECT.name}</span>
          </div>
        </div>
      </a>

      <div className="navbar-actions">
        <label className="select-field">
          <span>Dataset</span>
          <select value={datasetKey} onChange={(e) => changeDataset(e.target.value)} aria-label="Select dataset">
            {datasets.length === 0 && <option value={datasetKey}>Loading…</option>}
            {datasets.map((d) => (
              <option key={d.key} value={d.key}>
                {d.name}
              </option>
            ))}
            {hasCustomGraph && <option value={CUSTOM_DATASET}>Custom graph (Playground)</option>}
          </select>
        </label>

        <ExportMenu cs={cs} />

        <Button variant="secondary" icon={GraduationCap} onClick={() => onNavigate('viva')} aria-label="Viva Mode">
          <span className="label-keep">Viva Mode</span>
        </Button>

        <Button
          variant="secondary"
          icon={RotateCcw}
          onClick={cs.resetExperiment}
          aria-label="Reset experiment"
          title="Clear the coloring and restore the default speed, order and view options"
        >
          <span className="label-wide">Reset Experiment</span>
          <span className="label-mid">Reset</span>
        </Button>
      </div>
    </header>
  );
}
