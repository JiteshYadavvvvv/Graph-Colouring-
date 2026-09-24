import { motion } from 'framer-motion';
import { PencilRuler } from 'lucide-react';
import Button from '../components/Button';
import { APPLICATIONS } from '../content/applications';

export default function ApplicationsView({ pg, navigate }) {
  const openExample = (key) => {
    pg.loadExample(key);
    navigate('playground');
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Applications</span>
          <h1>Graph Coloring in the Real World</h1>
          <p className="muted">
            Whenever things conflict in pairs and have to be sorted into as few groups as possible, the problem is graph
            coloring: the things are vertices, the conflicts are edges, and the groups are colors.
          </p>
        </div>
      </header>

      <div className="app-grid">
        {APPLICATIONS.map((app, i) => {
          const Icon = app.icon;
          return (
            <motion.article
              key={app.id}
              className="card app-card"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="app-head">
                <span className="app-icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <h2>{app.title}</h2>
              </div>
              <p className="small">
                <strong>Problem.</strong> {app.problem}
              </p>
              <dl className="app-mapping">
                <div>
                  <dt>Vertex</dt>
                  <dd>{app.vertex}</dd>
                </div>
                <div>
                  <dt>Edge</dt>
                  <dd>{app.edge}</dd>
                </div>
                <div>
                  <dt>Color</dt>
                  <dd>{app.color}</dd>
                </div>
              </dl>
              <p className="muted small">{app.note}</p>
              {app.example && (
                <Button variant="secondary" size="sm" icon={PencilRuler} onClick={() => openExample(app.example)}>
                  Try it in the Playground
                </Button>
              )}
              {app.id === 'maps' && (
                <Button variant="secondary" size="sm" onClick={() => navigate('map')}>
                  Open the map
                </Button>
              )}
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
