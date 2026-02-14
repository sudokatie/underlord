import {
  GameState,
  Tile,
  TileType,
  RoomType,
  Imp,
  Creature,
  Hero,
  DungeonHeart,
  CreatureType,
  HeroType,
  Position,
} from '../game/types';
import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_WIDTH, GRID_HEIGHT } from '../game/constants';

// Color schemes
const TILE_COLORS: Record<TileType, string> = {
  [TileType.ROCK]: '#1a1a2e',
  [TileType.DIRT]: '#4a3728',
  [TileType.FLOOR]: '#3a3a4a',
  [TileType.WATER]: '#1a4a6a',
  [TileType.LAVA]: '#8a2a1a',
};

const ROOM_COLORS: Record<RoomType, string> = {
  [RoomType.NONE]: 'transparent',
  [RoomType.LAIR]: '#2a2a4a',
  [RoomType.HATCHERY]: '#2a4a2a',
  [RoomType.LIBRARY]: '#4a2a4a',
  [RoomType.TRAINING]: '#4a3a2a',
  [RoomType.TREASURY]: '#4a4a2a',
  [RoomType.WORKSHOP]: '#3a3a3a',
  [RoomType.PRISON]: '#2a2a2a',
  [RoomType.TORTURE]: '#4a1a1a',
};

const CREATURE_COLORS: Record<CreatureType, string> = {
  [CreatureType.IMP]: '#ff9900',
  [CreatureType.BEETLE]: '#66aa33',
  [CreatureType.ORC]: '#33aa33',
  [CreatureType.WARLOCK]: '#9933ff',
  [CreatureType.TROLL]: '#666666',
  [CreatureType.DARK_ANGEL]: '#333366',
};

const HERO_COLORS: Record<HeroType, string> = {
  [HeroType.PEASANT]: '#ccaa77',
  [HeroType.ARCHER]: '#77cc77',
  [HeroType.KNIGHT]: '#aaaacc',
  [HeroType.WIZARD]: '#7777ff',
  [HeroType.LORD]: '#ffcc00',
};

/**
 * Main render function.
 */
export function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Clear canvas
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Render layers
  renderGrid(ctx, state.grid);
  renderDigTasks(ctx, state);
  renderEntities(ctx, state);
  renderHeart(ctx, state.heart);
  renderPlacementPreview(ctx, state);
}

/**
 * Render the grid tiles and rooms.
 */
export function renderGrid(
  ctx: CanvasRenderingContext2D,
  grid: Tile[][]
): void {
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const tile = grid[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      // Draw base tile
      ctx.fillStyle = TILE_COLORS[tile.type];
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Draw room overlay
      if (tile.room !== RoomType.NONE) {
        ctx.fillStyle = ROOM_COLORS[tile.room];
        ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }

      // Draw gold seam indicator
      if (tile.goldSeam && tile.type === TileType.DIRT) {
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(px + 8, py + 8, 8, 8);
      }

      // Draw claimed border
      if (tile.owner && tile.type === TileType.FLOOR) {
        ctx.strokeStyle = '#4a4a6a';
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }
  }
}

/**
 * Render dig task markers.
 */
export function renderDigTasks(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.strokeStyle = '#ff6600';
  ctx.lineWidth = 2;

  for (const task of state.digTasks) {
    const px = task.pos.x * TILE_SIZE;
    const py = task.pos.y * TILE_SIZE;

    // Draw X marker
    ctx.beginPath();
    ctx.moveTo(px + 4, py + 4);
    ctx.lineTo(px + TILE_SIZE - 4, py + TILE_SIZE - 4);
    ctx.moveTo(px + TILE_SIZE - 4, py + 4);
    ctx.lineTo(px + 4, py + TILE_SIZE - 4);
    ctx.stroke();
  }

  ctx.lineWidth = 1;
}

/**
 * Render all entities (imps, creatures, heroes).
 */
export function renderEntities(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Render imps
  for (const imp of state.imps) {
    renderImp(ctx, imp);
  }

  // Render creatures
  for (const creature of state.creatures) {
    renderCreature(ctx, creature);
  }

  // Render heroes
  for (const hero of state.heroes) {
    renderHero(ctx, hero);
  }
}

/**
 * Render an imp.
 */
export function renderImp(ctx: CanvasRenderingContext2D, imp: Imp): void {
  const px = imp.pos.x * TILE_SIZE + TILE_SIZE / 2;
  const py = imp.pos.y * TILE_SIZE + TILE_SIZE / 2;
  const radius = 6;

  // Body
  ctx.fillStyle = CREATURE_COLORS[CreatureType.IMP];
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, Math.PI * 2);
  ctx.fill();

  // Carrying indicator
  if (imp.carrying > 0) {
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(px, py - radius - 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Health bar if damaged
  if (imp.hp < imp.maxHp) {
    renderHealthBar(ctx, imp.pos, imp.hp, imp.maxHp);
  }
}

/**
 * Render a creature.
 */
export function renderCreature(ctx: CanvasRenderingContext2D, creature: Creature): void {
  const px = creature.pos.x * TILE_SIZE + TILE_SIZE / 2;
  const py = creature.pos.y * TILE_SIZE + TILE_SIZE / 2;
  const radius = 8;

  // Body
  ctx.fillStyle = CREATURE_COLORS[creature.type];
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, Math.PI * 2);
  ctx.fill();

  // Level indicator
  if (creature.level > 1) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(creature.level.toString(), px, py + 3);
  }

  // Health bar if damaged
  if (creature.hp < creature.maxHp) {
    renderHealthBar(ctx, creature.pos, creature.hp, creature.maxHp);
  }
}

/**
 * Render a hero.
 */
export function renderHero(ctx: CanvasRenderingContext2D, hero: Hero): void {
  const px = hero.pos.x * TILE_SIZE + TILE_SIZE / 2;
  const py = hero.pos.y * TILE_SIZE + TILE_SIZE / 2;
  const size = 10;

  // Body (diamond shape for heroes)
  ctx.fillStyle = HERO_COLORS[hero.type];
  ctx.beginPath();
  ctx.moveTo(px, py - size);
  ctx.lineTo(px + size, py);
  ctx.lineTo(px, py + size);
  ctx.lineTo(px - size, py);
  ctx.closePath();
  ctx.fill();

  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Health bar
  if (hero.hp < hero.maxHp) {
    renderHealthBar(ctx, hero.pos, hero.hp, hero.maxHp);
  }
}

/**
 * Render the dungeon heart.
 */
export function renderHeart(ctx: CanvasRenderingContext2D, heart: DungeonHeart): void {
  const px = heart.pos.x * TILE_SIZE + TILE_SIZE / 2;
  const py = heart.pos.y * TILE_SIZE + TILE_SIZE / 2;

  // Glow effect
  const gradient = ctx.createRadialGradient(px, py, 0, px, py, 20);
  gradient.addColorStop(0, '#ff3366');
  gradient.addColorStop(0.5, '#aa1144');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(px - 20, py - 20, 40, 40);

  // Heart shape (simplified)
  ctx.fillStyle = '#ff1144';
  ctx.beginPath();
  ctx.arc(px - 6, py - 4, 8, 0, Math.PI * 2);
  ctx.arc(px + 6, py - 4, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(px - 14, py);
  ctx.lineTo(px, py + 14);
  ctx.lineTo(px + 14, py);
  ctx.fill();

  // Health bar
  renderHealthBar(ctx, heart.pos, heart.hp, heart.maxHp, 30);
}

/**
 * Render a health bar above an entity.
 */
export function renderHealthBar(
  ctx: CanvasRenderingContext2D,
  pos: Position,
  hp: number,
  maxHp: number,
  width: number = 20
): void {
  const px = pos.x * TILE_SIZE + (TILE_SIZE - width) / 2;
  const py = pos.y * TILE_SIZE - 6;
  const height = 4;
  const hpPercent = Math.max(0, hp / maxHp);

  // Background
  ctx.fillStyle = '#330000';
  ctx.fillRect(px, py, width, height);

  // Health
  const hpColor = hpPercent > 0.5 ? '#00cc00' : hpPercent > 0.25 ? '#cccc00' : '#cc0000';
  ctx.fillStyle = hpColor;
  ctx.fillRect(px, py, width * hpPercent, height);

  // Border
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(px, py, width, height);
}

/**
 * Render room placement preview.
 */
export function renderPlacementPreview(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (!state.hoverPos || state.selectedRoom === RoomType.NONE) {
    return;
  }

  const px = state.hoverPos.x * TILE_SIZE;
  const py = state.hoverPos.y * TILE_SIZE;
  const roomSize = 3 * TILE_SIZE;

  // Preview color based on validity
  ctx.fillStyle = state.placementValid
    ? 'rgba(0, 255, 0, 0.3)'
    : 'rgba(255, 0, 0, 0.3)';
  ctx.fillRect(px, py, roomSize, roomSize);

  // Border
  ctx.strokeStyle = state.placementValid ? '#00ff00' : '#ff0000';
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, roomSize, roomSize);
  ctx.lineWidth = 1;
}

/**
 * Get tile color for a tile type.
 */
export function getTileColor(type: TileType): string {
  return TILE_COLORS[type];
}

/**
 * Get creature color for a creature type.
 */
export function getCreatureColor(type: CreatureType): string {
  return CREATURE_COLORS[type];
}

/**
 * Get hero color for a hero type.
 */
export function getHeroColor(type: HeroType): string {
  return HERO_COLORS[type];
}
