import { buildDist } from './utils.js';

export function* dynamicProgramming(nodes) {
  const n = nodes.length;
  if (n < 2) return;

  const d = buildDist(nodes);
  const FULL = (1 << n) - 1;

  // dp[mask][i] = min cost visiting exactly the nodes in mask, ending at i  (node 0 always in mask)
  const INF = 1e18;
  const dp     = Array.from({ length: FULL + 1 }, () => new Float64Array(n).fill(INF));
  const parent = Array.from({ length: FULL + 1 }, () => new Int8Array(n).fill(-1));

  dp[1][0] = 0;

  let bestCost = INF;
  let bestPath = null;
  let computed = 0;
  const yieldEvery = Math.max(1, Math.floor(n * (FULL + 1) / 400));

  // Fill DP
  for (let mask = 1; mask <= FULL; mask += 2) {           // bit 0 always set
    for (let i = 0; i < n; i++) {
      if (!(mask & (1 << i))) continue;
      if (dp[mask][i] === INF) continue;

      for (let j = 0; j < n; j++) {
        if (mask & (1 << j)) continue;
        const newMask = mask | (1 << j);
        const newCost = dp[mask][i] + d[i][j];
        if (newCost < dp[newMask][j]) {
          dp[newMask][j] = newCost;
          parent[newMask][j] = i;
          computed++;

          if (computed % yieldEvery === 0) {
            yield {
              currentPath:   null,
              bestPath:      bestPath ? [...bestPath] : null,
              currentCost:   null,
              bestCost:      bestCost === INF ? null : bestCost,
              highlightEdge: { from: i, to: j },
              phase:         'Dynamic Programming',
              status:        `Computing DP states… (${computed.toLocaleString()})`,
              progress:      mask / FULL,
            };
          }
        }
      }
    }
  }

  // Find best ending node
  let lastNode = -1;
  for (let i = 1; i < n; i++) {
    if (dp[FULL][i] === INF) continue;
    const c = dp[FULL][i] + d[i][0];
    if (c < bestCost) { bestCost = c; lastNode = i; }
  }

  // Reconstruct path
  const path = [];
  let mask = FULL;
  let cur  = lastNode;
  while (cur !== -1) {
    path.push(cur);
    const prev = parent[mask][cur];
    mask ^= (1 << cur);
    cur = prev;
  }
  path.reverse();
  path.push(0);   // return to start
  bestPath = path;

  // Animate reconstruction
  for (let i = 2; i <= bestPath.length; i++) {
    yield {
      currentPath: bestPath.slice(0, i),
      bestPath:    [...bestPath],
      currentCost: bestCost,
      bestCost,
      phase:       'Reconstructing',
      status:      `Reconstructing optimal path…`,
      progress:    1,
    };
  }

  yield {
    currentPath: [...bestPath],
    bestPath:    [...bestPath],
    currentCost: bestCost,
    bestCost,
    progress:    1,
    phase:       'Complete',
    status:      `Optimal tour found  |  Cost: ${bestCost.toFixed(4)}`,
    done:        true,
  };
}
