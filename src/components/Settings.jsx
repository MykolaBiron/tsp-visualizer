import './Settings.css';

const ALGORITHMS = [
  { value: 'bruteForce',         label: 'Brute Force',         maxNodes: 10, complexity: 'O(n!)' },
  { value: 'dynamicProgramming', label: 'Dynamic Programming', maxNodes: 15, complexity: 'O(n²·2ⁿ)' },
  { value: 'nearestNeighbour',   label: 'Nearest Neighbour',   maxNodes: 20, complexity: 'O(n²)' },
];

const ALGO_NOTES = {
  bruteForce:
    'Tries every permutation. Guarantees optimal solution but scales as n!. Limited to 10 nodes.',
  dynamicProgramming:
    'Held-Karp DP finds the exact optimal tour. Exponential memory: limited to 15 nodes.',
  nearestNeighbour:
    'Greedy heuristic — always visit the closest unvisited city. Fast but not optimal.',
};

export default function Settings({
  nodeCount, setNodeCount,
  algorithm, setAlgorithm,
  speed, setSpeed,
  isRunning, onRunStop, onRandomize,
  stats, frame,
}) {
  const selectedAlgo = ALGORITHMS.find(a => a.value === algorithm);
  const maxNodes = selectedAlgo?.maxNodes ?? 20;

  const handleAlgoChange = (e) => {
    const next = ALGORITHMS.find(a => a.value === e.target.value);
    setAlgorithm(e.target.value);
    if (next && nodeCount > next.maxNodes) setNodeCount(next.maxNodes);
  };

  const speedLabel = speed <= 1 ? '1×' : speed <= 50 ? `${speed}×` : speed <= 200 ? `${speed}×` : `${speed}×`;

  return (
    <aside className="settings">
      <div className="settings-header">
        <div className="logo-wrap">
          <span className="logo-tsp">TSP</span>
          <span className="logo-vis">Visualizer</span>
        </div>
        <p className="tagline">Travelling Salesman Problem</p>
      </div>

      <div className="divider" />

      {/* Node count */}
      <div className="settings-group">
        <label className="settings-label">
          Nodes <span className="settings-value">{nodeCount}</span>
        </label>
        <input
          type="range"
          min={2}
          max={maxNodes}
          value={Math.min(nodeCount, maxNodes)}
          onChange={e => setNodeCount(Number(e.target.value))}
          disabled={isRunning}
          className="slider"
        />
        <div className="slider-range">
          <span>2</span>
          <span>{maxNodes}</span>
        </div>
      </div>

      {/* Algorithm */}
      <div className="settings-group">
        <label className="settings-label">Algorithm</label>
        <select
          value={algorithm}
          onChange={handleAlgoChange}
          disabled={isRunning}
          className="select"
        >
          {ALGORITHMS.map(a => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        {selectedAlgo && (
          <div className="complexity-tag">{selectedAlgo.complexity}</div>
        )}
      </div>

      {/* Algorithm note */}
      <div className="algo-note">
        {ALGO_NOTES[algorithm]}
      </div>

      {/* Speed */}
      <div className="settings-group">
        <label className="settings-label">
          Speed <span className="settings-value">{speedLabel}</span>
          {algorithm === 'bruteForce' && (
            <span className="speed-boost-badge">10× speed up</span>
          )}
          {['nearestNeighbour', 'dynamicProgramming'].includes(algorithm) && (
            <span className="speed-nn-badge">step-by-step</span>
          )}
        </label>
        <input
          type="range"
          min={1}
          max={500}
          value={speed}
          onChange={e => setSpeed(Number(e.target.value))}
          className="slider slider--speed"
        />
        <div className="slider-range">
          <span>Slow</span>
          <span>Fast</span>
        </div>
      </div>

      <div className="divider" />

      {/* Stats */}
      <div className="stats-panel">
        <div className="stat-row">
          <span className="stat-key">Best Cost</span>
          <span className="stat-val">
            {stats.bestCost !== null ? stats.bestCost.toFixed(4) : '—'}
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-key">Steps</span>
          <span className="stat-val">
            {stats.steps > 0 ? stats.steps.toLocaleString() : '—'}
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-key">Elapsed</span>
          <span className="stat-val">
            {stats.elapsed > 0 ? `${stats.elapsed}s` : '—'}
          </span>
        </div>
        {frame?.phase && (
          <div className="stat-row">
            <span className="stat-key">Phase</span>
            <span className="stat-val stat-phase">{frame.phase}</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#00aaff', boxShadow: '0 0 6px #00aaff' }} />
          <span>Current path</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
          <span>Best tour</span>
        </div>
      </div>

      <div className="settings-actions">
        <button
          className="btn btn-secondary"
          onClick={onRandomize}
          disabled={isRunning}
        >
          ⟳ Randomize
        </button>
        <button
          className={`btn ${isRunning ? 'btn-stop' : 'btn-run'}`}
          onClick={onRunStop}
        >
          {isRunning ? '■ Stop' : '▶ Run'}
        </button>
      </div>
    </aside>
  );
}
