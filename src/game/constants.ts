import { RoomType, CreatureType, HeroType } from './types';

// Grid
export const GRID_WIDTH = 40;
export const GRID_HEIGHT = 30;
export const TILE_SIZE = 24;
export const CANVAS_WIDTH = GRID_WIDTH * TILE_SIZE; // 960
export const CANVAS_HEIGHT = GRID_HEIGHT * TILE_SIZE; // 720

// Economy
export const STARTING_GOLD = 2000;
export const DIG_GOLD = 50;
export const GOLD_SEAM_VALUE = 200;
export const IMP_COST = 100;
export const DEFAULT_TREASURY_CAPACITY = 1000;
export const TREASURY_CAPACITY_PER_ROOM = 1000;
export const GOLD_SEAM_CHANCE = 0.05;

// Timing (seconds)
export const WAVE_INTERVAL = 120;
export const WAVE_WARNING = 30;
export const WAGE_INTERVAL = 60;
export const HEART_REGEN_DELAY = 5;

// Room costs
export const ROOM_COSTS: Record<RoomType, number> = {
  [RoomType.NONE]: 0,
  [RoomType.LAIR]: 500,
  [RoomType.HATCHERY]: 750,
  [RoomType.LIBRARY]: 1000,
  [RoomType.TRAINING]: 1000,
  [RoomType.TREASURY]: 250,
  [RoomType.WORKSHOP]: 1500,
  [RoomType.PRISON]: 750,
  [RoomType.TORTURE]: 1000,
};

// Room attractions
export const ROOM_ATTRACTS: Record<RoomType, CreatureType | null> = {
  [RoomType.NONE]: null,
  [RoomType.LAIR]: null,
  [RoomType.HATCHERY]: CreatureType.BEETLE,
  [RoomType.LIBRARY]: CreatureType.WARLOCK,
  [RoomType.TRAINING]: CreatureType.ORC,
  [RoomType.TREASURY]: null,
  [RoomType.WORKSHOP]: CreatureType.TROLL,
  [RoomType.PRISON]: null,
  [RoomType.TORTURE]: CreatureType.DARK_ANGEL,
};

// Room names for UI
export const ROOM_NAMES: Record<RoomType, string> = {
  [RoomType.NONE]: 'None',
  [RoomType.LAIR]: 'Lair',
  [RoomType.HATCHERY]: 'Hatchery',
  [RoomType.LIBRARY]: 'Library',
  [RoomType.TRAINING]: 'Training Room',
  [RoomType.TREASURY]: 'Treasury',
  [RoomType.WORKSHOP]: 'Workshop',
  [RoomType.PRISON]: 'Prison',
  [RoomType.TORTURE]: 'Torture Chamber',
};

// Creature stats
export const CREATURE_STATS: Record<
  CreatureType,
  { hp: number; atk: number; spd: number; cost: number; range: number }
> = {
  [CreatureType.IMP]: { hp: 20, atk: 5, spd: 3.0, cost: 0, range: 1 },
  [CreatureType.BEETLE]: { hp: 40, atk: 10, spd: 2.0, cost: 100, range: 1 },
  [CreatureType.ORC]: { hp: 60, atk: 15, spd: 1.5, cost: 200, range: 1 },
  [CreatureType.WARLOCK]: { hp: 35, atk: 25, spd: 1.0, cost: 300, range: 3 },
  [CreatureType.TROLL]: { hp: 80, atk: 12, spd: 1.0, cost: 250, range: 1 },
  [CreatureType.DARK_ANGEL]: { hp: 50, atk: 20, spd: 2.0, cost: 500, range: 1 },
};

// Hero stats
export const HERO_STATS: Record<
  HeroType,
  { hp: number; atk: number; spd: number; gold: number; minWave: number; range: number }
> = {
  [HeroType.PEASANT]: { hp: 30, atk: 8, spd: 2.0, gold: 50, minWave: 1, range: 1 },
  [HeroType.ARCHER]: { hp: 25, atk: 15, spd: 1.5, gold: 100, minWave: 2, range: 3 },
  [HeroType.KNIGHT]: { hp: 80, atk: 20, spd: 1.0, gold: 200, minWave: 3, range: 1 },
  [HeroType.WIZARD]: { hp: 40, atk: 30, spd: 1.0, gold: 300, minWave: 4, range: 3 },
  [HeroType.LORD]: { hp: 150, atk: 35, spd: 1.5, gold: 500, minWave: 5, range: 1 },
};

// Heart
export const HEART_HP = 1000;
export const HEART_REGEN = 1;

// Creature needs
export const HUNGER_DECAY_RATE = 1; // per second
export const HUNGER_THRESHOLD = 30; // go eat when below this
export const HAPPINESS_DECAY_RATE = 0.1; // per second without pay
export const FLEE_HP_THRESHOLD = 0.2; // flee when HP below 20%

// Starting values
export const STARTING_IMPS = 3;
export const HEART_CLEAR_RADIUS = 2; // 5x5 area (radius 2 from center)

// Death and respawn
export const CREATURE_RESPAWN_TIME = 30; // seconds
export const CREATURE_RESPAWN_COST_PERCENT = 0.5; // 50% of original cost
export const LAVA_DAMAGE_PER_SECOND = 10;
export const PRISON_CONVERT_TIME = 60; // seconds to convert prisoner
