/**
 * Project identity: every place that shows the project's name, subtitle,
 * description or institution reads it from here, so they never drift apart.
 */
export const PROJECT = {
  name: 'Interactive Map Coloring System',
  subtitle: 'Graph Coloring • DSA Visualization • Educational Computing',
  description:
    'An interactive graph-coloring platform that transforms geographical regions into mathematical graphs and visually demonstrates graph-coloring algorithms.',
};

export const INSTITUTION = {
  name: 'Army Institute of Technology, Pune',
  department: 'Department of Computer Engineering',
};

/**
 * Map coloring and graph coloring are classical problems; what this project
 * contributes is the implementation and its integration. `view` links a
 * highlight to the page that demonstrates it.
 */
export const HIGHLIGHTS = [
  {
    title: 'Interactive geographical visualization',
    text: 'Real state boundaries of India, drawn locally as SVG and explorable region by region.',
    view: 'map',
  },
  {
    title: 'Graph representation',
    text: 'Regions become vertices and shared borders become edges, stored as an adjacency list.',
    view: 'graph',
  },
  {
    title: 'Algorithm execution',
    text: 'Greedy coloring runs on the FastAPI backend, with Welsh–Powell and DSATUR vertex orders.',
    view: 'compare',
  },
  {
    title: 'Step-by-step visualization',
    text: 'Every decision the backend made is replayed in five phases, forward and backward.',
    view: 'map',
  },
  {
    title: 'Conflict detection',
    text: 'Every edge is verified; conflicts are shown with an outline, an icon and text.',
    view: 'conflicts',
  },
  {
    title: 'Map and graph synchronization',
    text: 'Map regions and graph vertices share stable IDs, so selections and colors stay in sync.',
    view: 'map',
  },
  {
    title: 'Educational viva mode',
    text: 'Examiner-style questions with answers, and a short scored quiz.',
    view: 'viva',
  },
  {
    title: 'Multiple graph datasets',
    text: 'The map of India, textbook graphs, and graphs you build in the Playground.',
    view: 'datasets',
  },
  {
    title: 'Offline-capable architecture',
    text: 'No CDN, map service or web fonts: after installation everything runs locally.',
    view: null,
  },
];

/** Sources the project builds on, shown in the footer and the README. */
export const CREDITS = {
  mapData:
    'State boundaries derived from the district GeoJSON of udit-001/india-maps-data, processed offline by tools/build_india_map.py.',
  algorithms: 'Greedy coloring; Welsh & Powell (1967); Brélaz, DSATUR (1979).',
};
