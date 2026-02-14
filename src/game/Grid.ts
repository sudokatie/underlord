import { Tile, TileType, RoomType, Position } from './types';
import { GRID_WIDTH, GRID_HEIGHT, DIG_GOLD, GOLD_SEAM_VALUE, GOLD_SEAM_CHANCE, HEART_CLEAR_RADIUS } from './constants';

/**
 * Create a new dungeon grid.
 * - Rock border around edges
 * - Dirt fill in center
 * - 5x5 floor area in center for dungeon heart
 * - Random gold seams in dirt tiles
 */
export function createGrid(seed?: number): Tile[][] {
  const grid: Tile[][] = [];
  const rng = seed !== undefined ? seededRandom(seed) : Math.random;

  const centerX = Math.floor(GRID_WIDTH / 2);
  const centerY = Math.floor(GRID_HEIGHT / 2);

  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      // Determine tile type
      let type: TileType;

      // Border is always rock
      if (x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1) {
        type = TileType.ROCK;
      }
      // Center area is floor (for dungeon heart)
      else if (
        Math.abs(x - centerX) <= HEART_CLEAR_RADIUS &&
        Math.abs(y - centerY) <= HEART_CLEAR_RADIUS
      ) {
        type = TileType.FLOOR;
      }
      // Everything else is dirt
      else {
        type = TileType.DIRT;
      }

      // Gold seams only in dirt
      const goldSeam = type === TileType.DIRT && rng() < GOLD_SEAM_CHANCE;

      row.push({
        type,
        room: RoomType.NONE,
        owner: type === TileType.FLOOR, // Center is claimed
        goldSeam,
      });
    }
    grid.push(row);
  }

  return grid;
}

/**
 * Get tile at position, or null if out of bounds.
 */
export function getTile(grid: Tile[][], x: number, y: number): Tile | null {
  if (!isValidPosition(x, y)) {
    return null;
  }
  return grid[y][x];
}

/**
 * Set tile at position.
 */
export function setTile(grid: Tile[][], x: number, y: number, tile: Tile): void {
  if (!isValidPosition(x, y)) {
    return;
  }
  grid[y][x] = tile;
}

/**
 * Dig a tile, converting dirt to floor.
 * Returns gold gained (base + bonus if gold seam).
 * Returns 0 if tile cannot be dug.
 */
export function digTile(grid: Tile[][], x: number, y: number): number {
  const tile = getTile(grid, x, y);
  if (!tile || tile.type !== TileType.DIRT) {
    return 0;
  }

  const goldGained = DIG_GOLD + (tile.goldSeam ? GOLD_SEAM_VALUE : 0);

  // Convert to floor and claim it
  grid[y][x] = {
    type: TileType.FLOOR,
    room: RoomType.NONE,
    owner: true,
    goldSeam: false,
  };

  return goldGained;
}

/**
 * Check if position is within grid bounds.
 */
export function isValidPosition(x: number, y: number): boolean {
  return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
}

/**
 * Check if tile is walkable (floor tiles only).
 */
export function isWalkable(grid: Tile[][], x: number, y: number): boolean {
  const tile = getTile(grid, x, y);
  return tile !== null && tile.type === TileType.FLOOR;
}

/**
 * Check if tile is diggable (dirt tiles only).
 */
export function isDiggable(grid: Tile[][], x: number, y: number): boolean {
  const tile = getTile(grid, x, y);
  return tile !== null && tile.type === TileType.DIRT;
}

/**
 * Get walkable adjacent tiles (4-directional).
 */
export function getNeighbors(grid: Tile[][], x: number, y: number): Position[] {
  const neighbors: Position[] = [];
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 0, y: 1 },  // down
    { x: -1, y: 0 }, // left
    { x: 1, y: 0 },  // right
  ];

  for (const dir of directions) {
    const nx = x + dir.x;
    const ny = y + dir.y;
    if (isWalkable(grid, nx, ny)) {
      neighbors.push({ x: nx, y: ny });
    }
  }

  return neighbors;
}

/**
 * Get all adjacent tiles (4-directional), including non-walkable.
 */
export function getAllNeighbors(x: number, y: number): Position[] {
  const neighbors: Position[] = [];
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 0, y: 1 },  // down
    { x: -1, y: 0 }, // left
    { x: 1, y: 0 },  // right
  ];

  for (const dir of directions) {
    const nx = x + dir.x;
    const ny = y + dir.y;
    if (isValidPosition(nx, ny)) {
      neighbors.push({ x: nx, y: ny });
    }
  }

  return neighbors;
}

/**
 * Find all gold seam positions in the grid.
 */
export function findGoldSeams(grid: Tile[][]): Position[] {
  const seams: Position[] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const tile = grid[y][x];
      if (tile.goldSeam) {
        seams.push({ x, y });
      }
    }
  }
  return seams;
}

/**
 * Count tiles of a specific type.
 */
export function countTileType(grid: Tile[][], type: TileType): number {
  let count = 0;
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      if (grid[y][x].type === type) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Simple seeded random number generator (LCG).
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}
