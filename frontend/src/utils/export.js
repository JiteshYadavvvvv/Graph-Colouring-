/**
 * Export builders. Everything written to a file comes from the loaded graph,
 * the backend's coloring result, and the backend's verification: the
 * colors currently on screen, including a simulated conflict if one is
 * active (the file says so). Nothing about the user or the environment is
 * included.
 */
import { strategyInfo } from './constants';
import { colorClasses, colorName, nameOf, usedColors } from './helpers';

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Everything the exports need, gathered once. */
function snapshot(cs) {
  const { graph, result, coloring, verification, simulated } = cs;
  const s = graph.statistics;
  const hubs = graph.vertices.filter((v) => graph.adjacency[v].length === s.max_degree);
  return {
    graph,
    result,
    coloring,
    verification,
    simulated,
    stats: s,
    hubs,
    colorsUsed: usedColors(coloring).length,
    conflictVertices: new Set(verification?.conflicting_vertices ?? []),
  };
}

export function resultJSON(cs, now) {
  const x = snapshot(cs);
  const { graph, result, coloring, verification, stats } = x;
  return JSON.stringify(
    {
      generated_at: now.toISOString(),
      dataset: { key: graph.key, name: graph.name, graph_type: graph.graph_type },
      algorithm: {
        name: result.algorithm ?? 'Greedy Graph Coloring',
        strategy: result.strategy,
        vertex_order: result.strategy_label,
        time_complexity: result.statistics.time_complexity,
        space_complexity: result.statistics.space_complexity,
      },
      statistics: {
        vertices: stats.vertices,
        edges: stats.edges,
        max_degree: stats.max_degree,
        min_degree: stats.min_degree,
        average_degree: stats.average_degree,
        colors_used: x.colorsUsed,
        chromatic_number: graph.chromatic?.value ?? null,
        chromatic_number_exact: graph.chromatic?.exact ?? false,
        conflicts: verification ? verification.conflicts.length : null,
        valid: verification ? verification.valid : null,
        execution_ms: result.statistics.execution_ms,
        neighbor_checks: result.statistics.neighbor_checks,
        color_checks: result.statistics.color_checks,
      },
      simulated_conflict: x.simulated
        ? { vertex: x.simulated.vertex, original_color: x.simulated.from, simulated_color: x.simulated.to }
        : null,
      coloring: result.order.map((v, i) => ({
        order: i + 1,
        id: v,
        name: nameOf(graph, v),
        degree: graph.adjacency[v].length,
        color: coloring[v],
      })),
      conflicts: (verification?.conflicts ?? []).map((c) => ({
        a: c.region_a,
        b: c.region_b,
        color: c.color,
      })),
    },
    null,
    2,
  );
}

export function resultCSV(cs) {
  const { graph, result, coloring, conflictVertices } = snapshot(cs);
  const header = ['order', 'vertex_id', 'vertex_name', 'degree', 'color', 'color_name', 'in_conflict'];
  const rows = result.order.map((v, i) => [
    i + 1,
    v,
    nameOf(graph, v),
    graph.adjacency[v].length,
    coloring[v],
    colorName(coloring[v]),
    conflictVertices.has(v) ? 'yes' : 'no',
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
}

export function adjacencyText(graph) {
  const lines = [
    `# Adjacency list: ${graph.name} (${graph.statistics.vertices} vertices, ${graph.statistics.edges} edges)`,
    '# Format: vertex_id (name) [degree]: neighbor ids',
    '',
  ];
  for (const v of graph.vertices) {
    const neighbors = graph.adjacency[v];
    lines.push(`${v} (${nameOf(graph, v)}) [${neighbors.length}]: ${neighbors.join(', ') || '(none)'}`);
  }
  return lines.join('\n') + '\n';
}

export function reportText(cs, now) {
  const x = snapshot(cs);
  const { graph, result, coloring, verification, stats } = x;
  const row = (label, value) => `  ${label.padEnd(22)}${value}`;
  const chromatic = graph.chromatic;
  const verdict = !verification
    ? 'Not verified'
    : verification.valid
      ? 'Yes (every edge checked by POST /api/conflicts)'
      : `No: ${verification.conflicts.length} conflicting edge(s)`;

  const lines = [
    'INTERACTIVE MAP COLORING SYSTEM: ALGORITHM EXECUTION REPORT',
    '='.repeat(60),
    row('Timestamp', now.toISOString()),
    '',
    'DATASET',
    row('Name', graph.name),
    row('Graph type', graph.graph_type ?? '—'),
    row('Vertices', stats.vertices),
    row('Edges', stats.edges),
    row('Max degree (Δ)', `${stats.max_degree}${x.hubs.length === 1 ? ` (${nameOf(graph, x.hubs[0])})` : ''}`),
    row('Min degree', stats.min_degree),
    row('Average degree', stats.average_degree.toFixed(2)),
    row('Density', stats.density),
    '',
    'ALGORITHM',
    row('Algorithm', `${result.algorithm ?? 'Greedy Graph Coloring'} (${strategyInfo(result.strategy).algorithm} order)`),
    row('Vertex order', result.strategy_label),
    row('Time complexity', `${result.statistics.time_complexity} (coloring decisions: ${result.statistics.core_time_complexity})`),
    row('Space complexity', result.statistics.space_complexity),
    '',
    'RESULT',
    row('Colors produced', `${x.colorsUsed} (by the algorithm)`),
    row(
      'Known minimum (χ)',
      chromatic?.value !== null && chromatic?.value !== undefined
        ? `${chromatic.value} (exact)`
        : `between ${chromatic?.lower_bound} and ${chromatic?.upper_bound} (not proven)`,
    ),
    row('Conflicts', verification ? verification.conflicts.length : 'not verified'),
    row('Valid coloring', verdict),
    row('Execution time', `${result.statistics.execution_ms} ms (measured on the backend)`),
    row('Vertices processed', result.steps.length),
    row('Neighbor checks', result.statistics.neighbor_checks),
    row('Candidate colors', result.statistics.color_checks),
  ];

  if (x.simulated) {
    lines.push(
      '',
      'NOTE: a simulated conflict is active. ' +
        `${nameOf(graph, x.simulated.vertex)} was changed from Color ${x.simulated.from} to Color ${x.simulated.to} ` +
        'in the browser to demonstrate conflict detection.',
    );
  }
  if (verification?.conflicts.length) {
    lines.push('', 'CONFLICTS');
    for (const c of verification.conflicts) {
      lines.push(`  ${nameOf(graph, c.region_a)} – ${nameOf(graph, c.region_b)}: both Color ${c.color}`);
    }
  }

  lines.push('', 'COLOR CLASSES (no two members are adjacent)');
  for (const { color, members } of colorClasses(coloring, result.order)) {
    lines.push(`  Color ${color} (${colorName(color)}), ${members.length}: ${members.map((v) => nameOf(graph, v)).join(', ')}`);
  }

  lines.push('', 'ASSIGNMENT (in the order the algorithm visited the vertices)');
  lines.push(`  ${'#'.padEnd(4)}${'ID'.padEnd(10)}${'Name'.padEnd(24)}${'Degree'.padEnd(8)}Color`);
  result.order.forEach((v, i) => {
    lines.push(
      `  ${String(i + 1).padStart(2, '0').padEnd(4)}${v.padEnd(10)}${nameOf(graph, v).padEnd(24)}${String(graph.adjacency[v].length).padEnd(8)}${coloring[v]}`,
    );
  });
  return lines.join('\n') + '\n';
}

export const EXPORTS = [
  {
    id: 'json',
    label: 'Coloring result',
    format: 'JSON',
    needsResult: true,
    build: (cs, now, base) => ({ name: `${base}-coloring.json`, content: resultJSON(cs, now), mime: 'application/json' }),
  },
  {
    id: 'csv',
    label: 'Coloring result',
    format: 'CSV',
    needsResult: true,
    build: (cs, now, base) => ({ name: `${base}-coloring.csv`, content: resultCSV(cs), mime: 'text/csv' }),
  },
  {
    id: 'adjacency',
    label: 'Graph adjacency list',
    format: 'TXT',
    needsResult: false,
    build: (cs, now, base) => ({ name: `${base}-adjacency.txt`, content: adjacencyText(cs.graph), mime: 'text/plain' }),
  },
  {
    id: 'report',
    label: 'Algorithm execution report',
    format: 'TXT',
    needsResult: true,
    build: (cs, now, base) => ({ name: `${base}-report.txt`, content: reportText(cs, now), mime: 'text/plain' }),
  },
];

/** A result can be exported once the run has finished. */
export function canExport(item, cs) {
  return Boolean(cs.graph) && (!item.needsResult || (cs.runState === 'done' && Boolean(cs.result)));
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Builds the file for an export id and downloads it. Returns the file name. */
export function runExport(id, cs) {
  const item = EXPORTS.find((e) => e.id === id);
  if (!item || !canExport(item, cs)) return null;
  const now = new Date();
  const base = `${slug(cs.graph.name)}-${now.toISOString().slice(0, 10)}`;
  const file = item.build(cs, now, base);
  downloadFile(file.name, file.content, file.mime);
  return file.name;
}
