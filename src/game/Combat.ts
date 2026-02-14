import { Entity, Creature, Hero, CreatureType, HeroType } from './types';
import { CREATURE_STATS, HERO_STATS } from './constants';
import { getDistance } from './Pathfinding';

/**
 * Process an attack from attacker to defender.
 * Returns damage dealt.
 */
export function processAttack(
  attacker: Entity,
  attackerAtk: number,
  defender: Entity
): number {
  // Damage = ATK * random(0.8, 1.2)
  const variance = 0.8 + Math.random() * 0.4;
  const damage = Math.floor(attackerAtk * variance);

  defender.hp = Math.max(0, defender.hp - damage);
  return damage;
}

/**
 * Calculate attack damage (deterministic, for testing).
 */
export function calculateDamage(atk: number, variance: number = 1.0): number {
  return Math.floor(atk * variance);
}

/**
 * Check if attacker is in range of defender.
 */
export function isInRange(
  attacker: Entity,
  defender: Entity,
  range: number
): boolean {
  const dist = getDistance(attacker.pos, defender.pos);
  return dist <= range;
}

/**
 * Get attack range for a creature type.
 */
export function getCreatureRange(type: CreatureType): number {
  return CREATURE_STATS[type].range;
}

/**
 * Get attack range for a hero type.
 */
export function getHeroRange(type: HeroType): number {
  return HERO_STATS[type].range;
}

/**
 * Get attack value for a creature.
 */
export function getCreatureAtk(creature: Creature): number {
  const baseAtk = CREATURE_STATS[creature.type].atk;
  const levelBonus = (creature.level - 1) * 0.1;
  return Math.floor(baseAtk * (1 + levelBonus));
}

/**
 * Get attack value for a hero.
 */
export function getHeroAtk(hero: Hero): number {
  return HERO_STATS[hero.type].atk;
}

/**
 * Check if entity is dead.
 */
export function isDead(entity: Entity): boolean {
  return entity.hp <= 0;
}

/**
 * Check if entity can attack (cooldown check).
 */
export function canAttackNow(
  entity: Entity,
  speed: number,
  currentTime: number
): boolean {
  const cooldown = 3 / speed;
  return currentTime - entity.lastAttackTime >= cooldown;
}

/**
 * Record that an entity attacked.
 */
export function recordAttackTime(entity: Entity, currentTime: number): void {
  entity.lastAttackTime = currentTime;
}

/**
 * Find target by ID in entity arrays.
 */
export function findTargetById(
  targetId: string,
  creatures: Creature[],
  heroes: Hero[],
  heart: Entity | null
): Entity | null {
  // Check heart
  if (heart && heart.id === targetId) {
    return heart;
  }

  // Check creatures
  for (const c of creatures) {
    if (c.id === targetId) return c;
  }

  // Check heroes
  for (const h of heroes) {
    if (h.id === targetId) return h;
  }

  return null;
}

/**
 * Process all combat for one tick.
 * Returns array of combat events for logging.
 */
export function processCombat(
  creatures: Creature[],
  heroes: Hero[],
  heart: Entity,
  currentTime: number
): CombatEvent[] {
  const events: CombatEvent[] = [];

  // Creatures attack heroes
  for (const creature of creatures) {
    if (isDead(creature)) continue;
    if (!creature.targetId) continue;

    const target = findTargetById(creature.targetId, [], heroes, null);
    if (!target || isDead(target)) {
      creature.targetId = null;
      continue;
    }

    const range = getCreatureRange(creature.type);
    if (!isInRange(creature, target, range)) continue;

    const speed = CREATURE_STATS[creature.type].spd;
    if (!canAttackNow(creature, speed, currentTime)) continue;

    const atk = getCreatureAtk(creature);
    const damage = processAttack(creature, atk, target);
    recordAttackTime(creature, currentTime);

    events.push({
      attackerId: creature.id,
      defenderId: target.id,
      damage,
      defenderDied: isDead(target),
    });
  }

  // Heroes attack creatures and heart
  for (const hero of heroes) {
    if (isDead(hero)) continue;
    if (!hero.targetId) continue;

    const target = findTargetById(hero.targetId, creatures, [], heart);
    if (!target || isDead(target)) {
      hero.targetId = null;
      continue;
    }

    const range = getHeroRange(hero.type);
    if (!isInRange(hero, target, range)) continue;

    const speed = HERO_STATS[hero.type].spd;
    if (!canAttackNow(hero, speed, currentTime)) continue;

    const atk = getHeroAtk(hero);
    const damage = processAttack(hero, atk, target);
    recordAttackTime(hero, currentTime);

    events.push({
      attackerId: hero.id,
      defenderId: target.id,
      damage,
      defenderDied: isDead(target),
    });
  }

  return events;
}

/**
 * Combat event for logging/display.
 */
export interface CombatEvent {
  attackerId: string;
  defenderId: string;
  damage: number;
  defenderDied: boolean;
}
