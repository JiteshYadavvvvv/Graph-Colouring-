import { motion } from 'framer-motion';
import { VIEWS } from '../utils/constants';

export default function Sidebar({ view, onNavigate, graph, connected }) {
  return (
    <nav className="sidebar" aria-label="Main navigation">
      <ul className="nav-list">
        {VIEWS.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`nav-item ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(id);
                }}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="nav-active-bg"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </a>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        <div className="engine-status">
          <span className={`dot ${connected ? 'ok' : 'down'}`} aria-hidden="true" />
          {connected ? 'Coloring engine online' : 'Engine unreachable'}
        </div>
        {graph && (
          <div className="sidebar-dataset">
            <strong>{graph.name}</strong>
            <span>
              {graph.statistics.vertices} vertices · {graph.statistics.edges} edges
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}
