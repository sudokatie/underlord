import { Hero, HeroType, Position, Tile, TileType } from './types';
import { createHero } from './Hero';
import { HERO_STATS, GRID_WIDTH, WAVE_INTERVAL, WAVE_WARNING } from './constants';

/**
 * Generate wave composition for a given wave number.
 * Returns array of hero types to spawn.
 */
export function createWave(waveNumber: number): HeroType[] {
  const heroes: HeroType[] = [];

  // Base peasants: wave + 1
  const peasantCount = waveNumber + 1;
  for (let i = 0; i < peasantCount; i++) {
    heroes.push(HeroType.PEASANT);
  }

  // Add archers starting wave 2
  if (waveNumber >= 2) {
    const archerCount = Math.floor((waveNumber - 1) / 2) + 1;
    for (let i = 0; i < Math.min(archerCount, 3); i++) {
      heroes.push(HeroType.ARCHER);
    }
  }

  // Add knights starting wave 3
  if (waveNumber >= 3) {
    const knightCount = Math.floor((waveNumber - 2) / 2) + 1;
    for (let i = 0; i < Math.min(knightCount, 2); i++) {
      heroes.push(HeroType.KNIGHT);
    }
  }

  // Add wizards starting wave 4
  if (waveNumber >= 4) {
    const wizardCount = Math.floor((waveNumber - 3) / 2) + 1;
    for (let i = 0; i < Math.min(wizardCount, 2); i++) {
      heroes.push(HeroType.WIZARD);
    }
  }

  // Add lord starting wave 5 (one per wave)
  if (waveNumber >= 5) {
    heroes.push(HeroType.LORD);
  }

  return heroes;
}

/**
 * Get spawn positions at map edges.
 * Returns positions where heroes can spawn (top edge).
 */
export function getSpawnPositions(grid: Tile[][], count: number): Position[] {
  const positions: Position[] = [];
  const usedX = new Set<number>();

  // Spawn on top edge (y = 1, just inside border)
  // Find walkable positions or positions adjacent to walkable tiles
  for (let attempt = 0; attempt < count * 10 && positions.length < count; attempt++) {
    const x = 2 + Math.floor(Math.random() * (GRID_WIDTH - 4));

    if (usedX.has(x)) continue;

    // Check if we can spawn here (dirt or floor is fine for heroes entering)
    const tile = grid[1][x];
    if (tile && tile.type !== TileType.ROCK && tile.type !== TileType.WATER && tile.type !== TileType.LAVA) {
      positions.push({ x, y: 1 });
      usedX.add(x);
    }
  }

  // If we couldn't find enough positions, fill with whatever we can
  while (positions.length < count) {
    const x = 2 + positions.length;
    positions.push({ x, y: 1 });
  }

  return positions;
}

/**
 * Spawn heroes for a wave.
 * Returns array of created heroes.
 */
export function spawnWave(
  waveNumber: number,
  grid: Tile[][]
): Hero[] {
  const heroTypes = createWave(waveNumber);
  const positions = getSpawnPositions(grid, heroTypes.length);
  const heroes: Hero[] = [];

  for (let i = 0; i < heroTypes.length; i++) {
    const hero = createHero(heroTypes[i], positions[i]);
    heroes.push(hero);
  }

  return heroes;
}

/**
 * Get time until next wave.
 */
export function getTimeTilNextWave(waveTimer: number): number {
  return Math.max(0, WAVE_INTERVAL - waveTimer);
}

/**
 * Check if wave warning should show.
 */
export function shouldShowWarning(waveTimer: number): boolean {
  const timeTilWave = getTimeTilNextWave(waveTimer);
  return timeTilWave <= WAVE_WARNING && timeTilWave > 0;
}

/**
 * Check if it's time to spawn a wave.
 */
export function shouldSpawnWave(waveTimer: number): boolean {
  return waveTimer >= WAVE_INTERVAL;
}

/**
 * Get total hero count for a wave.
 */
export function getWaveHeroCount(waveNumber: number): number {
  return createWave(waveNumber).length;
}

/**
 * Get wave difficulty estimate (sum of hero gold values).
 */
export function getWaveDifficulty(waveNumber: number): number {
  const heroes = createWave(waveNumber);
  return heroes.reduce((sum, type) => sum + HERO_STATS[type].gold, 0);
}
