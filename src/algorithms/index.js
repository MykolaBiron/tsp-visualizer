import { bruteForce }         from './bruteForce.js';
import { dynamicProgramming } from './dynamicProgramming.js';
import { nearestNeighbour }   from './nearestNeighbour.js';
import { nearestInsertion }   from './nearestInsertion.js';
import { minimalSpanningTree } from './minimalSpanningTree.js';
import { christofides }       from './christofides.js';
import { twoOpt }             from './twoOpt.js';

export function createAlgorithmGenerator(algorithm, nodes) {
  switch (algorithm) {
    case 'bruteForce':          return bruteForce(nodes);
    case 'dynamicProgramming':  return dynamicProgramming(nodes);
    case 'nearestNeighbour':    return nearestNeighbour(nodes);
    case 'nearestInsertion':    return nearestInsertion(nodes);
    case 'minimalSpanningTree': return minimalSpanningTree(nodes);
    case 'christofides':        return christofides(nodes);
    case 'twoOpt':              return twoOpt(nodes);
    default:                    return nearestNeighbour(nodes);
  }
}
