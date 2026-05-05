export function buildDist(nodes) {
  const n = nodes.length;
  const d = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const v = Math.sqrt(dx * dx + dy * dy);
      d[i][j] = v;
      d[j][i] = v;
    }
  }
  return d;
}

export function tourCost(path, d) {
  let c = 0;
  for (let i = 0; i < path.length - 1; i++) c += d[path[i]][path[i + 1]];
  return c;
}

export function circularCost(tour, d) {
  const n = tour.length;
  let c = 0;
  for (let i = 0; i < n; i++) c += d[tour[i]][tour[(i + 1) % n]];
  return c;
}

export function toPath(tour) {
  return [...tour, tour[0]];
}

export function* permutations(arr) {
  if (arr.length === 0) { yield []; return; }
  for (let i = 0; i < arr.length; i++) {
    const rest = arr.filter((_, j) => j !== i);
    for (const p of permutations(rest)) yield [arr[i], ...p];
  }
}

export function factorial(n) {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

/** Build a greedy nearest-neighbour tour starting from node 0 */
export function nnTour(n, d) {
  const visited = new Uint8Array(n);
  const tour = [0];
  visited[0] = 1;
  for (let step = 1; step < n; step++) {
    let best = -1, bestDist = Infinity;
    const cur = tour[tour.length - 1];
    for (let j = 0; j < n; j++) {
      if (!visited[j] && d[cur][j] < bestDist) { bestDist = d[cur][j]; best = j; }
    }
    tour.push(best);
    visited[best] = 1;
  }
  return tour;
}
