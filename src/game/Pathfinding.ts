import { Position, Tile } from './types';
import { isWalkable, getNeighbors } from './Grid';

/**
 * A* pathfinding algorithm.
 * Returns array of positions from start to end (inclusive).
 * Returns empty array if no path exists.
 */
export function findPath(grid: Tile[][], start: Position, end: Position): Position[] {
  // Same position - no path needed
  if (start.x === end.x && start.y === end.y) {
    return [];
  }

  // End must be walkable
  if (!isWalkable(grid, end.x, end.y)) {
    return [];
  }

  // Start must be walkable (unless we're starting on current position)
  if (!isWalkable(grid, start.x, start.y)) {
    return [];
  }

  const openSet: Position[] = [start];
  const cameFrom = new Map<string, Position>();

  // g score: cost from start to this node
  const gScore = new Map<string, number>();
  gScore.set(posKey(start), 0);

  // f score: g score + heuristic
  const fScore = new Map<string, number>();
  fScore.set(posKey(start), heuristic(start, end));

  while (openSet.length > 0) {
    // Get node with lowest f score
    let currentIdx = 0;
    let currentFScore = fScore.get(posKey(openSet[0])) ?? Infinity;
    for (let i = 1; i < openSet.length; i++) {
      const f = fScore.get(posKey(openSet[i])) ?? Infinity;
      if (f < currentFScore) {
        currentIdx = i;
        currentFScore = f;
      }
    }

    const current = openSet[currentIdx];

    // Reached the goal
    if (current.x === end.x && current.y === end.y) {
      return reconstructPath(cameFrom, current);
    }

    // Remove current from open set
    openSet.splice(currentIdx, 1);

    // Check all neighbors
    const neighbors = getNeighbors(grid, current.x, current.y);
    for (const neighbor of neighbors) {
      const tentativeG = (gScore.get(posKey(current)) ?? Infinity) + 1;
      const neighborKey = posKey(neighbor);

      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        // This path is better
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeG);
        fScore.set(neighborKey, tentativeG + heuristic(neighbor, end));

        // Add to open set if not already there
        if (!openSet.some((p) => p.x === neighbor.x && p.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  // No path found
  return [];
}

/**
 * Manhattan distance heuristic.
 */
export function heuristic(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Manhattan distance between two positions.
 */
export function getDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Reconstruct path from came_from map.
 * Returns path from start to end (inclusive of end, exclusive of start).
 */
function reconstructPath(cameFrom: Map<string, Position>, current: Position): Position[] {
  const path: Position[] = [current];
  let curr = current;

  while (cameFrom.has(posKey(curr))) {
    curr = cameFrom.get(posKey(curr))!;
    path.unshift(curr);
  }

  // Remove start position (caller already at start)
  path.shift();

  return path;
}

/**
 * Create a unique key for a position.
 */
function posKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

/**
 * Check if a path exists between two positions.
 */
export function hasPath(grid: Tile[][], start: Position, end: Position): boolean {
  if (start.x === end.x && start.y === end.y) {
    return true;
  }
  return findPath(grid, start, end).length > 0;
}

/**
 * Find the nearest position from a list that has a valid path.
 */
export function findNearestReachable(
  grid: Tile[][],
  from: Position,
  targets: Position[]
): Position | null {
  let nearest: Position | null = null;
  let nearestDist = Infinity;

  for (const target of targets) {
    const path = findPath(grid, from, target);
    if (path.length > 0 && path.length < nearestDist) {
      nearest = target;
      nearestDist = path.length;
    } else if (from.x === target.x && from.y === target.y) {
      // Already at target
      return target;
    }
  }

  return nearest;
}

/**
 * Get the next step in a path toward a destination.
 * Returns null if no path or already at destination.
 */
export function getNextStep(grid: Tile[][], from: Position, to: Position): Position | null {
  if (from.x === to.x && from.y === to.y) {
    return null;
  }

  const path = findPath(grid, from, to);
  if (path.length === 0) {
    return null;
  }

  return path[0];
}
