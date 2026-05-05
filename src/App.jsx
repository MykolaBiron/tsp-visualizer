import { useState, useRef, useEffect, useCallback } from 'react';
import Settings from './components/Settings.jsx';
import Graph from './components/Graph.jsx';
import { createAlgorithmGenerator } from './algorithms/index.js';

function generateRandomNodes(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 0.08 + Math.random() * 0.84,
    y: 0.08 + Math.random() * 0.84,
  }));
}

export default function App() {
  const [nodeCount, setNodeCount] = useState(8);
  const [algorithm, setAlgorithm] = useState('nearestNeighbour');
  const [speed, setSpeed] = useState(10);
  const [nodes, setNodes] = useState(() => generateRandomNodes(8));
  const [frame, setFrame] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState({ steps: 0, bestCost: null, elapsed: 0 });

  const generatorRef    = useRef(null);
  const animRef         = useRef(null);
  const isRunningRef    = useRef(false);
  const speedRef        = useRef(10);
  const algorithmRef    = useRef(algorithm);
  const stepsRef        = useRef(0);
  const startTimeRef    = useRef(0);

  useEffect(() => { speedRef.current   = speed;     }, [speed]);
  useEffect(() => { algorithmRef.current = algorithm; }, [algorithm]);

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
    setNodes(generateRandomNodes(nodeCount));
    setFrame(null);
    stepsRef.current = 0;
    setStats({ steps: 0, bestCost: null, elapsed: 0 });
  }, [nodeCount, stopAnimation]);

  useEffect(() => {
    stopAnimation();
    setNodes(generateRandomNodes(nodeCount));
    setFrame(null);
    stepsRef.current = 0;
    setStats({ steps: 0, bestCost: null, elapsed: 0 });
  }, [nodeCount]);

  const handleRun = useCallback((currentNodes) => {
    if (!currentNodes || currentNodes.length < 2) return;
    stopAnimation();

    generatorRef.current = createAlgorithmGenerator(algorithm, currentNodes);
    isRunningRef.current = true;
    stepsRef.current = 0;
    startTimeRef.current = performance.now();
    setIsRunning(true);

    // Algorithms with a fixed delay run 1 step per tick at the specified ms interval.
    // Algorithms without an entry batch `speed` steps per requestAnimationFrame.
    const ALGO_DELAY_MS = {
      nearestNeighbour:   160,   // ~6 fps
      dynamicProgramming:  25,   // 40 fps
      christofides:       160,   // ~6 fps
      twoOpt:             160,   // ~6 fps
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
  }, [algorithm, stopAnimation]);

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
        speed={speed}
        setSpeed={setSpeed}
        isRunning={isRunning}
        onRunStop={handleRunStop}
        onRandomize={handleRandomize}
        stats={stats}
        frame={frame}
      />
      <Graph nodes={nodes} frame={frame} />
    </div>
  );
}
