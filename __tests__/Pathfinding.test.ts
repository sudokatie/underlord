import {
  findPath,
  heuristic,
  getDistance,
  hasPath,
  findNearestReachable,
  getNextStep,
} from '../src/game/Pathfinding';
import { createGrid, digTile } from '../src/game/Grid';
import { Tile, TileType, RoomType } from '../src/game/types';
import { GRID_WIDTH, GRID_HEIGHT, HEART_CLEAR_RADIUS } from '../src/game/constants';

describe('Pathfinding', () => {
  // Helper to create a grid with a corridor
  function createCorridorGrid(): Tile[][] {
    const grid = createGrid();
    // Dig a corridor from center to the left
    const centerX = Math.floor(GRID_WIDTH / 2);
    const centerY = Math.floor(GRID_HEIGHT / 2);
    for (let x = centerX - HEART_CLEAR_RADIUS - 5; x <= centerX - HEART_CLEAR_RADIUS - 1; x++) {
      digTile(grid, x, centerY);
    }
    return grid;
  }

  describe('findPath', () => {
    it('returns empty array when start equals end', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const path = findPath(grid, { x: centerX, y: centerY }, { x: centerX, y: centerY });
      expect(path).toEqual([]);
    });

    it('finds path between adjacent tiles', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const path = findPath(grid, { x: centerX, y: centerY }, { x: centerX + 1, y: centerY });
      expect(path.length).toBe(1);
      expect(path[0]).toEqual({ x: centerX + 1, y: centerY });
    });

    it('finds path across clear area', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const startX = centerX - HEART_CLEAR_RADIUS;
      const endX = centerX + HEART_CLEAR_RADIUS;
      const path = findPath(grid, { x: startX, y: centerY }, { x: endX, y: centerY });
      expect(path.length).toBe(endX - startX);
    });

    it('returns empty array when end is not walkable', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      // Try to path to a dirt tile
      const path = findPath(grid, { x: centerX, y: centerY }, { x: 3, y: 3 });
      expect(path).toEqual([]);
    });

    it('returns empty array when start is not walkable', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      // Start from dirt
      const path = findPath(grid, { x: 3, y: 3 }, { x: centerX, y: centerY });
      expect(path).toEqual([]);
    });

    it('returns empty array when completely blocked', () => {
      const grid = createGrid();
      // Dig isolated tiles that can't reach each other
      digTile(grid, 3, 3);
      digTile(grid, 10, 10);
      const path = findPath(grid, { x: 3, y: 3 }, { x: 10, y: 10 });
      expect(path).toEqual([]);
    });

    it('finds path through corridor', () => {
      const grid = createCorridorGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const startX = centerX - HEART_CLEAR_RADIUS - 5;
      const path = findPath(grid, { x: centerX, y: centerY }, { x: startX, y: centerY });
      expect(path.length).toBeGreaterThan(0);
      // Path should end at destination
      expect(path[path.length - 1]).toEqual({ x: startX, y: centerY });
    });

    it('finds optimal path (no diagonal shortcuts)', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      // Path from corner of clear area to opposite corner
      const startX = centerX - HEART_CLEAR_RADIUS;
      const startY = centerY - HEART_CLEAR_RADIUS;
      const endX = centerX + HEART_CLEAR_RADIUS;
      const endY = centerY + HEART_CLEAR_RADIUS;
      const path = findPath(grid, { x: startX, y: startY }, { x: endX, y: endY });
      // Optimal path should be manhattan distance
      const expectedLength = Math.abs(endX - startX) + Math.abs(endY - startY);
      expect(path.length).toBe(expectedLength);
    });

    it('does not include start position in path', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const path = findPath(grid, { x: centerX, y: centerY }, { x: centerX + 2, y: centerY });
      // Path should not start with the start position
      expect(path[0]).not.toEqual({ x: centerX, y: centerY });
    });

    it('includes end position in path', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const endPos = { x: centerX + 2, y: centerY };
      const path = findPath(grid, { x: centerX, y: centerY }, endPos);
      expect(path[path.length - 1]).toEqual(endPos);
    });

    it('path only contains walkable tiles', () => {
      const grid = createCorridorGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const startX = centerX - HEART_CLEAR_RADIUS - 5;
      const path = findPath(grid, { x: centerX, y: centerY }, { x: startX, y: centerY });
      for (const pos of path) {
        expect(grid[pos.y][pos.x].type).toBe(TileType.FLOOR);
      }
    });
  });

  describe('heuristic', () => {
    it('returns 0 for same position', () => {
      expect(heuristic({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
    });

    it('returns manhattan distance horizontally', () => {
      expect(heuristic({ x: 0, y: 0 }, { x: 5, y: 0 })).toBe(5);
    });

    it('returns manhattan distance vertically', () => {
      expect(heuristic({ x: 0, y: 0 }, { x: 0, y: 7 })).toBe(7);
    });

    it('returns manhattan distance diagonally', () => {
      expect(heuristic({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
    });

    it('works with negative deltas', () => {
      expect(heuristic({ x: 5, y: 5 }, { x: 2, y: 3 })).toBe(5);
    });
  });

  describe('getDistance', () => {
    it('returns 0 for same position', () => {
      expect(getDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
    });

    it('returns manhattan distance', () => {
      expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
    });
  });

  describe('hasPath', () => {
    it('returns true for same position', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      expect(hasPath(grid, { x: centerX, y: centerY }, { x: centerX, y: centerY })).toBe(true);
    });

    it('returns true for reachable position', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      expect(hasPath(grid, { x: centerX, y: centerY }, { x: centerX + 1, y: centerY })).toBe(true);
    });

    it('returns false for unreachable position', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      expect(hasPath(grid, { x: centerX, y: centerY }, { x: 3, y: 3 })).toBe(false);
    });
  });

  describe('findNearestReachable', () => {
    it('returns null for empty targets', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      expect(findNearestReachable(grid, { x: centerX, y: centerY }, [])).toBeNull();
    });

    it('returns target if already at position', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const target = { x: centerX, y: centerY };
      expect(findNearestReachable(grid, target, [target])).toEqual(target);
    });

    it('returns nearest reachable target', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const near = { x: centerX + 1, y: centerY };
      const far = { x: centerX + 2, y: centerY };
      expect(findNearestReachable(grid, { x: centerX, y: centerY }, [far, near])).toEqual(near);
    });

    it('returns null if no targets are reachable', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      // Unreachable dirt tiles
      const targets = [{ x: 3, y: 3 }, { x: 4, y: 4 }];
      expect(findNearestReachable(grid, { x: centerX, y: centerY }, targets)).toBeNull();
    });
  });

  describe('getNextStep', () => {
    it('returns null when at destination', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const pos = { x: centerX, y: centerY };
      expect(getNextStep(grid, pos, pos)).toBeNull();
    });

    it('returns next position in path', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const nextStep = getNextStep(grid, { x: centerX, y: centerY }, { x: centerX + 2, y: centerY });
      expect(nextStep).toEqual({ x: centerX + 1, y: centerY });
    });

    it('returns null when no path exists', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      expect(getNextStep(grid, { x: centerX, y: centerY }, { x: 3, y: 3 })).toBeNull();
    });
  });
});
