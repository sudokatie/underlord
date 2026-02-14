import { Hero, HeroType, HeroBehavior, Position, Entity } from './types';
import { HERO_STATS, FLEE_HP_THRESHOLD } from './constants';
import { getDistance } from './Pathfinding';

let heroIdCounter = 0;

/**
 * Create a new hero of the given type at the position.
 */
export function createHero(type: HeroType, pos: Position): Hero {
  heroIdCounter++;
  const stats = HERO_STATS[type];

  return {
    id: `hero-${heroIdCounter}`,
    pos: { ...pos },
    hp: stats.hp,
    maxHp: stats.hp,
    lastAttackTime: 0,
    type,
    behavior: HeroBehavior.ENTERING,
    targetId: null,
  };
}

/**
 * Get hero's stats based on type.
 */
export function getHeroStats(type: HeroType): {
  hp: number;
  atk: number;
  spd: number;
  gold: number;
  minWave: number;
  range: number;
} {
  return HERO_STATS[type];
}

/**
 * Get hero's attack damage.
 */
export function getHeroAttack(hero: Hero): number {
  return HERO_STATS[hero.type].atk;
}

/**
 * Get hero's movement speed.
 */
export function getHeroSpeed(hero: Hero): number {
  return HERO_STATS[hero.type].spd;
}

/**
 * Get hero's attack range.
 */
export function getHeroRange(hero: Hero): number {
  return HERO_STATS[hero.type].range;
}

/**
 * Get gold dropped when hero dies.
 */
export function getHeroGold(hero: Hero): number {
  return HERO_STATS[hero.type].gold;
}

/**
 * Determine what behavior the hero should have.
 */
export function determineBehavior(
  hero: Hero,
  hasEnemyInRange: boolean
): HeroBehavior {
  // Flee if low health
  if (hero.hp / hero.maxHp < FLEE_HP_THRESHOLD) {
    return HeroBehavior.FLEEING;
  }

  // Attack if enemy in range
  if (hasEnemyInRange && hero.targetId) {
    return HeroBehavior.ATTACKING;
  }

  // Otherwise keep entering/moving toward heart
  return HeroBehavior.ENTERING;
}

/**
 * Update hero behavior.
 */
export function updateBehavior(hero: Hero, newBehavior: HeroBehavior): void {
  hero.behavior = newBehavior;
}

/**
 * Choose target for hero (prioritize heart, then creatures per spec).
 */
export function chooseTarget(
  hero: Hero,
  creatures: Entity[],
  heart: Entity | null
): string | null {
  const range = getHeroRange(hero);

  // First priority: Heart (if in range)
  if (heart && heart.hp > 0) {
    const heartDist = getDistance(hero.pos, heart.pos);
    if (heartDist <= range) {
      return heart.id;
    }
  }

  // Second priority: Creatures in range
  let nearestCreature: Entity | null = null;
  let nearestDist = Infinity;

  for (const creature of creatures) {
    if (creature.hp <= 0) continue;
    const dist = getDistance(hero.pos, creature.pos);
    if (dist <= range && dist < nearestDist) {
      nearestCreature = creature;
      nearestDist = dist;
    }
  }

  if (nearestCreature) {
    return nearestCreature.id;
  }

  // Third priority would be Rooms, but rooms don't have HP in v1

  return null;
}

/**
 * Find nearest enemy (creature or heart) regardless of range.
 */
export function findNearestTarget(
  hero: Hero,
  creatures: Entity[],
  heart: Entity | null
): Entity | null {
  let nearest: Entity | null = null;
  let nearestDist = Infinity;

  // Check creatures
  for (const creature of creatures) {
    if (creature.hp <= 0) continue;
    const dist = getDistance(hero.pos, creature.pos);
    if (dist < nearestDist) {
      nearest = creature;
      nearestDist = dist;
    }
  }

  // Check heart
  if (heart && heart.hp > 0) {
    const heartDist = getDistance(hero.pos, heart.pos);
    if (heartDist < nearestDist) {
      nearest = heart;
    }
  }

  return nearest;
}

/**
 * Set hero's target.
 */
export function setHeroTarget(hero: Hero, targetId: string | null): void {
  hero.targetId = targetId;
}

/**
 * Check if hero can attack (cooldown elapsed).
 */
export function canAttack(hero: Hero, currentTime: number): boolean {
  const stats = HERO_STATS[hero.type];
  const attackCooldown = 3 / stats.spd;
  return currentTime - hero.lastAttackTime >= attackCooldown;
}

/**
 * Record attack time.
 */
export function recordAttack(hero: Hero, currentTime: number): void {
  hero.lastAttackTime = currentTime;
}

/**
 * Check if hero is ranged.
 */
export function isRanged(hero: Hero): boolean {
  return HERO_STATS[hero.type].range > 1;
}

/**
 * Check if hero wants to flee.
 */
export function wantsToFlee(hero: Hero): boolean {
  return hero.hp / hero.maxHp < FLEE_HP_THRESHOLD;
}

/**
 * Check if hero is dead.
 */
export function isDead(hero: Hero): boolean {
  return hero.hp <= 0;
}

/**
 * Reset hero id counter (for testing).
 */
export function resetHeroIdCounter(): void {
  heroIdCounter = 0;
}
