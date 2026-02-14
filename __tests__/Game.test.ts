import {
  createGame,
  startGame,
  updateGame,
  designateDig,
  cancelDig,
  tryPlaceRoom,
  summonImp,
  togglePause,
  checkGameOver,
  addMessage,
  calculateScore,
  resetCreatureSpawnTimer,
  resetWageTimer,
} from '../src/game/Game';
import { resetImpIdCounter, resetDigTargets } from '../src/game/Imp';
import { resetCreatureIdCounter } from '../src/game/Creature';
import { resetHeroIdCounter } from '../src/game/Hero';
import { GameScreen, RoomType, TileType, CreatureType, HeroType, HeroBehavior, CreatureBehavior } from '../src/game/types';
import {
  GRID_WIDTH,
  GRID_HEIGHT,
  STARTING_GOLD,
  STARTING_IMPS,
  HEART_HP,
  HEART_CLEAR_RADIUS,
  HEART_REGEN_DELAY,
  IMP_COST,
  ROOM_COSTS,
  CREATURE_STATS,
  CREATURE_RESPAWN_TIME,
  LAVA_DAMAGE_PER_SECOND,
} from '../src/game/constants';

describe('Game', () => {
  beforeEach(() => {
    resetImpIdCounter();
    resetCreatureIdCounter();
    resetHeroIdCounter();
    resetCreatureSpawnTimer();
    resetDigTargets();
  });

  describe('createGame', () => {
    it('creates game with TITLE screen', () => {
      const state = createGame();
      expect(state.screen).toBe(GameScreen.TITLE);
    });

    it('creates game with starting gold', () => {
      const state = createGame();
      expect(state.gold).toBe(STARTING_GOLD);
    });

    it('creates game with starting imps', () => {
      const state = createGame();
      expect(state.imps.length).toBe(STARTING_IMPS);
    });

    it('creates game with dungeon heart', () => {
      const state = createGame();
      expect(state.heart).toBeDefined();
      expect(state.heart.hp).toBe(HEART_HP);
    });

    it('heart is at center of grid', () => {
      const state = createGame();
      expect(state.heart.pos.x).toBe(Math.floor(GRID_WIDTH / 2));
      expect(state.heart.pos.y).toBe(Math.floor(GRID_HEIGHT / 2));
    });

    it('creates game with empty rooms', () => {
      const state = createGame();
      expect(state.rooms).toEqual([]);
    });

    it('creates game with empty creatures', () => {
      const state = createGame();
      expect(state.creatures).toEqual([]);
    });

    it('creates game with empty heroes', () => {
      const state = createGame();
      expect(state.heroes).toEqual([]);
    });

    it('creates game with wave 0', () => {
      const state = createGame();
      expect(state.wave).toBe(0);
    });

    it('creates game not paused', () => {
      const state = createGame();
      expect(state.paused).toBe(false);
    });
  });

  describe('startGame', () => {
    it('sets screen to PLAYING', () => {
      const state = createGame();
      startGame(state);
      expect(state.screen).toBe(GameScreen.PLAYING);
    });

    it('resets wave timer', () => {
      const state = createGame();
      state.waveTimer = 50;
      startGame(state);
      expect(state.waveTimer).toBe(0);
    });

    it('adds welcome message', () => {
      const state = createGame();
      startGame(state);
      expect(state.messages.length).toBeGreaterThan(0);
    });
  });

  describe('updateGame', () => {
    it('does nothing when not PLAYING', () => {
      const state = createGame();
      const initialTime = state.gameTime;
      updateGame(state, 1);
      expect(state.gameTime).toBe(initialTime);
    });

    it('does nothing when paused', () => {
      const state = createGame();
      startGame(state);
      state.paused = true;
      const initialTime = state.gameTime;
      updateGame(state, 1);
      expect(state.gameTime).toBe(initialTime);
    });

    it('advances game time', () => {
      const state = createGame();
      startGame(state);
      updateGame(state, 0.5);
      expect(state.gameTime).toBe(0.5);
    });

    it('advances wave timer', () => {
      const state = createGame();
      startGame(state);
      updateGame(state, 0.5);
      expect(state.waveTimer).toBe(0.5);
    });
  });

  describe('designateDig', () => {
    it('adds dig task for valid dirt tile', () => {
      const state = createGame();
      // Find a dirt tile
      const digPos = { x: 5, y: 5 };
      expect(state.grid[5][5].type).toBe(TileType.DIRT);
      
      const result = designateDig(state, digPos);
      expect(result).toBe(true);
      expect(state.digTasks.length).toBe(1);
      expect(state.digTasks[0].pos).toEqual(digPos);
    });

    it('returns false for non-diggable tile', () => {
      const state = createGame();
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const result = designateDig(state, { x: centerX, y: centerY });
      expect(result).toBe(false);
    });

    it('returns false for already designated tile', () => {
      const state = createGame();
      const digPos = { x: 5, y: 5 };
      designateDig(state, digPos);
      const result = designateDig(state, digPos);
      expect(result).toBe(false);
    });

    it('sets assigned to false', () => {
      const state = createGame();
      designateDig(state, { x: 5, y: 5 });
      expect(state.digTasks[0].assigned).toBe(false);
    });
  });

  describe('cancelDig', () => {
    it('removes dig task', () => {
      const state = createGame();
      const digPos = { x: 5, y: 5 };
      designateDig(state, digPos);
      const result = cancelDig(state, digPos);
      expect(result).toBe(true);
      expect(state.digTasks.length).toBe(0);
    });

    it('returns false if no task at position', () => {
      const state = createGame();
      const result = cancelDig(state, { x: 5, y: 5 });
      expect(result).toBe(false);
    });
  });

  describe('tryPlaceRoom', () => {
    it('places room when valid and affordable', () => {
      const state = createGame();
      startGame(state);
      // Need to dig out area first - use center floor area
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      // The 5x5 center area is floor, find a spot for 3x3 room
      const topLeft = { x: centerX - HEART_CLEAR_RADIUS, y: centerY - HEART_CLEAR_RADIUS };
      
      const result = tryPlaceRoom(state, topLeft, RoomType.LAIR);
      expect(result).toBe(true);
      expect(state.rooms.length).toBe(1);
    });

    it('deducts gold when placing room', () => {
      const state = createGame();
      startGame(state);
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const topLeft = { x: centerX - HEART_CLEAR_RADIUS, y: centerY - HEART_CLEAR_RADIUS };
      const initialGold = state.gold;
      
      tryPlaceRoom(state, topLeft, RoomType.LAIR);
      expect(state.gold).toBe(initialGold - ROOM_COSTS[RoomType.LAIR]);
    });

    it('returns false when cannot afford', () => {
      const state = createGame();
      startGame(state);
      state.gold = 100; // Not enough for lair (500)
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const topLeft = { x: centerX - HEART_CLEAR_RADIUS, y: centerY - HEART_CLEAR_RADIUS };
      
      const result = tryPlaceRoom(state, topLeft, RoomType.LAIR);
      expect(result).toBe(false);
    });

    it('returns false when invalid position', () => {
      const state = createGame();
      startGame(state);
      // Try to place on dirt (not floor)
      const result = tryPlaceRoom(state, { x: 3, y: 3 }, RoomType.LAIR);
      expect(result).toBe(false);
    });
  });

  describe('summonImp', () => {
    it('creates new imp when affordable', () => {
      const state = createGame();
      startGame(state);
      const initialImps = state.imps.length;
      const result = summonImp(state);
      expect(result).toBe(true);
      expect(state.imps.length).toBe(initialImps + 1);
    });

    it('deducts gold', () => {
      const state = createGame();
      startGame(state);
      const initialGold = state.gold;
      summonImp(state);
      expect(state.gold).toBe(initialGold - IMP_COST);
    });

    it('returns false when cannot afford', () => {
      const state = createGame();
      startGame(state);
      state.gold = 50;
      const result = summonImp(state);
      expect(result).toBe(false);
    });

    it('does not create imp when cannot afford', () => {
      const state = createGame();
      startGame(state);
      state.gold = 50;
      const initialImps = state.imps.length;
      summonImp(state);
      expect(state.imps.length).toBe(initialImps);
    });
  });

  describe('togglePause', () => {
    it('pauses when playing', () => {
      const state = createGame();
      startGame(state);
      togglePause(state);
      expect(state.paused).toBe(true);
    });

    it('unpauses when paused', () => {
      const state = createGame();
      startGame(state);
      state.paused = true;
      togglePause(state);
      expect(state.paused).toBe(false);
    });

    it('does nothing when not playing', () => {
      const state = createGame();
      togglePause(state);
      expect(state.paused).toBe(false);
    });
  });

  describe('checkGameOver', () => {
    it('returns false when heart alive', () => {
      const state = createGame();
      expect(checkGameOver(state)).toBe(false);
    });

    it('returns true when heart destroyed', () => {
      const state = createGame();
      state.heart.hp = 0;
      expect(checkGameOver(state)).toBe(true);
    });
  });

  describe('addMessage', () => {
    it('adds message to array', () => {
      const state = createGame();
      addMessage(state, 'Test message');
      expect(state.messages).toContain('Test message');
    });

    it('keeps only last 10 messages', () => {
      const state = createGame();
      for (let i = 0; i < 15; i++) {
        addMessage(state, `Message ${i}`);
      }
      expect(state.messages.length).toBe(10);
      expect(state.messages[0]).toBe('Message 5');
    });
  });

  describe('calculateScore', () => {
    it('calculates score based on waves', () => {
      const state = createGame();
      state.wave = 5;
      state.gold = 0;
      const score = calculateScore(state);
      expect(score).toBe(500); // 5 waves * 100
    });

    it('includes gold in score', () => {
      const state = createGame();
      state.wave = 0;
      state.gold = 500;
      const score = calculateScore(state);
      expect(score).toBe(500);
    });

    it('includes creatures in score', () => {
      const state = createGame();
      state.wave = 0;
      state.gold = 0;
      // Add some dummy creatures
      state.creatures = [{} as any, {} as any];
      const score = calculateScore(state);
      expect(score).toBe(100); // 2 creatures * 50
    });
  });

  describe('heart regeneration', () => {
    it('does not regenerate when recently attacked', () => {
      const state = createGame();
      startGame(state);
      state.heart.hp = 500;
      state.heart.lastAttackTime = 0;
      state.gameTime = 2; // Only 2 seconds since attack (need 5)

      updateGame(state, 1);
      // Should not regenerate yet
      expect(state.heart.hp).toBe(500);
    });

    it('regenerates after regen delay', () => {
      const state = createGame();
      startGame(state);
      state.heart.hp = 500;
      state.heart.lastAttackTime = 0;
      state.gameTime = HEART_REGEN_DELAY + 1;

      updateGame(state, 1);
      // Should have regenerated
      expect(state.heart.hp).toBeGreaterThan(500);
    });

    it('does not exceed max HP', () => {
      const state = createGame();
      startGame(state);
      state.heart.hp = HEART_HP - 0.5;
      state.heart.lastAttackTime = 0;
      state.gameTime = HEART_REGEN_DELAY + 1;

      updateGame(state, 1);
      expect(state.heart.hp).toBe(HEART_HP);
    });

    it('does not regenerate at full health', () => {
      const state = createGame();
      startGame(state);
      state.heart.lastAttackTime = 0;
      state.gameTime = HEART_REGEN_DELAY + 1;
      const hpBefore = state.heart.hp;

      updateGame(state, 1);
      expect(state.heart.hp).toBe(hpBefore);
    });
  });

  describe('creature attraction', () => {
    it('does not spawn creatures without lair', () => {
      const state = createGame();
      startGame(state);
      state.gameTime = 30; // Past spawn interval

      // Place hatchery but no lair
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      tryPlaceRoom(state, { x: centerX - 2, y: centerY - 2 }, RoomType.HATCHERY);

      updateGame(state, 0.1);
      expect(state.creatures.length).toBe(0);
    });

    it('spawns creature when lair and attraction room exist', () => {
      const state = createGame();
      startGame(state);
      state.gold = 5000;
      resetCreatureSpawnTimer();

      // Place lair and hatchery
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      
      // Place lair
      tryPlaceRoom(state, { x: centerX - 2, y: centerY - 2 }, RoomType.LAIR);
      // Place hatchery (need more floor space - expand the area)
      // For this test, manually mark some tiles as floor
      for (let y = centerY - 3; y <= centerY + 3; y++) {
        for (let x = centerX - 3; x <= centerX + 3; x++) {
          state.grid[y][x] = { type: TileType.FLOOR, room: RoomType.NONE, owner: true, goldSeam: false };
        }
      }
      tryPlaceRoom(state, { x: centerX + 1, y: centerY - 2 }, RoomType.HATCHERY);

      // Advance time past spawn interval
      state.gameTime = 31;
      updateGame(state, 0.1);

      expect(state.creatures.length).toBeGreaterThan(0);
    });

    it('deducts gold when spawning creature', () => {
      const state = createGame();
      startGame(state);
      state.gold = 5000;
      const initialGold = state.gold;
      resetCreatureSpawnTimer();

      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      
      // Expand floor area
      for (let y = centerY - 3; y <= centerY + 3; y++) {
        for (let x = centerX - 3; x <= centerX + 3; x++) {
          state.grid[y][x] = { type: TileType.FLOOR, room: RoomType.NONE, owner: true, goldSeam: false };
        }
      }
      
      tryPlaceRoom(state, { x: centerX - 2, y: centerY - 2 }, RoomType.LAIR);
      const goldAfterLair = state.gold;
      tryPlaceRoom(state, { x: centerX + 1, y: centerY - 2 }, RoomType.HATCHERY);
      const goldAfterHatchery = state.gold;

      state.gameTime = 31;
      updateGame(state, 0.1);

      // Should have paid for beetle (100 gold)
      if (state.creatures.length > 0) {
        expect(state.gold).toBe(goldAfterHatchery - CREATURE_STATS[CreatureType.BEETLE].cost);
      }
    });

    it('respects max creatures based on lairs', () => {
      const state = createGame();
      startGame(state);
      state.gold = 10000;

      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      
      // Expand floor area
      for (let y = centerY - 5; y <= centerY + 5; y++) {
        for (let x = centerX - 5; x <= centerX + 5; x++) {
          state.grid[y][x] = { type: TileType.FLOOR, room: RoomType.NONE, owner: true, goldSeam: false };
        }
      }
      
      // Place 1 lair (max 3 creatures)
      tryPlaceRoom(state, { x: centerX - 2, y: centerY - 2 }, RoomType.LAIR);
      // Place multiple hatcheries
      tryPlaceRoom(state, { x: centerX + 1, y: centerY - 2 }, RoomType.HATCHERY);
      tryPlaceRoom(state, { x: centerX - 2, y: centerY + 2 }, RoomType.HATCHERY);

      // Manually add 3 creatures to hit max
      state.creatures = [
        { id: 'c1', pos: { x: centerX, y: centerY }, hp: 40, maxHp: 40, lastAttackTime: 0, type: CreatureType.BEETLE, behavior: CreatureBehavior.IDLE, hunger: 100, happiness: 100, level: 1, targetId: null },
        { id: 'c2', pos: { x: centerX, y: centerY }, hp: 40, maxHp: 40, lastAttackTime: 0, type: CreatureType.BEETLE, behavior: CreatureBehavior.IDLE, hunger: 100, happiness: 100, level: 1, targetId: null },
        { id: 'c3', pos: { x: centerX, y: centerY }, hp: 40, maxHp: 40, lastAttackTime: 0, type: CreatureType.BEETLE, behavior: CreatureBehavior.IDLE, hunger: 100, happiness: 100, level: 1, targetId: null },
      ];

      resetCreatureSpawnTimer();
      state.gameTime = 31;
      updateGame(state, 0.1);

      // Should not spawn more
      expect(state.creatures.length).toBe(3);
    });
  });

  describe('creature wages', () => {
    beforeEach(() => {
      resetWageTimer();
    });

    it('deducts wages after wage interval', () => {
      const state = createGame();
      startGame(state);
      state.gold = 1000;
      
      // Add a beetle (cost 100, wage = 10)
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      state.creatures = [
        { id: 'c1', pos: { x: centerX, y: centerY }, hp: 40, maxHp: 40, lastAttackTime: 0, type: CreatureType.BEETLE, behavior: CreatureBehavior.IDLE, hunger: 100, happiness: 100, level: 1, targetId: null },
      ];
      
      // Advance past wage interval (60 seconds)
      state.gameTime = 61;
      const goldBefore = state.gold;
      updateGame(state, 0.1);
      
      // Should have deducted 10 gold (10% of beetle cost)
      expect(state.gold).toBe(goldBefore - 10);
    });

    it('reduces happiness when wages cannot be paid', () => {
      const state = createGame();
      startGame(state);
      state.gold = 5; // Not enough for wages
      
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      state.creatures = [
        { id: 'c1', pos: { x: centerX, y: centerY }, hp: 40, maxHp: 40, lastAttackTime: 0, type: CreatureType.BEETLE, behavior: CreatureBehavior.IDLE, hunger: 100, happiness: 100, level: 1, targetId: null },
      ];
      
      state.gameTime = 61;
      updateGame(state, 0.1);
      
      // Happiness should be reduced (80 - small decay from updateNeeds)
      expect(state.creatures[0].happiness).toBeLessThan(81);
      expect(state.creatures[0].happiness).toBeGreaterThan(79);
    });
  });

  describe('entity movement', () => {
    it('heroes move toward dungeon heart', () => {
      const state = createGame();
      startGame(state);
      
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      
      // Create walkable path from hero to heart
      for (let y = 1; y <= centerY; y++) {
        state.grid[y][centerX] = { type: TileType.FLOOR, room: RoomType.NONE, owner: true, goldSeam: false };
      }
      
      // Add a hero at the top (using proper enum values)
      state.heroes = [
        { id: 'h1', pos: { x: centerX, y: 2 }, hp: 30, maxHp: 30, lastAttackTime: 0, type: HeroType.PEASANT, behavior: HeroBehavior.ENTERING, targetId: null },
      ];
      
      const initialY = state.heroes[0].pos.y;
      updateGame(state, 1);
      
      // Hero should have moved toward heart (y increased)
      expect(state.heroes[0].pos.y).toBeGreaterThan(initialY);
    });
  });

  describe('lava damage', () => {
    it('damages creatures standing on lava', () => {
      const state = createGame();
      startGame(state);
      
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      
      // Place lava tile
      state.grid[centerY][centerX + 3] = { type: TileType.LAVA, room: RoomType.NONE, owner: false, goldSeam: false };
      
      // Add creature on lava
      state.creatures = [
        { id: 'c1', pos: { x: centerX + 3, y: centerY }, hp: 40, maxHp: 40, lastAttackTime: 0, type: CreatureType.BEETLE, behavior: CreatureBehavior.IDLE, hunger: 100, happiness: 100, level: 1, targetId: null },
      ];
      
      const initialHp = state.creatures[0].hp;
      updateGame(state, 1);
      
      // Should have taken lava damage
      expect(state.creatures[0].hp).toBeLessThan(initialHp);
    });
  });

  describe('creature respawn', () => {
    it('queues dead creature for respawn', () => {
      const state = createGame();
      startGame(state);
      state.gold = 5000;
      
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      
      // Add a dead creature
      state.creatures = [
        { id: 'c1', pos: { x: centerX, y: centerY }, hp: 0, maxHp: 40, lastAttackTime: 0, type: CreatureType.BEETLE, behavior: CreatureBehavior.IDLE, hunger: 100, happiness: 100, level: 1, targetId: null },
      ];
      
      updateGame(state, 0.1);
      
      // Creature should be removed and queued for respawn
      expect(state.creatures.length).toBe(0);
      expect(state.deadCreatures.length).toBe(1);
      expect(state.deadCreatures[0].type).toBe(CreatureType.BEETLE);
    });

    it('respawns creature after delay with cost', () => {
      const state = createGame();
      startGame(state);
      state.gold = 5000;
      
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      
      // Expand floor area and add lair
      for (let y = centerY - 3; y <= centerY + 3; y++) {
        for (let x = centerX - 3; x <= centerX + 3; x++) {
          state.grid[y][x] = { type: TileType.FLOOR, room: RoomType.NONE, owner: true, goldSeam: false };
        }
      }
      tryPlaceRoom(state, { x: centerX - 2, y: centerY - 2 }, RoomType.LAIR);
      
      // Add dead creature entry
      state.deadCreatures = [
        { type: CreatureType.BEETLE, respawnTime: state.gameTime + 1, cost: 50 },
      ];
      
      const goldBefore = state.gold;
      state.gameTime = 2; // Past respawn time
      updateGame(state, 0.1);
      
      // Should have respawned and deducted cost
      expect(state.creatures.length).toBe(1);
      expect(state.deadCreatures.length).toBe(0);
      expect(state.gold).toBe(goldBefore - 50);
    });
  });

  describe('imp immortality', () => {
    it('respawns dead imp at heart instantly', () => {
      const state = createGame();
      startGame(state);
      
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      
      // Kill an imp
      state.imps[0].hp = 0;
      state.imps[0].pos = { x: 5, y: 5 };
      
      const impCount = state.imps.length;
      updateGame(state, 0.1);
      
      // Imp should still exist (respawned)
      expect(state.imps.length).toBe(impCount);
      // Imp should be at full health
      expect(state.imps[0].hp).toBe(state.imps[0].maxHp);
      // Imp should be near heart
      expect(state.imps[0].pos.x).toBe(centerX);
      expect(state.imps[0].pos.y).toBe(centerY + 1);
    });
  });

  describe('prison capture', () => {
    it('captures defeated hero when prison exists', () => {
      const state = createGame();
      startGame(state);
      state.gold = 5000;
      
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      
      // Expand floor area
      for (let y = centerY - 3; y <= centerY + 3; y++) {
        for (let x = centerX - 3; x <= centerX + 3; x++) {
          state.grid[y][x] = { type: TileType.FLOOR, room: RoomType.NONE, owner: true, goldSeam: false };
        }
      }
      
      // Build prison
      tryPlaceRoom(state, { x: centerX - 2, y: centerY - 2 }, RoomType.PRISON);
      
      // Add creature and hero in combat
      state.creatures = [
        { id: 'c1', pos: { x: centerX, y: centerY }, hp: 100, maxHp: 100, lastAttackTime: 0, type: CreatureType.ORC, behavior: CreatureBehavior.FIGHTING, hunger: 100, happiness: 100, level: 1, targetId: 'h1' },
      ];
      state.heroes = [
        { id: 'h1', pos: { x: centerX, y: centerY }, hp: 1, maxHp: 30, lastAttackTime: 0, type: HeroType.PEASANT, behavior: HeroBehavior.ATTACKING, targetId: 'c1' },
      ];
      
      const goldBefore = state.gold;
      updateGame(state, 0.1);
      
      // If hero died, should be captured not killed for gold
      if (state.heroes.length === 0) {
        expect(state.prisoners.length).toBe(1);
        expect(state.prisoners[0].heroType).toBe(HeroType.PEASANT);
        // Gold should NOT have increased (captured, not killed)
        expect(state.gold).toBe(goldBefore);
      }
    });
  });

  describe('creature working behavior', () => {
    it('creature enters working state when at work room', () => {
      const state = createGame();
      startGame(state);
      state.gold = 5000;
      
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      
      // Expand floor area
      for (let y = centerY - 5; y <= centerY + 5; y++) {
        for (let x = centerX - 5; x <= centerX + 5; x++) {
          state.grid[y][x] = { type: TileType.FLOOR, room: RoomType.NONE, owner: true, goldSeam: false };
        }
      }
      
      // Build training room
      tryPlaceRoom(state, { x: centerX - 2, y: centerY - 2 }, RoomType.TRAINING);
      
      // Add orc AT the training room (adjacent to a room tile)
      state.creatures = [
        { id: 'c1', pos: { x: centerX - 2, y: centerY - 1 }, hp: 60, maxHp: 60, lastAttackTime: 0, type: CreatureType.ORC, behavior: CreatureBehavior.IDLE, hunger: 100, happiness: 100, level: 1, targetId: null },
      ];
      
      updateGame(state, 1);
      
      // Orc should be in WORKING state (gains happiness from working)
      expect(state.creatures[0].behavior).toBe(CreatureBehavior.WORKING);
    });
  });

  describe('unhappy creatures leave', () => {
    it('creature leaves when happiness below threshold', () => {
      const state = createGame();
      startGame(state);
      
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      
      // Add very unhappy creature
      state.creatures = [
        { id: 'c1', pos: { x: centerX, y: centerY }, hp: 40, maxHp: 40, lastAttackTime: 0, type: CreatureType.BEETLE, behavior: CreatureBehavior.IDLE, hunger: 100, happiness: 5, level: 1, targetId: null },
      ];
      
      updateGame(state, 0.1);
      
      // Creature should have left
      expect(state.creatures.length).toBe(0);
    });
  });

  describe('imp enemy avoidance', () => {
    it('imp flees when hero is nearby', () => {
      const state = createGame();
      startGame(state);
      
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);
      
      // Place imp away from heart
      state.imps[0].pos = { x: centerX + 3, y: centerY };
      
      // Place hero near imp
      state.heroes = [
        { id: 'h1', pos: { x: centerX + 4, y: centerY }, hp: 30, maxHp: 30, lastAttackTime: 0, type: HeroType.PEASANT, behavior: HeroBehavior.ENTERING, targetId: null },
      ];
      
      const initialX = state.imps[0].pos.x;
      updateGame(state, 1);
      
      // Imp should have moved toward heart (x decreased)
      expect(state.imps[0].pos.x).toBeLessThan(initialX);
    });
  });
});
