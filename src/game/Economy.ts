import { Room, RoomType, Creature } from './types';
import {
  STARTING_GOLD,
  DEFAULT_TREASURY_CAPACITY,
  TREASURY_CAPACITY_PER_ROOM,
  CREATURE_STATS,
  ROOM_COSTS,
  IMP_COST,
} from './constants';
import { countRoomsByType } from './Room';

/**
 * Economy state interface.
 */
export interface EconomyState {
  gold: number;
  maxGold: number;
  lastWageTime: number;
}

/**
 * Create initial economy state.
 */
export function createEconomy(): EconomyState {
  return {
    gold: STARTING_GOLD,
    maxGold: DEFAULT_TREASURY_CAPACITY,
    lastWageTime: 0,
  };
}

/**
 * Add gold, capped by treasury capacity.
 * Returns actual amount added (may be less if capped).
 */
export function addGold(economy: EconomyState, amount: number): number {
  const actualAdd = Math.min(amount, economy.maxGold - economy.gold);
  economy.gold += actualAdd;
  return actualAdd;
}

/**
 * Spend gold if available.
 * Returns true if successful, false if insufficient funds.
 */
export function spendGold(economy: EconomyState, amount: number): boolean {
  if (economy.gold < amount) {
    return false;
  }
  economy.gold -= amount;
  return true;
}

/**
 * Check if player can afford amount.
 */
export function canAfford(economy: EconomyState, amount: number): boolean {
  return economy.gold >= amount;
}

/**
 * Get treasury capacity based on treasury rooms.
 */
export function getTreasuryCapacity(rooms: Room[]): number {
  const treasuryCount = countRoomsByType(rooms, RoomType.TREASURY);
  return DEFAULT_TREASURY_CAPACITY + treasuryCount * TREASURY_CAPACITY_PER_ROOM;
}

/**
 * Update max gold based on treasury rooms.
 */
export function updateMaxGold(economy: EconomyState, rooms: Room[]): void {
  economy.maxGold = getTreasuryCapacity(rooms);
  // Cap current gold if it exceeds new max
  economy.gold = Math.min(economy.gold, economy.maxGold);
}

/**
 * Calculate wages for all creatures.
 * Wages = 10% of creature cost per minute.
 */
export function calculateWages(creatures: Creature[]): number {
  let totalWages = 0;
  for (const creature of creatures) {
    const stats = CREATURE_STATS[creature.type];
    const wage = Math.floor(stats.cost * 0.1);
    totalWages += wage;
  }
  return totalWages;
}

/**
 * Process wage payment for creatures.
 * Returns true if all wages paid, false if partial/none.
 */
export function processWages(
  economy: EconomyState,
  creatures: Creature[],
  currentTime: number,
  wageInterval: number
): { paid: boolean; amount: number } {
  // Check if it's time to pay wages
  if (currentTime - economy.lastWageTime < wageInterval) {
    return { paid: true, amount: 0 };
  }

  const wages = calculateWages(creatures);
  if (wages === 0) {
    economy.lastWageTime = currentTime;
    return { paid: true, amount: 0 };
  }

  if (spendGold(economy, wages)) {
    economy.lastWageTime = currentTime;
    return { paid: true, amount: wages };
  }

  // Can't afford wages - pay what we can
  const partialPay = economy.gold;
  economy.gold = 0;
  economy.lastWageTime = currentTime;
  return { paid: false, amount: partialPay };
}

/**
 * Get cost to build a room.
 */
export function getRoomCost(type: RoomType): number {
  return ROOM_COSTS[type] || 0;
}

/**
 * Get cost to summon an imp.
 */
export function getImpCost(): number {
  return IMP_COST;
}

/**
 * Get cost to recruit a creature.
 */
export function getCreatureCost(type: import('./types').CreatureType): number {
  return CREATURE_STATS[type].cost;
}

/**
 * Check if player can afford to build a room.
 */
export function canAffordRoom(economy: EconomyState, type: RoomType): boolean {
  return canAfford(economy, getRoomCost(type));
}

/**
 * Check if player can afford to summon an imp.
 */
export function canAffordImp(economy: EconomyState): boolean {
  return canAfford(economy, IMP_COST);
}

/**
 * Get gold overflow amount (gold that couldn't be stored).
 */
export function getGoldOverflow(economy: EconomyState, addAmount: number): number {
  const wouldHave = economy.gold + addAmount;
  return Math.max(0, wouldHave - economy.maxGold);
}
