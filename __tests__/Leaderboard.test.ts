// Tests for Underlord leaderboard

import {
  getLeaderboard,
  addEntry,
  getTop,
  wouldRank,
  getRank,
  clearLeaderboard,
  calculateScore,
  LeaderboardEntry,
} from '../src/game/Leaderboard';

// Mock localStorage for Node test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Leaderboard', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('getLeaderboard', () => {
    it('returns empty array when no entries', () => {
      expect(getLeaderboard()).toEqual([]);
    });

    it('returns stored entries', () => {
      const entry: LeaderboardEntry = {
        name: 'Dark Abyss',
        score: 8500,
        wavesDefeated: 10,
        creaturesRecruited: 15,
        maxGold: 5000,
        date: '2026-02-16',
      };
      addEntry(entry);
      expect(getLeaderboard()).toHaveLength(1);
      expect(getLeaderboard()[0].name).toBe('Dark Abyss');
    });
  });

  describe('addEntry', () => {
    it('adds entry to leaderboard', () => {
      const entry: LeaderboardEntry = {
        name: 'Shadow Keep',
        score: 5000,
        wavesDefeated: 5,
        creaturesRecruited: 10,
        maxGold: 3000,
        date: '2026-02-16',
      };
      const result = addEntry(entry);
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(5000);
    });

    it('sorts entries by score descending', () => {
      addEntry({ name: 'Weak', score: 2000, wavesDefeated: 2, creaturesRecruited: 5, maxGold: 1000, date: '2026-02-16' });
      addEntry({ name: 'Strong', score: 10000, wavesDefeated: 15, creaturesRecruited: 20, maxGold: 8000, date: '2026-02-16' });
      addEntry({ name: 'Medium', score: 5000, wavesDefeated: 8, creaturesRecruited: 12, maxGold: 4000, date: '2026-02-16' });
      
      const entries = getLeaderboard();
      expect(entries[0].name).toBe('Strong');
      expect(entries[1].name).toBe('Medium');
      expect(entries[2].name).toBe('Weak');
    });

    it('sorts by waves when scores equal', () => {
      addEntry({ name: 'FewWaves', score: 5000, wavesDefeated: 5, creaturesRecruited: 15, maxGold: 3000, date: '2026-02-16' });
      addEntry({ name: 'ManyWaves', score: 5000, wavesDefeated: 10, creaturesRecruited: 10, maxGold: 3000, date: '2026-02-16' });
      
      const entries = getLeaderboard();
      expect(entries[0].name).toBe('ManyWaves');
      expect(entries[1].name).toBe('FewWaves');
    });

    it('limits to 10 entries', () => {
      for (let i = 0; i < 15; i++) {
        addEntry({
          name: `Dungeon${i}`,
          score: i * 1000,
          wavesDefeated: i,
          creaturesRecruited: i + 3,
          maxGold: i * 500,
          date: '2026-02-16',
        });
      }
      expect(getLeaderboard()).toHaveLength(10);
    });
  });

  describe('getTop', () => {
    it('returns top N entries', () => {
      for (let i = 0; i < 5; i++) {
        addEntry({
          name: `Dungeon${i}`,
          score: (i + 1) * 2000,
          wavesDefeated: (i + 1) * 2,
          creaturesRecruited: (i + 1) * 3,
          maxGold: (i + 1) * 1000,
          date: '2026-02-16',
        });
      }
      const top3 = getTop(3);
      expect(top3).toHaveLength(3);
      expect(top3[0].score).toBe(10000);
    });
  });

  describe('wouldRank', () => {
    it('returns rank when board not full', () => {
      addEntry({ name: 'Test', score: 5000, wavesDefeated: 5, creaturesRecruited: 10, maxGold: 3000, date: '2026-02-16' });
      expect(wouldRank(8000)).toBe(1);
      expect(wouldRank(3000)).toBe(2);
    });

    it('returns null when would not rank on full board', () => {
      for (let i = 0; i < 10; i++) {
        addEntry({
          name: `Dungeon${i}`,
          score: (i + 1) * 1000,
          wavesDefeated: i + 1,
          creaturesRecruited: i + 3,
          maxGold: (i + 1) * 500,
          date: '2026-02-16',
        });
      }
      expect(wouldRank(500)).toBeNull();
    });
  });

  describe('getRank', () => {
    it('returns rank for existing score', () => {
      addEntry({ name: 'First', score: 10000, wavesDefeated: 15, creaturesRecruited: 20, maxGold: 8000, date: '2026-02-16' });
      addEntry({ name: 'Second', score: 5000, wavesDefeated: 8, creaturesRecruited: 12, maxGold: 4000, date: '2026-02-16' });
      const entries = getLeaderboard();
      expect(getRank(entries[0].score)).toBe(1);
      expect(getRank(entries[1].score)).toBe(2);
    });

    it('returns null for non-existent score', () => {
      addEntry({ name: 'Test', score: 5000, wavesDefeated: 5, creaturesRecruited: 10, maxGold: 3000, date: '2026-02-16' });
      expect(getRank(15000)).toBeNull();
    });
  });

  describe('clearLeaderboard', () => {
    it('removes all entries', () => {
      addEntry({ name: 'Test', score: 5000, wavesDefeated: 5, creaturesRecruited: 10, maxGold: 3000, date: '2026-02-16' });
      clearLeaderboard();
      expect(getLeaderboard()).toEqual([]);
    });
  });

  describe('calculateScore', () => {
    it('calculates score from dungeon stats', () => {
      // 10 waves * 500 = 5000
      // 15 creatures * 100 = 1500
      // 20 heroes * 50 = 1000
      // 5000 gold / 10 = 500
      // 8 rooms * 25 = 200
      // Total = 8200
      const score = calculateScore(10, 15, 20, 5000, 8);
      expect(score).toBe(8200);
    });

    it('handles early dungeon', () => {
      const score = calculateScore(1, 3, 2, 500, 2);
      expect(score).toBe(500 + 300 + 100 + 50 + 50); // 1000
    });

    it('handles dominant dungeon', () => {
      const score = calculateScore(25, 30, 100, 20000, 20);
      expect(score).toBe(12500 + 3000 + 5000 + 2000 + 500); // 23000
    });
  });
});
