import { buildDist, tourCost, permutations, factorial } from './utils.js';

export function* bruteForce(nodes) {
  const n = nodes.length;
  if (n < 2) return;

  const d = buildDist(nodes);
  const others = Array.from({ length: n - 1 }, (_, i) => i + 1);
  const total = factorial(n - 1);

  let bestPath = null;
  let bestCost = Infinity;
  let step = 0;

  for (const perm of permutations(others)) {
    const path = [0, ...perm, 0];
    const cost = tourCost(path, d);
    step++;

    const improved = cost < bestCost;
    if (improved) { bestCost = cost; bestPath = path; }

    yield {
      currentPath: path,
      bestPath:    bestPath ? [...bestPath] : null,
      currentCost: cost,
      bestCost,
      progress:    step / total,
      phase:       'Brute Force',
      status:      `Permutation ${step.toLocaleString()} / ${total.toLocaleString()}  |  Best: ${bestCost.toFixed(4)}`,
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
