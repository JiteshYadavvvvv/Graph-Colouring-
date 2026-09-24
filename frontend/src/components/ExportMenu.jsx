import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Download, FileJson, FileSpreadsheet, FileText, ListTree } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EXPORTS, canExport, runExport } from '../utils/export';

export const EXPORT_ICONS = { json: FileJson, csv: FileSpreadsheet, adjacency: ListTree, report: FileText };

/** "Export Report" dropdown in the header. */
export default function ExportMenu({ cs }) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => !rootRef.current?.contains(event.target) && setOpen(false);
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        rootRef.current?.querySelector('.export-trigger')?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    rootRef.current?.querySelector('[role="menuitem"]:not([disabled])')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const onMenuKey = (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = [...rootRef.current.querySelectorAll('[role="menuitem"]:not([disabled])')];
    const index = items.indexOf(document.activeElement);
    const next = items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
    next?.focus();
  };

  const choose = (id) => {
    const file = runExport(id, cs);
    setOpen(false);
    if (file) setNotice(`Saved ${file}`);
  };

  return (
    <div className="export-menu" ref={rootRef}>
      <button
        type="button"
        className="btn btn-secondary btn-md export-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        disabled={!cs.graph}
      >
        <Download size={16} aria-hidden="true" />
        <span className="label-wide">Export Report</span>
        <span className="label-mid">Export</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="menu"
            role="menu"
            aria-label="Export"
            onKeyDown={onMenuKey}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {EXPORTS.map((item) => {
              const Icon = EXPORT_ICONS[item.id];
              const enabled = canExport(item, cs);
              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  disabled={!enabled}
                  onClick={() => choose(item.id)}
                  title={enabled ? undefined : 'Finish a coloring run first'}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>
                    {item.label}
                    <small>{enabled ? item.format : `${item.format} · run the algorithm first`}</small>
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <span className="sr-only" role="status">
        {notice}
      </span>
      <AnimatePresence>
        {notice && (
          <motion.span className="export-notice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-hidden="true">
            {notice}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
