import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { TriangleAlert, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState, ErrorState } from './components/LoadingState';
import LoadingState from './components/LoadingState';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { useColoring } from './hooks/useColoring';
import { VIEWS } from './utils/constants';
import ConflictsView from './views/ConflictsView';
import GraphView from './views/GraphView';
import Home from './views/Home';
import HowItWorks from './views/HowItWorks';
import MapView from './views/MapView';
import ResultsView from './views/ResultsView';
import StatisticsView from './views/StatisticsView';

const VIEW_COMPONENTS = {
  home: Home,
  graph: GraphView,
  map: MapView,
  results: ResultsView,
  conflicts: ConflictsView,
  how: HowItWorks,
  stats: StatisticsView,
};

function viewFromHash() {
  const id = window.location.hash.replace('#', '');
  return VIEWS.some((v) => v.id === id) ? id : 'home';
}

export default function App() {
  const cs = useColoring();
  const [view, setView] = useState(viewFromHash);

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((id) => {
    if (window.location.hash !== `#${id}`) window.location.hash = id;
    setView(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const { load, graph } = cs;
  const View = VIEW_COMPONENTS[view];

  let content;
  if (load.status === 'error') {
    content = (
      <ErrorState
        title={load.error?.kind === 'network' ? 'Coloring engine offline' : 'Could not load the dataset'}
        message={load.error?.message}
        onRetry={cs.retryLoad}
      />
    );
  } else if (!graph) {
    content = <LoadingState label="Loading graph from the coloring engine…" />;
  } else if (graph.vertices.length === 0) {
    content = <EmptyState title="Empty graph" message="This dataset has no vertices, so there is nothing to color." />;
  } else {
    content = <View cs={cs} navigate={navigate} />;
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar
        datasets={cs.datasets}
        datasetKey={cs.datasetKey}
        onDatasetChange={cs.changeDataset}
        runState={cs.runState}
        strategy={cs.strategy}
        onReset={cs.reset}
      />
      <div className="app-body">
        <Sidebar view={view} onNavigate={navigate} graph={graph} connected={load.status !== 'error'} />
        <main id="main-content" className="main" tabIndex={-1}>
          <AnimatePresence>
            {cs.actionError && (
              <motion.div
                className="banner banner-danger toast"
                role="alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <TriangleAlert size={20} aria-hidden="true" />
                <div>
                  <strong>Request failed</strong>
                  <p>{cs.actionError}</p>
                </div>
                <button className="icon-btn" onClick={cs.clearActionError} aria-label="Dismiss error">
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${view}-${load.status}-${graph?.key ?? 'none'}`}
              initial={{ opacity: 0, y: 12, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.998 }}
              transition={{ duration: 0.3, ease: [0.25, 0.8, 0.35, 1] }}
            >
              {content}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
    </MotionConfig>
  );
}
