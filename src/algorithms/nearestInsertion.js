import { buildDist, tourCost } from './utils.js';

export function* nearestInsertion(nodes) {
  const n = nodes.length;
  if (n < 2) return;

  const d = buildDist(nodes);

  // Start with node 0 and its nearest neighbor to form the initial sub-tour (0 -> j -> 0)
  let bestJ = -1, bestDist = Infinity;
  for (let j = 1; j < n; j++) {
    if (d[0][j] < bestDist) {
      bestDist = d[0][j];
      bestJ = j;
    }
  }

  const tour = [0, bestJ, 0];
  const visited = new Uint8Array(n);
  visited[0] = 1;
  visited[bestJ] = 1;

  yield {
    currentPath: [...tour],
    bestPath: null,
    currentCost: tourCost(tour, d),
    bestCost: null,
    visitedNodes: [0, bestJ],
    currentNode: bestJ,
    phase: 'Nearest Insertion',
    status: `Initial tour: Node 0 and its nearest neighbor Node ${bestJ}`,
    progress: 2 / n,
  };

  // Insert remaining nodes
  for (let step = 2; step < n; step++) {
    // 1. Find unvisited node k closest to the tour
    let k = -1;
    let minD = Infinity;
    let closestTourNode = -1;

    for (let u = 0; u < n; u++) {
      if (visited[u]) continue;
      for (let idx = 0; idx < tour.length - 1; idx++) {
        const v = tour[idx];
        if (d[u][v] < minD) {
          minD = d[u][v];
          k = u;
          closestTourNode = v;
        }
      }
    }

    // Highlight the selected node k before scanning insertion positions
    yield {
      currentPath: [...tour],
      bestPath: null,
      currentCost: tourCost(tour, d),
      bestCost: null,
      visitedNodes: Array.from({ length: n }, (_, idx) => visited[idx] ? idx : -1).filter(idx => idx !== -1),
      currentNode: k,
      highlightEdge: { from: closestTourNode, to: k },
      phase: 'Nearest Insertion',
      status: `Selecting Node ${k} (closest unvisited to tour, distance ${minD.toFixed(4)})`,
      progress: step / n,
    };

    // 2. Find insertion edge in the tour that minimizes cost increase
    let bestIdx = -1;
    let minInsertCost = Infinity;

    for (let i = 0; i < tour.length - 1; i++) {
      const u = tour[i];
      const v = tour[i + 1];
      const insertCost = d[u][k] + d[k][v] - d[u][v];

      // Visualize evaluating this insertion position
      const tempPath = [...tour.slice(0, i + 1), k, ...tour.slice(i + 1)];
      yield {
        currentPath: tempPath,
        bestPath: null,
        currentCost: tourCost(tempPath, d),
        bestCost: null,
        visitedNodes: Array.from({ length: n }, (_, idx) => visited[idx] ? idx : -1).filter(idx => idx !== -1),
        currentNode: k,
        highlightEdge: { from: u, to: k },
        phase: 'Nearest Insertion',
        status: `Evaluating insertion between Node ${u} and Node ${v} (cost increase: +${insertCost.toFixed(4)})`,
        progress: step / n,
      };

      if (insertCost < minInsertCost) {
        minInsertCost = insertCost;
        bestIdx = i;
      }
    }

    // Insert k at the best index
    tour.splice(bestIdx + 1, 0, k);
    visited[k] = 1;

    yield {
      currentPath: [...tour],
      bestPath: null,
      currentCost: tourCost(tour, d),
      bestCost: null,
      visitedNodes: Array.from({ length: n }, (_, idx) => visited[idx] ? idx : -1).filter(idx => idx !== -1),
      currentNode: k,
      phase: 'Nearest Insertion',
      status: `Inserted Node ${k} between Node ${tour[bestIdx]} and Node ${tour[bestIdx + 2]}`,
      progress: (step + 1) / n,
    };
  }

  const finalCost = tourCost(tour, d);
  yield {
    currentPath: [...tour],
    bestPath: [...tour],
    currentCost: finalCost,
    bestCost: finalCost,
    visitedNodes: Array.from({ length: n }, (_, i) => i),
    currentNode: null,
    phase: 'Complete',
    status: `Tour complete | Cost: ${finalCost.toFixed(4)}`,
    progress: 1,
    done: true,
  };
}
