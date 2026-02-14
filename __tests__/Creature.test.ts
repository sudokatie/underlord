import {
  createCreature,
  getCreatureStats,
  getCreatureAttack,
  getCreatureSpeed,
  getCreatureRange,
  updateNeeds,
  determineBehavior,
  updateBehavior,
  levelUp,
  feedCreature,
  payCreature,
  isHungry,
  wantsToFlee,
  findNearestEnemy,
  setCreatureTarget,
  canAttack,
  recordAttack,
  resetCreatureIdCounter,
  trainCreature,
} from '../src/game/Creature';
import { CreatureType, CreatureBehavior, Entity } from '../src/game/types';
import { CREATURE_STATS, HUNGER_THRESHOLD, FLEE_HP_THRESHOLD } from '../src/game/constants';

describe('Creature', () => {
  beforeEach(() => {
    resetCreatureIdCounter();
  });

  describe('createCreature', () => {
    it('creates beetle with correct stats', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      expect(creature.type).toBe(CreatureType.BEETLE);
      expect(creature.hp).toBe(40);
      expect(creature.maxHp).toBe(40);
      expect(creature.pos).toEqual({ x: 10, y: 10 });
      expect(creature.behavior).toBe(CreatureBehavior.IDLE);
      expect(creature.level).toBe(1);
    });

    it('creates orc with correct stats', () => {
      const creature = createCreature(CreatureType.ORC, { x: 10, y: 10 });
      expect(creature.hp).toBe(60);
      expect(creature.maxHp).toBe(60);
    });

    it('creates warlock with correct stats', () => {
      const creature = createCreature(CreatureType.WARLOCK, { x: 10, y: 10 });
      expect(creature.hp).toBe(35);
      expect(creature.maxHp).toBe(35);
    });

    it('creates troll with correct stats', () => {
      const creature = createCreature(CreatureType.TROLL, { x: 10, y: 10 });
      expect(creature.hp).toBe(80);
    });

    it('creates dark angel with correct stats', () => {
      const creature = createCreature(CreatureType.DARK_ANGEL, { x: 10, y: 10 });
      expect(creature.hp).toBe(50);
    });

    it('starts with full hunger and happiness', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      expect(creature.hunger).toBe(100);
      expect(creature.happiness).toBe(100);
    });

    it('creates unique ids', () => {
      const c1 = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      const c2 = createCreature(CreatureType.ORC, { x: 10, y: 10 });
      expect(c1.id).not.toBe(c2.id);
    });
  });

  describe('getCreatureStats', () => {
    it('returns beetle stats', () => {
      const stats = getCreatureStats(CreatureType.BEETLE);
      expect(stats.hp).toBe(40);
      expect(stats.atk).toBe(10);
      expect(stats.spd).toBe(2.0);
      expect(stats.range).toBe(1);
    });

    it('returns warlock stats with range 3', () => {
      const stats = getCreatureStats(CreatureType.WARLOCK);
      expect(stats.range).toBe(3);
    });
  });

  describe('getCreatureAttack', () => {
    it('returns base attack at level 1', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      expect(getCreatureAttack(creature)).toBe(10);
    });

    it('returns increased attack at level 2', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.level = 2;
      // 10 * 1.1 = 11
      expect(getCreatureAttack(creature)).toBe(11);
    });

    it('returns increased attack at level 5', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.level = 5;
      // 10 * 1.4 = 14
      expect(getCreatureAttack(creature)).toBe(14);
    });
  });

  describe('getCreatureSpeed', () => {
    it('returns correct speed for beetle', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      expect(getCreatureSpeed(creature)).toBe(2.0);
    });

    it('returns correct speed for imp', () => {
      const creature = createCreature(CreatureType.IMP, { x: 10, y: 10 });
      expect(getCreatureSpeed(creature)).toBe(3.0);
    });
  });

  describe('getCreatureRange', () => {
    it('returns 1 for melee creatures', () => {
      const beetle = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      const orc = createCreature(CreatureType.ORC, { x: 10, y: 10 });
      expect(getCreatureRange(beetle)).toBe(1);
      expect(getCreatureRange(orc)).toBe(1);
    });

    it('returns 3 for ranged creatures', () => {
      const warlock = createCreature(CreatureType.WARLOCK, { x: 10, y: 10 });
      expect(getCreatureRange(warlock)).toBe(3);
    });
  });

  describe('updateNeeds', () => {
    it('decreases hunger over time', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.hunger = 100;
      updateNeeds(creature, 10); // 10 seconds
      expect(creature.hunger).toBe(90);
    });

    it('does not go below 0 hunger', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.hunger = 5;
      updateNeeds(creature, 10);
      expect(creature.hunger).toBe(0);
    });

    it('decreases happiness slowly', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.happiness = 100;
      updateNeeds(creature, 10);
      expect(creature.happiness).toBeLessThan(100);
    });
  });

  describe('determineBehavior', () => {
    it('returns FLEEING when low HP', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.hp = creature.maxHp * 0.1; // 10% HP
      expect(determineBehavior(creature, false, false)).toBe(CreatureBehavior.FLEEING);
    });

    it('returns FIGHTING when enemy nearby and has target', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.targetId = 'enemy-1';
      expect(determineBehavior(creature, true, false)).toBe(CreatureBehavior.FIGHTING);
    });

    it('returns EATING when hungry and food available', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.hunger = HUNGER_THRESHOLD - 1;
      expect(determineBehavior(creature, false, true)).toBe(CreatureBehavior.EATING);
    });

    it('returns IDLE when no conditions met', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      expect(determineBehavior(creature, false, false)).toBe(CreatureBehavior.IDLE);
    });

    it('prioritizes fleeing over fighting', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.hp = creature.maxHp * 0.1;
      creature.targetId = 'enemy-1';
      expect(determineBehavior(creature, true, false)).toBe(CreatureBehavior.FLEEING);
    });
  });

  describe('updateBehavior', () => {
    it('sets behavior', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      updateBehavior(creature, CreatureBehavior.FIGHTING);
      expect(creature.behavior).toBe(CreatureBehavior.FIGHTING);
    });
  });

  describe('levelUp', () => {
    it('increases level', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      levelUp(creature);
      expect(creature.level).toBe(2);
    });

    it('increases maxHp by 10%', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      const originalMax = creature.maxHp;
      levelUp(creature);
      expect(creature.maxHp).toBe(originalMax + Math.floor(originalMax * 0.1));
    });

    it('heals to full on level up', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.hp = 10;
      levelUp(creature);
      expect(creature.hp).toBe(creature.maxHp);
    });
  });

  describe('feedCreature', () => {
    it('increases hunger', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.hunger = 50;
      feedCreature(creature);
      expect(creature.hunger).toBe(80); // +30 default
    });

    it('caps at 100', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.hunger = 90;
      feedCreature(creature, 30);
      expect(creature.hunger).toBe(100);
    });
  });

  describe('payCreature', () => {
    it('increases happiness', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.happiness = 50;
      payCreature(creature);
      expect(creature.happiness).toBe(70); // +20 default
    });

    it('caps at 100', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.happiness = 90;
      payCreature(creature, 30);
      expect(creature.happiness).toBe(100);
    });
  });

  describe('isHungry', () => {
    it('returns true when below threshold', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.hunger = HUNGER_THRESHOLD - 1;
      expect(isHungry(creature)).toBe(true);
    });

    it('returns false when at or above threshold', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.hunger = HUNGER_THRESHOLD;
      expect(isHungry(creature)).toBe(false);
    });
  });

  describe('wantsToFlee', () => {
    it('returns true when HP below threshold', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.hp = creature.maxHp * (FLEE_HP_THRESHOLD - 0.01);
      expect(wantsToFlee(creature)).toBe(true);
    });

    it('returns false when HP at or above threshold', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.hp = creature.maxHp * FLEE_HP_THRESHOLD;
      expect(wantsToFlee(creature)).toBe(false);
    });
  });

  describe('findNearestEnemy', () => {
    it('returns null for empty enemies', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      expect(findNearestEnemy(creature, [])).toBeNull();
    });

    it('returns nearest enemy', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      const enemies: Entity[] = [
        { id: 'e1', pos: { x: 15, y: 10 }, hp: 10, maxHp: 10, lastAttackTime: 0 },
        { id: 'e2', pos: { x: 11, y: 10 }, hp: 10, maxHp: 10, lastAttackTime: 0 },
      ];
      const nearest = findNearestEnemy(creature, enemies);
      expect(nearest?.id).toBe('e2');
    });

    it('skips dead enemies', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      const enemies: Entity[] = [
        { id: 'e1', pos: { x: 11, y: 10 }, hp: 0, maxHp: 10, lastAttackTime: 0 },
        { id: 'e2', pos: { x: 15, y: 10 }, hp: 10, maxHp: 10, lastAttackTime: 0 },
      ];
      const nearest = findNearestEnemy(creature, enemies);
      expect(nearest?.id).toBe('e2');
    });
  });

  describe('setCreatureTarget', () => {
    it('sets target id', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      setCreatureTarget(creature, 'enemy-1');
      expect(creature.targetId).toBe('enemy-1');
    });

    it('allows null target', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.targetId = 'enemy-1';
      setCreatureTarget(creature, null);
      expect(creature.targetId).toBeNull();
    });
  });

  describe('canAttack', () => {
    it('returns true when cooldown elapsed', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.lastAttackTime = 0;
      // Beetle speed 2.0, cooldown = 3/2 = 1.5s
      expect(canAttack(creature, 2)).toBe(true);
    });

    it('returns false when on cooldown', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      creature.lastAttackTime = 1;
      expect(canAttack(creature, 1.5)).toBe(false);
    });
  });

  describe('recordAttack', () => {
    it('updates lastAttackTime', () => {
      const creature = createCreature(CreatureType.BEETLE, { x: 10, y: 10 });
      recordAttack(creature, 5.5);
      expect(creature.lastAttackTime).toBe(5.5);
    });
  });

  describe('trainCreature', () => {
  it('adds training progress', () => {
    const creature = createCreature(CreatureType.ORC, { x: 10, y: 10 });
    expect(creature.trainingProgress).toBe(0);
    trainCreature(creature, 25);
    expect(creature.trainingProgress).toBe(25);
  });

  it('levels up when progress reaches 100', () => {
    const creature = createCreature(CreatureType.ORC, { x: 10, y: 10 });
    expect(creature.level).toBe(1);
    const leveledUp = trainCreature(creature, 100);
    expect(leveledUp).toBe(true);
    expect(creature.level).toBe(2);
    expect(creature.trainingProgress).toBe(0);
  });

  it('accumulates progress over multiple calls', () => {
    const creature = createCreature(CreatureType.ORC, { x: 10, y: 10 });
    trainCreature(creature, 40);
    trainCreature(creature, 40);
    expect(creature.trainingProgress).toBe(80);
    const leveledUp = trainCreature(creature, 30);
    expect(leveledUp).toBe(true);
    expect(creature.level).toBe(2);
    expect(creature.trainingProgress).toBe(0);
  });

  it('respects max level', () => {
    const creature = createCreature(CreatureType.ORC, { x: 10, y: 10 });
    creature.level = 10;
    const leveledUp = trainCreature(creature, 100, 10);
    expect(leveledUp).toBe(false);
    expect(creature.level).toBe(10);
  });

  it('returns false when not leveling up', () => {
    const creature = createCreature(CreatureType.ORC, { x: 10, y: 10 });
    const leveledUp = trainCreature(creature, 50);
    expect(leveledUp).toBe(false);
  });
  });
});
