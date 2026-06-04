import { buildDist, tourCost } from './utils.js';

export function* minimalSpanningTree(nodes) {
  const n = nodes.length;
  if (n < 2) return;

  const d = buildDist(nodes);

  // ── Phase 1: Build MST (Prim's Algorithm) ─────────────────────────────────
  const inTree = new Uint8Array(n);
  const key = new Float64Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);
  key[0] = 0;

  const mstEdges = [];
  const mstPhaseEdges = [];

  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    for (let v = 0; v < n; v++) {
      if (!inTree[v] && (u === -1 || key[v] < key[u])) u = v;
    }

    if (u === -1) break;
    inTree[u] = 1;

    if (parent[u] !== -1) {
      mstEdges.push({ from: parent[u], to: u });
      mstPhaseEdges.push({
        from: parent[u],
        to: u,
        color: '#ff8822',
        glow: '#ff5500',
        width: 2.5
      });

      yield {
        currentPath: null,
        bestPath: null,
        currentCost: null,
        bestCost: null,
        phaseEdges: [...mstPhaseEdges],
        currentNode: u,
        phase: 'MST (Building Tree)',
        status: `Added MST edge from Node ${parent[u]} to Node ${u} (dist: ${d[parent[u]][u].toFixed(4)})`,
        progress: 0.4 * (mstEdges.length / (n - 1)),
      };
    } else {
      // Start node
      yield {
        currentPath: null,
        bestPath: null,
        currentCost: null,
        bestCost: null,
        phaseEdges: [],
        currentNode: u,
        phase: 'MST (Building Tree)',
        status: `Starting MST construction at Node ${u}`,
        progress: 0,
      };
    }

    for (let v = 0; v < n; v++) {
      if (!inTree[v] && d[u][v] < key[v]) {
        key[v] = d[u][v];
        parent[v] = u;
      }
    }
  }

  // ── Phase 2: DFS Traversal of the MST ─────────────────────────────────────
  // Build adjacency list
  const adj = Array.from({ length: n }, () => []);
  for (const e of mstEdges) {
    adj[e.from].push(e.to);
    adj[e.to].push(e.from);
  }

  // DFS order traversal
  const dfsOrder = [];
  const visitedDFS = new Uint8Array(n);

  function dfs(curr) {
    visitedDFS[curr] = 1;
    dfsOrder.push(curr);
    for (const neighbor of adj[curr]) {
      if (!visitedDFS[neighbor]) {
        dfs(neighbor);
        dfsOrder.push(curr); // record return path
      }
    }
  }
  dfs(0);

  // Animate the DFS traversal on the tree
  const dfsPath = [];
  for (let i = 0; i < dfsOrder.length; i++) {
    const node = dfsOrder[i];
    dfsPath.push(node);
    yield {
      currentPath: [...dfsPath],
      bestPath: null,
      currentCost: null,
      bestCost: null,
      phaseEdges: [...mstPhaseEdges],
      currentNode: node,
      phase: 'MST (DFS Traversal)',
      status: `Traversing MST: reached Node ${node} (${i + 1}/${dfsOrder.length} steps)`,
      progress: 0.4 + 0.3 * ((i + 1) / dfsOrder.length),
    };
  }

  // ── Phase 3: Shortcut DFS path to Hamiltonian path ───────────────────────
  const seen = new Set();
  const shortcutPath = [];

  for (let i = 0; i < dfsOrder.length; i++) {
    const node = dfsOrder[i];

    if (!seen.has(node)) {
      seen.add(node);
      shortcutPath.push(node);

      yield {
        currentPath: [...shortcutPath],
        bestPath: null,
        currentCost: tourCost(shortcutPath, d),
        bestCost: null,
        phaseEdges: [...mstPhaseEdges],
        currentNode: node,
        phase: 'MST (Shortcutting)',
        status: `Added Node ${node} to TSP tour (first visit)`,
        progress: 0.7 + 0.25 * ((i + 1) / dfsOrder.length),
      };
    } else {
      // Show skipping
      yield {
        currentPath: [...shortcutPath],
        bestPath: null,
        currentCost: tourCost(shortcutPath, d),
        bestCost: null,
        phaseEdges: [...mstPhaseEdges],
        currentNode: node,
        phase: 'MST (Shortcutting)',
        status: `Node ${node} already visited, skipping (shortcutting)`,
        progress: 0.7 + 0.25 * ((i + 1) / dfsOrder.length),
      };
    }
  }

  // Close the tour
  shortcutPath.push(shortcutPath[0]);
  const cost = tourCost(shortcutPath, d);

  yield {
    currentPath: [...shortcutPath],
    bestPath: [...shortcutPath],
    currentCost: cost,
    bestCost: cost,
    phaseEdges: [...mstPhaseEdges],
    currentNode: null,
    phase: 'MST (Shortcutting)',
    status: `Closing the tour: returned to Node ${shortcutPath[0]}`,
    progress: 0.95,
  };

  yield {
    currentPath: [...shortcutPath],
    bestPath: [...shortcutPath],
    currentCost: cost,
    bestCost: cost,
    phase: 'Complete',
    status: `MST tour complete | Cost: ${cost.toFixed(4)} (≤ 2.0× optimal)`,
    progress: 1,
    done: true,
  };
}
