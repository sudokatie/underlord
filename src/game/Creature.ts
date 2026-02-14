import { Creature, CreatureType, CreatureBehavior, Position, Entity } from './types';
import { CREATURE_STATS, HUNGER_DECAY_RATE, HUNGER_THRESHOLD, FLEE_HP_THRESHOLD } from './constants';
import { getDistance } from './Pathfinding';

let creatureIdCounter = 0;

/**
 * Create a new creature of the given type at the position.
 */
export function createCreature(type: CreatureType, pos: Position): Creature {
  creatureIdCounter++;
  const stats = CREATURE_STATS[type];

  return {
    id: `creature-${creatureIdCounter}`,
    pos: { ...pos },
    hp: stats.hp,
    maxHp: stats.hp,
    lastAttackTime: 0,
    type,
    behavior: CreatureBehavior.IDLE,
    hunger: 100, // 0-100, starts full
    happiness: 100, // 0-100, starts happy
    level: 1,
    targetId: null,
    trainingProgress: 0, // 0-100, levels up at 100
  };
}

/**
 * Get creature's stats based on type.
 */
export function getCreatureStats(type: CreatureType): {
  hp: number;
  atk: number;
  spd: number;
  cost: number;
  range: number;
} {
  return CREATURE_STATS[type];
}

/**
 * Get creature's effective attack (including level bonus).
 */
export function getCreatureAttack(creature: Creature): number {
  const baseAtk = CREATURE_STATS[creature.type].atk;
  const levelBonus = (creature.level - 1) * 0.1;
  return Math.floor(baseAtk * (1 + levelBonus));
}

/**
 * Get creature's movement speed.
 */
export function getCreatureSpeed(creature: Creature): number {
  return CREATURE_STATS[creature.type].spd;
}

/**
 * Get creature's attack range.
 */
export function getCreatureRange(creature: Creature): number {
  return CREATURE_STATS[creature.type].range;
}

/**
 * Update creature needs (hunger, happiness) for one tick.
 */
export function updateNeeds(creature: Creature, dt: number): void {
  // Hunger decreases over time
  creature.hunger = Math.max(0, creature.hunger - HUNGER_DECAY_RATE * dt);

  // Happiness decays slowly (would be affected by wages, room quality, etc.)
  // For now, just a slow decay
  creature.happiness = Math.max(0, creature.happiness - 0.05 * dt);
}

/**
 * Determine what behavior the creature should have based on state.
 */
export function determineBehavior(
  creature: Creature,
  hasEnemyNearby: boolean,
  hasFood: boolean
): CreatureBehavior {
  // Flee if low health
  if (creature.hp / creature.maxHp < FLEE_HP_THRESHOLD) {
    return CreatureBehavior.FLEEING;
  }

  // Fight if enemy nearby
  if (hasEnemyNearby && creature.targetId) {
    return CreatureBehavior.FIGHTING;
  }

  // Eat if hungry and food available
  if (creature.hunger < HUNGER_THRESHOLD && hasFood) {
    return CreatureBehavior.EATING;
  }

  // Otherwise idle (or working if in a room, handled elsewhere)
  return CreatureBehavior.IDLE;
}

/**
 * Update creature behavior.
 */
export function updateBehavior(creature: Creature, newBehavior: CreatureBehavior): void {
  creature.behavior = newBehavior;
}

/**
 * Level up a creature, increasing its stats.
 */
export function levelUp(creature: Creature): void {
  creature.level++;

  // Increase max HP by 10%
  const hpBonus = Math.floor(creature.maxHp * 0.1);
  creature.maxHp += hpBonus;
  creature.hp = creature.maxHp; // Heal to full on level up
}

/**
 * Feed a creature, restoring hunger.
 */
export function feedCreature(creature: Creature, amount: number = 30): void {
  creature.hunger = Math.min(100, creature.hunger + amount);
}

/**
 * Train a creature, adding progress toward next level.
 * Returns true if creature leveled up.
 */
export function trainCreature(creature: Creature, amount: number, maxLevel: number = 10): boolean {
  if (creature.level >= maxLevel) {
    return false;
  }
  
  creature.trainingProgress += amount;
  
  if (creature.trainingProgress >= 100) {
    creature.trainingProgress = 0;
    levelUp(creature);
    return true;
  }
  
  return false;
}

/**
 * Pay a creature, restoring happiness.
 */
export function payCreature(creature: Creature, amount: number = 20): void {
  creature.happiness = Math.min(100, creature.happiness + amount);
}

/**
 * Check if creature is hungry.
 */
export function isHungry(creature: Creature): boolean {
  return creature.hunger < HUNGER_THRESHOLD;
}

/**
 * Check if creature wants to flee.
 */
export function wantsToFlee(creature: Creature): boolean {
  return creature.hp / creature.maxHp < FLEE_HP_THRESHOLD;
}

/**
 * Find nearest enemy from a list.
 */
export function findNearestEnemy(
  creature: Creature,
  enemies: Entity[]
): Entity | null {
  let nearest: Entity | null = null;
  let nearestDist = Infinity;

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const dist = getDistance(creature.pos, enemy.pos);
    if (dist < nearestDist) {
      nearest = enemy;
      nearestDist = dist;
    }
  }

  return nearest;
}

/**
 * Set creature's target.
 */
export function setCreatureTarget(creature: Creature, targetId: string | null): void {
  creature.targetId = targetId;
}

/**
 * Check if creature can attack (cooldown elapsed).
 */
export function canAttack(creature: Creature, currentTime: number): boolean {
  const stats = CREATURE_STATS[creature.type];
  const attackCooldown = 3 / stats.spd; // 3 / speed seconds between attacks
  return currentTime - creature.lastAttackTime >= attackCooldown;
}

/**
 * Record attack time.
 */
export function recordAttack(creature: Creature, currentTime: number): void {
  creature.lastAttackTime = currentTime;
}

/**
 * Reset creature id counter (for testing).
 */
export function resetCreatureIdCounter(): void {
  creatureIdCounter = 0;
}
