import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Database, GitBranch, GraduationCap, Palette, PencilRuler, Play, Scale, ShieldCheck } from 'lucide-react';
import Button from '../components/Button';
import StatusIndicators from '../components/StatusIndicators';
import { PALETTE } from '../utils/constants';

const EXPLORE = [
  { view: 'datasets', icon: Database, title: 'Datasets', text: 'India, a wheel, K3, C7, K5 and a bipartite crown graph.' },
  { view: 'playground', icon: PencilRuler, title: 'Graph Playground', text: 'Draw your own graph and color it on the backend.' },
  { view: 'compare', icon: Scale, title: 'Compare algorithms', text: 'Greedy vs. Welsh–Powell vs. DSATUR on the same graph.' },
  { view: 'viva', icon: GraduationCap, title: 'Viva Mode', text: 'Examiner questions with answers, plus a quiz.' },
];

const STEPS = [
  { n: '01', icon: GitBranch, title: 'Model the Map', text: 'Regions become vertices and shared borders become edges.' },
  { n: '02', icon: Palette, title: 'Run Greedy Coloring', text: 'Visit each vertex and assign the smallest color its neighbors are not using.' },
  { n: '03', icon: ShieldCheck, title: 'Verify the Result', text: 'Check every edge automatically and flag any adjacent regions that share a color.' },
];

/* Decorative illustration: regions (left) turning into a graph (right). */
function HeroArt() {
  const regions = [
    { d: 'M20 30 L90 18 L110 70 L60 100 L18 82 Z', c: 0, cx: 62, cy: 58 },
    { d: 'M90 18 L160 30 L150 88 L110 70 Z', c: 1, cx: 128, cy: 52 },
    { d: 'M18 82 L60 100 L70 150 L22 140 Z', c: 1, cx: 42, cy: 118 },
    { d: 'M60 100 L110 70 L150 88 L140 150 L70 150 Z', c: 2, cx: 105, cy: 115 },
  ];
  const links = [[0, 1], [0, 2], [0, 3], [1, 3], [2, 3]];
  const nodes = [[260, 50], [330, 40], [250, 130], [320, 125]];
  return (
    <svg viewBox="0 0 380 180" className="hero-art" aria-hidden="true">
      {regions.map((r, i) => (
        <motion.path
          key={i}
          d={r.d}
          fill={PALETTE[r.c].fill}
          stroke="#fff"
          strokeWidth="3"
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.12 }}
        />
      ))}
      <motion.path
        d="M180 90 L215 90"
        stroke="#94A3B8"
        strokeWidth="3"
        strokeLinecap="round"
        markerEnd="url(#arrow)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      />
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="#94A3B8" />
        </marker>
      </defs>
      {links.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          stroke="#B8C2D6"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1 + i * 0.08 }}
        />
      ))}
      {nodes.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="16"
          fill={PALETTE[regions[i].c].fill}
          stroke="#fff"
          strokeWidth="3"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.3 + i * 0.1, type: 'spring' }}
        />
      ))}
    </svg>
  );
}

export default function Home({ cs, navigate }) {
  const { graph, datasets } = cs;

  const startColoring = () => {
    navigate('map');
    if (cs.runState === 'idle') cs.run('animate');
  };

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-text">
          <motion.span className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Graph Coloring Visualizer · DSA Project
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            Interactive Map Coloring System
          </motion.h1>
          <motion.p className="hero-tagline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            Visualize how graph coloring transforms geographical constraints into a mathematical problem.
          </motion.p>
          <motion.p className="hero-desc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            Every state of India becomes a <strong>vertex</strong>, and every shared border becomes an{' '}
            <strong>edge</strong>. A <strong>Greedy Graph Coloring</strong> algorithm, running in Python, then gives
            each state the smallest color its neighbors are not using, so no two neighboring states ever look the
            same. You watch each of its decisions, step by step.
          </motion.p>
          <div className="hero-actions">
            <Button icon={Play} size="lg" onClick={startColoring}>
              Start Coloring
            </Button>
            <Button variant="secondary" size="lg" icon={BookOpen} onClick={() => navigate('how')}>
              How It Works
            </Button>
          </div>
          <StatusIndicators cs={cs} className="hero-status" />
        </div>
        <div className="hero-visual">
          <HeroArt />
          <div className="hero-caption">
            <span>Map regions</span>
            <ArrowRight size={14} aria-hidden="true" />
            <span>Graph vertices</span>
          </div>
        </div>
      </section>

      <section className="step-cards">
        {STEPS.map(({ n, icon: Icon, title, text }, i) => (
          <motion.article
            key={n}
            className="card step-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <div className="step-card-top">
              <span className="step-num">{n}</span>
              <Icon size={20} aria-hidden="true" />
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
          </motion.article>
        ))}
      </section>

      <section className="explore-grid" aria-label="Explore">
        {EXPLORE.map(({ view, icon: Icon, title, text }, i) => (
          <motion.button
            key={view}
            type="button"
            className="card explore-card"
            onClick={() => navigate(view)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            whileHover={{ y: -3 }}
          >
            <Icon size={20} aria-hidden="true" />
            <strong>{title}</strong>
            <span className="muted small">{text}</span>
            <ArrowRight size={16} className="explore-arrow" aria-hidden="true" />
          </motion.button>
        ))}
      </section>

      <section className="card dataset-strip">
        <div>
          <span className="eyebrow">Available datasets</span>
          <p className="muted small">Every dataset runs through the same algorithm on the backend.</p>
        </div>
        <div className="dataset-chips">
          {datasets.map((d) => (
            <button
              key={d.key}
              className={`dataset-chip ${graph.key === d.key ? 'active' : ''}`}
              onClick={() => cs.changeDataset(d.key)}
              aria-pressed={graph.key === d.key}
            >
              <strong>{d.name}</strong>
              <span>
                V {d.vertices} · E {d.edges}
              </span>
            </button>
          ))}
          <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('datasets')}>
            All datasets
          </Button>
        </div>
      </section>
    </div>
  );
}
