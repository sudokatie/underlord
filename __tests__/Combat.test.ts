import {
  processAttack,
  calculateDamage,
  isInRange,
  getCreatureRange,
  getHeroRange,
  getCreatureAtk,
  getHeroAtk,
  isDead,
  canAttackNow,
  recordAttackTime,
  findTargetById,
  processCombat,
} from '../src/game/Combat';
import { createCreature, resetCreatureIdCounter } from '../src/game/Creature';
import { createHero, resetHeroIdCounter } from '../src/game/Hero';
import { Entity, Creature, Hero, CreatureType, HeroType } from '../src/game/types';
import { CREATURE_STATS, HERO_STATS } from '../src/game/constants';

describe('Combat', () => {
  beforeEach(() => {
    resetCreatureIdCounter();
    resetHeroIdCounter();
  });

  describe('processAttack', () => {
    it('reduces defender HP', () => {
      const attacker: Entity = {
        id: 'a',
        pos: { x: 0, y: 0 },
        hp: 100,
        maxHp: 100,
        lastAttackTime: 0,
      };
      const defender: Entity = {
        id: 'd',
        pos: { x: 1, y: 0 },
        hp: 50,
        maxHp: 50,
        lastAttackTime: 0,
      };

      processAttack(attacker, 10, defender);
      expect(defender.hp).toBeLessThan(50);
    });

    it('returns damage dealt', () => {
      const attacker: Entity = {
        id: 'a',
        pos: { x: 0, y: 0 },
        hp: 100,
        maxHp: 100,
        lastAttackTime: 0,
      };
      const defender: Entity = {
        id: 'd',
        pos: { x: 1, y: 0 },
        hp: 100,
        maxHp: 100,
        lastAttackTime: 0,
      };

      const damage = processAttack(attacker, 10, defender);
      expect(damage).toBeGreaterThanOrEqual(8); // 10 * 0.8
      expect(damage).toBeLessThanOrEqual(12); // 10 * 1.2
    });

    it('does not reduce HP below 0', () => {
      const attacker: Entity = {
        id: 'a',
        pos: { x: 0, y: 0 },
        hp: 100,
        maxHp: 100,
        lastAttackTime: 0,
      };
      const defender: Entity = {
        id: 'd',
        pos: { x: 1, y: 0 },
        hp: 5,
        maxHp: 50,
        lastAttackTime: 0,
      };

      processAttack(attacker, 100, defender);
      expect(defender.hp).toBe(0);
    });
  });

  describe('calculateDamage', () => {
    it('returns base damage with variance 1.0', () => {
      expect(calculateDamage(10, 1.0)).toBe(10);
    });

    it('returns reduced damage with variance 0.8', () => {
      expect(calculateDamage(10, 0.8)).toBe(8);
    });

    it('returns increased damage with variance 1.2', () => {
      expect(calculateDamage(10, 1.2)).toBe(12);
    });
  });

  describe('isInRange', () => {
    it('returns true for adjacent entities', () => {
      const a: Entity = {
        id: 'a',
        pos: { x: 10, y: 10 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 0,
      };
      const b: Entity = {
        id: 'b',
        pos: { x: 11, y: 10 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 0,
      };
      expect(isInRange(a, b, 1)).toBe(true);
    });

    it('returns false when beyond range', () => {
      const a: Entity = {
        id: 'a',
        pos: { x: 10, y: 10 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 0,
      };
      const b: Entity = {
        id: 'b',
        pos: { x: 15, y: 10 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 0,
      };
      expect(isInRange(a, b, 1)).toBe(false);
    });

    it('returns true for ranged attack at distance 3', () => {
      const a: Entity = {
        id: 'a',
        pos: { x: 10, y: 10 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 0,
      };
      const b: Entity = {
        id: 'b',
        pos: { x: 13, y: 10 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 0,
      };
      expect(isInRange(a, b, 3)).toBe(true);
    });
  });

  describe('getCreatureRange', () => {
    it('returns 1 for melee creatures', () => {
      expect(getCreatureRange(CreatureType.BEETLE)).toBe(1);
      expect(getCreatureRange(CreatureType.ORC)).toBe(1);
    });

    it('returns 3 for warlock', () => {
      expect(getCreatureRange(CreatureType.WARLOCK)).toBe(3);
    });
  });

  describe('getHeroRange', () => {
    it('returns 1 for melee heroes', () => {
      expect(getHeroRange(HeroType.PEASANT)).toBe(1);
      expect(getHeroRange(HeroType.KNIGHT)).toBe(1);
    });

    it('returns 3 for ranged heroes', () => {
      expect(getHeroRange(HeroType.ARCHER)).toBe(3);
      expect(getHeroRange(HeroType.WIZARD)).toBe(3);
    });
  });

  describe('getCreatureAtk', () => {
    it('returns base attack at level 1', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 0, y: 0 });
      expect(getCreatureAtk(creature)).toBe(10);
    });

    it('returns increased attack at higher levels', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 0, y: 0 });
      creature.level = 3;
      // 10 * 1.2 = 12
      expect(getCreatureAtk(creature)).toBe(12);
    });
  });

  describe('getHeroAtk', () => {
    it('returns correct attack for each hero type', () => {
      expect(getHeroAtk(createHero(HeroType.PEASANT, { x: 0, y: 0 }))).toBe(8);
      expect(getHeroAtk(createHero(HeroType.KNIGHT, { x: 0, y: 0 }))).toBe(20);
      expect(getHeroAtk(createHero(HeroType.WIZARD, { x: 0, y: 0 }))).toBe(30);
    });
  });

  describe('isDead', () => {
    it('returns true when HP is 0', () => {
      const entity: Entity = {
        id: 'e',
        pos: { x: 0, y: 0 },
        hp: 0,
        maxHp: 10,
        lastAttackTime: 0,
      };
      expect(isDead(entity)).toBe(true);
    });

    it('returns false when HP is positive', () => {
      const entity: Entity = {
        id: 'e',
        pos: { x: 0, y: 0 },
        hp: 1,
        maxHp: 10,
        lastAttackTime: 0,
      };
      expect(isDead(entity)).toBe(false);
    });
  });

  describe('canAttackNow', () => {
    it('returns true when cooldown elapsed', () => {
      const entity: Entity = {
        id: 'e',
        pos: { x: 0, y: 0 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 0,
      };
      // Speed 2.0, cooldown = 1.5s
      expect(canAttackNow(entity, 2.0, 2.0)).toBe(true);
    });

    it('returns false when on cooldown', () => {
      const entity: Entity = {
        id: 'e',
        pos: { x: 0, y: 0 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 1.0,
      };
      // Speed 2.0, cooldown = 1.5s, current time 2.0
      expect(canAttackNow(entity, 2.0, 2.0)).toBe(false);
    });
  });

  describe('recordAttackTime', () => {
    it('updates lastAttackTime', () => {
      const entity: Entity = {
        id: 'e',
        pos: { x: 0, y: 0 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 0,
      };
      recordAttackTime(entity, 5.5);
      expect(entity.lastAttackTime).toBe(5.5);
    });
  });

  describe('findTargetById', () => {
    it('finds heart', () => {
      const heart: Entity = {
        id: 'heart',
        pos: { x: 20, y: 15 },
        hp: 1000,
        maxHp: 1000,
        lastAttackTime: 0,
      };
      expect(findTargetById('heart', [], [], heart)).toBe(heart);
    });

    it('finds creature', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 0, y: 0 });
      expect(findTargetById(creature.id, [creature], [], null)).toBe(creature);
    });

    it('finds hero', () => {
      const hero = createHero(HeroType.PEASANT, { x: 0, y: 0 });
      expect(findTargetById(hero.id, [], [hero], null)).toBe(hero);
    });

    it('returns null if not found', () => {
      expect(findTargetById('nonexistent', [], [], null)).toBeNull();
    });
  });

  describe('processCombat', () => {
    it('returns empty events with no combatants', () => {
      const heart: Entity = {
        id: 'heart',
        pos: { x: 20, y: 15 },
        hp: 1000,
        maxHp: 1000,
        lastAttackTime: 0,
      };
      const events = processCombat([], [], heart, 10);
      expect(events).toEqual([]);
    });

    it('creature attacks hero in range', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      const hero = createHero(HeroType.PEASANT, { x: 11, y: 10 });
      creature.targetId = hero.id;

      const heart: Entity = {
        id: 'heart',
        pos: { x: 20, y: 15 },
        hp: 1000,
        maxHp: 1000,
        lastAttackTime: 0,
      };

      const events = processCombat([creature], [hero], heart, 10);
      expect(events.length).toBe(1);
      expect(events[0].attackerId).toBe(creature.id);
      expect(events[0].defenderId).toBe(hero.id);
      expect(hero.hp).toBeLessThan(30);
    });

    it('hero attacks creature in range', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      const hero = createHero(HeroType.PEASANT, { x: 11, y: 10 });
      hero.targetId = creature.id;

      const heart: Entity = {
        id: 'heart',
        pos: { x: 20, y: 15 },
        hp: 1000,
        maxHp: 1000,
        lastAttackTime: 0,
      };

      const events = processCombat([creature], [hero], heart, 10);
      expect(events.length).toBe(1);
      expect(events[0].attackerId).toBe(hero.id);
      expect(events[0].defenderId).toBe(creature.id);
    });

    it('hero attacks heart', () => {
      const hero = createHero(HeroType.PEASANT, { x: 20, y: 15 });
      hero.targetId = 'heart';

      const heart: Entity = {
        id: 'heart',
        pos: { x: 20, y: 15 },
        hp: 1000,
        maxHp: 1000,
        lastAttackTime: 0,
      };

      const events = processCombat([], [hero], heart, 10);
      expect(events.length).toBe(1);
      expect(events[0].defenderId).toBe('heart');
      expect(heart.hp).toBeLessThan(1000);
    });

    it('dead entities do not attack', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.hp = 0;
      const hero = createHero(HeroType.PEASANT, { x: 11, y: 10 });
      creature.targetId = hero.id;

      const heart: Entity = {
        id: 'heart',
        pos: { x: 20, y: 15 },
        hp: 1000,
        maxHp: 1000,
        lastAttackTime: 0,
      };

      const events = processCombat([creature], [hero], heart, 10);
      expect(events).toEqual([]);
    });

    it('clears target when target is dead', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      const hero = createHero(HeroType.PEASANT, { x: 11, y: 10 });
      hero.hp = 0;
      creature.targetId = hero.id;

      const heart: Entity = {
        id: 'heart',
        pos: { x: 20, y: 15 },
        hp: 1000,
        maxHp: 1000,
        lastAttackTime: 0,
      };

      processCombat([creature], [hero], heart, 10);
      expect(creature.targetId).toBeNull();
    });
  });
});
