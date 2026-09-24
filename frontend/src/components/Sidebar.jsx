import { motion } from 'framer-motion';
import { NAV_GROUPS, VIEWS } from '../utils/constants';

const VIEW_BY_ID = Object.fromEntries(VIEWS.map((v) => [v.id, v]));

export default function Sidebar({ view, onNavigate, graph }) {
  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="nav-groups">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="nav-group">
            <div className="nav-group-label" aria-hidden="true">
              {group.label}
            </div>
            <ul className="nav-list">
              {group.views.map((id) => {
                const { label, icon: Icon } = VIEW_BY_ID[id];
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
                      <Icon size={17} aria-hidden="true" />
                      <span>{label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {graph && (
        <div className="sidebar-footer">
          <div className="sidebar-dataset">
            <span className="eyebrow">Active dataset</span>
            <strong>{graph.name}</strong>
            <span>
              {graph.statistics.vertices} vertices · {graph.statistics.edges} edges
            </span>
          </div>
        </div>
      )}
    </nav>
  );
}
