import {
  canPlaceRoom,
  placeRoom,
  removeRoom,
  getRoomEfficiency,
  getRoomAtPosition,
  countRoomsByType,
  getRoomCost,
  getRoomsByType,
  isInsideRoom,
  getTotalEfficiency,
} from '../src/game/Room';
import { createGrid, digTile } from '../src/game/Grid';
import { Tile, TileType, RoomType, Room, Position } from '../src/game/types';
import { GRID_WIDTH, GRID_HEIGHT, ROOM_COSTS, HEART_CLEAR_RADIUS } from '../src/game/constants';

describe('Room', () => {
  // Helper to create a grid with extra floor space
  function createTestGrid(): Tile[][] {
    const grid = createGrid();
    // Dig out a large area for room placement
    for (let y = 5; y < 15; y++) {
      for (let x = 5; x < 15; x++) {
        digTile(grid, x, y);
      }
    }
    return grid;
  }

  describe('canPlaceRoom', () => {
    it('returns true for valid 3x3 floor area', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      expect(canPlaceRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR)).toBe(true);
    });

    it('returns false for RoomType.NONE', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      expect(canPlaceRoom(grid, rooms, { x: 6, y: 6 }, RoomType.NONE)).toBe(false);
    });

    it('returns false if any tile is not FLOOR', () => {
      const grid = createGrid();
      const rooms: Room[] = [];
      // Using area that includes dirt tiles
      expect(canPlaceRoom(grid, rooms, { x: 3, y: 3 }, RoomType.LAIR)).toBe(false);
    });

    it('returns false if any tile is not owned', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      // Remove ownership from one tile
      grid[6][6].owner = false;
      expect(canPlaceRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR)).toBe(false);
    });

    it('returns false if tiles have existing room', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      placeRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR);
      // Try to place another room overlapping
      expect(canPlaceRoom(grid, rooms, { x: 7, y: 7 }, RoomType.HATCHERY)).toBe(false);
    });

    it('returns false if room goes out of bounds', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      expect(canPlaceRoom(grid, rooms, { x: GRID_WIDTH - 2, y: 6 }, RoomType.LAIR)).toBe(false);
    });

    it('returns false if room touches rock border', () => {
      const grid = createGrid();
      const rooms: Room[] = [];
      // Position at border
      expect(canPlaceRoom(grid, rooms, { x: 0, y: 5 }, RoomType.LAIR)).toBe(false);
    });

    it('returns true for all room types on valid area', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      const roomTypes = [
        RoomType.LAIR,
        RoomType.HATCHERY,
        RoomType.LIBRARY,
        RoomType.TRAINING,
        RoomType.TREASURY,
        RoomType.WORKSHOP,
        RoomType.PRISON,
        RoomType.TORTURE,
      ];
      for (const type of roomTypes) {
        expect(canPlaceRoom(grid, rooms, { x: 6, y: 6 }, type)).toBe(true);
      }
    });
  });

  describe('placeRoom', () => {
    it('sets room type on all tiles', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      placeRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR);

      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          expect(grid[6 + dy][6 + dx].room).toBe(RoomType.LAIR);
        }
      }
    });

    it('returns Room with correct tiles', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      const room = placeRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR);

      expect(room.tiles.length).toBe(9);
      expect(room.type).toBe(RoomType.LAIR);
    });

    it('returns Room with efficiency 1.0 for full 3x3', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      const room = placeRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR);
      expect(room.efficiency).toBe(1.0);
    });

    it('adds room to rooms array', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      placeRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR);
      expect(rooms.length).toBe(1);
    });

    it('can place multiple non-overlapping rooms', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      placeRoom(grid, rooms, { x: 5, y: 5 }, RoomType.LAIR);
      placeRoom(grid, rooms, { x: 9, y: 5 }, RoomType.HATCHERY);
      expect(rooms.length).toBe(2);
    });
  });

  describe('removeRoom', () => {
    it('clears room type from tiles', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      const room = placeRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR);
      removeRoom(grid, rooms, room);

      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          expect(grid[6 + dy][6 + dx].room).toBe(RoomType.NONE);
        }
      }
    });

    it('removes room from rooms array', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      const room = placeRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR);
      expect(rooms.length).toBe(1);
      removeRoom(grid, rooms, room);
      expect(rooms.length).toBe(0);
    });

    it('only removes the specified room', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      const room1 = placeRoom(grid, rooms, { x: 5, y: 5 }, RoomType.LAIR);
      const room2 = placeRoom(grid, rooms, { x: 9, y: 5 }, RoomType.HATCHERY);
      removeRoom(grid, rooms, room1);
      expect(rooms.length).toBe(1);
      expect(rooms[0]).toBe(room2);
    });
  });

  describe('getRoomEfficiency', () => {
    it('returns 1.0 for 9-tile room', () => {
      const room: Room = {
        type: RoomType.LAIR,
        tiles: Array(9).fill({ x: 0, y: 0 }),
        efficiency: 0,
      };
      expect(getRoomEfficiency(room)).toBe(1.0);
    });

    it('returns ~0.67 for 6-tile room', () => {
      const room: Room = {
        type: RoomType.LAIR,
        tiles: Array(6).fill({ x: 0, y: 0 }),
        efficiency: 0,
      };
      expect(getRoomEfficiency(room)).toBeCloseTo(6 / 9, 2);
    });

    it('caps at 1.0 for larger rooms', () => {
      const room: Room = {
        type: RoomType.LAIR,
        tiles: Array(12).fill({ x: 0, y: 0 }),
        efficiency: 0,
      };
      expect(getRoomEfficiency(room)).toBe(1.0);
    });

    it('returns 0 for empty room', () => {
      const room: Room = {
        type: RoomType.LAIR,
        tiles: [],
        efficiency: 0,
      };
      expect(getRoomEfficiency(room)).toBe(0);
    });
  });

  describe('getRoomAtPosition', () => {
    it('finds room containing position', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      const room = placeRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR);
      expect(getRoomAtPosition(rooms, { x: 7, y: 7 })).toBe(room);
    });

    it('returns null for position without room', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      placeRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR);
      expect(getRoomAtPosition(rooms, { x: 3, y: 3 })).toBeNull();
    });

    it('returns null for empty rooms array', () => {
      const rooms: Room[] = [];
      expect(getRoomAtPosition(rooms, { x: 7, y: 7 })).toBeNull();
    });

    it('finds correct room among multiple', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      placeRoom(grid, rooms, { x: 5, y: 5 }, RoomType.LAIR);
      const hatchery = placeRoom(grid, rooms, { x: 9, y: 5 }, RoomType.HATCHERY);
      expect(getRoomAtPosition(rooms, { x: 10, y: 6 })).toBe(hatchery);
    });
  });

  describe('countRoomsByType', () => {
    it('returns 0 when no rooms', () => {
      expect(countRoomsByType([], RoomType.LAIR)).toBe(0);
    });

    it('returns 0 when no rooms of given type', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      placeRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR);
      expect(countRoomsByType(rooms, RoomType.HATCHERY)).toBe(0);
    });

    it('counts single room', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      placeRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR);
      expect(countRoomsByType(rooms, RoomType.LAIR)).toBe(1);
    });

    it('counts multiple rooms of same type', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      placeRoom(grid, rooms, { x: 5, y: 5 }, RoomType.TREASURY);
      placeRoom(grid, rooms, { x: 9, y: 5 }, RoomType.TREASURY);
      expect(countRoomsByType(rooms, RoomType.TREASURY)).toBe(2);
    });
  });

  describe('getRoomCost', () => {
    it('returns correct cost for LAIR', () => {
      expect(getRoomCost(RoomType.LAIR)).toBe(ROOM_COSTS[RoomType.LAIR]);
    });

    it('returns correct cost for TREASURY', () => {
      expect(getRoomCost(RoomType.TREASURY)).toBe(250);
    });

    it('returns 0 for NONE', () => {
      expect(getRoomCost(RoomType.NONE)).toBe(0);
    });
  });

  describe('getRoomsByType', () => {
    it('returns empty array when no rooms', () => {
      expect(getRoomsByType([], RoomType.LAIR)).toEqual([]);
    });

    it('returns all rooms of given type', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      const lair1 = placeRoom(grid, rooms, { x: 5, y: 5 }, RoomType.LAIR);
      placeRoom(grid, rooms, { x: 9, y: 5 }, RoomType.HATCHERY);
      const lair2 = placeRoom(grid, rooms, { x: 5, y: 9 }, RoomType.LAIR);
      
      const lairs = getRoomsByType(rooms, RoomType.LAIR);
      expect(lairs.length).toBe(2);
      expect(lairs).toContain(lair1);
      expect(lairs).toContain(lair2);
    });
  });

  describe('isInsideRoom', () => {
    it('returns true for position inside room', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      placeRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR);
      expect(isInsideRoom(rooms, { x: 7, y: 7 })).toBe(true);
    });

    it('returns false for position outside room', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      placeRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR);
      expect(isInsideRoom(rooms, { x: 3, y: 3 })).toBe(false);
    });
  });

  describe('getTotalEfficiency', () => {
    it('returns 0 for no rooms', () => {
      expect(getTotalEfficiency([], RoomType.LAIR)).toBe(0);
    });

    it('returns efficiency of single room', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      placeRoom(grid, rooms, { x: 6, y: 6 }, RoomType.LAIR);
      expect(getTotalEfficiency(rooms, RoomType.LAIR)).toBe(1.0);
    });

    it('sums efficiency of multiple rooms', () => {
      const grid = createTestGrid();
      const rooms: Room[] = [];
      placeRoom(grid, rooms, { x: 5, y: 5 }, RoomType.TREASURY);
      placeRoom(grid, rooms, { x: 9, y: 5 }, RoomType.TREASURY);
      expect(getTotalEfficiency(rooms, RoomType.TREASURY)).toBe(2.0);
    });
  });
});
