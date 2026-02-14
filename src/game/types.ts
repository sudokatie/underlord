// Enums
export enum TileType {
  ROCK = 'ROCK',
  DIRT = 'DIRT',
  FLOOR = 'FLOOR',
  WATER = 'WATER',
  LAVA = 'LAVA',
}

export enum RoomType {
  NONE = 'NONE',
  LAIR = 'LAIR',
  HATCHERY = 'HATCHERY',
  LIBRARY = 'LIBRARY',
  TRAINING = 'TRAINING',
  TREASURY = 'TREASURY',
  WORKSHOP = 'WORKSHOP',
  PRISON = 'PRISON',
  TORTURE = 'TORTURE',
}

export enum CreatureType {
  IMP = 'IMP',
  BEETLE = 'BEETLE',
  ORC = 'ORC',
  WARLOCK = 'WARLOCK',
  TROLL = 'TROLL',
  DARK_ANGEL = 'DARK_ANGEL',
}

export enum HeroType {
  PEASANT = 'PEASANT',
  ARCHER = 'ARCHER',
  KNIGHT = 'KNIGHT',
  WIZARD = 'WIZARD',
  LORD = 'LORD',
}

export enum TaskType {
  IDLE = 'IDLE',
  DIG = 'DIG',
  CLAIM = 'CLAIM',
  HAUL = 'HAUL',
  FORTIFY = 'FORTIFY',
}

export enum CreatureBehavior {
  IDLE = 'IDLE',
  WORKING = 'WORKING',
  EATING = 'EATING',
  FIGHTING = 'FIGHTING',
  FLEEING = 'FLEEING',
}

export enum HeroBehavior {
  ENTERING = 'ENTERING',
  ATTACKING = 'ATTACKING',
  FLEEING = 'FLEEING',
}

export enum GameScreen {
  TITLE = 'TITLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

// Interfaces
export interface Position {
  x: number;
  y: number;
}

export interface Tile {
  type: TileType;
  room: RoomType;
  owner: boolean;
  goldSeam: boolean;
}

export interface Room {
  type: RoomType;
  tiles: Position[];
  efficiency: number;
}

export interface Entity {
  id: string;
  pos: Position;
  hp: number;
  maxHp: number;
  lastAttackTime: number;
}

export interface Imp extends Entity {
  task: TaskType;
  target: Position | null;
  carrying: number;
  path: Position[];
}

export interface Creature extends Entity {
  type: CreatureType;
  behavior: CreatureBehavior;
  hunger: number;
  happiness: number;
  level: number;
  targetId: string | null;
  trainingProgress: number; // 0-100, levels up at 100
}

export interface Hero extends Entity {
  type: HeroType;
  behavior: HeroBehavior;
  targetId: string | null;
}

export interface DungeonHeart extends Entity {
  // Heart is just an entity with no additional properties
  readonly _brand?: 'DungeonHeart';
}

export interface DigTask {
  pos: Position;
  assigned: boolean;
}

export interface DeadCreature {
  type: CreatureType;
  respawnTime: number;
  cost: number;
}

export interface Prisoner {
  heroType: HeroType;
  captureTime: number;
}

export interface GameState {
  screen: GameScreen;
  grid: Tile[][];
  rooms: Room[];
  imps: Imp[];
  creatures: Creature[];
  heroes: Hero[];
  heart: DungeonHeart;
  gold: number;
  maxGold: number;
  wave: number;
  waveTimer: number;
  gameTime: number;
  paused: boolean;
  messages: string[];
  digTasks: DigTask[];
  selectedRoom: RoomType;
  placementValid: boolean;
  hoverPos: Position | null;
  deadCreatures: DeadCreature[];
  prisoners: Prisoner[];
}
