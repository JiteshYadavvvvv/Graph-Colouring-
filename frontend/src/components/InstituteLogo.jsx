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

/**
 * The institute logo at a fixed height; its width follows its own aspect
 * ratio. The height is passed as a CSS variable so a stylesheet can adapt it
 * (e.g. on phones) without ever distorting the image.
 */
export default function InstituteLogo({ height = 48, className = '', decorative = false }) {
  if (!LOGO_URL) return null;
  return (
    <img
      src={LOGO_URL}
      // Decorative when the institution's name is written right next to it.
      alt={decorative ? '' : `${INSTITUTION.name} logo`}
      className={`institute-logo ${className}`}
      style={{ '--logo-h': `${height}px` }}
      decoding="async"
    />
  );
}
