import { buildDist, tourCost } from './utils.js';

export function* nearestNeighbour(nodes) {
  const n = nodes.length;
  if (n < 2) return;

  const d = buildDist(nodes);
  const visited = new Uint8Array(n);
  const tour    = [0];
  visited[0]    = 1;

  yield {
    currentPath:  [0],
    bestPath:     null,
    currentCost:  0,
    bestCost:     null,
    visitedNodes: [0],
    currentNode:  0,
    phase:        'Nearest Neighbour',
    status:       'Starting at node 0',
    progress:     1 / n,
  };

  for (let step = 1; step < n; step++) {
    const cur = tour[tour.length - 1];
    let bestJ = -1, bestDist = Infinity;

    // Show searching
    for (let j = 0; j < n; j++) {
      if (!visited[j] && d[cur][j] < bestDist) {
        bestDist = d[cur][j];
        bestJ = j;
      }
    }

    yield {
      currentPath:  [...tour],
      bestPath:     null,
      currentCost:  tourCost([...tour, bestJ], d),
      bestCost:     null,
      visitedNodes: [...tour],
      currentNode:  cur,
      highlightEdge: { from: cur, to: bestJ },
      phase:        'Nearest Neighbour',
      status:       `Nearest unvisited from ${cur} → node ${bestJ}  (dist ${bestDist.toFixed(4)})`,
      progress:     step / n,
    };

    tour.push(bestJ);
    visited[bestJ] = 1;

    yield {
      currentPath:  [...tour],
      bestPath:     null,
      currentCost:  tourCost(tour, d),
      bestCost:     null,
      visitedNodes: [...tour],
      currentNode:  bestJ,
      phase:        'Nearest Neighbour',
      status:       `Visited node ${bestJ}  (${step + 1}/${n})`,
      progress:     (step + 1) / n,
    };
  }

  // Close tour
  const closedTour = [...tour, 0];
  const cost = tourCost(closedTour, d);

  yield {
    currentPath:  closedTour,
    bestPath:     closedTour,
    currentCost:  cost,
    bestCost:     cost,
    visitedNodes: tour,
    currentNode:  null,
    highlightEdge: { from: tour[tour.length - 1], to: 0 },
    phase:        'Nearest Neighbour',
    status:       `Returning to start…`,
    progress:     1,
  };

  yield {
    currentPath:  closedTour,
    bestPath:     closedTour,
    currentCost:  cost,
    bestCost:     cost,
    visitedNodes: tour,
    currentNode:  null,
    phase:        'Complete',
    status:       `Tour complete  |  Cost: ${cost.toFixed(4)}`,
    progress:     1,
    done:         true,
  };
}
