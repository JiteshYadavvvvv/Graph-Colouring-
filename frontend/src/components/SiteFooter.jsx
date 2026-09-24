import { CREDITS, INSTITUTION, PROJECT } from '../content/identity';
import InstituteLogo from './InstituteLogo';

/** Institution, project identity and the sources the project builds on. */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-identity">
        <InstituteLogo height={36} />
        <div>
          <strong>{PROJECT.name}</strong>
          <span>
            {INSTITUTION.department}, {INSTITUTION.name}
          </span>
        </div>
      </div>
      <div className="footer-credits">
        <p>{PROJECT.subtitle}</p>
        <p>An educational implementation of classical graph-coloring algorithms.</p>
        <p>
          <strong>Map data.</strong> {CREDITS.mapData}
        </p>
        <p>
          <strong>Algorithms.</strong> {CREDITS.algorithms}
        </p>
      </div>
    </footer>
  );
}
