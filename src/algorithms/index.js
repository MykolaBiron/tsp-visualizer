import { bruteForce }         from './bruteForce.js';
import { dynamicProgramming } from './dynamicProgramming.js';
import { nearestNeighbour }   from './nearestNeighbour.js';
import { twoOpt }             from './twoOpt.js';
import { christofides }       from './christofides.js';

export function createAlgorithmGenerator(algorithm, nodes) {
  switch (algorithm) {
    case 'bruteForce':         return bruteForce(nodes);
    case 'dynamicProgramming': return dynamicProgramming(nodes);
    case 'nearestNeighbour':   return nearestNeighbour(nodes);
    case 'twoOpt':             return twoOpt(nodes);
    case 'christofides':       return christofides(nodes);
    default:                   return nearestNeighbour(nodes);
  }
}
