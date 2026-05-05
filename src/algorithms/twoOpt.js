import { buildDist, circularCost, toPath, nnTour } from './utils.js';

function swap2opt(tour, i, j) {
  // Reverse segment [i..j]
  const t = [...tour];
  let l = i, r = j;
  while (l < r) { [t[l], t[r]] = [t[r], t[l]]; l++; r--; }
  return t;
}

export function* twoOpt(nodes) {
  const n = nodes.length;
  if (n < 3) return;

  const d = buildDist(nodes);

  // ── Phase 1: build Nearest Neighbour seed ──
  let tour = nnTour(n, d);
  let cost = circularCost(tour, d);

  yield {
    currentPath: toPath(tour),
    bestPath: toPath(tour),
    currentCost: cost,
    bestCost: cost,
    phase: '2-opt  (NN seed)',
    status: `Starting from Nearest Neighbour tour  |  Cost: ${cost.toFixed(4)}`,
    progress: 0,
  };

  // ── Phase 2: 2-opt improvements ──
  let improved = true;
  let pass = 0;
  const maxPasses = 200;

  while (improved && pass < maxPasses) {
    improved = false;
    pass++;

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;   // skip full reversal

        const a = tour[i], b = tour[i + 1];
        const c = tour[j], e = tour[(j + 1) % n];

        const gain = d[a][b] + d[c][e] - d[a][c] - d[b][e];

        if (gain > 1e-10) {
          tour = swap2opt(tour, i + 1, j);
          cost = circularCost(tour, d);
          improved = true;

          yield {
            currentPath: toPath(tour),
            bestPath: toPath(tour),
            currentCost: cost,
            bestCost: cost,
            highlightEdge: { from: a, to: c },
            phase: '2-opt',
            status: `2-opt swap (pass ${pass})  |  Cost: ${cost.toFixed(4)}`,
            progress: 0.5,
          };
          // restart inner loops after improvement
          break;
        }
      }
      if (improved) break;
    }

    if (!improved) {
      yield {
        currentPath: toPath(tour),
        bestPath: toPath(tour),
        currentCost: cost,
        bestCost: cost,
        phase: '2-opt',
        status: `2-opt converged after ${pass} pass(es)  |  Cost: ${cost.toFixed(4)}`,
        progress: 0.5,
      };
    }
  }

  // ── Phase 3: Or-opt (move 1, 2, 3 consecutive nodes) ──
  yield {
    currentPath: toPath(tour),
    bestPath: toPath(tour),
    currentCost: cost,
    bestCost: cost,
    phase: '3-opt (or-opt)',
    status: 'Starting Or-opt relocations…',
    progress: 0.6,
  };

  for (const segLen of [1, 2, 3]) {
    let orImproved = true;
    let orPass = 0;
    while (orImproved && orPass < 50) {
      orImproved = false;
      orPass++;
      for (let i = 0; i < n; i++) {
        if (i + segLen > n) continue;
        const seg = tour.slice(i, i + segLen);
        const prev = tour[(i - 1 + n) % n];
        const next = tour[(i + segLen) % n];

        // Cost saved by removing segment
        const removeSave = d[prev][tour[i]] + d[tour[(i + segLen - 1) % n]][next] - d[prev][next];

        let bestGain = 1e-10, bestJ = -1;
        for (let j = 0; j < n; j++) {
          if (j >= i - 1 && j <= i + segLen) continue;
          const jn = tour[(j + 1) % n];
          const insertCost = d[tour[j]][seg[0]] + d[seg[seg.length - 1]][jn] - d[tour[j]][jn];
          const gain = removeSave - insertCost;
          if (gain > bestGain) { bestGain = gain; bestJ = j; }
        }

        if (bestJ !== -1) {
          // Remove segment and re-insert after bestJ
          const without = tour.filter((_, idx) => idx < i || idx >= i + segLen);
          const jIdx = without.indexOf(tour[bestJ]);
          without.splice(jIdx + 1, 0, ...seg);
          tour = without;
          cost = circularCost(tour, d);
          orImproved = true;

          yield {
            currentPath: toPath(tour),
            bestPath: toPath(tour),
            currentCost: cost,
            bestCost: cost,
            phase: `3-opt (or-opt-${segLen})`,
            status: `Or-opt-${segLen} relocation  |  Cost: ${cost.toFixed(4)}`,
            progress: 0.6 + 0.4 * (segLen / 3),
          };
          break;
        }
      }
    }
  }

  yield {
    currentPath: toPath(tour),
    bestPath: toPath(tour),
    currentCost: cost,
    bestCost: cost,
    progress: 1,
    phase: 'Complete',
    status: `Optimised tour  |  Cost: ${cost.toFixed(4)}`,
    done: true,
  };
}
