import { bruteForce }         from './bruteForce.js';
import { dynamicProgramming } from './dynamicProgramming.js';
import { nearestNeighbour }   from './nearestNeighbour.js';

export function createAlgorithmGenerator(algorithm, nodes) {
  switch (algorithm) {
    case 'bruteForce':         return bruteForce(nodes);
    case 'dynamicProgramming': return dynamicProgramming(nodes);
    case 'nearestNeighbour':   return nearestNeighbour(nodes);
    default:                   return nearestNeighbour(nodes);
  }
}
