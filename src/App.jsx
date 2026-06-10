import { useState, useRef, useEffect, useCallback } from 'react';
import Settings from './components/Settings.jsx';
import Graph from './components/Graph.jsx';
import { createAlgorithmGenerator } from './algorithms/index.js';

function generateNodes(count, preset) {
  const safeCount = Math.max(2, count);

  if (preset === 'completeGraph') {
    return Array.from({ length: safeCount }, (_, i) => {
      const angle = (2 * Math.PI * i) / safeCount - Math.PI / 2;
      const radius = 0.38;
      return {
        id: i,
        x: 0.5 + Math.cos(angle) * radius,
        y: 0.5 + Math.sin(angle) * radius,
      };
    });
  }

  if (preset === 'grid') {
    const cols = Math.ceil(Math.sqrt(safeCount));
    const rows = Math.ceil(safeCount / cols);
    const xStep = cols === 1 ? 0 : 0.76 / (cols - 1);
    const yStep = rows === 1 ? 0 : 0.76 / (rows - 1);

    return Array.from({ length: safeCount }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        id: i,
        x: 0.12 + col * xStep,
        y: 0.12 + row * yStep,
      };
    });
  }

  if (preset === 'clusters') {
    return Array.from({ length: safeCount }, (_, i) => {
      const leftCluster = i % 2 === 0;
      const centerX = leftCluster ? 0.3 : 0.7;
      const centerY = leftCluster ? 0.35 : 0.65;
      const spread = 0.12;
      return {
        id: i,
        x: centerX + (Math.random() * 2 - 1) * spread,
        y: centerY + (Math.random() * 2 - 1) * spread,
      };
    });
  }

  return Array.from({ length: safeCount }, (_, i) => ({
    id: i,
    x: 0.08 + Math.random() * 0.84,
    y: 0.08 + Math.random() * 0.84,
  }));
}

export default function App() {
  const [nodeCount, setNodeCount] = useState(8);
  const [algorithm, setAlgorithm] = useState('nearestNeighbour');
  const [graphPreset, setGraphPreset] = useState('random');
  const [speed, setSpeed] = useState(10);
  const [nodes, setNodes] = useState(() => generateNodes(8, 'random'));
  const [frame, setFrame] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isStepwiseMode, setIsStepwiseMode] = useState(false);
  const [stepState, setStepState] = useState({ index: -1, total: 0 });
  const [stats, setStats] = useState({ steps: 0, bestCost: null, elapsed: 0 });

  const generatorRef    = useRef(null);
  const animRef         = useRef(null);
  const isRunningRef    = useRef(false);
  const speedRef        = useRef(10);
  const algorithmRef    = useRef(algorithm);
  const stepsRef        = useRef(0);
  const startTimeRef    = useRef(0);
  const stepFramesRef    = useRef([]);

  useEffect(() => { speedRef.current   = speed;     }, [speed]);
  useEffect(() => { algorithmRef.current = algorithm; }, [algorithm]);

  const resetStepwise = useCallback(() => {
    setIsStepwiseMode(false);
    setStepState({ index: -1, total: 0 });
    stepFramesRef.current = [];
  }, []);

  const stopAnimation = useCallback(() => {
    isRunningRef.current = false;
    setIsRunning(false);
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      clearTimeout(animRef.current);
      animRef.current = null;
    }
    generatorRef.current = null;
  }, []);

  const handleRandomize = useCallback(() => {
    stopAnimation();
    resetStepwise();
    setNodes(generateNodes(nodeCount, graphPreset));
    setFrame(null);
    stepsRef.current = 0;
    setStats({ steps: 0, bestCost: null, elapsed: 0 });
  }, [nodeCount, graphPreset, stopAnimation, resetStepwise]);

  useEffect(() => {
    stopAnimation();
    resetStepwise();
    setNodes(generateNodes(nodeCount, graphPreset));
    setFrame(null);
    stepsRef.current = 0;
    setStats({ steps: 0, bestCost: null, elapsed: 0 });
  }, [nodeCount, graphPreset, stopAnimation, resetStepwise]);

  const handleRun = useCallback((currentNodes) => {
    if (!currentNodes || currentNodes.length < 2) return;
    stopAnimation();
    resetStepwise();

    generatorRef.current = createAlgorithmGenerator(algorithm, currentNodes);
    isRunningRef.current = true;
    stepsRef.current = 0;
    startTimeRef.current = performance.now();
    setIsRunning(true);

    // Algorithms with a fixed delay run 1 step per tick at the specified ms interval.
    // Algorithms without an entry batch `speed` steps per requestAnimationFrame.
    const ALGO_DELAY_MS = {
      nearestNeighbour:    160,   // ~6 fps
      dynamicProgramming:   25,   // 40 fps
      christofides:        160,   // ~6 fps
      twoOpt:              160,   // ~6 fps
      nearestInsertion:    120,   // ~8 fps
      minimalSpanningTree: 120,   // ~8 fps
    };

    const animate = () => {
      if (!isRunningRef.current || !generatorRef.current) return;

      const delayMs = ALGO_DELAY_MS[algorithmRef.current];
      const isSlow = delayMs !== undefined;
      const stepsPerFrame = isSlow ? 1 : speedRef.current;
      let lastFrame = null;

      for (let i = 0; i < stepsPerFrame; i++) {
        let result;
        try {
          result = generatorRef.current.next();
        } catch (err) {
          console.error('Algorithm error:', err);
          isRunningRef.current = false;
          setIsRunning(false);
          return;
        }
        if (result.done) {
          if (lastFrame) setFrame(lastFrame);
          isRunningRef.current = false;
          setIsRunning(false);
          return;
        }
        lastFrame = result.value;
        stepsRef.current++;
      }

      if (lastFrame) {
        setFrame(lastFrame);
        const elapsed = ((performance.now() - startTimeRef.current) / 1000).toFixed(1);
        setStats({
          steps: stepsRef.current,
          bestCost: lastFrame.bestCost ?? null,
          elapsed,
        });
      }

      if (isSlow) {
        animRef.current = setTimeout(() => {
          animRef.current = requestAnimationFrame(animate);
        }, delayMs);
      } else {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [algorithm, stopAnimation, resetStepwise]);

  const handleGoStepwise = useCallback(() => {
    if (!nodes || nodes.length < 2) return;

    stopAnimation();
    const startedAt = performance.now();
    const generator = createAlgorithmGenerator(algorithm, nodes);
    const collectedFrames = [];

    try {
      while (true) {
        const result = generator.next();
        if (result.done) break;
        collectedFrames.push(result.value);
      }
    } catch (err) {
      console.error('Algorithm error:', err);
      return;
    }

    stepFramesRef.current = [];
    stepFramesRef.current = collectedFrames;

    setIsStepwiseMode(true);
    if (collectedFrames.length === 0) {
      setStepState({ index: -1, total: 0 });
      setFrame(null);
      setStats({ steps: 0, bestCost: null, elapsed: 0 });
      return;
    }

    const firstFrame = collectedFrames[0];
    const elapsed = ((performance.now() - startedAt) / 1000).toFixed(1);
    setStepState({ index: 0, total: collectedFrames.length });
    setFrame(firstFrame);
    setStats({
      steps: 1,
      bestCost: firstFrame.bestCost ?? null,
      elapsed,
    });
  }, [algorithm, nodes, stopAnimation]);

  const handleExitStepwise = useCallback(() => {
    resetStepwise();
    setFrame(null);
    setStats({ steps: 0, bestCost: null, elapsed: 0 });
  }, [resetStepwise]);

  const handleStepNext = useCallback(() => {
    if (!isStepwiseMode || stepState.index >= stepFramesRef.current.length - 1) return;

    const nextIndex = stepState.index + 1;
    const nextFrame = stepFramesRef.current[nextIndex];
    if (!nextFrame) return;

    setFrame(nextFrame);
    setStepState({ index: nextIndex, total: stepFramesRef.current.length });
    setStats(prev => ({
      ...prev,
      steps: nextIndex + 1,
      bestCost: nextFrame.bestCost ?? null,
    }));
  }, [isStepwiseMode, stepState]);

  const handleStepPrev = useCallback(() => {
    if (!isStepwiseMode || stepState.index <= 0) return;

    const prevIndex = stepState.index - 1;
    const prevFrame = stepFramesRef.current[prevIndex];
    if (!prevFrame) return;

    setFrame(prevFrame);
    setStepState({ index: prevIndex, total: stepFramesRef.current.length });
    setStats(prev => ({
      ...prev,
      steps: prevIndex + 1,
      bestCost: prevFrame.bestCost ?? null,
    }));
  }, [isStepwiseMode, stepState]);

  const handleRunStop = useCallback(() => {
    if (isRunning) {
      stopAnimation();
    } else {
      handleRun(nodes);
    }
  }, [isRunning, nodes, handleRun, stopAnimation]);

  return (
    <div className="app">
      <Settings
        nodeCount={nodeCount}
        setNodeCount={setNodeCount}
        algorithm={algorithm}
        setAlgorithm={setAlgorithm}
        graphPreset={graphPreset}
        setGraphPreset={setGraphPreset}
        speed={speed}
        setSpeed={setSpeed}
        isRunning={isRunning}
        onRunStop={handleRunStop}
        onRandomize={handleRandomize}
        isStepwiseMode={isStepwiseMode}
        onGoStepwise={handleGoStepwise}
        onExitStepwise={handleExitStepwise}
        onStepNext={handleStepNext}
        onStepPrev={handleStepPrev}
        stepIndex={stepState.index}
        stepTotal={stepState.total}
        stats={stats}
        frame={frame}
      />
      <Graph nodes={nodes} frame={frame} />
    </div>
  );
}
