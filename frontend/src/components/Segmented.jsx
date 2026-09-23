import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Segmented control (radio group) with a sliding active indicator.
 * options: [{ value, label, title?, icon? }]
 *
 * The indicator is one element moved with a CSS transform. (A Framer Motion
 * `layoutId` would be shorter, but a layout animation inside a page that is
 * leaving blocks AnimatePresence from ever finishing the page transition.)
 */
export default function Segmented({ options, value, onChange, ariaLabel, ariaLabelledBy, size = 'md' }) {
  const rootRef = useRef(null);
  const [thumb, setThumb] = useState(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const measure = () => {
      const active = root.querySelector('button[aria-checked="true"]');
      if (active) setThumb({ x: active.offsetLeft, w: active.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [value, options]);

  const onKeyDown = (event) => {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const back = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    if (!forward && !back) return;
    event.preventDefault();
    const index = options.findIndex((o) => o.value === value);
    const next = options[(index + (forward ? 1 : -1) + options.length) % options.length];
    onChange(next.value);
    rootRef.current?.querySelector(`[data-value="${next.value}"]`)?.focus();
  };

  return (
    <div
      ref={rootRef}
      className={`segmented segmented-${size}`}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      {thumb && (
        <span
          className="segmented-thumb"
          style={{ width: thumb.w, transform: `translateX(${thumb.x}px)` }}
          aria-hidden="true"
        />
      )}
      {options.map(({ value: v, label, title, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            data-value={v}
            title={title}
            className={active ? 'active' : ''}
            onClick={() => onChange(v)}
            onKeyDown={onKeyDown}
          >
            {Icon && <Icon size={14} aria-hidden="true" />}
            <span className="segmented-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
