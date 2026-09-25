import { ArrowRight } from 'lucide-react';
import { INSTITUTION, PROJECT } from '../content/identity';
import { VIEWS } from '../utils/constants';
import InstituteLogo from './InstituteLogo';

const LABELS = Object.fromEntries(VIEWS.map((v) => [v.id, v.label]));

const COLUMNS = [
  { title: 'Platform', views: ['home', 'map', 'graph', 'playground', 'compare'] },
  { title: 'Learn', views: ['how', 'applications', 'viva', 'about', 'team'] },
];

/**
 * Footer of the Home and Project Team pages: the project's name and purpose,
 * where it was built, links to the main sections, and a large wordmark.
 * `current` marks the page the footer is shown on.
 */
export default function SiteFooter({ onNavigate, current }) {
  const go = (id) => (event) => {
    event.preventDefault();
    onNavigate(id);
  };

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-about">
            <span className="footer-mark">{PROJECT.brand}</span>
            <p className="footer-description">{PROJECT.description}</p>

            <span className="footer-label">Built at</span>
            <div className="footer-institution">
              <InstituteLogo height={34} decorative />
              <span>
                {INSTITUTION.department}
                <br />
                {INSTITUTION.name}
              </span>
            </div>
          </div>

          <div className="footer-links">
            {COLUMNS.map((column) => (
              <nav key={column.title} className="footer-column" aria-label={`${column.title} links`}>
                <span className="footer-label">{column.title}</span>
                <ul>
                  {column.views.map((id) => (
                    <li key={id} className={id === current ? 'current' : ''}>
                      <a href={`#${id}`} onClick={go(id)} aria-current={id === current ? 'page' : undefined}>
                        {LABELS[id]}
                      </a>
                    </li>
                  ))}
                </ul>
                {column.title === 'Learn' && (
                  <button type="button" className="footer-cta" onClick={() => onNavigate('map')}>
                    Open the map
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                )}
              </nav>
            ))}
          </div>
        </div>

        {/* The wordmark is stretched to the footer's width by SVG, so it fits
            every screen without measuring text. */}
        <svg className="footer-wordmark" viewBox="0 0 1000 190" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="footer-wordmark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e6ecfb" />
              <stop offset="1" stopColor="#f8faff" />
            </linearGradient>
          </defs>
          <text x="500" y="168" textAnchor="middle" textLength="990" lengthAdjust="spacing">
            {PROJECT.brand.toUpperCase()}
          </text>
        </svg>

        <div className="footer-bottom">
          <span>
            © {PROJECT.year} {PROJECT.brand} · {PROJECT.name}
          </span>
          <span>Map data: udit-001/india-maps-data</span>
        </div>
      </div>
    </footer>
  );
}
