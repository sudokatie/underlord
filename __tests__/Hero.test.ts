import {
  createHero,
  getHeroStats,
  getHeroAttack,
  getHeroSpeed,
  getHeroRange,
  getHeroGold,
  determineBehavior,
  updateBehavior,
  chooseTarget,
  findNearestTarget,
  setHeroTarget,
  canAttack,
  recordAttack,
  isRanged,
  wantsToFlee,
  isDead,
  resetHeroIdCounter,
} from '../src/game/Hero';
import { HeroType, HeroBehavior, Entity } from '../src/game/types';
import { HERO_STATS, FLEE_HP_THRESHOLD } from '../src/game/constants';

describe('Hero', () => {
  beforeEach(() => {
    resetHeroIdCounter();
  });

  describe('createHero', () => {
    it('creates peasant with correct stats', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      expect(hero.type).toBe(HeroType.PEASANT);
      expect(hero.hp).toBe(30);
      expect(hero.maxHp).toBe(30);
      expect(hero.pos).toEqual({ x: 10, y: 10 });
      expect(hero.behavior).toBe(HeroBehavior.ENTERING);
    });

    it('creates archer with correct stats', () => {
      const hero = createHero(HeroType.ARCHER, { x: 10, y: 10 });
      expect(hero.hp).toBe(25);
    });

    it('creates knight with correct stats', () => {
      const hero = createHero(HeroType.KNIGHT, { x: 10, y: 10 });
      expect(hero.hp).toBe(80);
    });

    it('creates wizard with correct stats', () => {
      const hero = createHero(HeroType.WIZARD, { x: 10, y: 10 });
      expect(hero.hp).toBe(40);
    });

    it('creates lord with correct stats', () => {
      const hero = createHero(HeroType.LORD, { x: 10, y: 10 });
      expect(hero.hp).toBe(150);
    });

    it('creates unique ids', () => {
      const h1 = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      const h2 = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      expect(h1.id).not.toBe(h2.id);
    });
  });

  describe('getHeroStats', () => {
    it('returns peasant stats', () => {
      const stats = getHeroStats(HeroType.PEASANT);
      expect(stats.hp).toBe(30);
      expect(stats.atk).toBe(8);
      expect(stats.spd).toBe(2.0);
      expect(stats.gold).toBe(50);
      expect(stats.range).toBe(1);
    });

    it('returns archer stats with range 3', () => {
      const stats = getHeroStats(HeroType.ARCHER);
      expect(stats.range).toBe(3);
    });

    it('returns wizard stats with range 3', () => {
      const stats = getHeroStats(HeroType.WIZARD);
      expect(stats.range).toBe(3);
    });
  });

  describe('getHeroAttack', () => {
    it('returns correct attack for peasant', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      expect(getHeroAttack(hero)).toBe(8);
    });

    it('returns correct attack for knight', () => {
      const hero = createHero(HeroType.KNIGHT, { x: 10, y: 10 });
      expect(getHeroAttack(hero)).toBe(20);
    });
  });

  describe('getHeroSpeed', () => {
    it('returns correct speed for peasant', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      expect(getHeroSpeed(hero)).toBe(2.0);
    });

    it('returns correct speed for knight', () => {
      const hero = createHero(HeroType.KNIGHT, { x: 10, y: 10 });
      expect(getHeroSpeed(hero)).toBe(1.0);
    });
  });

  describe('getHeroRange', () => {
    it('returns 1 for melee heroes', () => {
      const peasant = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      const knight = createHero(HeroType.KNIGHT, { x: 10, y: 10 });
      expect(getHeroRange(peasant)).toBe(1);
      expect(getHeroRange(knight)).toBe(1);
    });

    it('returns 3 for ranged heroes', () => {
      const archer = createHero(HeroType.ARCHER, { x: 10, y: 10 });
      const wizard = createHero(HeroType.WIZARD, { x: 10, y: 10 });
      expect(getHeroRange(archer)).toBe(3);
      expect(getHeroRange(wizard)).toBe(3);
    });
  });

  describe('getHeroGold', () => {
    it('returns correct gold for each type', () => {
      expect(getHeroGold(createHero(HeroType.PEASANT, { x: 0, y: 0 }))).toBe(50);
      expect(getHeroGold(createHero(HeroType.ARCHER, { x: 0, y: 0 }))).toBe(100);
      expect(getHeroGold(createHero(HeroType.KNIGHT, { x: 0, y: 0 }))).toBe(200);
      expect(getHeroGold(createHero(HeroType.WIZARD, { x: 0, y: 0 }))).toBe(300);
      expect(getHeroGold(createHero(HeroType.LORD, { x: 0, y: 0 }))).toBe(500);
    });
  });

  describe('determineBehavior', () => {
    it('returns FLEEING when low HP', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      hero.hp = hero.maxHp * 0.1;
      expect(determineBehavior(hero, false)).toBe(HeroBehavior.FLEEING);
    });

    it('returns ATTACKING when enemy in range and has target', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      hero.targetId = 'creature-1';
      expect(determineBehavior(hero, true)).toBe(HeroBehavior.ATTACKING);
    });

    it('returns ENTERING when no conditions met', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      expect(determineBehavior(hero, false)).toBe(HeroBehavior.ENTERING);
    });

    it('prioritizes fleeing over attacking', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      hero.hp = hero.maxHp * 0.1;
      hero.targetId = 'creature-1';
      expect(determineBehavior(hero, true)).toBe(HeroBehavior.FLEEING);
    });
  });

  describe('updateBehavior', () => {
    it('sets behavior', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      updateBehavior(hero, HeroBehavior.ATTACKING);
      expect(hero.behavior).toBe(HeroBehavior.ATTACKING);
    });
  });

  describe('chooseTarget', () => {
    it('returns null with no targets', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      expect(chooseTarget(hero, [], null)).toBeNull();
    });

    it('targets creature in range', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      const creature: Entity = {
        id: 'c1',
        pos: { x: 11, y: 10 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 0,
      };
      expect(chooseTarget(hero, [creature], null)).toBe('c1');
    });

    it('does not target creature out of range', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      const creature: Entity = {
        id: 'c1',
        pos: { x: 15, y: 10 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 0,
      };
      expect(chooseTarget(hero, [creature], null)).toBeNull();
    });

    it('targets heart when in range and no creatures', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      const heart: Entity = {
        id: 'heart',
        pos: { x: 11, y: 10 },
        hp: 100,
        maxHp: 100,
        lastAttackTime: 0,
      };
      expect(chooseTarget(hero, [], heart)).toBe('heart');
    });

    it('prioritizes heart over creatures (per spec)', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      const creature: Entity = {
        id: 'c1',
        pos: { x: 11, y: 10 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 0,
      };
      const heart: Entity = {
        id: 'heart',
        pos: { x: 11, y: 10 },
        hp: 100,
        maxHp: 100,
        lastAttackTime: 0,
      };
      // Spec says: Prioritize: Heart > Creatures > Rooms
      expect(chooseTarget(hero, [creature], heart)).toBe('heart');
    });

    it('skips dead creatures', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      const deadCreature: Entity = {
        id: 'c1',
        pos: { x: 11, y: 10 },
        hp: 0,
        maxHp: 10,
        lastAttackTime: 0,
      };
      expect(chooseTarget(hero, [deadCreature], null)).toBeNull();
    });

    it('ranged hero targets at range 3', () => {
      const hero = createHero(HeroType.ARCHER, { x: 10, y: 10 });
      const creature: Entity = {
        id: 'c1',
        pos: { x: 13, y: 10 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 0,
      };
      expect(chooseTarget(hero, [creature], null)).toBe('c1');
    });
  });

  describe('findNearestTarget', () => {
    it('returns null with no targets', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      expect(findNearestTarget(hero, [], null)).toBeNull();
    });

    it('returns nearest creature', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      const far: Entity = {
        id: 'far',
        pos: { x: 20, y: 10 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 0,
      };
      const near: Entity = {
        id: 'near',
        pos: { x: 12, y: 10 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 0,
      };
      expect(findNearestTarget(hero, [far, near], null)?.id).toBe('near');
    });

    it('returns heart if closer than creatures', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      const creature: Entity = {
        id: 'c1',
        pos: { x: 20, y: 10 },
        hp: 10,
        maxHp: 10,
        lastAttackTime: 0,
      };
      const heart: Entity = {
        id: 'heart',
        pos: { x: 11, y: 10 },
        hp: 100,
        maxHp: 100,
        lastAttackTime: 0,
      };
      expect(findNearestTarget(hero, [creature], heart)?.id).toBe('heart');
    });
  });

  describe('setHeroTarget', () => {
    it('sets target id', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      setHeroTarget(hero, 'creature-1');
      expect(hero.targetId).toBe('creature-1');
    });
  });

  describe('canAttack', () => {
    it('returns true when cooldown elapsed', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      hero.lastAttackTime = 0;
      expect(canAttack(hero, 2)).toBe(true);
    });

    it('returns false when on cooldown', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      hero.lastAttackTime = 1;
      expect(canAttack(hero, 1.5)).toBe(false);
    });
  });

  describe('recordAttack', () => {
    it('updates lastAttackTime', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      recordAttack(hero, 5.5);
      expect(hero.lastAttackTime).toBe(5.5);
    });
  });

  describe('isRanged', () => {
    it('returns false for melee heroes', () => {
      expect(isRanged(createHero(HeroType.PEASANT, { x: 0, y: 0 }))).toBe(false);
      expect(isRanged(createHero(HeroType.KNIGHT, { x: 0, y: 0 }))).toBe(false);
    });

    it('returns true for ranged heroes', () => {
      expect(isRanged(createHero(HeroType.ARCHER, { x: 0, y: 0 }))).toBe(true);
      expect(isRanged(createHero(HeroType.WIZARD, { x: 0, y: 0 }))).toBe(true);
    });
  });

  describe('wantsToFlee', () => {
    it('returns true when HP below threshold', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      hero.hp = hero.maxHp * (FLEE_HP_THRESHOLD - 0.01);
      expect(wantsToFlee(hero)).toBe(true);
    });

    it('returns false when HP at or above threshold', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      hero.hp = hero.maxHp * FLEE_HP_THRESHOLD;
      expect(wantsToFlee(hero)).toBe(false);
    });
  });

  describe('isDead', () => {
    it('returns true when HP is 0', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      hero.hp = 0;
      expect(isDead(hero)).toBe(true);
    });

    it('returns true when HP is negative', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      hero.hp = -5;
      expect(isDead(hero)).toBe(true);
    });

    it('returns false when HP is positive', () => {
      const hero = createHero(HeroType.PEASANT, { x: 10, y: 10 });
      expect(isDead(hero)).toBe(false);
    });
  });
});
