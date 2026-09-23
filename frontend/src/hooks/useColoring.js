import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { checkConflicts, getDatasets, getGraph, runColoring } from '../api/client';
import { DEFAULT_SPEED, speedMs } from '../utils/constants';
import { coloringAtCursor, edgeKey } from '../utils/helpers';

const START = { step: -1, phase: 0 };
const LAST_PHASE = 3;

function nextCursor(cursor, totalSteps) {
  if (cursor.phase < LAST_PHASE) return { step: cursor.step, phase: cursor.phase + 1 };
  if (cursor.step + 1 < totalSteps) return { step: cursor.step + 1, phase: 0 };
  return null; // finished
}

/**
 * All application state lives here: the dataset loaded from the backend,
 * the coloring result returned by POST /api/color, and the playback cursor
 * that replays that result step by step.
 *
 * runState: 'idle' → 'requesting' → 'playing' ⇄ 'paused' → 'done'
 */
export function useColoring() {
  const [datasets, setDatasets] = useState([]);
  const [datasetKey, setDatasetKey] = useState('india');
  const [graph, setGraph] = useState(null);
  const [load, setLoad] = useState({ status: 'loading', error: null });
  const [reloadToken, setReloadToken] = useState(0);

  const [strategy, setStrategyState] = useState('natural');
  const [result, setResult] = useState(null);
  const [runState, setRunState] = useState('idle');
  const [cursor, setCursor] = useState(START);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [selected, setSelected] = useState(null);
  const [simulated, setSimulated] = useState(null);
  const [verification, setVerification] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Incremented on every reset, so responses to outdated requests are ignored.
  const generation = useRef(0);

  // ---- Load the dataset list and the selected graph from the backend ----
  useEffect(() => {
    let cancelled = false;
    setLoad({ status: 'loading', error: null });
    Promise.all([getDatasets(), getGraph(datasetKey)])
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
      reset();
      setGraph(null);
      setDatasetKey(key);
    },
    [datasetKey, reset],
  );

  const setStrategy = useCallback(
    (value) => {
      reset(); // a result computed with another vertex order is no longer current
      setStrategyState(value);
    },
    [reset],
  );

  const retryLoad = useCallback(() => setReloadToken((t) => t + 1), []);

  // ---- Verification (POST /api/conflicts) ----
  const verify = useCallback(
    async (coloring) => {
      const gen = generation.current;
      setVerifying(true);
      setActionError(null);
      try {
        const response = await checkConflicts(datasetKey, coloring);
        if (gen === generation.current) setVerification(response);
      } catch (error) {
        if (gen === generation.current) setActionError(error.message);
      } finally {
        if (gen === generation.current) setVerifying(false);
      }
    },
    [datasetKey],
  );

  // ---- Running the algorithm (POST /api/color) ----
  const run = useCallback(
    async (mode = 'animate') => {
      const gen = ++generation.current;
      setRunState('requesting');
      setResult(null);
      setCursor(START);
      setSelected(null);
      setSimulated(null);
      setVerification(null);
      setActionError(null);
      try {
        const response = await runColoring(datasetKey, strategy);
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
          verify(response.coloring);
        } else {
          setCursor({ step: 0, phase: 0 });
          setRunState(mode === 'paused' ? 'paused' : 'playing');
        }
      } catch (error) {
        if (gen !== generation.current) return;
        setRunState('idle');
        setActionError(error.message);
      }
    },
    [datasetKey, strategy, verify],
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
    const timer = setTimeout(advance, phaseMs);
    return () => clearTimeout(timer);
  }, [runState, advance, phaseMs]);

  const togglePause = useCallback(() => {
    setRunState((state) => (state === 'playing' ? 'paused' : state === 'paused' ? 'playing' : state));
  }, []);

  const stepForward = useCallback(() => {
    if (runState === 'idle') {
      run('paused');
    } else if (runState === 'playing' || runState === 'paused') {
      setRunState('paused');
      advance();
    }
  }, [runState, run, advance]);

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
    // the browser change; the graph on the backend is untouched.
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
    runState === 'done' ? totalSteps : Math.max(0, cursor.step + (cursor.phase === LAST_PHASE ? 1 : 0));

  // One highlight object is shared by the map, the graph, and the panels, so
  // every view always agrees on the current vertex and its neighbors.
  const highlight = useMemo(() => {
    let recent = null; // the most recently colored vertex (its halo fades out)
    if (animating && result) {
      recent = cursor.phase === LAST_PHASE ? activeStep?.vertex : result.steps[cursor.step - 1]?.vertex;
    }
    return {
      active: activeStep?.vertex ?? null,
      neighbors: new Set(activeStep && cursor.phase >= 1 ? activeStep.neighbors : []),
      phase: cursor.phase,
      recent: recent ?? null,
    };
  }, [activeStep, animating, result, cursor]);

  const conflicts = useMemo(
    () => ({
      vertices: new Set(verification?.conflicting_vertices ?? []),
      edges: new Set((verification?.conflicts ?? []).map((c) => edgeKey(c.region_a, c.region_b))),
    }),
    [verification],
  );

  return {
    // data
    datasets,
    datasetKey,
    graph,
    load,
    retryLoad,
    changeDataset,
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
    togglePause,
    stepForward,
    skipToEnd,
    reset,
    // visual state
    coloring,
    highlight,
    selected,
    setSelected,
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
