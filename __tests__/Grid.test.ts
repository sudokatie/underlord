import {
  createGrid,
  getTile,
  setTile,
  digTile,
  isValidPosition,
  isWalkable,
  isDiggable,
  getNeighbors,
  getAllNeighbors,
  findGoldSeams,
  countTileType,
} from '../src/game/Grid';
import { TileType, RoomType } from '../src/game/types';
import { GRID_WIDTH, GRID_HEIGHT, DIG_GOLD, GOLD_SEAM_VALUE, HEART_CLEAR_RADIUS } from '../src/game/constants';

describe('Grid', () => {
  describe('createGrid', () => {
    it('creates grid with correct dimensions', () => {
      const grid = createGrid();
      expect(grid.length).toBe(GRID_HEIGHT);
      expect(grid[0].length).toBe(GRID_WIDTH);
    });

    it('has rock tiles on all borders', () => {
      const grid = createGrid();
      // Top and bottom borders
      for (let x = 0; x < GRID_WIDTH; x++) {
        expect(grid[0][x].type).toBe(TileType.ROCK);
        expect(grid[GRID_HEIGHT - 1][x].type).toBe(TileType.ROCK);
      }
      // Left and right borders
      for (let y = 0; y < GRID_HEIGHT; y++) {
        expect(grid[y][0].type).toBe(TileType.ROCK);
        expect(grid[y][GRID_WIDTH - 1].type).toBe(TileType.ROCK);
      }
    });

    it('has floor tiles in center area for heart', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);

      // Check 5x5 center area
      for (let dy = -HEART_CLEAR_RADIUS; dy <= HEART_CLEAR_RADIUS; dy++) {
        for (let dx = -HEART_CLEAR_RADIUS; dx <= HEART_CLEAR_RADIUS; dx++) {
          expect(grid[centerY + dy][centerX + dx].type).toBe(TileType.FLOOR);
        }
      }
    });

    it('has center area claimed', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);

      expect(grid[centerY][centerX].owner).toBe(true);
    });

    it('has dirt tiles between border and center', () => {
      const grid = createGrid();
      // Check a tile that should be dirt (not border, not center)
      expect(grid[5][5].type).toBe(TileType.DIRT);
    });

    it('produces consistent gold seams with same seed', () => {
      const grid1 = createGrid(12345);
      const grid2 = createGrid(12345);
      const seams1 = findGoldSeams(grid1);
      const seams2 = findGoldSeams(grid2);
      expect(seams1).toEqual(seams2);
    });

    it('produces different gold seams with different seeds', () => {
      const grid1 = createGrid(12345);
      const grid2 = createGrid(54321);
      const seams1 = findGoldSeams(grid1);
      const seams2 = findGoldSeams(grid2);
      expect(seams1).not.toEqual(seams2);
    });

    it('gold seams only exist in dirt tiles', () => {
      const grid = createGrid(12345);
      const seams = findGoldSeams(grid);
      for (const pos of seams) {
        expect(grid[pos.y][pos.x].type).toBe(TileType.DIRT);
      }
    });
  });

  describe('getTile', () => {
    it('returns tile at valid position', () => {
      const grid = createGrid();
      const tile = getTile(grid, 5, 5);
      expect(tile).not.toBeNull();
      expect(tile?.type).toBe(TileType.DIRT);
    });

    it('returns null for negative x', () => {
      const grid = createGrid();
      expect(getTile(grid, -1, 5)).toBeNull();
    });

    it('returns null for negative y', () => {
      const grid = createGrid();
      expect(getTile(grid, 5, -1)).toBeNull();
    });

    it('returns null for x out of bounds', () => {
      const grid = createGrid();
      expect(getTile(grid, GRID_WIDTH, 5)).toBeNull();
    });

    it('returns null for y out of bounds', () => {
      const grid = createGrid();
      expect(getTile(grid, 5, GRID_HEIGHT)).toBeNull();
    });
  });

  describe('setTile', () => {
    it('sets tile at valid position', () => {
      const grid = createGrid();
      const newTile = { type: TileType.WATER, room: RoomType.NONE, owner: false, goldSeam: false };
      setTile(grid, 5, 5, newTile);
      expect(grid[5][5]).toEqual(newTile);
    });

    it('does nothing for invalid position', () => {
      const grid = createGrid();
      const originalTile = { ...grid[5][5] };
      setTile(grid, -1, 5, { type: TileType.WATER, room: RoomType.NONE, owner: false, goldSeam: false });
      expect(grid[5][5]).toEqual(originalTile);
    });
  });

  describe('digTile', () => {
    it('converts dirt to floor', () => {
      const grid = createGrid();
      expect(grid[5][5].type).toBe(TileType.DIRT);
      digTile(grid, 5, 5);
      expect(grid[5][5].type).toBe(TileType.FLOOR);
    });

    it('returns base gold for normal dirt', () => {
      const grid = createGrid(99999); // Use seed that likely has no gold seam at 5,5
      // First clear any potential gold seam
      grid[5][5].goldSeam = false;
      const gold = digTile(grid, 5, 5);
      expect(gold).toBe(DIG_GOLD);
    });

    it('returns bonus gold for gold seam', () => {
      const grid = createGrid();
      grid[5][5].goldSeam = true;
      const gold = digTile(grid, 5, 5);
      expect(gold).toBe(DIG_GOLD + GOLD_SEAM_VALUE);
    });

    it('returns 0 for rock tiles', () => {
      const grid = createGrid();
      const gold = digTile(grid, 0, 0); // Border is rock
      expect(gold).toBe(0);
      expect(grid[0][0].type).toBe(TileType.ROCK);
    });

    it('returns 0 for already dug floor tiles', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const gold = digTile(grid, centerX, centerY);
      expect(gold).toBe(0);
    });

    it('claims tile after digging', () => {
      const grid = createGrid();
      expect(grid[5][5].owner).toBe(false);
      digTile(grid, 5, 5);
      expect(grid[5][5].owner).toBe(true);
    });

    it('clears gold seam after digging', () => {
      const grid = createGrid();
      grid[5][5].goldSeam = true;
      digTile(grid, 5, 5);
      expect(grid[5][5].goldSeam).toBe(false);
    });
  });

  describe('isValidPosition', () => {
    it('returns true for valid positions', () => {
      expect(isValidPosition(0, 0)).toBe(true);
      expect(isValidPosition(GRID_WIDTH - 1, GRID_HEIGHT - 1)).toBe(true);
      expect(isValidPosition(10, 10)).toBe(true);
    });

    it('returns false for negative x', () => {
      expect(isValidPosition(-1, 5)).toBe(false);
    });

    it('returns false for negative y', () => {
      expect(isValidPosition(5, -1)).toBe(false);
    });

    it('returns false for x >= width', () => {
      expect(isValidPosition(GRID_WIDTH, 5)).toBe(false);
    });

    it('returns false for y >= height', () => {
      expect(isValidPosition(5, GRID_HEIGHT)).toBe(false);
    });
  });

  describe('isWalkable', () => {
    it('returns true for floor tiles', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      expect(isWalkable(grid, centerX, centerY)).toBe(true);
    });

    it('returns false for rock tiles', () => {
      const grid = createGrid();
      expect(isWalkable(grid, 0, 0)).toBe(false);
    });

    it('returns false for dirt tiles', () => {
      const grid = createGrid();
      expect(isWalkable(grid, 5, 5)).toBe(false);
    });

    it('returns false for out of bounds', () => {
      const grid = createGrid();
      expect(isWalkable(grid, -1, 5)).toBe(false);
    });
  });

  describe('isDiggable', () => {
    it('returns true for dirt tiles', () => {
      const grid = createGrid();
      expect(isDiggable(grid, 5, 5)).toBe(true);
    });

    it('returns false for rock tiles', () => {
      const grid = createGrid();
      expect(isDiggable(grid, 0, 0)).toBe(false);
    });

    it('returns false for floor tiles', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      expect(isDiggable(grid, centerX, centerY)).toBe(false);
    });
  });

  describe('getNeighbors', () => {
    it('returns walkable adjacent tiles', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const neighbors = getNeighbors(grid, centerX, centerY);
      
      // All neighbors should be walkable floor tiles
      for (const pos of neighbors) {
        expect(isWalkable(grid, pos.x, pos.y)).toBe(true);
      }
    });

    it('returns 4 neighbors for center of clear area', () => {
      const grid = createGrid();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const neighbors = getNeighbors(grid, centerX, centerY);
      expect(neighbors.length).toBe(4);
    });

    it('returns fewer neighbors at edge of walkable area', () => {
      const grid = createGrid();
      // Edge of the cleared center area - some neighbors are dirt
      const centerX = Math.floor(GRID_WIDTH / 2);
      const edgeY = Math.floor(GRID_HEIGHT / 2) - HEART_CLEAR_RADIUS;
      const neighbors = getNeighbors(grid, centerX, edgeY);
      expect(neighbors.length).toBeLessThan(4);
    });

    it('returns empty array when surrounded by non-walkable', () => {
      const grid = createGrid();
      // Dig a single tile isolated by dirt
      digTile(grid, 3, 3);
      const neighbors = getNeighbors(grid, 3, 3);
      expect(neighbors.length).toBe(0);
    });
  });

  describe('getAllNeighbors', () => {
    it('returns 4 neighbors for middle position', () => {
      const neighbors = getAllNeighbors(10, 10);
      expect(neighbors.length).toBe(4);
    });

    it('returns 2 neighbors for corner position', () => {
      const neighbors = getAllNeighbors(0, 0);
      expect(neighbors.length).toBe(2);
    });

    it('returns 3 neighbors for edge position', () => {
      const neighbors = getAllNeighbors(0, 10);
      expect(neighbors.length).toBe(3);
    });
  });

  describe('findGoldSeams', () => {
    it('finds all gold seams in grid', () => {
      const grid = createGrid(42);
      const seams = findGoldSeams(grid);
      
      // Verify each position has a gold seam
      for (const pos of seams) {
        expect(grid[pos.y][pos.x].goldSeam).toBe(true);
      }
    });

    it('returns empty array when no gold seams', () => {
      const grid = createGrid();
      // Clear all gold seams manually
      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          grid[y][x].goldSeam = false;
        }
      }
      expect(findGoldSeams(grid).length).toBe(0);
    });
  });

  describe('countTileType', () => {
    it('counts rock tiles correctly', () => {
      const grid = createGrid();
      const rockCount = countTileType(grid, TileType.ROCK);
      // Border tiles: 2*width + 2*(height-2)
      const expectedBorder = 2 * GRID_WIDTH + 2 * (GRID_HEIGHT - 2);
      expect(rockCount).toBe(expectedBorder);
    });

    it('counts floor tiles correctly', () => {
      const grid = createGrid();
      const floorCount = countTileType(grid, TileType.FLOOR);
      // Center 5x5 area
      const clearSize = (2 * HEART_CLEAR_RADIUS + 1);
      expect(floorCount).toBe(clearSize * clearSize);
    });

    it('counts dirt tiles correctly', () => {
      const grid = createGrid();
      const dirtCount = countTileType(grid, TileType.DIRT);
      const totalTiles = GRID_WIDTH * GRID_HEIGHT;
      const borderTiles = 2 * GRID_WIDTH + 2 * (GRID_HEIGHT - 2);
      const clearSize = (2 * HEART_CLEAR_RADIUS + 1);
      const floorTiles = clearSize * clearSize;
      expect(dirtCount).toBe(totalTiles - borderTiles - floorTiles);
    });
  });
});
