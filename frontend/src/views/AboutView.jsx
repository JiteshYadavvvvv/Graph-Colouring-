import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { Fragment } from 'react';
import {
  ABOUT,
  ALGORITHM,
  CONTRIBUTIONS,
  DESIGN_DECISIONS,
  ENDPOINTS,
  FUTURE_SCOPE,
  LIMITATIONS,
  PIPELINE,
  STACK,
  TIERS,
} from '../content/about';
import { INSTITUTION, PROJECT } from '../content/identity';
import { ALGORITHM_STEPS, FULL_PSEUDOCODE } from '../content/learning';
import { VIEWS } from '../utils/constants';

const LABELS = Object.fromEntries(VIEWS.map((v) => [v.id, v.label]));

const SECTIONS = [
  { id: 'about-overview', label: 'Overview' },
  { id: 'about-architecture', label: 'Architecture' },
  { id: 'about-stack', label: 'Technology stack' },
  { id: 'about-algorithm', label: 'Algorithm' },
  { id: 'about-limitations', label: 'Limitations' },
  { id: 'about-future', label: 'Future scope' },
];

/** In-page links scroll instead of changing the hash, which selects the page. */
function scrollToSection(id) {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

/** Consecutive pipeline nodes that run in the same place (browser or backend). */
function tierGroups(nodes) {
  const groups = [];
  nodes.forEach((node, index) => {
    const last = groups[groups.length - 1];
    if (last && last.tier === node.tier) last.nodes.push({ ...node, index });
    else groups.push({ tier: node.tier, nodes: [{ ...node, index }] });
  });
  return groups;
}

function PipelineEdge({ label }) {
  return (
    <div className="pipeline-edge">
      <ArrowDown size={16} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

function PipelineNode({ node }) {
  const Icon = node.icon;
  return (
    <div className="pipeline-node">
      <span className="pipeline-icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <div className="pipeline-body">
        <h4>
          <span className="pipeline-num">{node.index + 1}</span>
          {node.title}
        </h4>
        <code>{node.where}</code>
        <p>{node.text}</p>
      </div>
    </div>
  );
}

function Pipeline() {
  const groups = tierGroups(PIPELINE);
  return (
    <div className="pipeline">
      {groups.map((group, gi) => (
        <Fragment key={group.nodes[0].title}>
          <section className={`pipeline-group tier-${group.tier}`} aria-label={TIERS[group.tier]}>
            <span className="pipeline-tier">{TIERS[group.tier]}</span>
            <ol className="pipeline-nodes" start={group.nodes[0].index + 1}>
              {group.nodes.map((node, ni) => (
                <li key={node.title}>
                  <PipelineNode node={node} />
                  {ni < group.nodes.length - 1 && <PipelineEdge label={node.edge} />}
                </li>
              ))}
            </ol>
          </section>
          {gi < groups.length - 1 && <PipelineEdge label={group.nodes[group.nodes.length - 1].edge} />}
        </Fragment>
      ))}
    </div>
  );
}

function CostTable({ caption, rows }) {
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label={caption}>
      <table className="data-table cost-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Part</th>
            <th scope="col">Cost</th>
            <th scope="col">Why</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.part}>
              <th scope="row">{row.part}</th>
              <td className="big-o-cell">{row.cost}</td>
              <td>{row.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeader({ id, eyebrow, title, children }) {
  return (
    <header className="about-section-head">
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={id} className="section-title">
        {title}
      </h2>
      {children && <p className="muted section-sub">{children}</p>}
    </header>
  );
}

export default function AboutView({ navigate }) {
  return (
    <div className="page about-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">About the Project · {PROJECT.brand}</span>
          <h1>{ABOUT.title}</h1>
          <p className="muted">
            {INSTITUTION.department}, {INSTITUTION.name}
          </p>
        </div>
      </header>

      <nav className="card about-contents" aria-label="On this page">
        <span className="about-contents-label">On this page</span>
        <ul>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <button type="button" className="dataset-chip" onClick={() => scrollToSection(s.id)}>
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ---------------- Overview ---------------- */}
      <section className="about-section" id="about-overview" aria-labelledby="about-overview-title">
        <SectionHeader id="about-overview-title" eyebrow="Overview" title="About the project" />
        <article className="card about-intro">
          <div className="about-pair">
            <div className="about-statement">
              <h3>Problem</h3>
              <p>{ABOUT.problem}</p>
            </div>
            <div className="about-statement">
              <h3>Approach</h3>
              <p>{ABOUT.approach}</p>
            </div>
          </div>
          <dl className="about-mapping">
            {ABOUT.mapping.map((m) => (
              <div key={m.from}>
                <dt>{m.from}</dt>
                <dd>
                  <ArrowRight size={14} aria-hidden="true" />
                  {m.to}
                </dd>
              </div>
            ))}
          </dl>
        </article>

        <h3 className="about-subtitle">Key contributions of this implementation</h3>
        <ol className="contribution-grid">
          {CONTRIBUTIONS.map((c, i) => (
            <motion.li
              key={c.title}
              className="card contribution"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
            >
              <span className="lesson-num">{i + 1}</span>
              <h4>{c.title}</h4>
              <p>{c.text}</p>
              {c.view && (
                <button type="button" className="text-link" onClick={() => navigate(c.view)}>
                  See it: {LABELS[c.view]} <ArrowRight size={14} aria-hidden="true" />
                </button>
              )}
            </motion.li>
          ))}
        </ol>
        <p className="muted small about-note">
          Map coloring, graph coloring, greedy coloring, Welsh–Powell and DSATUR are established topics in graph
          theory. The items above are features of this implementation, not new discoveries.
        </p>
      </section>

      {/* ---------------- Architecture ---------------- */}
      <section className="about-section" id="about-architecture" aria-labelledby="about-architecture-title">
        <SectionHeader id="about-architecture-title" eyebrow="Technical architecture" title="From a click to a colored map">
          The path of one coloring request through the system, as implemented.
        </SectionHeader>
        <div className="arch-layout">
          <div className="card arch-card">
            <h3 className="card-title">Request pipeline</h3>
            <Pipeline />
          </div>
          <div className="arch-side">
            <div className="card arch-card">
              <h3 className="card-title">API endpoints</h3>
              <ul className="endpoint-list">
                {ENDPOINTS.map((e) => (
                  <li key={e.path}>
                    <span className={`method method-${e.method.toLowerCase()}`}>{e.method}</span>
                    <code>{e.path}</code>
                    <span className="muted small">{e.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card arch-card">
              <h3 className="card-title">Design decisions</h3>
              <ul className="explain-list">
                {DESIGN_DECISIONS.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Technology stack ---------------- */}
      <section className="about-section" id="about-stack" aria-labelledby="about-stack-title">
        <SectionHeader id="about-stack-title" eyebrow="Technology stack" title="What the project is built with">
          Only technologies the code actually uses.
        </SectionHeader>
        <div className="stack-grid">
          {STACK.map((group) => {
            const Icon = group.icon;
            return (
              <article key={group.group} className="card stack-card">
                <h3 className="stack-head">
                  <span className="pipeline-icon" aria-hidden="true">
                    <Icon size={17} />
                  </span>
                  {group.group}
                </h3>
                <dl className="stack-list">
                  {group.items.map((item) => (
                    <div key={item.name}>
                      <dt>{item.name}</dt>
                      <dd>{item.role}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            );
          })}
        </div>
      </section>

      {/* ---------------- Algorithm ---------------- */}
      <section className="about-section" id="about-algorithm" aria-labelledby="about-algorithm-title">
        <SectionHeader id="about-algorithm-title" eyebrow="Algorithm documentation" title="Greedy Graph Coloring">
          Implemented by hand in backend/algorithms/coloring.py. The complexities below are those of this
          implementation.
        </SectionHeader>

        <div className="about-pair">
          <article className="card about-statement">
            <h3>Input</h3>
            <ul className="explain-list">
              {ALGORITHM.input.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
          <article className="card about-statement">
            <h3>Output</h3>
            <ul className="explain-list">
              {ALGORITHM.output.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        </div>

        <h3 className="about-subtitle">Algorithm steps</h3>
        <ol className="algo-steps">
          {ALGORITHM_STEPS.map((step, i) => (
            <li key={step.title} className="card">
              <span className="step-num">{i + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p className="muted small">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="how-code">
          <div className="card pseudocode full">
            <h3 className="card-title">Pseudocode</h3>
            <pre tabIndex={0} role="region" aria-label="Greedy coloring pseudocode">
              <code>{FULL_PSEUDOCODE}</code>
            </pre>
          </div>
          <div className="card complexity">
            <h3 className="card-title">Complexity at a glance</h3>
            <div className="complexity-grid">
              <div className="complexity-box">
                <span className="eyebrow">Time · coloring</span>
                <span className="big-o">O(V + E)</span>
              </div>
              <div className="complexity-box">
                <span className="eyebrow">Time · as run by the API</span>
                <span className="big-o">O(V + E + V·C)</span>
              </div>
              <div className="complexity-box">
                <span className="eyebrow">Extra space · coloring</span>
                <span className="big-o">O(V)</span>
              </div>
              <div className="complexity-box">
                <span className="eyebrow">Space · recorded steps</span>
                <span className="big-o">O(V + E + V·C)</span>
              </div>
            </div>
            <p className="muted small">
              V = vertices, E = edges, Δ = maximum degree, C = colors in use. {ALGORITHM.note}
            </p>
          </div>
        </div>

        <div className="card about-costs">
          <h3 className="card-title">Time complexity</h3>
          <CostTable caption="Time complexity of each part" rows={ALGORITHM.time} />
          <h3 className="card-title">Space complexity</h3>
          <CostTable caption="Space complexity of each part" rows={ALGORITHM.space} />
        </div>

        <div className="card about-statement">
          <h3>Limitations of greedy coloring</h3>
          <ul className="explain-list">
            {ALGORITHM.limitations.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- Limitations ---------------- */}
      <section className="about-section" id="about-limitations" aria-labelledby="about-limitations-title">
        <SectionHeader id="about-limitations-title" eyebrow="Limitations" title="What this project does not do">
          The known limits of the current version.
        </SectionHeader>
        <ul className="limit-grid">
          {LIMITATIONS.map((l) => (
            <li key={l.title} className="card limit-card">
              <h4>{l.title}</h4>
              <p>{l.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------- Future scope ---------------- */}
      <section className="about-section" id="about-future" aria-labelledby="about-future-title">
        <SectionHeader id="about-future-title" eyebrow="Future scope" title="Possible extensions">
          Ideas for extending the project. None of them is implemented in the current version.
        </SectionHeader>
        <ul className="future-grid">
          {FUTURE_SCOPE.map((f) => {
            const Icon = f.icon;
            return (
              <li key={f.title} className="card future-card">
                <span className="pipeline-icon" aria-hidden="true">
                  <Icon size={17} />
                </span>
                <h4>{f.title}</h4>
                <p>{f.text}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
