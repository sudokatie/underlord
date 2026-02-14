import {
  createEconomy,
  addGold,
  spendGold,
  canAfford,
  getTreasuryCapacity,
  updateMaxGold,
  calculateWages,
  processWages,
  getRoomCost,
  getImpCost,
  getCreatureCost,
  canAffordRoom,
  canAffordImp,
  getGoldOverflow,
} from '../src/game/Economy';
import { createCreature, resetCreatureIdCounter } from '../src/game/Creature';
import { createGrid, digTile } from '../src/game/Grid';
import { placeRoom } from '../src/game/Room';
import { Room, RoomType, CreatureType } from '../src/game/types';
import {
  STARTING_GOLD,
  DEFAULT_TREASURY_CAPACITY,
  TREASURY_CAPACITY_PER_ROOM,
  ROOM_COSTS,
  IMP_COST,
  CREATURE_STATS,
} from '../src/game/constants';

describe('Economy', () => {
  beforeEach(() => {
    resetCreatureIdCounter();
  });

  describe('createEconomy', () => {
    it('creates economy with starting gold', () => {
      const economy = createEconomy();
      expect(economy.gold).toBe(STARTING_GOLD);
    });

    it('creates economy with default max gold', () => {
      const economy = createEconomy();
      expect(economy.maxGold).toBe(DEFAULT_TREASURY_CAPACITY);
    });

    it('creates economy with lastWageTime 0', () => {
      const economy = createEconomy();
      expect(economy.lastWageTime).toBe(0);
    });
  });

  describe('addGold', () => {
    it('adds gold to economy', () => {
      const economy = createEconomy();
      economy.gold = 500;
      addGold(economy, 100);
      expect(economy.gold).toBe(600);
    });

    it('caps gold at maxGold', () => {
      const economy = createEconomy();
      economy.gold = 900;
      economy.maxGold = 1000;
      addGold(economy, 200);
      expect(economy.gold).toBe(1000);
    });

    it('returns actual amount added', () => {
      const economy = createEconomy();
      economy.gold = 900;
      economy.maxGold = 1000;
      const added = addGold(economy, 200);
      expect(added).toBe(100);
    });

    it('returns 0 when already at max', () => {
      const economy = createEconomy();
      economy.gold = 1000;
      economy.maxGold = 1000;
      const added = addGold(economy, 100);
      expect(added).toBe(0);
    });
  });

  describe('spendGold', () => {
    it('deducts gold from economy', () => {
      const economy = createEconomy();
      economy.gold = 500;
      spendGold(economy, 100);
      expect(economy.gold).toBe(400);
    });

    it('returns true on success', () => {
      const economy = createEconomy();
      economy.gold = 500;
      expect(spendGold(economy, 100)).toBe(true);
    });

    it('returns false when insufficient funds', () => {
      const economy = createEconomy();
      economy.gold = 50;
      expect(spendGold(economy, 100)).toBe(false);
    });

    it('does not deduct when insufficient funds', () => {
      const economy = createEconomy();
      economy.gold = 50;
      spendGold(economy, 100);
      expect(economy.gold).toBe(50);
    });
  });

  describe('canAfford', () => {
    it('returns true when enough gold', () => {
      const economy = createEconomy();
      economy.gold = 500;
      expect(canAfford(economy, 500)).toBe(true);
    });

    it('returns false when not enough gold', () => {
      const economy = createEconomy();
      economy.gold = 50;
      expect(canAfford(economy, 100)).toBe(false);
    });
  });

  describe('getTreasuryCapacity', () => {
    it('returns default capacity with no treasury rooms', () => {
      expect(getTreasuryCapacity([])).toBe(DEFAULT_TREASURY_CAPACITY);
    });

    it('increases capacity with treasury rooms', () => {
      const rooms: Room[] = [
        { type: RoomType.TREASURY, tiles: [], efficiency: 1.0 },
      ];
      expect(getTreasuryCapacity(rooms)).toBe(
        DEFAULT_TREASURY_CAPACITY + TREASURY_CAPACITY_PER_ROOM
      );
    });

    it('increases capacity for each treasury room', () => {
      const rooms: Room[] = [
        { type: RoomType.TREASURY, tiles: [], efficiency: 1.0 },
        { type: RoomType.TREASURY, tiles: [], efficiency: 1.0 },
      ];
      expect(getTreasuryCapacity(rooms)).toBe(
        DEFAULT_TREASURY_CAPACITY + 2 * TREASURY_CAPACITY_PER_ROOM
      );
    });

    it('ignores non-treasury rooms', () => {
      const rooms: Room[] = [
        { type: RoomType.LAIR, tiles: [], efficiency: 1.0 },
        { type: RoomType.HATCHERY, tiles: [], efficiency: 1.0 },
      ];
      expect(getTreasuryCapacity(rooms)).toBe(DEFAULT_TREASURY_CAPACITY);
    });
  });

  describe('updateMaxGold', () => {
    it('updates maxGold based on treasury rooms', () => {
      const economy = createEconomy();
      const rooms: Room[] = [
        { type: RoomType.TREASURY, tiles: [], efficiency: 1.0 },
      ];
      updateMaxGold(economy, rooms);
      expect(economy.maxGold).toBe(
        DEFAULT_TREASURY_CAPACITY + TREASURY_CAPACITY_PER_ROOM
      );
    });

    it('caps gold when maxGold decreases', () => {
      const economy = createEconomy();
      economy.gold = 1500;
      economy.maxGold = 2000;
      updateMaxGold(economy, []); // No treasury rooms
      expect(economy.gold).toBe(DEFAULT_TREASURY_CAPACITY);
    });
  });

  describe('calculateWages', () => {
    it('returns 0 for no creatures', () => {
      expect(calculateWages([])).toBe(0);
    });

    it('calculates wages for single creature', () => {
      const beetle = createCreature(CreatureType.BEETLE, { x: 0, y: 0 });
      // Beetle cost 100, wages = 10%
      expect(calculateWages([beetle])).toBe(10);
    });

    it('sums wages for multiple creatures', () => {
      const beetle = createCreature(CreatureType.BEETLE, { x: 0, y: 0 });
      const orc = createCreature(CreatureType.ORC, { x: 0, y: 0 });
      // Beetle: 10, Orc: 20
      expect(calculateWages([beetle, orc])).toBe(30);
    });

    it('imps have no wages (cost 0)', () => {
      const imp = createCreature(CreatureType.IMP, { x: 0, y: 0 });
      expect(calculateWages([imp])).toBe(0);
    });
  });

  describe('processWages', () => {
    it('does not process if interval not elapsed', () => {
      const economy = createEconomy();
      economy.lastWageTime = 50;
      const beetle = createCreature(CreatureType.BEETLE, { x: 0, y: 0 });
      const result = processWages(economy, [beetle], 60, 60);
      expect(result.paid).toBe(true);
      expect(result.amount).toBe(0);
    });

    it('processes wages when interval elapsed', () => {
      const economy = createEconomy();
      economy.lastWageTime = 0;
      economy.gold = 100;
      const beetle = createCreature(CreatureType.BEETLE, { x: 0, y: 0 });
      const result = processWages(economy, [beetle], 60, 60);
      expect(result.paid).toBe(true);
      expect(result.amount).toBe(10);
      expect(economy.gold).toBe(90);
    });

    it('updates lastWageTime on payment', () => {
      const economy = createEconomy();
      economy.lastWageTime = 0;
      const beetle = createCreature(CreatureType.BEETLE, { x: 0, y: 0 });
      processWages(economy, [beetle], 65, 60);
      expect(economy.lastWageTime).toBe(65);
    });

    it('returns paid false when cannot afford', () => {
      const economy = createEconomy();
      economy.lastWageTime = 0;
      economy.gold = 5;
      const beetle = createCreature(CreatureType.BEETLE, { x: 0, y: 0 });
      const result = processWages(economy, [beetle], 60, 60);
      expect(result.paid).toBe(false);
      expect(economy.gold).toBe(0);
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

  describe('getImpCost', () => {
    it('returns IMP_COST', () => {
      expect(getImpCost()).toBe(IMP_COST);
    });
  });

  describe('getCreatureCost', () => {
    it('returns correct cost for each creature type', () => {
      expect(getCreatureCost(CreatureType.BEETLE)).toBe(100);
      expect(getCreatureCost(CreatureType.ORC)).toBe(200);
      expect(getCreatureCost(CreatureType.WARLOCK)).toBe(300);
    });
  });

  describe('canAffordRoom', () => {
    it('returns true when can afford', () => {
      const economy = createEconomy();
      economy.gold = 1000;
      expect(canAffordRoom(economy, RoomType.LAIR)).toBe(true);
    });

    it('returns false when cannot afford', () => {
      const economy = createEconomy();
      economy.gold = 100;
      expect(canAffordRoom(economy, RoomType.LAIR)).toBe(false);
    });
  });

  describe('canAffordImp', () => {
    it('returns true when can afford', () => {
      const economy = createEconomy();
      economy.gold = 100;
      expect(canAffordImp(economy)).toBe(true);
    });

    it('returns false when cannot afford', () => {
      const economy = createEconomy();
      economy.gold = 50;
      expect(canAffordImp(economy)).toBe(false);
    });
  });

  describe('getGoldOverflow', () => {
    it('returns 0 when no overflow', () => {
      const economy = createEconomy();
      economy.gold = 500;
      economy.maxGold = 1000;
      expect(getGoldOverflow(economy, 100)).toBe(0);
    });

    it('returns overflow amount', () => {
      const economy = createEconomy();
      economy.gold = 900;
      economy.maxGold = 1000;
      expect(getGoldOverflow(economy, 200)).toBe(100);
    });
  });
});
