import {
  getTileColor,
  getCreatureColor,
  getHeroColor,
} from '../src/components/Renderer';
import { TileType, CreatureType, HeroType } from '../src/game/types';

describe('Renderer', () => {
  describe('getTileColor', () => {
    it('returns color for ROCK', () => {
      expect(getTileColor(TileType.ROCK)).toBe('#1a1a2e');
    });

    it('returns color for DIRT', () => {
      expect(getTileColor(TileType.DIRT)).toBe('#4a3728');
    });

    it('returns color for FLOOR', () => {
      expect(getTileColor(TileType.FLOOR)).toBe('#3a3a4a');
    });

    it('returns color for WATER', () => {
      expect(getTileColor(TileType.WATER)).toBe('#1a4a6a');
    });

    it('returns color for LAVA', () => {
      expect(getTileColor(TileType.LAVA)).toBe('#8a2a1a');
    });
  });

  describe('getCreatureColor', () => {
    it('returns color for IMP', () => {
      expect(getCreatureColor(CreatureType.IMP)).toBe('#ff9900');
    });

    it('returns color for BEETLE', () => {
      expect(getCreatureColor(CreatureType.BEETLE)).toBe('#66aa33');
    });

    it('returns color for WARLOCK', () => {
      expect(getCreatureColor(CreatureType.WARLOCK)).toBe('#9933ff');
    });
  });

  describe('getHeroColor', () => {
    it('returns color for PEASANT', () => {
      expect(getHeroColor(HeroType.PEASANT)).toBe('#ccaa77');
    });

    it('returns color for KNIGHT', () => {
      expect(getHeroColor(HeroType.KNIGHT)).toBe('#aaaacc');
    });

    it('returns color for LORD', () => {
      expect(getHeroColor(HeroType.LORD)).toBe('#ffcc00');
    });
  });
});
