import {
  BarChart3,
  BookOpen,
  Home,
  Map as MapIcon,
  Network,
  ShieldAlert,
  Table2,
} from 'lucide-react';

/** Display palette. Color k (from the backend) maps to PALETTE[k - 1]. */
export const PALETTE = [
  { name: 'Blue', fill: '#3B6FE0' },
  { name: 'Teal', fill: '#18B7A0' },
  { name: 'Purple', fill: '#8B5CF6' },
  { name: 'Orange', fill: '#F59E0B' },
  { name: 'Olive', fill: '#5B8C1A' },
  { name: 'Crimson', fill: '#C2185B' },
  { name: 'Sky', fill: '#0EA5E9' },
  { name: 'Brown', fill: '#A16207' },
];

export const NEUTRAL_FILL = '#E6EAF2';
export const NEIGHBOR_FILL = '#CFF3F4';
export const CONFLICT_RED = '#E5484D';
export const ACTIVE_RING = '#6C5CE7';
export const NEIGHBOR_RING = '#12A4B5';

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

/** Milliseconds per phase for speed levels 1 (slow) … 5 (fast). */
export const SPEED_DELAYS = [1500, 950, 620, 360, 150];
export const SPEED_NAMES = ['Very slow', 'Slow', 'Normal', 'Fast', 'Very fast'];

export const STRATEGIES = [
  { id: 'natural', label: 'Natural order' },
  { id: 'largest_first', label: 'Largest degree first' },
];
