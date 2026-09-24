import { INSTITUTION } from '../content/identity';

// The logo is optional: drop the official file into src/assets/branding/
// (see the README there). If no file is present, nothing is rendered and the
// institution is shown by name only; the logo is never redrawn or imitated.
const files = import.meta.glob('../assets/branding/ait-logo.{svg,png,webp,jpg,jpeg}', {
  eager: true,
  import: 'default',
});
const LOGO_URL = Object.values(files)[0] ?? null;

export const HAS_INSTITUTE_LOGO = Boolean(LOGO_URL);

/** The institute logo at a fixed height; its width follows its own aspect ratio. */
export default function InstituteLogo({ height = 48, className = '' }) {
  if (!LOGO_URL) return null;
  return (
    <img
      src={LOGO_URL}
      alt={`${INSTITUTION.name} logo`}
      className={`institute-logo ${className}`}
      style={{ height, width: 'auto' }}
      decoding="async"
    />
  );
}
