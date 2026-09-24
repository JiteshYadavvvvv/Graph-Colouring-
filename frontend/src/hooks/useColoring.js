import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { analyzeGraph, checkConflicts, getDatasets, getGraph, getHealth, runColoring } from '../api/client';
import {
  CUSTOM_DATASET,
  DEFAULT_DATASET,
  DEFAULT_SPEED,
  LAST_PHASE,
  phaseDuration,
  speedMs,
} from '../utils/constants';
import { coloringAtCursor, edgeKey } from '../utils/helpers';

const START = { step: -1, phase: 0 };

function nextCursor(cursor, totalSteps) {
  if (cursor.phase < LAST_PHASE) return { step: cursor.step, phase: cursor.phase + 1 };
  if (cursor.step + 1 < totalSteps) return { step: cursor.step + 1, phase: 0 };
  return null; // finished
}

function previousCursor(cursor) {
  if (cursor.phase > 0) return { step: cursor.step, phase: cursor.phase - 1 };
  if (cursor.step > 0) return { step: cursor.step - 1, phase: LAST_PHASE };
  return null; // already at the very first phase
}

/**
 * All application state lives here: the graph loaded from the backend (a
 * built-in dataset, or a custom graph from the Playground), the coloring
 * result returned by POST /api/color, and the playback cursor that replays
 * that result step by step.
 *
 * runState: 'idle' → 'requesting' → 'playing' ⇄ 'paused' → 'done'
 */
export function useColoring() {
  const [datasets, setDatasets] = useState([]);
  const [datasetKey, setDatasetKey] = useState(DEFAULT_DATASET);
  const [graph, setGraph] = useState(null);
  const [load, setLoad] = useState({ status: 'loading', error: null });
  const [reloadToken, setReloadToken] = useState(0);
  // Result of GET /api/health: 'checking' | 'online' | 'offline' | 'error'
  const [engine, setEngine] = useState('checking');
  // The last graph built in the Playground, as analyzed by the backend.
  const customGraph = useRef(null);

  const [strategy, setStrategyState] = useState('natural');
  const [result, setResult] = useState(null);
  const [runState, setRunState] = useState('idle');
  const [cursor, setCursor] = useState(START);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [selected, setSelected] = useState(null);
  const [simulated, setSimulated] = useState(null);
  const [verification, setVerification] = useState(null);
  const [verifying, setVerifying] = useState(false);
  // { message, retry? }: a failed action, shown as a dismissible alert.
  const [actionError, setActionError] = useState(null);
  const [showDegrees, setShowDegrees] = useState(false);

  // Incremented on every reset, so responses to outdated requests are ignored.
  const generation = useRef(0);

  // ---- Health check (on start and on every retry) ----
  useEffect(() => {
    let cancelled = false;
    setEngine('checking');
    getHealth()
      .then((health) => !cancelled && setEngine(health?.status === 'ok' ? 'online' : 'error'))
      // A missing health route means the configured URL isn't the engine at all.
      .catch((error) => !cancelled && setEngine(['network', 'not_found'].includes(error.kind) ? 'offline' : 'error'));
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  // ---- Load the dataset list and the selected graph from the backend ----
  useEffect(() => {
    let cancelled = false;
    setLoad({ status: 'loading', error: null });
    const graphRequest = datasetKey === CUSTOM_DATASET ? Promise.resolve(customGraph.current) : getGraph(datasetKey);
    Promise.all([getDatasets(), graphRequest])
      .then(([list, loadedGraph]) => {
        if (cancelled) return;
        setDatasets(list);
        setGraph(loadedGraph);
        setLoad({ status: 'ready', error: null });
      })
      .catch((error) => {
        if (!cancelled) setLoad({ status: 'error', error });
      });
    return () => {
      cancelled = true;
    };
  }, [datasetKey, reloadToken]);

  const reset = useCallback(() => {
    generation.current += 1;
    setResult(null);
    setRunState('idle');
    setCursor(START);
    setSelected(null);
    setSimulated(null);
    setVerification(null);
    setVerifying(false);
    setActionError(null);
  }, []);

  const changeDataset = useCallback(
    (key) => {
      if (key === datasetKey) return;
      if (key === CUSTOM_DATASET && !customGraph.current) return;
      reset();
      setGraph(null);
      setDatasetKey(key);
    },
    [datasetKey, reset],
  );

  /**
   * Sends a Playground graph to the backend (POST /api/analyze) and makes it
   * the active graph. Throws the API error so the Playground can show it.
   */
  const loadCustomGraph = useCallback(
    async (spec) => {
      const analyzed = await analyzeGraph(spec);
      customGraph.current = analyzed;
      reset();
      setGraph(analyzed);
      setLoad({ status: 'ready', error: null });
      setDatasetKey(CUSTOM_DATASET);
      return analyzed;
    },
    [reset],
  );

  const retryLoad = useCallback(() => setReloadToken((t) => t + 1), []);

  // What the backend should color: a dataset key, or the custom graph itself.
  const sourceFor = (g) =>
    g?.key === CUSTOM_DATASET ? { graph: g.adjacency, names: g.names } : { dataset: g?.key ?? datasetKey };
  const source = useMemo(() => sourceFor(graph), [graph, datasetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Verification (POST /api/conflicts) ----
  const verify = useCallback(
    async (coloring, from = source) => {
      const gen = generation.current;
      setVerifying(true);
      setActionError(null);
      try {
        const response = await checkConflicts(from, coloring);
        if (gen === generation.current) setVerification(response);
      } catch (error) {
        if (gen === generation.current) setActionError({ message: error.message, retry: () => verify(coloring, from) });
      } finally {
        if (gen === generation.current) setVerifying(false);
      }
    },
    [source],
  );

  // ---- Running the algorithm (POST /api/color) ----
  // mode: 'animate' (auto play) | 'paused' (step by step) | 'instant'
  // options.strategy / options.graph override the current ones, for callers
  // that change them in the same event (state updates are not visible yet).
  const run = useCallback(
    async (mode = 'animate', options = {}) => {
      const gen = ++generation.current;
      const useStrategy = options.strategy ?? strategy;
      const from = options.graph ? sourceFor(options.graph) : source;
      setRunState('requesting');
      setResult(null);
      setCursor(START);
      setSelected(null);
      setSimulated(null);
      setVerification(null);
      setActionError(null);
      try {
        const response = await runColoring(from, useStrategy);
        if (gen !== generation.current) return;
        setResult(response);
        const total = response.steps.length;
        if (total === 0) {
          setRunState('done');
          return;
        }
        if (mode === 'instant') {
          setCursor({ step: total - 1, phase: LAST_PHASE });
          setRunState('done');
          verify(response.coloring, from);
        } else {
          setCursor({ step: 0, phase: 0 });
          setRunState(mode === 'paused' ? 'paused' : 'playing');
        }
      } catch (error) {
        if (gen !== generation.current) return;
        setRunState('idle');
        setActionError({ message: error.message, retry: () => run(mode, options) });
      }
    },
    [strategy, source, verify], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const setStrategy = useCallback(
    (value) => {
      reset(); // a result computed with another vertex order is no longer current
      setStrategyState(value);
    },
    [reset],
  );

  const finishPlayback = useCallback(
    (finalResult) => {
      setCursor({ step: finalResult.steps.length - 1, phase: LAST_PHASE });
      setRunState('done');
      verify(finalResult.coloring);
    },
    [verify],
  );

  const advance = useCallback(() => {
    if (!result) return;
    const next = nextCursor(cursor, result.steps.length);
    if (next) setCursor(next);
    else finishPlayback(result);
  }, [result, cursor, finishPlayback]);

  // ---- Playback clock: one phase per tick while playing ----
  // The only timer in the app's playback. Pausing, resetting, finishing, or
  // unmounting clears it through the effect cleanup, so no stray tick can
  // fire after the state it belonged to is gone.
  const phaseMs = speedMs(speed);
  useEffect(() => {
    if (runState !== 'playing') return undefined;
    const timer = setTimeout(advance, phaseDuration(cursor.phase, phaseMs));
    return () => clearTimeout(timer);
  }, [runState, advance, phaseMs, cursor.phase]);

  const togglePause = useCallback(() => {
    setRunState((state) => (state === 'playing' ? 'paused' : state === 'paused' ? 'playing' : state));
  }, []);

  /** Replay the current result from its first step (no new backend call). */
  const restart = useCallback(() => {
    if (!result || !result.steps.length) return;
    generation.current += 1;
    setSimulated(null);
    setVerification(null);
    setVerifying(false);
    setSelected(null);
    setCursor({ step: 0, phase: 0 });
    setRunState('playing');
  }, [result]);

  /** Play / pause; replays a finished run; starts auto play when idle. */
  const playPause = useCallback(() => {
    if (runState === 'playing' || runState === 'paused') togglePause();
    else if (runState === 'done' && result?.steps.length) restart();
    else if (runState === 'idle') run('animate');
  }, [runState, result, togglePause, restart, run]);

  const stepForward = useCallback(() => {
    if (runState === 'idle') {
      run('paused');
    } else if (runState === 'playing' || runState === 'paused') {
      setRunState('paused');
      advance();
    }
  }, [runState, run, advance]);

  /** One phase back. From the finished state this re-enters step-by-step mode. */
  const stepBack = useCallback(() => {
    if (!result || !['playing', 'paused', 'done'].includes(runState)) return;
    const from = runState === 'done' ? { step: result.steps.length - 1, phase: LAST_PHASE } : cursor;
    const previous = previousCursor(from);
    if (!previous) return;
    generation.current += 1; // drop a verification that may still be in flight
    setSimulated(null);
    setVerification(null);
    setVerifying(false);
    setRunState('paused');
    setCursor(previous);
  }, [result, runState, cursor]);

  const skipToEnd = useCallback(() => {
    if (runState === 'idle') run('instant');
    else if ((runState === 'playing' || runState === 'paused') && result) finishPlayback(result);
  }, [runState, result, run, finishPlayback]);

  // ---- Colors currently visible (always derived from backend steps) ----
  const baseColoring = useMemo(
    () => (result ? coloringAtCursor(result.steps, cursor) : {}),
    [result, cursor],
  );
  const coloring = useMemo(
    () => (simulated ? { ...baseColoring, [simulated.vertex]: simulated.to } : baseColoring),
    [baseColoring, simulated],
  );

  // ---- Conflict demo ----
  const simulateConflict = useCallback(() => {
    if (runState !== 'done' || !result || !graph?.edges.length) return;
    // Pick a random edge (u, v) and give u the color of v. Only the colors in
    // the browser change; the graph on the backend is untouched, and the
    // backend then has to find the conflict on its own.
    const [a, b] = graph.edges[Math.floor(Math.random() * graph.edges.length)];
    const [vertex, partner] = Math.random() < 0.5 ? [a, b] : [b, a];
    const change = {
      vertex,
      partner,
      from: result.coloring[vertex],
      to: result.coloring[partner],
    };
    setSimulated(change);
    setVerification(null);
    verify({ ...result.coloring, [vertex]: change.to });
  }, [runState, result, graph, verify]);

  /** "Fix Coloring": restore the algorithm's own coloring and re-verify it. */
  const restoreColoring = useCallback(() => {
    if (!result) return;
    setSimulated(null);
    setVerification(null);
    verify(result.coloring);
  }, [result, verify]);

  const detectConflicts = useCallback(() => verify(coloring), [verify, coloring]);

  // ---- Derived visual state ----
  const animating = runState === 'playing' || runState === 'paused';
  const activeStep = animating && result ? result.steps[cursor.step] ?? null : null;
  const totalSteps = result?.steps.length ?? 0;
  const completedSteps =
    runState === 'done' ? totalSteps : Math.max(0, cursor.step + (cursor.phase >= 3 ? 1 : 0));

  // One highlight object is shared by the map, the graph, and the panels, so
  // every view always agrees on the current vertex and its neighbors.
  //   active     vertex being processed (none in the "move to next" phase)
  //   neighbors  neighbors being checked
  //   recent     most recently colored vertex (its halo fades out)
  //   next       vertex the loop moves to (only in the "move to next" phase)
  const highlight = useMemo(() => {
    if (!animating || !result || !activeStep) {
      return { running: false, active: null, neighbors: new Set(), phase: 0, recent: null, next: null };
    }
    const advancing = cursor.phase === LAST_PHASE;
    return {
      running: true,
      active: advancing ? null : activeStep.vertex,
      neighbors: new Set(cursor.phase >= 1 && !advancing ? activeStep.neighbors : []),
      phase: cursor.phase,
      recent: cursor.phase >= 3 ? activeStep.vertex : result.steps[cursor.step - 1]?.vertex ?? null,
      next: advancing ? result.steps[cursor.step + 1]?.vertex ?? null : null,
    };
  }, [activeStep, animating, result, cursor]);

  const conflicts = useMemo(
    () => ({
      vertices: new Set(verification?.conflicting_vertices ?? []),
      edges: new Set((verification?.conflicts ?? []).map((c) => edgeKey(c.region_a, c.region_b))),
    }),
    [verification],
  );

  const resetExperiment = useCallback(() => {
    reset();
    setSpeed(DEFAULT_SPEED);
    setStrategyState('natural');
    setShowDegrees(false);
  }, [reset]);

  return {
    // data
    datasets,
    datasetKey,
    graph,
    load,
    engine,
    retryLoad,
    changeDataset,
    loadCustomGraph,
    hasCustomGraph: Boolean(customGraph.current),
    // algorithm
    strategy,
    setStrategy,
    result,
    runState,
    animating,
    cursor,
    activeStep,
    totalSteps,
    completedSteps,
    speed,
    setSpeed,
    phaseMs,
    run,
    playPause,
    togglePause,
    stepForward,
    stepBack,
    restart,
    skipToEnd,
    reset,
    resetExperiment,
    // visual state
    coloring,
    highlight,
    selected,
    setSelected,
    showDegrees,
    setShowDegrees,
    // verification
    verification,
    verifying,
    conflicts,
    detectConflicts,
    simulated,
    simulateConflict,
    restoreColoring,
    actionError,
    clearActionError: () => setActionError(null),
  };
}
