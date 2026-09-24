import { INSTITUTION, PROJECT } from '../content/identity';
import InstituteLogo, { HAS_INSTITUTE_LOGO } from './InstituteLogo';

/**
 * Institutional header of the landing page: the institute logo on the left,
 * and institution → department → project → supporting line in the center.
 * Without a logo file (src/assets/branding/), the left slot shows a clearly
 * labeled placeholder instead of any imitation of the logo.
 */
export default function InstitutionalHeader() {
  return (
    <section className="inst-header" aria-labelledby="project-title">
      <div className="inst-logo">
        {HAS_INSTITUTE_LOGO ? (
          <InstituteLogo height={76} />
        ) : (
          <div className="logo-placeholder" role="img" aria-label="Institute logo placeholder">
            Institute
            <br />
            logo
          </div>
        )}
      </div>
      <div className="inst-text">
        <p className="inst-name">{INSTITUTION.name}</p>
        <p className="inst-dept">{INSTITUTION.department}</p>
        <h1 id="project-title" className="inst-project">
          {PROJECT.name}
        </h1>
        <p className="inst-tagline">{PROJECT.tagline}</p>
      </div>
    </section>
  );
}
