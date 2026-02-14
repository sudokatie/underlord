# Changelog

## v0.1.0 - 2026-02-03

Initial release. A complete Dungeon Keeper style game playable in the browser.

### Features

- 40x30 tile dungeon grid with digging mechanics
- 8 room types (lair, hatchery, library, training, treasury, workshop, prison, torture)
- 6 creature types with unique stats and behaviors
- Imp workers with task-based AI (dig, haul, claim)
- A* pathfinding for all entities
- Combat system with melee and ranged attacks
- Hero invasion waves that scale in difficulty
- Economy system with gold, wages, and treasury capacity
- Dungeon heart as win/lose condition
- Canvas-based rendering with 8-bit aesthetic
- Keyboard and mouse controls
- Title screen, game UI, and game over screen

### Technical

- Next.js 14 with TypeScript
- 370 tests across 11 test suites
- Full type definitions for all game entities
- Modular architecture with separate systems for grid, rooms, combat, etc.

### Known Limitations

- No save/load functionality
- No sound effects or music
- Creatures don't currently arrive through portals (future feature)
- Prison and torture mechanics are basic (capture/convert not fully implemented)
