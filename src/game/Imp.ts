import { Imp, Position, TaskType, DigTask, Tile } from './types';
import { findPath, getDistance } from './Pathfinding';
import { digTile, isDiggable, isWalkable } from './Grid';

let impIdCounter = 0;

// Store original dig targets separately (since target gets changed to adjacent walkable)
const originalDigTargets: Map<string, Position> = new Map();

/**
 * Create a new imp at the given position.
 */
export function createImp(pos: Position): Imp {
  impIdCounter++;
  return {
    id: `imp-${impIdCounter}`,
    pos: { ...pos },
    hp: 20,
    maxHp: 20,
    lastAttackTime: 0,
    task: TaskType.IDLE,
    target: null,
    carrying: 0,
    path: [],
  };
}

/**
 * Assign a task to an imp.
 */
export function assignTask(imp: Imp, task: TaskType, target: Position | null): void {
  imp.task = task;
  imp.target = target;
  imp.path = [];

  // For dig tasks, save the original dirt target
  if (task === TaskType.DIG && target) {
    originalDigTargets.set(imp.id, { ...target });
  } else {
    originalDigTargets.delete(imp.id);
  }
}

/**
 * Update imp for one tick.
 * Returns gold if imp completed a dig task.
 */
export function updateImp(imp: Imp, grid: Tile[][], dt: number): number {
  if (imp.task === TaskType.IDLE) {
    return 0;
  }

  if (!imp.target) {
    imp.task = TaskType.IDLE;
    return 0;
  }

  // If at target, perform task
  if (imp.pos.x === imp.target.x && imp.pos.y === imp.target.y) {
    return performTask(imp, grid);
  }

  // Need to move toward target
  moveTowardTarget(imp, grid, dt);
  return 0;
}

/**
 * Move imp toward its target.
 */
function moveTowardTarget(imp: Imp, grid: Tile[][], dt: number): void {
  if (!imp.target) return;

  // Recalculate path if empty or stale
  if (imp.path.length === 0) {
    // For dig tasks, path to adjacent tile since target isn't walkable
    if (imp.task === TaskType.DIG) {
      const adjacentTarget = findAdjacentWalkable(grid, imp.target);
      if (adjacentTarget) {
        imp.path = findPath(grid, imp.pos, adjacentTarget);
        // Add the dig target at the end (we'll handle arrival specially)
        if (imp.path.length > 0) {
          imp.target = adjacentTarget;
        }
      }
    } else {
      imp.path = findPath(grid, imp.pos, imp.target);
    }
  }

  if (imp.path.length === 0) {
    return; // No path available
  }

  // Move to next position in path
  const nextPos = imp.path[0];
  const speed = 3.0; // tiles per second
  const moveDistance = speed * dt;

  const dx = nextPos.x - imp.pos.x;
  const dy = nextPos.y - imp.pos.y;
  const dist = Math.abs(dx) + Math.abs(dy);

  if (moveDistance >= dist) {
    // Arrived at next waypoint
    imp.pos = { ...nextPos };
    imp.path.shift();
  } else {
    // Partial move (for sub-tile precision if needed)
    // For simplicity, we just snap to positions
    imp.pos = { ...nextPos };
    imp.path.shift();
  }
}

/**
 * Find a walkable tile adjacent to the target.
 */
function findAdjacentWalkable(grid: Tile[][], target: Position): Position | null {
  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  for (const dir of directions) {
    const nx = target.x + dir.x;
    const ny = target.y + dir.y;
    if (isWalkable(grid, nx, ny)) {
      return { x: nx, y: ny };
    }
  }
  return null;
}

/**
 * Perform the imp's current task.
 * Returns gold earned if dig task.
 */
function performTask(imp: Imp, grid: Tile[][]): number {
  let gold = 0;

  switch (imp.task) {
    case TaskType.DIG:
      // Get the original dig target (the actual dirt tile)
      const digTarget = originalDigTargets.get(imp.id);
      if (digTarget && isDiggable(grid, digTarget.x, digTarget.y)) {
        gold = digTile(grid, digTarget.x, digTarget.y);
        imp.carrying += gold;
      }
      // Clean up and go idle
      originalDigTargets.delete(imp.id);
      imp.task = TaskType.IDLE;
      imp.target = null;
      break;

    case TaskType.CLAIM:
      // Claiming happens instantly
      imp.task = TaskType.IDLE;
      imp.target = null;
      break;

    case TaskType.HAUL:
      // Deposit gold at treasury
      gold = -imp.carrying; // Negative to indicate deposit (handled elsewhere)
      imp.carrying = 0;
      imp.task = TaskType.IDLE;
      imp.target = null;
      break;

    default:
      imp.task = TaskType.IDLE;
      imp.target = null;
  }

  return gold;
}

/**
 * Find the nearest unassigned dig task.
 */
export function findNearestTask(imp: Imp, tasks: DigTask[]): DigTask | null {
  let nearest: DigTask | null = null;
  let nearestDist = Infinity;

  for (const task of tasks) {
    if (task.assigned) continue;

    const dist = getDistance(imp.pos, task.pos);
    if (dist < nearestDist) {
      nearest = task;
      nearestDist = dist;
    }
  }

  return nearest;
}

/**
 * Check if imp is currently working (not idle).
 */
export function isImpWorking(imp: Imp): boolean {
  return imp.task !== TaskType.IDLE;
}

/**
 * Check if imp is carrying gold.
 */
export function isImpCarrying(imp: Imp): boolean {
  return imp.carrying > 0;
}

/**
 * Get the gold amount the imp is carrying.
 */
export function getImpCarryAmount(imp: Imp): number {
  return imp.carrying;
}

/**
 * Reset imp id counter (for testing).
 */
export function resetImpIdCounter(): void {
  impIdCounter = 0;
}

/**
 * Reset original dig targets map (for testing).
 */
export function resetDigTargets(): void {
  originalDigTargets.clear();
}
