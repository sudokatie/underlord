import {
  createImp,
  assignTask,
  updateImp,
  findNearestTask,
  isImpWorking,
  isImpCarrying,
  getImpCarryAmount,
  resetImpIdCounter,
} from '../src/game/Imp';
import { createGrid, digTile } from '../src/game/Grid';
import { Tile, TaskType, DigTask } from '../src/game/types';
import { GRID_WIDTH, GRID_HEIGHT, HEART_CLEAR_RADIUS, DIG_GOLD } from '../src/game/constants';

describe('Imp', () => {
  beforeEach(() => {
    resetImpIdCounter();
  });

  const centerX = Math.floor(GRID_WIDTH / 2);
  const centerY = Math.floor(GRID_HEIGHT / 2);

  describe('createImp', () => {
    it('creates imp with correct initial stats', () => {
      const imp = createImp({ x: 10, y: 10 });
      expect(imp.hp).toBe(20);
      expect(imp.maxHp).toBe(20);
      expect(imp.pos).toEqual({ x: 10, y: 10 });
      expect(imp.task).toBe(TaskType.IDLE);
      expect(imp.target).toBeNull();
      expect(imp.carrying).toBe(0);
      expect(imp.path).toEqual([]);
    });

    it('creates imp with unique id', () => {
      const imp1 = createImp({ x: 10, y: 10 });
      const imp2 = createImp({ x: 10, y: 10 });
      expect(imp1.id).not.toBe(imp2.id);
    });

    it('copies position to avoid mutation', () => {
      const pos = { x: 10, y: 10 };
      const imp = createImp(pos);
      pos.x = 20;
      expect(imp.pos.x).toBe(10);
    });
  });

  describe('assignTask', () => {
    it('sets task and target', () => {
      const imp = createImp({ x: centerX, y: centerY });
      assignTask(imp, TaskType.DIG, { x: 5, y: 5 });
      expect(imp.task).toBe(TaskType.DIG);
      expect(imp.target).toEqual({ x: 5, y: 5 });
    });

    it('clears path when assigning new task', () => {
      const imp = createImp({ x: centerX, y: centerY });
      imp.path = [{ x: 1, y: 1 }];
      assignTask(imp, TaskType.DIG, { x: 5, y: 5 });
      expect(imp.path).toEqual([]);
    });

    it('allows null target for IDLE', () => {
      const imp = createImp({ x: centerX, y: centerY });
      assignTask(imp, TaskType.IDLE, null);
      expect(imp.task).toBe(TaskType.IDLE);
      expect(imp.target).toBeNull();
    });
  });

  describe('updateImp', () => {
    it('returns 0 when idle', () => {
      const grid = createGrid();
      const imp = createImp({ x: centerX, y: centerY });
      const gold = updateImp(imp, grid, 1 / 60);
      expect(gold).toBe(0);
    });

    it('returns 0 when no target', () => {
      const grid = createGrid();
      const imp = createImp({ x: centerX, y: centerY });
      imp.task = TaskType.DIG;
      imp.target = null;
      const gold = updateImp(imp, grid, 1 / 60);
      expect(gold).toBe(0);
      expect(imp.task).toBe(TaskType.IDLE);
    });

    it('moves imp toward target', () => {
      const grid = createGrid();
      const imp = createImp({ x: centerX, y: centerY });
      const targetX = centerX + 2;
      assignTask(imp, TaskType.CLAIM, { x: targetX, y: centerY });
      
      // Update several times
      for (let i = 0; i < 10; i++) {
        updateImp(imp, grid, 1 / 60);
      }
      
      // Imp should have moved toward target
      expect(imp.pos.x).toBeGreaterThanOrEqual(centerX);
    });

    it('completes DIG task and returns gold', () => {
      const grid = createGrid();
      // Put imp adjacent to a dirt tile
      const digX = centerX - HEART_CLEAR_RADIUS - 1;
      const impX = centerX - HEART_CLEAR_RADIUS;
      const imp = createImp({ x: impX, y: centerY });
      
      // Clear any gold seam at dig position for consistent test
      grid[centerY][digX].goldSeam = false;
      
      // Manually set imp at target (simulating arrival)
      imp.pos = { x: digX, y: centerY };
      assignTask(imp, TaskType.DIG, { x: digX, y: centerY });
      
      const gold = updateImp(imp, grid, 1 / 60);
      
      // Should have dug and gotten gold
      expect(gold).toBe(DIG_GOLD);
      expect(imp.task).toBe(TaskType.IDLE);
      expect(imp.carrying).toBe(DIG_GOLD);
    });

    it('goes idle after completing task', () => {
      const grid = createGrid();
      const imp = createImp({ x: centerX, y: centerY });
      assignTask(imp, TaskType.CLAIM, { x: centerX, y: centerY });
      
      updateImp(imp, grid, 1 / 60);
      
      expect(imp.task).toBe(TaskType.IDLE);
      expect(imp.target).toBeNull();
    });
  });

  describe('findNearestTask', () => {
    it('returns null for empty tasks', () => {
      const imp = createImp({ x: centerX, y: centerY });
      expect(findNearestTask(imp, [])).toBeNull();
    });

    it('returns nearest unassigned task', () => {
      const imp = createImp({ x: centerX, y: centerY });
      const tasks: DigTask[] = [
        { pos: { x: centerX + 5, y: centerY }, assigned: false },
        { pos: { x: centerX + 1, y: centerY }, assigned: false },
        { pos: { x: centerX + 3, y: centerY }, assigned: false },
      ];
      
      const nearest = findNearestTask(imp, tasks);
      expect(nearest).toBe(tasks[1]); // x + 1 is nearest
    });

    it('skips assigned tasks', () => {
      const imp = createImp({ x: centerX, y: centerY });
      const tasks: DigTask[] = [
        { pos: { x: centerX + 1, y: centerY }, assigned: true },
        { pos: { x: centerX + 5, y: centerY }, assigned: false },
      ];
      
      const nearest = findNearestTask(imp, tasks);
      expect(nearest).toBe(tasks[1]); // Skip assigned, take farther one
    });

    it('returns null if all tasks assigned', () => {
      const imp = createImp({ x: centerX, y: centerY });
      const tasks: DigTask[] = [
        { pos: { x: centerX + 1, y: centerY }, assigned: true },
        { pos: { x: centerX + 5, y: centerY }, assigned: true },
      ];
      
      expect(findNearestTask(imp, tasks)).toBeNull();
    });
  });

  describe('isImpWorking', () => {
    it('returns false when idle', () => {
      const imp = createImp({ x: centerX, y: centerY });
      expect(isImpWorking(imp)).toBe(false);
    });

    it('returns true when digging', () => {
      const imp = createImp({ x: centerX, y: centerY });
      assignTask(imp, TaskType.DIG, { x: 5, y: 5 });
      expect(isImpWorking(imp)).toBe(true);
    });

    it('returns true when hauling', () => {
      const imp = createImp({ x: centerX, y: centerY });
      assignTask(imp, TaskType.HAUL, { x: 5, y: 5 });
      expect(isImpWorking(imp)).toBe(true);
    });
  });

  describe('isImpCarrying', () => {
    it('returns false when not carrying', () => {
      const imp = createImp({ x: centerX, y: centerY });
      expect(isImpCarrying(imp)).toBe(false);
    });

    it('returns true when carrying gold', () => {
      const imp = createImp({ x: centerX, y: centerY });
      imp.carrying = 50;
      expect(isImpCarrying(imp)).toBe(true);
    });
  });

  describe('getImpCarryAmount', () => {
    it('returns 0 when not carrying', () => {
      const imp = createImp({ x: centerX, y: centerY });
      expect(getImpCarryAmount(imp)).toBe(0);
    });

    it('returns carry amount', () => {
      const imp = createImp({ x: centerX, y: centerY });
      imp.carrying = 150;
      expect(getImpCarryAmount(imp)).toBe(150);
    });
  });
});
