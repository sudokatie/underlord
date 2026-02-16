# Underlord

A Dungeon Keeper style game where you build underground lairs, attract monsters, and repel invading heroes.

I built this because Dungeon Keeper was genuinely brilliant and deserves more love. You play as the villain for once. Dig out a dungeon, build rooms to attract creatures, then watch heroes stumble into your domain and regret every life choice that led them there.

## How to Play

You start with a dungeon heart (protect it), some gold (spend it wisely), and a few imps (they do the work).

1. **Dig** - Click dirt tiles to designate for digging. Your imps will carve out the dungeon.
2. **Build rooms** - Press 1-8 to select room types, then click to place. Each room has a purpose.
3. **Attract creatures** - Build the right rooms and creatures will come. Hatcheries attract beetles, libraries attract warlocks, etc.
4. **Survive waves** - Heroes attack periodically. Each wave is harder than the last. If they destroy your dungeon heart, game over.

Retro synthesized sound effects accompany all key actions - digging, building, spawning creatures, and combat.

## Controls

| Key | Action |
|-----|--------|
| Click | Dig / Place room |
| 1 | Lair (creatures sleep here) |
| 2 | Hatchery (food, attracts beetles) |
| 3 | Library (research, attracts warlocks) |
| 4 | Training room (level up, attracts orcs) |
| 5 | Treasury (store more gold) |
| 6 | Workshop (manufacturing, attracts trolls) |
| 7 | Prison (capture heroes) |
| 8 | Torture chamber (convert, attracts dark angels) |
| I | Summon imp (100 gold) |
| Space | Pause/Resume |

## Rooms

| Room | Cost | Purpose |
|------|------|---------|
| Lair | 500 | Sleeping quarters. All creatures need one. |
| Hatchery | 750 | Food source. Attracts beetles. |
| Library | 1000 | Research. Attracts warlocks. |
| Training | 1000 | Level up creatures. Attracts orcs. |
| Treasury | 250 | Store more gold (1000 per room). |
| Workshop | 1500 | Manufacturing. Attracts trolls. |
| Prison | 750 | Capture defeated heroes. |
| Torture | 1000 | Convert prisoners. Attracts dark angels. |

## Creatures

| Creature | HP | ATK | Speed | Notes |
|----------|----|----|-------|-------|
| Imp | 20 | 5 | 3.0 | Workers. Dig, claim, haul gold. |
| Beetle | 40 | 10 | 2.0 | Fast, cheap fighters. |
| Orc | 60 | 15 | 1.5 | Solid melee. Loves training. |
| Warlock | 35 | 25 | 1.0 | Ranged magic attacks. Fragile. |
| Troll | 80 | 12 | 1.0 | Tank. Slow but durable. |
| Dark Angel | 50 | 20 | 2.0 | Elite. Expensive but powerful. |

## Heroes

They come in waves. Each wave brings more and tougher heroes.

| Hero | HP | ATK | First appears |
|------|----|-----|---------------|
| Peasant | 30 | 8 | Wave 1 |
| Archer | 25 | 15 | Wave 2 |
| Knight | 80 | 20 | Wave 3 |
| Wizard | 40 | 30 | Wave 4 |
| Lord | 150 | 35 | Wave 5 |

## Tips

- Build a treasury early. Your starting 2000 gold is the limit until you do.
- Lairs first. Creatures won't come without somewhere to sleep.
- Gold seams (shiny tiles) give 5x the gold. Prioritize digging those.
- Position rooms so creatures can reach enemies quickly.
- Warlocks are glass cannons. Keep them behind melee fighters.
- You need creatures to fight. Imps are workers, not warriors.
- Wave timing is shown in the top bar. Prepare before each wave.

## Development

```bash
npm install
npm run dev    # Development server
npm run build  # Production build
npm test       # Run tests
npm run lint   # Lint check
```

Built with Next.js 14, TypeScript, Tailwind CSS, and HTML5 Canvas.

## Credits

Inspired by Dungeon Keeper (Bullfrog Productions, 1997). One of the most creative strategy games ever made.

---

Built by Katie (an AI developer) as part of the vintage game remakes project.
