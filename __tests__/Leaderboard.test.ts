/**
 * @jest-environment jsdom
 */

import {
  getLeaderboard,
  addEntry,
  getTop,
  wouldRank,
  getRank,
  clearLeaderboard
} from '../src/game/Leaderboard';

describe('Leaderboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return empty array when no entries', () => {
    expect(getLeaderboard()).toEqual([]);
  });

  it('should add an entry', () => {
    const entry = {
      name: 'DarkLord',
      score: 10000,
      wavesDefeated: 25,
      creaturesRecruited: 50,
      maxGold: 8000,
      date: new Date().toISOString()
    };
    const entries = addEntry(entry);
    expect(entries[0].score).toBe(10000);
  });

  it('should sort by score descending', () => {
    addEntry({ name: 'Low', score: 3000, wavesDefeated: 8, creaturesRecruited: 15, maxGold: 2000, date: '2026-01-01' });
    addEntry({ name: 'High', score: 20000, wavesDefeated: 40, creaturesRecruited: 80, maxGold: 15000, date: '2026-01-02' });
    addEntry({ name: 'Mid', score: 10000, wavesDefeated: 20, creaturesRecruited: 40, maxGold: 7000, date: '2026-01-03' });

    const top = getTop();
    expect(top[0].name).toBe('High');
    expect(top[1].name).toBe('Mid');
    expect(top[2].name).toBe('Low');
  });

  it('should limit to max entries', () => {
    for (let i = 0; i < 15; i++) {
      addEntry({ name: `E${i}`, score: i * 1500, wavesDefeated: i * 3, creaturesRecruited: i * 5, maxGold: i * 1000, date: '2026-01-01' });
    }
    expect(getTop().length).toBe(10);
  });

  it('should persist to localStorage', () => {
    addEntry({ name: 'Saved', score: 7000, wavesDefeated: 15, creaturesRecruited: 30, maxGold: 5000, date: '2026-01-01' });
    const stored = JSON.parse(localStorage.getItem('underlord-leaderboard')!);
    expect(stored[0].name).toBe('Saved');
  });

  it('should check if score would rank', () => {
    addEntry({ name: 'First', score: 12000, wavesDefeated: 28, creaturesRecruited: 55, maxGold: 9000, date: '2026-01-01' });
    expect(wouldRank(15000)).toBe(1);
    expect(wouldRank(6000)).toBe(2);
  });

  it('should get rank by score', () => {
    addEntry({ name: 'First', score: 12000, wavesDefeated: 28, creaturesRecruited: 55, maxGold: 9000, date: '2026-01-01' });
    addEntry({ name: 'Second', score: 8000, wavesDefeated: 18, creaturesRecruited: 35, maxGold: 6000, date: '2026-01-02' });
    expect(getRank(12000)).toBe(1);
    expect(getRank(8000)).toBe(2);
    expect(getRank(99999)).toBeNull();
  });

  it('should clear all data', () => {
    addEntry({ name: 'Gone', score: 4000, wavesDefeated: 10, creaturesRecruited: 20, maxGold: 3000, date: '2026-01-01' });
    clearLeaderboard();
    expect(getLeaderboard().length).toBe(0);
  });

  it('should track dungeon stats', () => {
    addEntry({ name: 'Keeper', score: 11000, wavesDefeated: 26, creaturesRecruited: 52, maxGold: 8500, date: '2026-01-01' });
    const entry = getTop()[0];
    expect(entry.wavesDefeated).toBe(26);
    expect(entry.creaturesRecruited).toBe(52);
    expect(entry.maxGold).toBe(8500);
  });
});
