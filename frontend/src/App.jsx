import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Database, RefreshCw, RotateCcw, TriangleAlert, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from './api/client';
import Button from './components/Button';
import LoadingState, { EmptyState, ErrorState } from './components/LoadingState';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { useColoring } from './hooks/useColoring';
import { usePlayground } from './hooks/usePlayground';
import { DEFAULT_DATASET, VIEWS } from './utils/constants';
import ApplicationsView from './views/ApplicationsView';
import CompareView from './views/CompareView';
import ConflictsView from './views/ConflictsView';
import DatasetsView from './views/DatasetsView';
import GraphView from './views/GraphView';
import Home from './views/Home';
import HowItWorks from './views/HowItWorks';
import MapView from './views/MapView';
import PlaygroundView from './views/PlaygroundView';
import ResultsView from './views/ResultsView';
import StatisticsView from './views/StatisticsView';
import TeamView from './views/TeamView';
import VivaView from './views/VivaView';

const VIEW_COMPONENTS = {
  home: Home,
  datasets: DatasetsView,
  map: MapView,
  graph: GraphView,
  playground: PlaygroundView,
  results: ResultsView,
  conflicts: ConflictsView,
  stats: StatisticsView,
  compare: CompareView,
  how: HowItWorks,
  applications: ApplicationsView,
  viva: VivaView,
  team: TeamView,
};

// Pages that work without a loaded graph (they don't depend on the backend).
const STANDALONE = new Set(['how', 'applications', 'playground', 'viva', 'team']);

/** Troubleshooting hint for developers; production shows none. */
function devHint(error) {
  if (!import.meta.env.DEV || !error) return null;
  if (error.kind === 'network') return 'cd backend && uvicorn main:app --reload';
  return `API base: ${API_BASE_URL || '(this origin, proxied by Vite to :8000)'}`;
}

const ERROR_TITLES = {
  network: 'Coloring engine is unreachable',
  not_found: 'Dataset not found',
  invalid_response: 'Unexpected response from the coloring engine',
  server: 'The coloring engine reported an error',
};

function viewFromHash() {
  const id = window.location.hash.replace('#', '');
  return VIEWS.some((v) => v.id === id) ? id : 'home';
}

export default function App() {
  const cs = useColoring();
  const pg = usePlayground();
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
  const standalone = STANDALONE.has(view);

  let content;
  if (load.status === 'error' && !standalone) {
    const kind = load.error?.kind;
    content = (
      <ErrorState
        title={ERROR_TITLES[kind] ?? 'Could not load the dataset'}
        message={load.error?.message}
        hint={devHint(load.error)}
        onRetry={cs.retryLoad}
      >
        <Button
          variant="secondary"
          icon={RotateCcw}
          onClick={() => {
            cs.resetExperiment();
            cs.retryLoad();
          }}
        >
          Reset
        </Button>
        {cs.datasetKey !== DEFAULT_DATASET && (
          <Button
            variant="secondary"
            icon={Database}
            onClick={() => {
              cs.changeDataset(DEFAULT_DATASET);
              navigate('datasets');
            }}
          >
            Back to datasets
          </Button>
        )}
      </ErrorState>
    );
  } else if (!graph && !standalone) {
    content = <LoadingState label="Loading graph from the coloring engine…" />;
  } else if (graph && graph.vertices.length === 0 && !standalone) {
    content = <EmptyState title="Empty graph" message="This graph has no vertices, so there is nothing to color." />;
  } else {
    content = <View cs={cs} pg={pg} navigate={navigate} />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Navbar cs={cs} onNavigate={navigate} />
        <div className="app-body">
          <Sidebar view={view} onNavigate={navigate} graph={graph} />
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
                    <p>{cs.actionError.message}</p>
                  </div>
                  {cs.actionError.retry && (
                    <Button variant="secondary" size="sm" icon={RefreshCw} onClick={cs.actionError.retry}>
                      Retry
                    </Button>
                  )}
                  <button className="icon-btn" onClick={cs.clearActionError} aria-label="Dismiss error">
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${view}-${standalone ? 'standalone' : `${load.status}-${graph?.key ?? 'none'}`}`}
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
