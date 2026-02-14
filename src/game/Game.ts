import {
  GameState,
  GameScreen,
  RoomType,
  DungeonHeart,
  Position,
  TaskType,
  Imp,
  CreatureBehavior,
  CreatureType,
  HeroBehavior,
  TileType,
  DeadCreature,
} from './types';
import { createGrid, isDiggable, isWalkable } from './Grid';
import { canPlaceRoom, placeRoom, countRoomsByType, getRoomsByType } from './Room';
import { createImp, assignTask, updateImp, findNearestTask, isImpWorking } from './Imp';
import { createCreature, updateNeeds, determineBehavior, updateBehavior, findNearestEnemy, setCreatureTarget, getCreatureSpeed, feedCreature, trainCreature } from './Creature';
import { chooseTarget as heroChooseTarget, setHeroTarget, determineBehavior as heroDetermineBehavior, updateBehavior as heroUpdateBehavior, getHeroSpeed, findNearestTarget } from './Hero';
import { processCombat, isDead } from './Combat';
import { spawnWave, shouldSpawnWave, shouldShowWarning } from './Wave';
import { createEconomy, canAfford, updateMaxGold, getRoomCost, getImpCost } from './Economy';
import { findPath, getDistance } from './Pathfinding';
import {
  GRID_WIDTH,
  GRID_HEIGHT,
  STARTING_IMPS,
  HEART_HP,
  HEART_REGEN,
  HEART_REGEN_DELAY,
  HERO_STATS,
  ROOM_ATTRACTS,
  CREATURE_STATS,
  WAGE_INTERVAL,
  CREATURE_RESPAWN_TIME,
  CREATURE_RESPAWN_COST_PERCENT,
  LAVA_DAMAGE_PER_SECOND,
  PRISON_CONVERT_TIME,
} from './constants';

// Creature attraction timing
const CREATURE_SPAWN_INTERVAL = 30; // seconds between attraction checks
let lastCreatureSpawnTime = 0;
let lastWageTime = 0;

/**
 * Create initial game state.
 */
export function createGame(): GameState {
  const grid = createGrid();
  const economy = createEconomy();

  // Create dungeon heart at center
  const centerX = Math.floor(GRID_WIDTH / 2);
  const centerY = Math.floor(GRID_HEIGHT / 2);
  const heart: DungeonHeart = {
    id: 'heart',
    pos: { x: centerX, y: centerY },
    hp: HEART_HP,
    maxHp: HEART_HP,
    lastAttackTime: 0,
  };

  // Create starting imps
  const imps: Imp[] = [];
  for (let i = 0; i < STARTING_IMPS; i++) {
    const imp = createImp({
      x: centerX + (i - 1),
      y: centerY + 1,
    });
    imps.push(imp);
  }

  return {
    screen: GameScreen.TITLE,
    grid,
    rooms: [],
    imps,
    creatures: [],
    heroes: [],
    heart,
    gold: economy.gold,
    maxGold: economy.maxGold,
    wave: 0,
    waveTimer: 0,
    gameTime: 0,
    paused: false,
    messages: [],
    digTasks: [],
    selectedRoom: RoomType.NONE,
    placementValid: false,
    hoverPos: null,
    deadCreatures: [],
    prisoners: [],
  };
}

/**
 * Start the game from title screen.
 */
export function startGame(state: GameState): void {
  state.screen = GameScreen.PLAYING;
  state.waveTimer = 0;
  state.wave = 0;
  addMessage(state, 'The dungeon awaits. Build your empire!');
}

/**
 * Main game update loop.
 */
export function updateGame(state: GameState, dt: number): void {
  if (state.screen !== GameScreen.PLAYING || state.paused) {
    return;
  }

  state.gameTime += dt;
  state.waveTimer += dt;

  // Heart regeneration (1 HP/s if not attacked in last 5 seconds)
  const timeSinceHeartAttack = state.gameTime - state.heart.lastAttackTime;
  if (timeSinceHeartAttack >= HEART_REGEN_DELAY && state.heart.hp < state.heart.maxHp) {
    state.heart.hp = Math.min(state.heart.maxHp, state.heart.hp + HEART_REGEN * dt);
  }

  // Creature attraction - spawn creatures based on rooms
  if (state.gameTime - lastCreatureSpawnTime >= CREATURE_SPAWN_INTERVAL) {
    lastCreatureSpawnTime = state.gameTime;
    trySpawnCreature(state);
  }

  // Update imps
  for (const imp of state.imps) {
    // Imps avoid enemies - check if hero is nearby
    const nearbyHero = state.heroes.find(h => getDistance(imp.pos, h.pos) <= 2);
    if (nearbyHero) {
      // Flee toward heart instead of working
      imp.task = TaskType.IDLE;
      imp.target = null;
      imp.path = [];
      moveEntityToward(imp, state.heart.pos, 3.0, dt, state.grid);
      continue;
    }
    
    if (!isImpWorking(imp)) {
      // Find task for idle imp
      const task = findNearestTask(imp, state.digTasks);
      if (task) {
        task.assigned = true;
        assignTask(imp, TaskType.DIG, task.pos);
      }
    }
    const gold = updateImp(imp, state.grid, dt);
    if (gold > 0) {
      addGoldToState(state, gold);
    }
  }

  // Process wages (10% of creature cost per minute)
  if (state.gameTime - lastWageTime >= WAGE_INTERVAL) {
    lastWageTime = state.gameTime;
    let totalWages = 0;
    for (const creature of state.creatures) {
      const stats = CREATURE_STATS[creature.type];
      totalWages += Math.floor(stats.cost * 0.1);
    }
    if (totalWages > 0 && state.gold >= totalWages) {
      state.gold -= totalWages;
    } else if (totalWages > 0) {
      // Can't pay wages - creatures become unhappy
      for (const creature of state.creatures) {
        creature.happiness = Math.max(0, creature.happiness - 20);
      }
    }
  }

  // Update creatures
  const creaturesToRemove: string[] = [];
  for (const creature of state.creatures) {
    if (isDead(creature)) continue;
    updateNeeds(creature, dt);

    // Unhappy creatures may leave (happiness below 10)
    if (creature.happiness < 10) {
      creaturesToRemove.push(creature.id);
      addMessage(state, `${creature.type.toLowerCase().replace('_', ' ')} left due to unhappiness!`);
      continue;
    }

    // Find enemies (heroes)
    const nearestHero = findNearestEnemy(creature, state.heroes);
    if (nearestHero) {
      setCreatureTarget(creature, nearestHero.id);
    }

    const hasEnemy = nearestHero !== null;
    const hatcheries = getRoomsByType(state.rooms, RoomType.HATCHERY);
    const hasFood = hatcheries.length > 0;
    
    // Check for work room based on creature type
    const workRoom = getCreatureWorkRoom(creature.type, state.rooms);
    const hasWork = workRoom !== null;
    
    const behavior = determineBehavior(creature, hasEnemy, hasFood);
    updateBehavior(creature, behavior);

    // Move creature based on behavior
    if (behavior === CreatureBehavior.FIGHTING && nearestHero) {
      // Move toward target if not in range
      const range = CREATURE_STATS[creature.type].range;
      const dist = getDistance(creature.pos, nearestHero.pos);
      if (dist > range) {
        moveEntityToward(creature, nearestHero.pos, getCreatureSpeed(creature), dt, state.grid);
      }
    } else if (behavior === CreatureBehavior.EATING && hasFood) {
      // Move toward hatchery
      const hatchery = hatcheries[0];
      if (hatchery && hatchery.tiles.length > 0) {
        const targetTile = hatchery.tiles[0];
        const dist = getDistance(creature.pos, targetTile);
        if (dist <= 1) {
          // At hatchery, eat
          feedCreature(creature, 30);
        } else {
          moveEntityToward(creature, targetTile, getCreatureSpeed(creature), dt, state.grid);
        }
      }
    } else if (behavior === CreatureBehavior.FLEEING) {
      // Move toward dungeon heart (safety)
      moveEntityToward(creature, state.heart.pos, getCreatureSpeed(creature), dt, state.grid);
    } else if (behavior === CreatureBehavior.IDLE && hasWork) {
      // WORKING behavior - move to and use assigned room
      const workTile = workRoom.tiles[0];
      const dist = getDistance(creature.pos, workTile);
      if (dist <= 1) {
        // At work room - "working" (gain happiness)
        creature.happiness = Math.min(100, creature.happiness + 0.5 * dt);
        updateBehavior(creature, CreatureBehavior.WORKING);
        
        // Training room levels up creatures
        if (workRoom.type === RoomType.TRAINING) {
          const leveledUp = trainCreature(creature, dt * 2); // ~50 seconds to level
          if (leveledUp) {
            addMessage(state, `${creature.type.toLowerCase().replace('_', ' ')} leveled up to ${creature.level}!`);
          }
        }
      } else {
        moveEntityToward(creature, workTile, getCreatureSpeed(creature), dt, state.grid);
      }
    }
  }
  
  // Remove creatures that left due to unhappiness
  state.creatures = state.creatures.filter(c => !creaturesToRemove.includes(c.id));

  // Update heroes
  for (const hero of state.heroes) {
    if (isDead(hero)) continue;

    // Choose target in range
    const targetId = heroChooseTarget(hero, state.creatures, state.heart);
    setHeroTarget(hero, targetId);

    const hasEnemyInRange = targetId !== null;
    const behavior = heroDetermineBehavior(hero, hasEnemyInRange);
    heroUpdateBehavior(hero, behavior);

    // Move hero based on behavior
    if (behavior === HeroBehavior.ENTERING) {
      // Move toward dungeon heart or nearest target
      const nearestTarget = findNearestTarget(hero, state.creatures, state.heart);
      if (nearestTarget) {
        moveEntityToward(hero, nearestTarget.pos, getHeroSpeed(hero), dt, state.grid);
      } else {
        moveEntityToward(hero, state.heart.pos, getHeroSpeed(hero), dt, state.grid);
      }
    } else if (behavior === HeroBehavior.ATTACKING && targetId) {
      // Move closer if not in range
      const target = findEntityById(targetId, state.creatures, state.heart);
      if (target) {
        const range = HERO_STATS[hero.type].range;
        const dist = getDistance(hero.pos, target.pos);
        if (dist > range) {
          moveEntityToward(hero, target.pos, getHeroSpeed(hero), dt, state.grid);
        }
      }
    } else if (behavior === HeroBehavior.FLEEING) {
      // Move toward map edge (away from heart)
      const fleeTarget = { x: hero.pos.x < GRID_WIDTH / 2 ? 1 : GRID_WIDTH - 2, y: 1 };
      moveEntityToward(hero, fleeTarget, getHeroSpeed(hero), dt, state.grid);
    }
  }

  // Apply lava damage to entities on lava tiles
  applyLavaDamage(state, dt);

  // Process combat
  const combatEvents = processCombat(
    state.creatures,
    state.heroes,
    state.heart,
    state.gameTime
  );

  // Handle deaths and gold from kills
  for (const event of combatEvents) {
    if (event.defenderDied) {
      const deadHero = state.heroes.find(h => h.id === event.defenderId);
      if (deadHero) {
        // Check if we have a prison - capture instead of kill
        const hasPrison = countRoomsByType(state.rooms, RoomType.PRISON) > 0;
        if (hasPrison) {
          state.prisoners.push({
            heroType: deadHero.type,
            captureTime: state.gameTime,
          });
          addMessage(state, `Hero captured! Prisoner added to prison.`);
        } else {
          const goldDrop = HERO_STATS[deadHero.type].gold;
          addGoldToState(state, goldDrop);
          addMessage(state, `Hero slain! +${goldDrop} gold`);
        }
      }
    }
  }

  // Handle creature deaths - queue for respawn
  for (const creature of state.creatures) {
    if (isDead(creature)) {
      const stats = CREATURE_STATS[creature.type];
      state.deadCreatures.push({
        type: creature.type,
        respawnTime: state.gameTime + CREATURE_RESPAWN_TIME,
        cost: Math.floor(stats.cost * CREATURE_RESPAWN_COST_PERCENT),
      });
      addMessage(state, `${creature.type.toLowerCase().replace('_', ' ')} fell in battle!`);
    }
  }

  // Handle imp deaths - respawn instantly at heart (imps are immortal)
  for (const imp of state.imps) {
    if (isDead(imp)) {
      imp.hp = imp.maxHp;
      imp.pos = { x: state.heart.pos.x, y: state.heart.pos.y + 1 };
      imp.task = TaskType.IDLE;
      imp.target = null;
      imp.path = [];
      imp.carrying = 0;
      addMessage(state, 'Imp respawned at dungeon heart.');
    }
  }

  // Process creature respawns
  processCreatureRespawns(state);

  // Process prisoner conversion in torture chamber
  processPrisonerConversion(state);

  // Remove dead heroes and creatures (imps handled above - they respawn)
  state.heroes = state.heroes.filter(h => !isDead(h));
  state.creatures = state.creatures.filter(c => !isDead(c));

  // Check wave spawning
  if (shouldSpawnWave(state.waveTimer)) {
    state.wave++;
    const newHeroes = spawnWave(state.wave, state.grid);
    state.heroes.push(...newHeroes);
    state.waveTimer = 0;
    addMessage(state, `Wave ${state.wave} incoming! ${newHeroes.length} heroes attack!`);
  } else if (shouldShowWarning(state.waveTimer)) {
    // Could add warning UI here
  }

  // Check game over
  if (checkGameOver(state)) {
    state.screen = GameScreen.GAME_OVER;
    addMessage(state, 'Your dungeon heart has been destroyed!');
  }
}

/**
 * Designate tiles for digging.
 */
export function designateDig(state: GameState, pos: Position): boolean {
  if (!isDiggable(state.grid, pos.x, pos.y)) {
    return false;
  }

  // Check if already designated
  if (state.digTasks.some(t => t.pos.x === pos.x && t.pos.y === pos.y)) {
    return false;
  }

  state.digTasks.push({ pos, assigned: false });
  return true;
}

/**
 * Cancel dig designation.
 */
export function cancelDig(state: GameState, pos: Position): boolean {
  const index = state.digTasks.findIndex(t => t.pos.x === pos.x && t.pos.y === pos.y);
  if (index === -1) return false;

  state.digTasks.splice(index, 1);
  return true;
}

/**
 * Try to place a room at position.
 */
export function tryPlaceRoom(state: GameState, topLeft: Position, type: RoomType): boolean {
  const cost = getRoomCost(type);

  if (!canAfford({ gold: state.gold, maxGold: state.maxGold, lastWageTime: 0 }, cost)) {
    addMessage(state, 'Not enough gold!');
    return false;
  }

  if (!canPlaceRoom(state.grid, state.rooms, topLeft, type)) {
    addMessage(state, 'Cannot place room here!');
    return false;
  }

  // Deduct cost and place
  state.gold -= cost;
  placeRoom(state.grid, state.rooms, topLeft, type);
  addMessage(state, `${type} built!`);

  // Update treasury capacity
  updateMaxGold(
    { gold: state.gold, maxGold: state.maxGold, lastWageTime: 0 },
    state.rooms
  );
  state.maxGold = state.rooms.filter(r => r.type === RoomType.TREASURY).length * 1000 + 1000;

  return true;
}

/**
 * Summon a new imp.
 */
export function summonImp(state: GameState): boolean {
  const cost = getImpCost();

  if (!canAfford({ gold: state.gold, maxGold: state.maxGold, lastWageTime: 0 }, cost)) {
    addMessage(state, 'Not enough gold!');
    return false;
  }

  state.gold -= cost;
  const centerX = Math.floor(GRID_WIDTH / 2);
  const centerY = Math.floor(GRID_HEIGHT / 2);
  const imp = createImp({ x: centerX, y: centerY });
  state.imps.push(imp);
  addMessage(state, 'Imp summoned!');
  return true;
}

/**
 * Toggle pause state.
 */
export function togglePause(state: GameState): void {
  if (state.screen === GameScreen.PLAYING) {
    state.paused = !state.paused;
  }
}

/**
 * Check if game is over (heart destroyed).
 */
export function checkGameOver(state: GameState): boolean {
  return state.heart.hp <= 0;
}

/**
 * Add message to log.
 */
export function addMessage(state: GameState, message: string): void {
  state.messages.push(message);
  // Keep only last 10 messages
  if (state.messages.length > 10) {
    state.messages.shift();
  }
}

/**
 * Add gold to state with cap.
 */
function addGoldToState(state: GameState, amount: number): void {
  state.gold = Math.min(state.gold + amount, state.maxGold);
}

/**
 * Calculate final score.
 */
export function calculateScore(state: GameState): number {
  const waveBonus = state.wave * 100;
  const goldBonus = state.gold;
  const creatureBonus = state.creatures.length * 50;
  return waveBonus + goldBonus + creatureBonus;
}

/**
 * Try to spawn a creature based on rooms built.
 * Each room type attracts a specific creature type.
 * Requires a lair for creatures to stay.
 */
function trySpawnCreature(state: GameState): void {
  // Must have at least one lair
  const lairCount = countRoomsByType(state.rooms, RoomType.LAIR);
  if (lairCount === 0) return;

  // Max creatures based on lairs (3 per lair)
  const maxCreatures = lairCount * 3;
  if (state.creatures.length >= maxCreatures) return;

  // Check each room type for attraction
  const attractionRooms: RoomType[] = [
    RoomType.HATCHERY,
    RoomType.LIBRARY,
    RoomType.TRAINING,
    RoomType.WORKSHOP,
    RoomType.TORTURE,
  ];

  for (const roomType of attractionRooms) {
    const roomCount = countRoomsByType(state.rooms, roomType);
    if (roomCount === 0) continue;

    const creatureType = ROOM_ATTRACTS[roomType];
    if (!creatureType) continue;

    // Count existing creatures of this type
    const existingCount = state.creatures.filter(c => c.type === creatureType).length;

    // Can attract up to roomCount creatures of this type
    if (existingCount >= roomCount) continue;

    // Check if we can afford the creature
    const cost = CREATURE_STATS[creatureType].cost;
    if (state.gold < cost) continue;

    // Find spawn position (near dungeon heart)
    const spawnPos = findCreatureSpawnPosition(state);
    if (!spawnPos) continue;

    // Spawn the creature
    state.gold -= cost;
    const creature = createCreature(creatureType, spawnPos);
    state.creatures.push(creature);
    addMessage(state, `A ${creatureType.toLowerCase().replace('_', ' ')} has arrived!`);

    // Only spawn one per check
    return;
  }
}

/**
 * Find a valid spawn position for a creature near the dungeon heart.
 */
function findCreatureSpawnPosition(state: GameState): Position | null {
  const heartX = state.heart.pos.x;
  const heartY = state.heart.pos.y;

  // Try positions around the heart
  for (let radius = 1; radius <= 3; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        const x = heartX + dx;
        const y = heartY + dy;
        if (isWalkable(state.grid, x, y)) {
          // Check not occupied by another creature
          const occupied = state.creatures.some(
            c => c.pos.x === x && c.pos.y === y
          );
          if (!occupied) {
            return { x, y };
          }
        }
      }
    }
  }
  return null;
}

/**
 * Reset creature spawn timer (for testing).
 */
export function resetCreatureSpawnTimer(): void {
  lastCreatureSpawnTime = 0;
}

/**
 * Reset wage timer (for testing).
 */
export function resetWageTimer(): void {
  lastWageTime = 0;
}

/**
 * Move an entity toward a target position.
 */
function moveEntityToward(
  entity: { pos: Position },
  target: Position,
  speed: number,
  dt: number,
  grid: import('./types').Tile[][]
): void {
  // Already at target
  if (entity.pos.x === target.x && entity.pos.y === target.y) {
    return;
  }

  // Find path
  const path = findPath(grid, entity.pos, target);
  if (path.length === 0) {
    // No path, try to move directly (for entities on unwalkable tiles like heroes spawning)
    const dx = Math.sign(target.x - entity.pos.x);
    const dy = Math.sign(target.y - entity.pos.y);
    const nextX = entity.pos.x + dx;
    const nextY = entity.pos.y + dy;
    if (isWalkable(grid, nextX, nextY)) {
      entity.pos = { x: nextX, y: nextY };
    } else if (isWalkable(grid, entity.pos.x + dx, entity.pos.y)) {
      entity.pos = { x: entity.pos.x + dx, y: entity.pos.y };
    } else if (isWalkable(grid, entity.pos.x, entity.pos.y + dy)) {
      entity.pos = { x: entity.pos.x, y: entity.pos.y + dy };
    }
    return;
  }

  // Move along path
  const nextPos = path[0];
  const moveAmount = speed * dt;

  // For simplicity, snap to next tile if we have enough movement
  if (moveAmount >= 1) {
    entity.pos = { ...nextPos };
  }
}

/**
 * Find an entity by ID.
 */
function findEntityById(
  id: string,
  creatures: import('./types').Creature[],
  heart: DungeonHeart
): { pos: Position } | null {
  if (heart.id === id) return heart;
  for (const c of creatures) {
    if (c.id === id) return c;
  }
  return null;
}

/**
 * Get the work room for a creature type.
 */
function getCreatureWorkRoom(
  creatureType: import('./types').CreatureType,
  rooms: import('./types').Room[]
): import('./types').Room | null {
  // Map creature types to their work rooms
  const workRoomMap: Record<string, RoomType> = {
    BEETLE: RoomType.HATCHERY,
    ORC: RoomType.TRAINING,
    WARLOCK: RoomType.LIBRARY,
    TROLL: RoomType.WORKSHOP,
    DARK_ANGEL: RoomType.TORTURE,
  };
  
  const roomType = workRoomMap[creatureType];
  if (!roomType) return null;
  
  const matchingRooms = getRoomsByType(rooms, roomType);
  return matchingRooms.length > 0 ? matchingRooms[0] : null;
}

/**
 * Apply lava damage to all entities standing on lava tiles.
 */
function applyLavaDamage(state: GameState, dt: number): void {
  const damage = LAVA_DAMAGE_PER_SECOND * dt;

  // Damage creatures on lava
  for (const creature of state.creatures) {
    const tile = state.grid[creature.pos.y]?.[creature.pos.x];
    if (tile && tile.type === TileType.LAVA) {
      creature.hp = Math.max(0, creature.hp - damage);
    }
  }

  // Damage heroes on lava
  for (const hero of state.heroes) {
    const tile = state.grid[hero.pos.y]?.[hero.pos.x];
    if (tile && tile.type === TileType.LAVA) {
      hero.hp = Math.max(0, hero.hp - damage);
    }
  }

  // Damage imps on lava (though they'll respawn)
  for (const imp of state.imps) {
    const tile = state.grid[imp.pos.y]?.[imp.pos.x];
    if (tile && tile.type === TileType.LAVA) {
      imp.hp = Math.max(0, imp.hp - damage);
    }
  }
}

/**
 * Process creature respawns from the dead creature queue.
 */
function processCreatureRespawns(state: GameState): void {
  const toRespawn: DeadCreature[] = [];
  const remaining: DeadCreature[] = [];

  for (const dead of state.deadCreatures) {
    if (state.gameTime >= dead.respawnTime) {
      toRespawn.push(dead);
    } else {
      remaining.push(dead);
    }
  }

  state.deadCreatures = remaining;

  for (const dead of toRespawn) {
    // Check if we can afford the respawn cost
    if (state.gold < dead.cost) {
      addMessage(state, `Cannot afford to respawn ${dead.type.toLowerCase().replace('_', ' ')} (${dead.cost} gold)`);
      continue;
    }

    // Check if we have lair space
    const lairCount = countRoomsByType(state.rooms, RoomType.LAIR);
    const maxCreatures = lairCount * 3;
    if (state.creatures.length >= maxCreatures) {
      addMessage(state, `No lair space to respawn ${dead.type.toLowerCase().replace('_', ' ')}`);
      continue;
    }

    // Find spawn position
    const spawnPos = findCreatureSpawnPosition(state);
    if (!spawnPos) {
      addMessage(state, `No valid position to respawn ${dead.type.toLowerCase().replace('_', ' ')}`);
      continue;
    }

    // Respawn the creature
    state.gold -= dead.cost;
    const creature = createCreature(dead.type, spawnPos);
    state.creatures.push(creature);
    addMessage(state, `${dead.type.toLowerCase().replace('_', ' ')} has respawned! (-${dead.cost} gold)`);
  }
}

/**
 * Process prisoner conversion in torture chamber.
 * Converts prisoners to Dark Angels after PRISON_CONVERT_TIME.
 */
function processPrisonerConversion(state: GameState): void {
  // Need both prison (to hold) and torture chamber (to convert)
  const hasTorture = countRoomsByType(state.rooms, RoomType.TORTURE) > 0;
  if (!hasTorture || state.prisoners.length === 0) {
    return;
  }

  const toConvert: number[] = [];

  for (let i = 0; i < state.prisoners.length; i++) {
    const prisoner = state.prisoners[i];
    if (state.gameTime - prisoner.captureTime >= PRISON_CONVERT_TIME) {
      toConvert.push(i);
    }
  }

  // Convert prisoners in reverse order to maintain indices
  for (let i = toConvert.length - 1; i >= 0; i--) {
    const index = toConvert[i];
    state.prisoners.splice(index, 1);

    // Check if we have lair space
    const lairCount = countRoomsByType(state.rooms, RoomType.LAIR);
    const maxCreatures = lairCount * 3;
    if (state.creatures.length >= maxCreatures) {
      addMessage(state, 'Prisoner converted but no lair space! Lost.');
      continue;
    }

    // Find spawn position
    const spawnPos = findCreatureSpawnPosition(state);
    if (!spawnPos) {
      addMessage(state, 'Prisoner converted but no spawn position! Lost.');
      continue;
    }

    // Create Dark Angel from converted prisoner
    const darkAngel = createCreature(CreatureType.DARK_ANGEL, spawnPos);
    state.creatures.push(darkAngel);
    addMessage(state, 'Prisoner converted to Dark Angel!');
  }
}
