import {
  createWave,
  getSpawnPositions,
  spawnWave,
  getTimeTilNextWave,
  shouldShowWarning,
  shouldSpawnWave,
  getWaveHeroCount,
  getWaveDifficulty,
} from '../src/game/Wave';
import { createGrid } from '../src/game/Grid';
import { resetHeroIdCounter } from '../src/game/Hero';
import { HeroType, HeroBehavior } from '../src/game/types';
import { WAVE_INTERVAL, WAVE_WARNING, HERO_STATS } from '../src/game/constants';

describe('Wave', () => {
  beforeEach(() => {
    resetHeroIdCounter();
  });

  describe('createWave', () => {
    it('wave 1 has 2 peasants', () => {
      const heroes = createWave(1);
      expect(heroes.filter((h) => h === HeroType.PEASANT).length).toBe(2);
      expect(heroes.length).toBe(2);
    });

    it('wave 2 has 3 peasants and 1 archer', () => {
      const heroes = createWave(2);
      expect(heroes.filter((h) => h === HeroType.PEASANT).length).toBe(3);
      expect(heroes.filter((h) => h === HeroType.ARCHER).length).toBe(1);
    });

    it('wave 3 has peasants, archers, and knights', () => {
      const heroes = createWave(3);
      expect(heroes.filter((h) => h === HeroType.PEASANT).length).toBe(4);
      expect(heroes.filter((h) => h === HeroType.ARCHER).length).toBeGreaterThanOrEqual(1);
      expect(heroes.filter((h) => h === HeroType.KNIGHT).length).toBeGreaterThanOrEqual(1);
    });

    it('wave 4 includes wizards', () => {
      const heroes = createWave(4);
      expect(heroes.filter((h) => h === HeroType.WIZARD).length).toBeGreaterThanOrEqual(1);
    });

    it('wave 5 includes a lord', () => {
      const heroes = createWave(5);
      expect(heroes.filter((h) => h === HeroType.LORD).length).toBe(1);
    });

    it('wave 7 includes a lord', () => {
      const heroes = createWave(7);
      expect(heroes.filter((h) => h === HeroType.LORD).length).toBe(1);
    });

    it('wave counts increase with wave number', () => {
      const wave3Count = createWave(3).length;
      const wave5Count = createWave(5).length;
      const wave7Count = createWave(7).length;
      expect(wave5Count).toBeGreaterThan(wave3Count);
      expect(wave7Count).toBeGreaterThan(wave5Count);
    });
  });

  describe('getSpawnPositions', () => {
    it('returns requested number of positions', () => {
      const grid = createGrid();
      const positions = getSpawnPositions(grid, 5);
      expect(positions.length).toBe(5);
    });

    it('positions are at top edge (y = 1)', () => {
      const grid = createGrid();
      const positions = getSpawnPositions(grid, 3);
      for (const pos of positions) {
        expect(pos.y).toBe(1);
      }
    });

    it('positions have unique x values', () => {
      const grid = createGrid();
      const positions = getSpawnPositions(grid, 5);
      const xValues = positions.map((p) => p.x);
      const uniqueX = new Set(xValues);
      expect(uniqueX.size).toBe(5);
    });

    it('positions are within grid bounds', () => {
      const grid = createGrid();
      const positions = getSpawnPositions(grid, 10);
      for (const pos of positions) {
        expect(pos.x).toBeGreaterThanOrEqual(2);
        expect(pos.x).toBeLessThan(38);
      }
    });
  });

  describe('spawnWave', () => {
    it('creates correct number of heroes', () => {
      const grid = createGrid();
      const heroes = spawnWave(1, grid);
      expect(heroes.length).toBe(2); // Wave 1 = 2 peasants
    });

    it('heroes have correct types', () => {
      const grid = createGrid();
      const heroes = spawnWave(1, grid);
      for (const hero of heroes) {
        expect(hero.type).toBe(HeroType.PEASANT);
      }
    });

    it('heroes have ENTERING behavior', () => {
      const grid = createGrid();
      const heroes = spawnWave(1, grid);
      for (const hero of heroes) {
        expect(hero.behavior).toBe(HeroBehavior.ENTERING);
      }
    });

    it('heroes have unique positions', () => {
      const grid = createGrid();
      const heroes = spawnWave(3, grid);
      const positions = heroes.map((h) => `${h.pos.x},${h.pos.y}`);
      const unique = new Set(positions);
      expect(unique.size).toBe(heroes.length);
    });

    it('heroes have unique ids', () => {
      const grid = createGrid();
      const heroes = spawnWave(3, grid);
      const ids = heroes.map((h) => h.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(heroes.length);
    });
  });

  describe('getTimeTilNextWave', () => {
    it('returns full interval at timer 0', () => {
      expect(getTimeTilNextWave(0)).toBe(WAVE_INTERVAL);
    });

    it('returns remaining time correctly', () => {
      expect(getTimeTilNextWave(60)).toBe(WAVE_INTERVAL - 60);
    });

    it('returns 0 when timer exceeds interval', () => {
      expect(getTimeTilNextWave(WAVE_INTERVAL + 10)).toBe(0);
    });
  });

  describe('shouldShowWarning', () => {
    it('returns false when far from wave', () => {
      expect(shouldShowWarning(0)).toBe(false);
    });

    it('returns true when within warning time', () => {
      // At WAVE_INTERVAL - WAVE_WARNING + 1, we should show warning
      expect(shouldShowWarning(WAVE_INTERVAL - WAVE_WARNING + 1)).toBe(true);
    });

    it('returns false when wave is due', () => {
      expect(shouldShowWarning(WAVE_INTERVAL)).toBe(false);
    });
  });

  describe('shouldSpawnWave', () => {
    it('returns false before interval', () => {
      expect(shouldSpawnWave(WAVE_INTERVAL - 1)).toBe(false);
    });

    it('returns true at interval', () => {
      expect(shouldSpawnWave(WAVE_INTERVAL)).toBe(true);
    });

    it('returns true after interval', () => {
      expect(shouldSpawnWave(WAVE_INTERVAL + 10)).toBe(true);
    });
  });

  describe('getWaveHeroCount', () => {
    it('returns correct count for wave 1', () => {
      expect(getWaveHeroCount(1)).toBe(2);
    });

    it('returns correct count for wave 5', () => {
      const count = getWaveHeroCount(5);
      expect(count).toBeGreaterThan(5);
    });
  });

  describe('getWaveDifficulty', () => {
    it('returns sum of hero gold values', () => {
      // Wave 1: 2 peasants = 2 * 50 = 100
      expect(getWaveDifficulty(1)).toBe(100);
    });

    it('difficulty increases with wave number', () => {
      const diff3 = getWaveDifficulty(3);
      const diff5 = getWaveDifficulty(5);
      expect(diff5).toBeGreaterThan(diff3);
    });
  });
});
