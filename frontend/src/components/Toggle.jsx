/** Small on/off switch (a styled checkbox, so it is keyboard and screen-reader friendly). */
export default function Toggle({ checked, onChange, children }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true" />
      {children}
    </label>
  );
}
