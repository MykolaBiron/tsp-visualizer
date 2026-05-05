import { buildDist, tourCost } from './utils.js';

// ── Prim's MST ──────────────────────────────────────────────────────────────
function buildMST(n, d) {
  const inTree  = new Uint8Array(n);
  const key     = new Float64Array(n).fill(Infinity);
  const parent  = new Int32Array(n).fill(-1);
  key[0] = 0;

  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    for (let v = 0; v < n; v++) {
      if (!inTree[v] && (u === -1 || key[v] < key[u])) u = v;
    }
    inTree[u] = 1;
    for (let v = 0; v < n; v++) {
      if (!inTree[v] && d[u][v] < key[v]) { key[v] = d[u][v]; parent[v] = u; }
    }
  }

  const edges = [];
  for (let v = 1; v < n; v++) edges.push({ from: parent[v], to: v });
  return edges;
}

// ── Greedy minimum-weight perfect matching on odd-degree nodes ───────────────
function greedyMatching(oddNodes, d) {
  const remaining = [...oddNodes];
  const matched   = [];

  while (remaining.length >= 2) {
    let bestI = 0, bestJ = 1, bestDist = d[remaining[0]][remaining[1]];
    for (let i = 0; i < remaining.length; i++) {
      for (let j = i + 1; j < remaining.length; j++) {
        if (d[remaining[i]][remaining[j]] < bestDist) {
          bestDist = d[remaining[i]][remaining[j]];
          bestI = i; bestJ = j;
        }
      }
    }
    matched.push({ from: remaining[bestI], to: remaining[bestJ] });
    remaining.splice(bestJ, 1);
    remaining.splice(bestI, 1);
  }
  return matched;
}

// ── Hierholzer's Euler circuit ───────────────────────────────────────────────
function eulerCircuit(n, adjList) {
  const adj = adjList.map(list => [...list]);   // copy, we'll remove edges
  const stack = [0];
  const circuit = [];

  while (stack.length) {
    const v = stack[stack.length - 1];
    if (adj[v].length === 0) {
      circuit.push(v);
      stack.pop();
    } else {
      const u = adj[v].pop();
      // remove the reverse edge
      const idx = adj[u].indexOf(v);
      if (idx !== -1) adj[u].splice(idx, 1);
      stack.push(u);
    }
  }
  return circuit;
}

// ── Shortcut Euler path → Hamiltonian path ───────────────────────────────────
function shortcut(circuit) {
  const seen = new Set();
  const path = [];
  for (const v of circuit) {
    if (!seen.has(v)) { seen.add(v); path.push(v); }
  }
  path.push(path[0]);
  return path;
}

// ── Generator ────────────────────────────────────────────────────────────────
export function* christofides(nodes) {
  const n = nodes.length;
  if (n < 3) return;

  const d = buildDist(nodes);

  // ── Phase 1: Build MST ────────────────────────────────────────────────────
  const mstEdges = buildMST(n, d);

  const mstPhaseEdges = [];
  for (let i = 0; i < mstEdges.length; i++) {
    mstPhaseEdges.push({ from: mstEdges[i].from, to: mstEdges[i].to, color: '#ff8822', glow: '#ff5500', width: 2.5 });
    yield {
      currentPath:  null,
      bestPath:     null,
      currentCost:  null,
      bestCost:     null,
      phaseEdges:   mstPhaseEdges.map(e => ({ ...e })),
      phase:        'Christofides  (MST)',
      status:       `Building Minimum Spanning Tree… edge ${i + 1}/${mstEdges.length}`,
      progress:     0.1 + 0.15 * ((i + 1) / mstEdges.length),
    };
  }

  // ── Phase 2: Find odd-degree vertices ─────────────────────────────────────
  const degree = new Int32Array(n);
  for (const e of mstEdges) { degree[e.from]++; degree[e.to]++; }
  const oddNodes = [];
  for (let i = 0; i < n; i++) if (degree[i] % 2 === 1) oddNodes.push(i);

  yield {
    currentPath:  null,
    bestPath:     null,
    currentCost:  null,
    bestCost:     null,
    phaseEdges:   mstPhaseEdges,
    oddNodes:     [...oddNodes],
    phase:        'Christofides  (Odd Vertices)',
    status:       `Found ${oddNodes.length} odd-degree vertices (highlighted red)`,
    progress:     0.3,
  };

  // ── Phase 3: Minimum-weight perfect matching on odd nodes ─────────────────
  const matching = greedyMatching(oddNodes, d);
  const matchPhaseEdges = matching.map(e => ({ ...e, color: '#bb44ff', glow: '#8800ff', width: 2 }));

  for (let i = 0; i < matchPhaseEdges.length; i++) {
    yield {
      currentPath:  null,
      bestPath:     null,
      currentCost:  null,
      bestCost:     null,
      phaseEdges:   [...mstPhaseEdges, ...matchPhaseEdges.slice(0, i + 1)],
      oddNodes:     [...oddNodes],
      phase:        'Christofides  (Matching)',
      status:       `Adding matching edge ${i + 1}/${matchPhaseEdges.length}`,
      progress:     0.3 + 0.2 * ((i + 1) / matchPhaseEdges.length),
    };
  }

  // ── Phase 4: Build Eulerian multigraph & find Euler circuit ───────────────
  const adjList = Array.from({ length: n }, () => []);
  for (const e of mstEdges)    { adjList[e.from].push(e.to); adjList[e.to].push(e.from); }
  for (const e of matching)    { adjList[e.from].push(e.to); adjList[e.to].push(e.from); }

  const euler = eulerCircuit(n, adjList);
  const eulerEdges = [];

  for (let i = 0; i < euler.length - 1; i++) {
    eulerEdges.push({ from: euler[i], to: euler[i + 1], color: '#00ddff', glow: '#0088cc', width: 1.5 });
    yield {
      currentPath:  euler.slice(0, i + 2),
      bestPath:     null,
      currentCost:  null,
      bestCost:     null,
      phaseEdges:   eulerEdges.map(e => ({ ...e })),
      phase:        'Christofides  (Euler Circuit)',
      status:       `Traversing Eulerian circuit… step ${i + 1}/${euler.length - 1}`,
      progress:     0.5 + 0.3 * ((i + 1) / (euler.length - 1)),
    };
  }

  // ── Phase 5: Shortcut to Hamiltonian cycle ────────────────────────────────
  const finalTour = shortcut(euler);
  const cost = tourCost(finalTour, d);

  for (let i = 2; i <= finalTour.length; i++) {
    yield {
      currentPath: finalTour.slice(0, i),
      bestPath:    i === finalTour.length ? [...finalTour] : null,
      currentCost: cost,
      bestCost:    cost,
      phase:       'Christofides  (Shortcutting)',
      status:      `Shortcutting repeated visits… node ${i - 1}/${finalTour.length - 1}`,
      progress:    0.8 + 0.2 * (i / finalTour.length),
    };
  }

  yield {
    currentPath: [...finalTour],
    bestPath:    [...finalTour],
    currentCost: cost,
    bestCost:    cost,
    progress:    1,
    phase:       'Complete',
    status:      `Christofides tour  |  Cost: ${cost.toFixed(4)}  (≤ 1.5× optimal)`,
    done:        true,
  };
}
