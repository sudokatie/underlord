import { Tile, TileType, RoomType, Room, Position } from './types';
import { getTile, isValidPosition } from './Grid';
import { ROOM_COSTS } from './constants';

const ROOM_SIZE = 3;

/**
 * Check if a room can be placed at the given top-left position.
 * Requirements:
 * - All tiles must be FLOOR
 * - All tiles must be owned (claimed)
 * - No tiles can have an existing room
 * - Must fit within grid bounds (not touching rock border)
 */
export function canPlaceRoom(
  grid: Tile[][],
  rooms: Room[],
  topLeft: Position,
  type: RoomType
): boolean {
  if (type === RoomType.NONE) return false;

  // Check all tiles in 3x3 area
  for (let dy = 0; dy < ROOM_SIZE; dy++) {
    for (let dx = 0; dx < ROOM_SIZE; dx++) {
      const x = topLeft.x + dx;
      const y = topLeft.y + dy;

      // Must be valid position
      if (!isValidPosition(x, y)) return false;

      const tile = getTile(grid, x, y);
      if (!tile) return false;

      // Must be floor
      if (tile.type !== TileType.FLOOR) return false;

      // Must be owned
      if (!tile.owner) return false;

      // Must not have existing room
      if (tile.room !== RoomType.NONE) return false;
    }
  }

  return true;
}

/**
 * Place a room at the given top-left position.
 * Returns the created Room object.
 * Does NOT validate - call canPlaceRoom first.
 */
export function placeRoom(
  grid: Tile[][],
  rooms: Room[],
  topLeft: Position,
  type: RoomType
): Room {
  const tiles: Position[] = [];

  // Mark all tiles with room type
  for (let dy = 0; dy < ROOM_SIZE; dy++) {
    for (let dx = 0; dx < ROOM_SIZE; dx++) {
      const x = topLeft.x + dx;
      const y = topLeft.y + dy;
      grid[y][x].room = type;
      tiles.push({ x, y });
    }
  }

  const room: Room = {
    type,
    tiles,
    efficiency: getRoomEfficiency({ type, tiles, efficiency: 0 }),
  };

  rooms.push(room);
  return room;
}

/**
 * Remove a room, clearing tile room types.
 */
export function removeRoom(grid: Tile[][], rooms: Room[], room: Room): void {
  // Clear room type from tiles
  for (const pos of room.tiles) {
    const tile = getTile(grid, pos.x, pos.y);
    if (tile) {
      tile.room = RoomType.NONE;
    }
  }

  // Remove from rooms array
  const index = rooms.indexOf(room);
  if (index !== -1) {
    rooms.splice(index, 1);
  }
}

/**
 * Calculate room efficiency based on tile count.
 * Full 3x3 room = 1.0 efficiency.
 */
export function getRoomEfficiency(room: Room): number {
  const maxTiles = ROOM_SIZE * ROOM_SIZE;
  return Math.min(1.0, room.tiles.length / maxTiles);
}

/**
 * Find the room at a given position, or null if none.
 */
export function getRoomAtPosition(rooms: Room[], pos: Position): Room | null {
  for (const room of rooms) {
    for (const tile of room.tiles) {
      if (tile.x === pos.x && tile.y === pos.y) {
        return room;
      }
    }
  }
  return null;
}

/**
 * Count rooms of a given type.
 */
export function countRoomsByType(rooms: Room[], type: RoomType): number {
  return rooms.filter((r) => r.type === type).length;
}

/**
 * Get total cost to build a room of given type.
 */
export function getRoomCost(type: RoomType): number {
  return ROOM_COSTS[type] || 0;
}

/**
 * Get all rooms of a given type.
 */
export function getRoomsByType(rooms: Room[], type: RoomType): Room[] {
  return rooms.filter((r) => r.type === type);
}

/**
 * Check if a position is inside any room.
 */
export function isInsideRoom(rooms: Room[], pos: Position): boolean {
  return getRoomAtPosition(rooms, pos) !== null;
}

/**
 * Get total efficiency for all rooms of a type.
 */
export function getTotalEfficiency(rooms: Room[], type: RoomType): number {
  return getRoomsByType(rooms, type).reduce((sum, r) => sum + r.efficiency, 0);
}
