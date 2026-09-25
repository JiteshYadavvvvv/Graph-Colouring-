import {
  BarChart3,
  BookOpen,
  Database,
  PencilRuler,
  GraduationCap,
  House,
  Lightbulb,
  Map as MapIcon,
  Network,
  Scale,
  ShieldAlert,
  Table2,
  Users,
} from 'lucide-react';

/**
 * Display palette. Color k (from the backend) maps to PALETTE[k - 1].
 * `ink` is the label color that stays readable on top of `fill`.
 */
export const PALETTE = [
  { name: 'Blue', fill: '#4A72E0', ink: '#FFFFFF' },
  { name: 'Teal', fill: '#1FAE98', ink: '#FFFFFF' },
  { name: 'Purple', fill: '#8B6CF0', ink: '#FFFFFF' },
  { name: 'Amber', fill: '#F2A83B', ink: '#172033' },
  { name: 'Rose', fill: '#E0648A', ink: '#FFFFFF' },
  { name: 'Green', fill: '#5E9F3E', ink: '#FFFFFF' },
  { name: 'Sky', fill: '#3AA6DA', ink: '#FFFFFF' },
  { name: 'Brown', fill: '#A5794D', ink: '#FFFFFF' },
];

export const NEUTRAL_FILL = '#E7EBF3';
export const CONTEXT_FILL = '#F1F3F8';
export const NEIGHBOR_FILL = '#D4F1F1';
export const ACTIVE_FILL = '#ECE8FE';
export const CONFLICT_RED = '#E5484D';
export const ACTIVE_RING = '#6C5CE7';
export const NEIGHBOR_RING = '#12A4B5';
export const SELECT_RING = '#172033';
export const NEXT_RING = '#8391AD';

export const DEFAULT_DATASET = 'india';
export const CUSTOM_DATASET = 'custom';

/** Every page. `id` is also the URL hash. */
export const VIEWS = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'datasets', label: 'Datasets', icon: Database },
  { id: 'map', label: 'Map', icon: MapIcon },
  { id: 'graph', label: 'Graph', icon: Network },
  { id: 'playground', label: 'Playground', icon: PencilRuler },
  { id: 'results', label: 'Results', icon: Table2 },
  { id: 'conflicts', label: 'Conflicts', icon: ShieldAlert },
  { id: 'stats', label: 'Statistics', icon: BarChart3 },
  { id: 'compare', label: 'Compare', icon: Scale },
  { id: 'how', label: 'How It Works', icon: BookOpen },
  { id: 'applications', label: 'Applications', icon: Lightbulb },
  { id: 'viva', label: 'Viva Mode', icon: GraduationCap },
  { id: 'team', label: 'Project Team', icon: Users },
];

/** Sidebar sections. */
export const NAV_GROUPS = [
  { label: 'Overview', views: ['home', 'datasets'] },
  { label: 'Visualize', views: ['map', 'graph', 'playground'] },
  { label: 'Analyze', views: ['results', 'conflicts', 'stats', 'compare'] },
  { label: 'Learn', views: ['how', 'applications', 'viva'] },
  { label: 'About', views: ['team'] },
];

/**
 * Each backend step is replayed in five phases so the reasoning is visible:
 *   0 select   → highlight the vertex chosen next
 *   1 inspect  → highlight its neighbors and read their colors
 *   2 choose   → cross out used colors, find the smallest available one
 *   3 assign   → fill the vertex with that color
 *   4 advance  → the loop moves on; the next vertex is previewed
 */
export const PHASES = ['select', 'inspect', 'choose', 'assign', 'advance'];
export const LAST_PHASE = PHASES.length - 1;
export const PHASE_LABELS = [
  'Choose vertex',
  'Check neighboring colors',
  'Find available color',
  'Assign color',
  'Move to next vertex',
];

/**
 * Playback speeds. `ms` is how long each phase of a step stays on screen
 * (the short "move to next vertex" phase gets half of it). Every animation
 * duration in the visualizations is derived from this one value (see
 * phaseTiming below), so nothing else hardcodes timings.
 */
export const SPEEDS = [
  { id: '0.5x', label: '0.5×', ms: 1800 },
  { id: '1x', label: '1×', ms: 900 },
  { id: '2x', label: '2×', ms: 450 },
  { id: '4x', label: '4×', ms: 225 },
];
export const DEFAULT_SPEED = '1x';

export function speedMs(id) {
  return (SPEEDS.find((s) => s.id === id) ?? SPEEDS[1]).ms;
}

/** How long a given phase stays on screen at a given speed. */
export function phaseDuration(phase, ms) {
  return phase === LAST_PHASE ? ms / 2 : ms;
}

/** Animation durations (in seconds, for Framer Motion) derived from the phase length. */
export function phaseTiming(ms) {
  const phase = ms / 1000;
  return {
    phase,
    fill: Math.min(0.9, phase * 0.7), // color spreading through a region
    glow: Math.min(1.6, phase * 1.4), // halo fading after assignment
    ui: Math.min(0.35, phase * 0.5), // strokes, highlights, panels
  };
}

/**
 * Vertex orders the backend supports. All three are greedy: they differ only
 * in which vertex is colored next.
 */
export const STRATEGIES = [
  {
    id: 'natural',
    label: 'Greedy · natural order',
    short: 'Natural order',
    algorithm: 'Greedy Coloring',
  },
  {
    id: 'largest_first',
    label: 'Welsh–Powell · largest degree first',
    short: 'Welsh–Powell order',
    algorithm: 'Welsh–Powell',
  },
  {
    id: 'dsatur',
    label: 'DSATUR · most saturated first',
    short: 'DSATUR order',
    algorithm: 'DSATUR',
  },
];

export function strategyInfo(id) {
  return STRATEGIES.find((s) => s.id === id) ?? STRATEGIES[0];
}
