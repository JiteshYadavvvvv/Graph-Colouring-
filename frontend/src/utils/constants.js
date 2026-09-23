import {
  BarChart3,
  BookOpen,
  Home,
  Map as MapIcon,
  Network,
  ShieldAlert,
  Table2,
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

/** Sidebar navigation. `id` is also the URL hash. */
export const VIEWS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'graph', label: 'Graph', icon: Network },
  { id: 'map', label: 'Map', icon: MapIcon },
  { id: 'results', label: 'Results', icon: Table2 },
  { id: 'conflicts', label: 'Conflicts', icon: ShieldAlert },
  { id: 'how', label: 'How It Works', icon: BookOpen },
  { id: 'stats', label: 'Statistics', icon: BarChart3 },
];

/**
 * Each backend step is replayed in four phases so the reasoning is visible:
 *   0 select   → highlight the current vertex
 *   1 inspect  → highlight its neighbors and read their colors
 *   2 choose   → cross out used colors, find the smallest available one
 *   3 assign   → fill the vertex with that color
 */
export const PHASES = ['select', 'inspect', 'choose', 'assign'];
export const PHASE_LABELS = [
  'Select vertex',
  'Check neighbors',
  'Find smallest color',
  'Assign color',
];

/**
 * Playback speeds. `ms` is how long each of the four phases of a step stays
 * on screen. Every animation duration in the visualizations is derived from
 * this one value (see phaseTiming below), so nothing else hardcodes timings.
 */
export const SPEEDS = [
  { id: 'slow', label: 'Slow', ms: 1800 },
  { id: 'normal', label: 'Normal', ms: 1100 },
  { id: 'fast', label: 'Fast', ms: 500 },
  { id: 'instant', label: 'Instant', ms: 100 },
];
export const DEFAULT_SPEED = 'normal';

export function speedMs(id) {
  return (SPEEDS.find((s) => s.id === id) ?? SPEEDS[1]).ms;
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

export const STRATEGIES = [
  { id: 'natural', label: 'Natural order' },
  { id: 'largest_first', label: 'Largest degree first' },
];
